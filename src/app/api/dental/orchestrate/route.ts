import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getSupabaseClient } from '@/lib/supabase-server'
import { sendNotificationEmail } from '@/lib/notify-email'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024 // 50MB

function getR2(): { client: S3Client; bucket: string } | null {
  const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '').trim()
  const bucket = (process.env.CLOUDFLARE_R2_BUCKET || '').trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null
  const endpoint = (
    process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`
  ).trim()
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
  return { client, bucket }
}

export async function POST(request: NextRequest) {
  try {
    // Auth: match the existing Bearer-token pattern used by /api/rewards/submit
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(
      { global: { headers: { Authorization: `Bearer ${authToken}` } } },
      { requireServiceRole: true },
    )
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!user.email) {
      return NextResponse.json({ error: 'Account has no email on file' }, { status: 400 })
    }

    // Parse the uploaded PDF
    const form = await request.formData()
    const file = form.get('pdf')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'pdf file required' }, { status: 400 })
    }
    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 413 })
    }

    // Create job row
    const { data: job, error: insertError } = await supabase
      .from('dental_jobs')
      .insert({
        user_id: user.id,
        filename: file.name || 'document.pdf',
        status: 'pending',
      })
      .select()
      .single()
    if (insertError || !job) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create job' },
        { status: 500 },
      )
    }

    const markError = async (message: string) => {
      await supabase
        .from('dental_jobs')
        .update({
          status: 'error',
          error_message: message.slice(0, 1000),
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
    }

    // Call the Python worker (sibling Vercel function)
    const pdfBytes = Buffer.from(await file.arrayBuffer())
    const workerOrigin =
      process.env.DENTAL_WORKER_ORIGIN?.trim() ||
      process.env.VERCEL_URL?.trim() ||
      request.nextUrl.origin
    const workerUrl = workerOrigin.startsWith('http')
      ? `${workerOrigin.replace(/\/$/, '')}/api/dental/extract`
      : `https://${workerOrigin}/api/dental/extract`

    let pyRes: Response
    try {
      pyRes = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': String(pdfBytes.byteLength),
        },
        body: pdfBytes,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Worker unreachable'
      await markError(message)
      return NextResponse.json({ error: message }, { status: 502 })
    }

    if (!pyRes.ok) {
      const detail = await pyRes.text()
      await markError(`Worker ${pyRes.status}: ${detail}`)
      return NextResponse.json(
        { error: 'Extraction failed', detail, status: pyRes.status },
        { status: 502 },
      )
    }

    const pptxBuffer = Buffer.from(await pyRes.arrayBuffer())
    const figureCount = Number(pyRes.headers.get('X-Figure-Count') || '0')

    // Upload the .pptx to R2
    const r2 = getR2()
    if (!r2) {
      await markError('R2 not configured')
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }
    const key = `dental/${user.id}/${job.id}.pptx`
    try {
      await r2.client.send(
        new PutObjectCommand({
          Bucket: r2.bucket,
          Key: key,
          Body: pptxBuffer,
          ContentType:
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          ContentDisposition: `attachment; filename="dental-figures.pptx"`,
        }),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      await markError(message)
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const signedUrl = await getSignedUrl(
      r2.client,
      new GetObjectCommand({ Bucket: r2.bucket, Key: key }),
      { expiresIn: 60 * 60 * 24 * 7 }, // 7 days
    )

    // Mark job complete
    await supabase
      .from('dental_jobs')
      .update({
        status: 'done',
        figure_count: figureCount,
        result_key: key,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    // Email the user the download link (best-effort; don't fail the request)
    try {
      await sendNotificationEmail({
        to: user.email,
        subject: `Your dental figures are ready (${figureCount} figures)`,
        text:
          `We extracted ${figureCount} figures from "${file.name}".\n\n` +
          `Download your PowerPoint: ${signedUrl}\n\n` +
          `Link expires in 7 days.`,
        html:
          `<p>We extracted <strong>${figureCount}</strong> figures from <em>${file.name}</em>.</p>` +
          `<p><a href="${signedUrl}">Download your PowerPoint</a> (link expires in 7 days).</p>`,
      })
    } catch (err) {
      console.error('[dental] email send failed', err)
    }

    return NextResponse.json({
      jobId: job.id,
      figureCount,
      downloadUrl: signedUrl,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[dental] orchestrate error', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

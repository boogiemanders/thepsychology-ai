import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clientId,
      somaticRating,
      emotionalRating,
      neurologicalRating,
      socialRating,
      environmentalRating,
      stateTag,
      bodySystem,
      context,
      sensoryModifiers,
      hypothesis1,
      hypothesis2,
      targets,
      interventionId,
      interventionName,
      measure,
      practiceFrequency,
      exportedNote,
      noteExportedAt,
    } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const session = await prisma.session.create({
      data: {
        clientId,
        somaticRating,
        emotionalRating,
        neurologicalRating,
        socialRating,
        environmentalRating,
        stateTag,
        bodySystem,
        context,
        sensoryModifiers,
        hypothesis1,
        hypothesis2,
        targets,
        interventionId,
        interventionName,
        measure,
        practiceFrequency,
        exportedNote,
        noteExportedAt: noteExportedAt ? new Date(noteExportedAt) : null,
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

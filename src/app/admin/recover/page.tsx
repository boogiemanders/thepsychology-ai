import { redirect } from 'next/navigation'

export default async function AdminRecoverRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const nextParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') {
      nextParams.set(key, value)
      return
    }

    value?.forEach((entry) => nextParams.append(key, entry))
  })

  const query = nextParams.toString()
  redirect(query ? `/admin?${query}` : '/admin')
}

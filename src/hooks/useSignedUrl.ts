import { useEffect, useState } from 'react'
import { getSignedUrl } from '../lib/storage'

export function useSignedUrl(path?: string | null) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(Boolean(path))

  useEffect(() => {
    let active = true
    if (!path) {
      setUrl('')
      setLoading(false)
      return
    }

    setLoading(true)
    getSignedUrl(path)
      .then((nextUrl) => active && setUrl(nextUrl))
      .catch(() => active && setUrl(''))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [path])

  return { url, loading }
}

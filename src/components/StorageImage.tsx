import { useSignedUrl } from '../hooks/useSignedUrl'

type Props = {
  path?: string | null
  alt: string
  className?: string
  objectFit?: 'cover' | 'contain'
}

export function StorageImage({ path, alt, className = '', objectFit = 'cover' }: Props) {
  const { url, loading } = useSignedUrl(path)

  if (loading) return <div className={`image-skeleton ${className}`} aria-label="Загрузка изображения" />
  if (!url) return <div className={`image-placeholder ${className}`}>📷</div>

  return <img src={url} alt={alt} className={className} style={{ objectFit }} loading="lazy" />
}

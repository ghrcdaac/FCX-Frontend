const LEE_S3_BASE = (process.env.REACT_APP_LEE_S3_DEFAULT_BASE_URL || "").replace(/\/$/, "")
const LEE_S3_PROXY_PREFIX = "/lee-field-campaigns-szg"

export function shouldUseLeeS3Proxy() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.REACT_APP_LEE_S3_PROXY === "true"
  )
}

/** Rewrite LEE S3 URLs to the dev-server proxy (avoids S3 CORS in local dev). */
export function resolveLeeS3Url(url) {
  if (!url || !LEE_S3_BASE || !shouldUseLeeS3Proxy()) return url

  if (url.startsWith(LEE_S3_BASE)) {
    return `${LEE_S3_PROXY_PREFIX}${url.slice(LEE_S3_BASE.length)}`
  }

  return url
}

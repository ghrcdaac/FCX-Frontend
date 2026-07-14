import { LEE_S3_DEFAULT_BASE } from "../config"

const LEE_S3_PROXY_PREFIX = "/lee-field-campaigns-szg"

const LEE_S3_ORIGINS = [
  LEE_S3_DEFAULT_BASE,
  "https://ghrc-fcx-field-campaigns-szg.s3.amazonaws.com",
  "https://ghrc-fcx-field-campaigns-szg.s3.us-east-1.amazonaws.com",
]

export function shouldUseLeeS3Proxy() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.REACT_APP_LEE_S3_PROXY === "true"
  )
}

/** Rewrite szg bucket URLs to the dev-server proxy (avoids S3 CORS in local dev). */
export function resolveLeeS3Url(url) {
  if (!url || !shouldUseLeeS3Proxy()) return url

  for (const origin of LEE_S3_ORIGINS) {
    if (url.startsWith(origin)) {
      return `${LEE_S3_PROXY_PREFIX}${url.slice(origin.length)}`
    }
  }

  return url
}

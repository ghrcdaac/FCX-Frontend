const proxy = require("http-proxy-middleware")

const LEE_S3_TARGET = process.env.REACT_APP_NEW_FIELD_CAMPAIGNS_BASE_URL
const LEE_S3_PROXY_PREFIX = "/lee-field-campaigns-szg"

module.exports = function setupLeeS3Proxy(app) {
  if (!LEE_S3_TARGET) return

  app.use(
    LEE_S3_PROXY_PREFIX,
    proxy({
      target: LEE_S3_TARGET,
      changeOrigin: true,
      secure: true,
      pathRewrite: { [`^${LEE_S3_PROXY_PREFIX}`]: "" },
      onProxyRes(proxyRes) {
        proxyRes.headers["access-control-allow-origin"] = "*"
        proxyRes.headers["access-control-allow-methods"] = "GET, HEAD, OPTIONS"
        proxyRes.headers["access-control-allow-headers"] = "Range, Content-Type"
      },
    })
  )
}

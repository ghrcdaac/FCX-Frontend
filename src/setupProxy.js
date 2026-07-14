const proxy = require("http-proxy-middleware")

const LEE_S3_TARGET = "https://ghrc-fcx-field-campaigns-szg.s3.amazonaws.com"

module.exports = function setupLeeS3Proxy(app) {
  app.use(
    "/lee-field-campaigns-szg",
    proxy({
      target: LEE_S3_TARGET,
      changeOrigin: true,
      secure: true,
      pathRewrite: { "^/lee-field-campaigns-szg": "" },
      onProxyRes(proxyRes) {
        proxyRes.headers["access-control-allow-origin"] = "*"
        proxyRes.headers["access-control-allow-methods"] = "GET, HEAD, OPTIONS"
        proxyRes.headers["access-control-allow-headers"] = "Range, Content-Type"
      },
    })
  )
}

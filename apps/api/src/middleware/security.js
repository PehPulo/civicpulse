// Middleware Security Headers (Best practice setara Helmet)
export async function securityHeaders(c, next) {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // HTTPS wajib setelah kunjungan pertama (diabaikan peramban pada http://localhost).
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  c.header('Cross-Origin-Opener-Policy', 'same-origin')
  c.header('Cross-Origin-Resource-Policy', 'same-site')
  // Respons JSON API tidak pernah boleh memuat skrip/menjadi frame. /docs (Swagger UI, skrip CDN) dikecualikan.
  if (!c.req.path.endsWith('/docs')) c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
}

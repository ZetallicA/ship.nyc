import 'dotenv/config'

function required(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}

export const config = {
  port: parseInt(process.env.PORT ?? '8000'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production-please',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'noreply@oathlogistics.com',
  emailEnabled: !!process.env.RESEND_API_KEY,
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:8080').split(',').map(s => s.trim()),
  corsAllowAll: process.env.CORS_ALLOW_ALL === 'true',
}

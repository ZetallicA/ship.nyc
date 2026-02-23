#!/usr/bin/env node
/**
 * One-time CapRover setup for OATH Logistics
 * Creates all apps, configures PostgreSQL, sets all env vars.
 *
 * Usage:
 *   node setup-caprover.js <caprover-password>
 *
 * Example:
 *   node setup-caprover.js myCaproverPassword123
 */

const CAPROVER_URL  = 'https://captain.cap.oathone.com'
const BACKEND_APP   = 'oath-logistics'
const FRONTEND_APP  = 'oath-logistics-frontend'
const POSTGRES_APP  = 'oath-postgres'

// ── helpers ──────────────────────────────────────────────────────────────────

function randomSecret(bytes = 48) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Buffer.from(arr).toString('hex')
}

async function api(token, path, body) {
  const res = await fetch(`${CAPROVER_URL}/api/v2${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-namespace': 'captain',
      ...(token ? { 'x-captain-auth': token } : {}),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (json.status !== 100) {
    throw new Error(`CapRover API error on ${path}: ${json.description || JSON.stringify(json)}`)
  }
  return json.data
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const password = process.argv[2]
  if (!password) {
    console.error('Usage: node setup-caprover.js <caprover-password>')
    process.exit(1)
  }

  console.log(`\nConnecting to CapRover at ${CAPROVER_URL} ...\n`)

  // 1. Login
  const { token } = await api(null, '/login', { password })
  console.log('✔ Logged in')

  // 2. Generate secrets
  const POSTGRES_PASSWORD = randomSecret(24)
  const JWT_SECRET        = randomSecret(48)
  const DATABASE_URL      = `postgresql://oath:${POSTGRES_PASSWORD}@srv-captain--${POSTGRES_APP}:5432/oath_logistics`
  const VITE_API_URL      = `https://${BACKEND_APP}.cap.oathone.com/api`

  // 3. Create apps (ignore "already exists" errors)
  for (const [name, persistent] of [
    [BACKEND_APP,  false],
    [FRONTEND_APP, false],
    [POSTGRES_APP, true],
  ]) {
    try {
      await api(token, '/user/apps/appDefinitions/', { appName: name, hasPersistentData: persistent })
      console.log(`✔ Created app: ${name}`)
    } catch (e) {
      if (e.message.includes('already exist')) {
        console.log(`  (app ${name} already exists — skipping)`)
      } else {
        throw e
      }
    }
  }

  // 4. Configure PostgreSQL (docker image + volume + env vars)
  await api(token, '/user/apps/appDefinitions/update', {
    appName:           POSTGRES_APP,
    instanceCount:     1,
    hasPersistentData: true,
    notExposeAsWebApp: true,
    containerHttpPort: 5432,
    imageName:         'postgres:16-alpine',
    envVars: [
      { key: 'POSTGRES_PASSWORD', value: POSTGRES_PASSWORD },
      { key: 'POSTGRES_USER',     value: 'oath' },
      { key: 'POSTGRES_DB',       value: 'oath_logistics' },
      { key: 'PGDATA',            value: '/var/lib/postgresql/data/pgdata' },
    ],
    volumes: [
      { volumeName: 'oath-postgres-data', containerPath: '/var/lib/postgresql/data' },
    ],
  })
  console.log('✔ PostgreSQL configured (postgres:16-alpine)')

  // 5. Configure backend env vars
  await api(token, '/user/apps/appDefinitions/update', {
    appName:           BACKEND_APP,
    instanceCount:     1,
    hasPersistentData: false,
    containerHttpPort: 8000,
    envVars: [
      { key: 'DATABASE_URL',   value: DATABASE_URL },
      { key: 'JWT_SECRET',     value: JWT_SECRET },
      { key: 'NODE_ENV',       value: 'production' },
      { key: 'CORS_ALLOW_ALL', value: 'true' },
      { key: 'EMAIL_FROM',     value: 'noreply@oathone.com' },
      { key: 'RESEND_API_KEY', value: '' },
    ],
  })
  console.log('✔ Backend env vars set')

  // 6. Configure frontend build arg (VITE_API_URL baked in at Docker build time)
  await api(token, '/user/apps/appDefinitions/update', {
    appName:           FRONTEND_APP,
    instanceCount:     1,
    hasPersistentData: false,
    containerHttpPort: 80,
    buildArguments: [
      { key: 'VITE_API_URL', value: VITE_API_URL },
    ],
  })
  console.log('✔ Frontend build args set')

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SETUP COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next: add these to your GitHub repo
  Settings → Secrets and variables → Actions

  ┌─ Secrets (Repository secrets) ─────────────────────┐
  │  CAPROVER_PASSWORD   ${password}
  └─────────────────────────────────────────────────────┘

  ┌─ Variables (Repository variables) ─────────────────┐
  │  CAPROVER_URL        ${CAPROVER_URL}
  │  BACKEND_APP         ${BACKEND_APP}
  │  FRONTEND_APP        ${FRONTEND_APP}
  └─────────────────────────────────────────────────────┘

Then push to main — GitHub Actions will deploy automatically.

App URLs (after first deploy):
  Frontend : https://${FRONTEND_APP}.cap.oathone.com
  Backend  : https://${BACKEND_APP}.cap.oathone.com/api/health

Default login: admin / admin123  ← change this after first login!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

main().catch((err) => {
  console.error('\n✖ Setup failed:', err.message)
  process.exit(1)
})

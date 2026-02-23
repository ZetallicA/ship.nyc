#!/usr/bin/env node
/**
 * Idempotent CapRover first-run setup.
 * Called automatically by GitHub Actions before every deploy.
 * If the backend already has DATABASE_URL configured, exits immediately.
 *
 * Required env vars:
 *   CAPROVER_URL       e.g. https://captain.cap.example.com
 *   CAPROVER_PASSWORD
 *   BACKEND_APP        e.g. oath-logistics
 *   FRONTEND_APP       e.g. oath-logistics-frontend
 */

const CAPROVER_URL      = (process.env.CAPROVER_URL || '').replace(/\/$/, '')
const CAPROVER_PASSWORD = process.env.CAPROVER_PASSWORD
const BACKEND_APP       = process.env.BACKEND_APP  || 'oath-logistics'
const FRONTEND_APP      = process.env.FRONTEND_APP || 'oath-logistics-frontend'
const POSTGRES_APP      = 'oath-postgres'

if (!CAPROVER_URL || !CAPROVER_PASSWORD) {
  console.error('CAPROVER_URL and CAPROVER_PASSWORD env vars are required')
  process.exit(1)
}

// Derive app base domain from captain URL
// https://captain.cap.example.com → cap.example.com
const appBaseDomain = CAPROVER_URL.replace(/^https?:\/\/captain\./, '')
const VITE_API_URL  = `https://${BACKEND_APP}.${appBaseDomain}/api`

function randomHex(bytes = 32) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Buffer.from(arr).toString('hex')
}

async function api(token, method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-namespace': 'captain',
      ...(token ? { 'x-captain-auth': token } : {}),
    },
  }
  if (body !== undefined) {
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${CAPROVER_URL}/api/v2${path}`, opts)
  const json = await res.json()
  if (json.status !== 100) {
    throw new Error(`CapRover ${method} ${path}: ${json.description || JSON.stringify(json)}`)
  }
  return json.data
}

async function main() {
  console.log(`Connecting to ${CAPROVER_URL} ...`)
  const { token } = await api(null, 'POST', '/login', { password: CAPROVER_PASSWORD })
  console.log('✔ Logged in')

  // Fetch all existing app definitions
  const { appDefinitions } = await api(token, 'GET', '/user/apps/appDefinitions', undefined)
  const appMap = new Map(appDefinitions.map(a => [a.appName, a]))

  // Idempotency check: if backend already has DATABASE_URL, skip setup
  const backendEnv = appMap.get(BACKEND_APP)?.envVars ?? []
  const alreadyConfigured = backendEnv.some(e => e.key === 'DATABASE_URL' && e.value)
  if (alreadyConfigured) {
    console.log('✔ Already configured — skipping first-run setup')
    return
  }

  console.log('First-run setup: configuring all apps...\n')

  // Generate secrets (only happens once; stored in CapRover env vars)
  const POSTGRES_PASSWORD = randomHex(24)
  const JWT_SECRET        = randomHex(48)
  const DATABASE_URL      = `postgresql://oath:${POSTGRES_PASSWORD}@srv-captain--${POSTGRES_APP}:5432/oath_logistics`

  // Create apps (skip if they already exist)
  for (const [name, persistent] of [
    [BACKEND_APP,  false],
    [FRONTEND_APP, false],
    [POSTGRES_APP, true ],
  ]) {
    if (appMap.has(name)) {
      console.log(`  (${name} already exists — skipping create)`)
      continue
    }
    await api(token, 'POST', '/user/apps/appDefinitions/', {
      appName: name,
      hasPersistentData: persistent,
    })
    console.log(`✔ Created app: ${name}`)
  }

  // Configure PostgreSQL: docker image + named volume + env vars
  await api(token, 'POST', '/user/apps/appDefinitions/update', {
    appName:           POSTGRES_APP,
    instanceCount:     1,
    hasPersistentData: true,
    notExposeAsWebApp: true,
    containerHttpPort: 5432,
    imageName:         'postgres:16-alpine',
    envVars: [
      { key: 'POSTGRES_PASSWORD', value: POSTGRES_PASSWORD },
      { key: 'POSTGRES_USER',     value: 'oath'            },
      { key: 'POSTGRES_DB',       value: 'oath_logistics'  },
      { key: 'PGDATA',            value: '/var/lib/postgresql/data/pgdata' },
    ],
    volumes: [
      { volumeName: 'oath-postgres-data', containerPath: '/var/lib/postgresql/data' },
    ],
  })
  console.log('✔ PostgreSQL configured (postgres:16-alpine, persistent volume)')

  // Configure backend env vars
  await api(token, 'POST', '/user/apps/appDefinitions/update', {
    appName:           BACKEND_APP,
    instanceCount:     1,
    hasPersistentData: false,
    containerHttpPort: 8000,
    envVars: [
      { key: 'DATABASE_URL',   value: DATABASE_URL   },
      { key: 'JWT_SECRET',     value: JWT_SECRET     },
      { key: 'NODE_ENV',       value: 'production'   },
      { key: 'CORS_ALLOW_ALL', value: 'true'         },
      { key: 'EMAIL_FROM',     value: 'noreply@oathone.com' },
      { key: 'RESEND_API_KEY', value: ''             },
    ],
  })
  console.log('✔ Backend env vars set')

  // Configure frontend build arg (VITE_API_URL baked in at Docker build time)
  await api(token, 'POST', '/user/apps/appDefinitions/update', {
    appName:           FRONTEND_APP,
    instanceCount:     1,
    hasPersistentData: false,
    containerHttpPort: 80,
    buildArguments: [
      { key: 'VITE_API_URL', value: VITE_API_URL },
    ],
  })
  console.log('✔ Frontend build arg set')

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FIRST-RUN SETUP COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Frontend : https://${FRONTEND_APP}.${appBaseDomain}
 Backend  : https://${BACKEND_APP}.${appBaseDomain}/api/health
 Default login: admin / admin123  ← change after first login!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

main().catch(err => {
  console.error('\n✖ Setup failed:', err.message)
  process.exit(1)
})

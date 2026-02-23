import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default admin
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 12)
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        fullName: 'System Administrator',
        role: 'Admin',
        email: 'admin@oathlogistics.local',
      },
    })
    console.log('Created default admin user: admin / admin123')
    console.log('IMPORTANT: Change the admin password after first login!')
  } else {
    console.log('Admin user already exists, skipping.')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

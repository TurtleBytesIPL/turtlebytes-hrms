const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const p = new PrismaClient()

async function main() {
  // Check what users exist
  const users = await p.user.findMany({ select: { email: true, role: true, isActive: true } })
  console.log('\n📋 Current users in DB:')
  users.forEach(u => console.log(`   ${u.email} | ${u.role} | active:${u.isActive}`))

  if (users.length === 0) {
    console.log('   ❌ NO USERS — database is empty! Run: npx prisma migrate reset --force')
    return
  }

  // Try to fix passwords directly
  console.log('\n🔧 Fixing passwords...')
  const tbipl = await bcrypt.hash('TBIPL@1224', 10)
  const tl    = await bcrypt.hash('TeamLead@1224', 10)

  await p.user.upsert({ where:{email:'admin@turtlebytes.in'}, update:{password:tbipl,role:'SUPER_ADMIN',isActive:true}, create:{email:'admin@turtlebytes.in',password:tbipl,role:'SUPER_ADMIN'} })
  await p.user.upsert({ where:{email:'hr@turtlebytes.in'},    update:{password:tbipl,role:'HR_ADMIN',isActive:true},    create:{email:'hr@turtlebytes.in',   password:tbipl,role:'HR_ADMIN'} })
  await p.user.upsert({ where:{email:'teamlead@turtlebytes.in'}, update:{password:tl,role:'TEAM_LEAD',isActive:true},   create:{email:'teamlead@turtlebytes.in',password:tl,role:'TEAM_LEAD'} })

  console.log('✅ Passwords reset successfully')
  console.log('\n🔑 Try these logins:')
  console.log('   admin@turtlebytes.in     /  TBIPL@1224')
  console.log('   hr@turtlebytes.in        /  TBIPL@1224')
  console.log('   teamlead@turtlebytes.in  /  TeamLead@1224')
}

main().catch(e => {
  console.error('❌ Error:', e.message)
  if (e.message.includes('does not exist')) {
    console.log('\n💡 Tables missing — run: npx prisma migrate reset --force')
  }
}).finally(() => p.$disconnect())

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing departments...\n');

    // Get target departments
    const dpDept = await prisma.department.findUnique({ where: { code: 'DP' } });
    const opsDept = await prisma.department.findUnique({ where: { code: 'OPS' } });

    if (!dpDept || !opsDept) {
        console.error('❌ DP or OPS department not found. Run npx prisma db seed first.');
        return;
    }

    // ── 1. Engineering → move employees to DP, then delete ───────────────────
    const engDept = await prisma.department.findFirst({
        where: { OR: [{ code: 'ENG' }, { code: 'ENGINEERING' }, { name: { contains: 'Engineering' } }] }
    });
    if (engDept) {
        const moved = await prisma.employee.updateMany({
            where: { departmentId: engDept.id },
            data: { departmentId: dpDept.id },
        });
        await prisma.department.delete({ where: { id: engDept.id } });
        console.log(`✅ Engineering removed — ${moved.count} employee(s) moved → Data Processing`);
    } else {
        console.log('ℹ️  Engineering department not found (already removed)');
    }

    // ── 2. QA → delete (0 employees, safe to delete directly) ────────────────
    const qaDept = await prisma.department.findFirst({
        where: { OR: [{ code: 'QA' }, { name: { contains: 'Quality' } }] }
    });
    if (qaDept) {
        await prisma.employee.updateMany({
            where: { departmentId: qaDept.id },
            data: { departmentId: dpDept.id },
        });
        await prisma.department.delete({ where: { id: qaDept.id } });
        console.log(`✅ QA removed`);
    } else {
        console.log('ℹ️  QA department not found (already removed)');
    }

    // ── 3. Sales → delete (0 employees, safe) ────────────────────────────────
    const salesDept = await prisma.department.findFirst({
        where: { OR: [{ code: 'SALES' }, { name: { contains: 'Sales' } }] }
    });
    if (salesDept) {
        await prisma.employee.updateMany({
            where: { departmentId: salesDept.id },
            data: { departmentId: dpDept.id },
        });
        await prisma.department.delete({ where: { id: salesDept.id } });
        console.log(`✅ Sales removed`);
    } else {
        console.log('ℹ️  Sales department not found (already removed)');
    }

    // ── 4. XML Conversion employees → OPS ────────────────────────────────────
    const xmlMoved = await prisma.employee.updateMany({
        where: { jobTitle: { contains: 'XML', mode: 'insensitive' } },
        data: { departmentId: opsDept.id },
    });
    console.log(`✅ XML Conversion employees moved → Operations (${xmlMoved.count} employees)`);

    // ── 5. Also move Copy Editor and E-pub to OPS ─────────────────────────────
    const otherMoved = await prisma.employee.updateMany({
        where: {
            AND: [
                { departmentId: dpDept.id },
                { jobTitle: { in: ['Copy Editor', 'E-pub XML convertion', 'Copy editor'] } }
            ]
        },
        data: { departmentId: opsDept.id },
    });
    if (otherMoved.count > 0) {
        console.log(`✅ Copy Editor/E-pub employees moved → Operations (${otherMoved.count})`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n📊 Final Department Summary:');
    const depts = await prisma.department.findMany({
        include: { _count: { select: { employees: true } } },
        orderBy: { name: 'asc' },
    });
    for (const d of depts) {
        console.log(`   ${d.code.padEnd(6)} ${d.name.padEnd(25)} — ${d._count.employees} employees`);
    }
    console.log('\n✅ Done! Refresh your browser.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
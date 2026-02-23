import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { default: postgres } = require('./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js');
const bcrypt = require('./node_modules/.pnpm/bcryptjs@3.0.2/node_modules/bcryptjs/index.js');

const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cargo_marketplace';
const sql = postgres(url, { connect_timeout: 5 });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'golubevpm1@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '19955991aG';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Александр Голубев';

async function seedAdmin() {
  console.log('DB URL:', url.replace(/:([^:@]+)@/, ':***@'));

  // Check if admin already exists
  const [existing] = await sql`
    SELECT id, email, role FROM admins WHERE email = ${ADMIN_EMAIL}
  `;

  if (existing) {
    console.log('Admin already exists:', existing.email, '(role:', existing.role + ')');
    // Update password
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await sql`UPDATE admins SET password_hash = ${hash}, status = 'active' WHERE id = ${existing.id}`;
    console.log('Password updated successfully.');
    await sql.end();
    return;
  }

  // Create new admin
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const [admin] = await sql`
    INSERT INTO admins (email, password_hash, full_name, role, status)
    VALUES (${ADMIN_EMAIL}, ${hash}, ${ADMIN_NAME}, 'super_admin', 'active')
    RETURNING id, email, role
  `;

  console.log('Admin created:', admin.email, '(role:', admin.role + ')');
  await sql.end();
}

seedAdmin().catch(e => { console.error('ERROR:', e.message); process.exit(1); });

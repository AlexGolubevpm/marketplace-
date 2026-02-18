import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { default: postgres } = require('./node_modules/.pnpm/postgres@3.4.8/node_modules/postgres/src/index.js');

const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cargo_marketplace';
const sql = postgres(url, { connect_timeout: 5 });

async function check() {
  console.log('DB URL:', url.replace(/:([^:@]+)@/, ':***@'));

  // Проверяем таблицы
  const tables = await sql`SELECT tablename FROM pg_tables WHERE tablename LIKE 'knowledge%' ORDER BY tablename`;
  console.log('Knowledge tables:', tables.map(t => t.tablename));

  if (!tables.length) {
    console.error('PROBLEM: knowledge tables NOT FOUND — need to run migrations!');
    await sql.end();
    return;
  }

  // Пробуем вставить статью
  try {
    const [art] = await sql`
      INSERT INTO knowledge_articles (title, slug, content, status)
      VALUES ('Test', 'test-debug-delete-me', 'Test content', 'published')
      ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
      RETURNING id, status, slug
    `;
    console.log('INSERT OK:', art);
    await sql`DELETE FROM knowledge_articles WHERE slug = 'test-debug-delete-me'`;
    console.log('DELETE OK — DB works fine, problem is elsewhere');
  } catch(e) {
    console.error('INSERT ERROR:', e.message);
  }

  await sql.end();
}

check().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

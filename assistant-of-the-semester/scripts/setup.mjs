import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'node:fs';
const { Client } = pg;
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL belum disetel. Buat file .env atau hubungkan Neon.');
  process.exit(1);
}
const client = new Client({connectionString: process.env.DATABASE_URL});
try {
  await client.connect();
  await client.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  console.log('Database berhasil disiapkan. Struktur prodi dan kelompok siap; impor data/peserta-dsp.csv melalui panel admin.');
} finally {
  await client.end();
}

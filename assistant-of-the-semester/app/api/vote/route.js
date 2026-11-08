import { NextResponse } from 'next/server';
import { db, hasDatabase } from '../../../lib/db';
import { CATEGORY_KEYS } from '../../../lib/constants';
import { verifyPin, validOrigin } from '../../../lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data, status = 200) => NextResponse.json(data, {status, headers: {'Cache-Control': 'no-store'}});
const isId = (id) => /^\d{1,18}$/.test(String(id));

export async function POST(request) {
  if (!validOrigin(request)) return json({error: 'Asal permintaan tidak valid.'}, 403);
  if (!hasDatabase()) return json({error: 'Database belum disiapkan. Ini hanya tampilan demo.'}, 503);
  if (Number(request.headers.get('content-length') || 0) > 8192) return json({error: 'Permintaan terlalu besar.'}, 413);
  try {
    const body = await request.json();
    const {groupId, voterId, pin, choices} = body || {};
    if (!isId(groupId) || !isId(voterId) || typeof pin !== 'string' || pin.length > 64 || !choices || typeof choices !== 'object') {
      return json({error: 'Data pemilih tidak valid.'}, 400);
    }
    const assistantIds = CATEGORY_KEYS.map(key => choices[key]);
    if (assistantIds.some(id => !isId(id))) return json({error: 'Isi pilihan untuk keempat kategori.'}, 400);

    const [setting, voterRows, candidates] = await Promise.all([
      db("SELECT value FROM settings WHERE key='voting_open'"),
      db(`SELECT v.id,v.pin_hash,v.failed_attempts,v.locked_until FROM voters v
        JOIN classes c ON c.id=v.class_id WHERE v.id=$1 AND v.class_id=$2
        AND c.program_name IS NOT NULL AND c.group_number IS NOT NULL`, [voterId, groupId]),
      db('SELECT id FROM assistants WHERE active=true AND id = ANY($1::bigint[])', [assistantIds])
    ]);
    if (setting[0]?.value !== 'true') return json({error: 'Voting belum dibuka atau sudah ditutup.'}, 403);
    const voter = voterRows[0];
    if (!voter) return json({error: 'Nama tidak terdaftar pada program studi dan kelompok yang dipilih.'}, 400);
    if (voter.locked_until && new Date(voter.locked_until).getTime() > Date.now()) {
      return json({error: 'Terlalu banyak percobaan kode yang salah. Coba kembali dalam 15 menit atau hubungi panitia.'}, 429);
    }
    if (!verifyPin(pin.trim().toUpperCase(), voter.pin_hash)) {
      await db(`UPDATE voters SET failed_attempts=failed_attempts+1,
        locked_until=CASE WHEN failed_attempts+1>=5 THEN NOW()+INTERVAL '15 minutes' ELSE NULL END
        WHERE id=$1`, [voterId]);
      return json({error: 'Kode voting tidak sesuai dengan nama pemilih.'}, 401);
    }
    if (candidates.length !== new Set(assistantIds.map(String)).size) {
      return json({error: 'Salah satu kandidat tidak aktif atau tidak tersedia.'}, 400);
    }
    const result = await db(`WITH created_ballot AS (
      INSERT INTO ballots(voter_id) VALUES($1)
      ON CONFLICT (voter_id) DO NOTHING RETURNING id
    ), created_choices AS (
      INSERT INTO ballot_choices(ballot_id,category,assistant_id)
      SELECT b.id, c.category, c.assistant_id
      FROM created_ballot b
      CROSS JOIN UNNEST($2::text[], $3::bigint[]) AS c(category,assistant_id)
      RETURNING ballot_id
    ) SELECT (SELECT COUNT(*)::int FROM created_ballot) AS ballots_created,
      (SELECT COUNT(*)::int FROM created_choices) AS choices_created`,
      [voterId, CATEGORY_KEYS, assistantIds]);
    if (result[0]?.ballots_created !== 1) return json({error: 'Nama ini sudah pernah mengirim voting. Satu nama hanya bisa voting satu kali.'}, 409);
    if (result[0]?.choices_created !== 4) {
      // Query di atas adalah satu statement atomik; kondisi ini merupakan anomali.
      throw new Error('Jumlah pilihan tidak sesuai.');
    }
    await db('UPDATE voters SET failed_attempts=0,locked_until=NULL WHERE id=$1', [voterId]);
    return json({success: true, message: 'Voting berhasil tercatat. Terima kasih sudah berpartisipasi!'});
  } catch (error) {
    console.error('Vote error:', error);
    return json({error: 'Terjadi kesalahan server. Silakan coba lagi.'}, 500);
  }
}

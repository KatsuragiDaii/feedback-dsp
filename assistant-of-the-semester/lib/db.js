import { neon } from '@neondatabase/serverless';
import { DEMO_DATA, CATEGORY_KEYS } from './constants';

let client;
export function hasDatabase() { return Boolean(process.env.DATABASE_URL); }
export function db(query, params = []) {
  if (!hasDatabase()) throw new Error('DATABASE_URL belum disetel.');
  if (!client) client = neon(process.env.DATABASE_URL);
  return client(query, params);
}
export async function getPublicData() {
  if (!hasDatabase()) return DEMO_DATA;
  const [groups, voters, assistants, settings] = await Promise.all([
    db('SELECT id, program_name, group_number FROM classes WHERE program_name IS NOT NULL AND group_number IS NOT NULL ORDER BY program_name,group_number'),
    db(`SELECT v.id, v.class_id, v.name FROM voters v
      JOIN classes c ON c.id=v.class_id WHERE c.program_name IS NOT NULL ORDER BY v.name`),
    db('SELECT id, name, photo_url, description FROM assistants WHERE active = true ORDER BY name'),
    db("SELECT value FROM settings WHERE key='voting_open'")
  ]);
  const programs=[...new Set(groups.map(g=>g.program_name))].sort((a,b)=>a.localeCompare(b,'id'));
  return {demo:false, votingOpen:settings[0]?.value==='true', programs, groups, voters, assistants};
}
export async function getAdminData() {
  const [groups, voters, assistants, setting, ballotCounts, results] = await Promise.all([
    db('SELECT id,program_name,group_number FROM classes WHERE program_name IS NOT NULL AND group_number IS NOT NULL ORDER BY program_name,group_number'),
    db(`SELECT v.id,v.name,v.nim,v.class_id,c.program_name,c.group_number,
        EXISTS(SELECT 1 FROM ballots b WHERE b.voter_id=v.id) AS has_voted
      FROM voters v JOIN classes c ON c.id=v.class_id
      WHERE c.program_name IS NOT NULL ORDER BY c.program_name,c.group_number,v.name`),
    db('SELECT id,name,photo_url,description,active FROM assistants ORDER BY name'),
    db("SELECT value FROM settings WHERE key='voting_open'"),
    db(`SELECT COUNT(*)::int AS count FROM ballots b JOIN voters v ON b.voter_id=v.id
        JOIN classes c ON c.id=v.class_id WHERE c.program_name IS NOT NULL`),
    db(`SELECT bc.category,a.id AS assistant_id,a.name,COUNT(*)::int AS count
      FROM ballot_choices bc JOIN assistants a ON a.id=bc.assistant_id
      JOIN ballots b ON b.id=bc.ballot_id JOIN voters v ON v.id=b.voter_id
      JOIN classes c ON c.id=v.class_id WHERE c.program_name IS NOT NULL
      GROUP BY bc.category,a.id,a.name ORDER BY bc.category,count DESC,a.name`)
  ]);
  const programs=[...new Set(groups.map(g=>g.program_name))].sort((a,b)=>a.localeCompare(b,'id'));
  return {groups,programs,voters,assistants,votingOpen:setting[0]?.value==='true',
    totalBallots:ballotCounts[0]?.count||0,results:results.filter(r=>CATEGORY_KEYS.includes(r.category))};
}

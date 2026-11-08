import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { isAdmin, validOrigin, generatePin, hashPin } from '../../../../lib/security';
import { db, hasDatabase } from '../../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const respond = (data, status = 200) => NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
const idOk = (value) => /^\d{1,18}$/.test(String(value));
const cleanName = (value) => typeof value === 'string' ? value.trim().replace(/\s+/g,' ') : '';
const cleanProgram = (value) => cleanName(value);
const validProgram = (name) => name.length >= 3 && name.length <= 100 && !/[<>\x00-\x1f]/.test(name);
const validNumber = (n) => Number.isInteger(n) && n >= 1 && n <= 999;
const validNim = (nim) => /^\d{8,20}$/.test(nim);
const photoOk = (s) => !s || /^(https:\/\/[^\s]+|\/[^\s]+)$/.test(s);
// Kode grup internal stabil; tidak digunakan sebagai identitas mahasiswa.
const groupCode = (program, number) => 'DSP-' + createHash('sha256').update(program.toLocaleLowerCase('id')).digest('hex').slice(0,16) + '-' + String(number).padStart(3,'0');

export async function POST(request) {
  if (!validOrigin(request)) return respond({error:'Akses tidak valid.'},403);
  if (!(await isAdmin())) return respond({error:'Sesi admin berakhir. Silakan login.'},401);
  if (!hasDatabase()) return respond({error:'DATABASE_URL belum disiapkan.'},503);
  if (Number(request.headers.get('content-length')||0)>200000) return respond({error:'Data terlalu besar; gunakan batch maksimal 80 peserta.'},413);
  try {
    const body=await request.json();
    switch(body?.action) {
      case 'add_group': {
        const programName=cleanProgram(body.programName);
        const groupNumber=Number(body.groupNumber);
        if (!validProgram(programName)||!validNumber(groupNumber)) return respond({error:'Program studi atau nomor kelompok tidak valid.'},400);
        await db(`INSERT INTO classes(code,program_name,group_number) VALUES($1,$2,$3)
          ON CONFLICT DO NOTHING`,[groupCode(programName,groupNumber),programName,groupNumber]);
        return respond({success:true});
      }
      case 'import_voters': {
        if(!Array.isArray(body.rows)||!body.rows.length||body.rows.length>80) {
          return respond({error:'Impor 1–80 peserta per batch.'},400);
        }
        const seen=new Set();
        const rows=[];
        for (const row of body.rows) {
          const programName=cleanProgram(row?.programName);
          const groupNumber=Number(row?.groupNumber);
          const nim=String(row?.nim ?? '').trim();
          const name=cleanName(row?.name);
          if (!validProgram(programName)||!validNumber(groupNumber)||!validNim(nim)||name.length<2||name.length>180) {
            return respond({error:`Data tidak valid: ${name||'nama kosong'}. Format harus program_studi,kelompok,nim,nama.`},400);
          }
          if(seen.has(nim)) continue;
          seen.add(nim);
          rows.push({programName,groupNumber,nim,name,code:groupCode(programName,groupNumber)});
        }
        await db(`INSERT INTO classes(code,program_name,group_number)
          SELECT DISTINCT code,program_name,group_number
          FROM UNNEST($1::text[],$2::text[],$3::int[]) AS t(code,program_name,group_number)
          ON CONFLICT DO NOTHING`,[rows.map(r=>r.code),rows.map(r=>r.programName),rows.map(r=>r.groupNumber)]);
        const draft=rows.map(r=>({...r,pin:generatePin()}));
        const inserted=await db(`WITH input AS (
          SELECT * FROM UNNEST($1::text[],$2::text[],$3::text[],$4::text[]) AS t(group_code,nim,full_name,secret_hash)
        ), ins AS (
          INSERT INTO voters(class_id,nim,name,pin_hash)
          SELECT c.id,i.nim,i.full_name,i.secret_hash FROM input i JOIN classes c ON c.code=i.group_code
          ON CONFLICT DO NOTHING RETURNING id,nim,name,class_id
        ) SELECT ins.nim,ins.name,c.program_name,c.group_number
          FROM ins JOIN classes c ON c.id=ins.class_id`,
          [draft.map(r=>r.code),draft.map(r=>r.nim),draft.map(r=>r.name),draft.map(r=>hashPin(r.pin))]);
        const pinByNim=new Map(draft.map(r=>[r.nim,r.pin]));
        const credentials=inserted.map(v=>({programName:v.program_name,groupNumber:v.group_number,
          nim:v.nim,name:v.name,pin:pinByNim.get(v.nim)}));
        return respond({success:true,added:credentials.length,skipped:body.rows.length-credentials.length,credentials});
      }
      case 'reset_pin': {
        if(!idOk(body.voterId)) return respond({error:'ID tidak valid.'},400);
        const pin=generatePin();
        const changed=await db(`UPDATE voters SET pin_hash=$1,failed_attempts=0,locked_until=NULL
          WHERE id=$2 RETURNING name,nim,
          (SELECT program_name FROM classes WHERE id=voters.class_id) AS program_name,
          (SELECT group_number FROM classes WHERE id=voters.class_id) AS group_number`,
          [hashPin(pin),body.voterId]);
        if(!changed.length) return respond({error:'Pemilih tidak ditemukan.'},404);
        const v=changed[0];
        return respond({success:true,credentials:[{name:v.name,nim:v.nim,programName:v.program_name,groupNumber:v.group_number,pin}]});
      }
      case 'delete_voter': {
        if(!idOk(body.voterId)) return respond({error:'ID tidak valid.'},400);
        const removed=await db(`DELETE FROM voters v WHERE v.id=$1
          AND NOT EXISTS(SELECT 1 FROM ballots b WHERE b.voter_id=v.id) RETURNING id`,[body.voterId]);
        if(!removed.length) return respond({error:'Peserta sudah voting atau tidak ditemukan.'},409);
        return respond({success:true});
      }
      case 'add_assistant': {
        const name=cleanName(body.name);const url=String(body.photoUrl||'').trim();
        const description=String(body.description||'').trim();
        if(name.length<2||name.length>180||description.length>280||!photoOk(url)) return respond({error:'Data asisten tidak valid.'},400);
        await db('INSERT INTO assistants(name,photo_url,description) VALUES($1,$2,$3)',[name,url,description]);
        return respond({success:true});
      }
      case 'edit_assistant': {
        if(!idOk(body.assistantId)) return respond({error:'ID kandidat tidak valid.'},400);
        const name=cleanName(body.name);const url=String(body.photoUrl||'').trim();
        const description=String(body.description||'').trim();
        if(name.length<2||name.length>180||description.length>280||!photoOk(url)) return respond({error:'Data kandidat tidak valid.'},400);
        await db('UPDATE assistants SET name=$1,photo_url=$2,description=$3,active=$4 WHERE id=$5',
          [name,url,description,Boolean(body.active),body.assistantId]);
        return respond({success:true});
      }
      case 'delete_assistant': {
        if(!idOk(body.assistantId)) return respond({error:'ID kandidat tidak valid.'},400);
        const removed=await db(`DELETE FROM assistants a WHERE a.id=$1
          AND NOT EXISTS(SELECT 1 FROM ballot_choices bc WHERE bc.assistant_id=a.id) RETURNING id`,[body.assistantId]);
        if(!removed.length) return respond({error:'Kandidat sudah menerima suara atau tidak ditemukan.'},409);
        return respond({success:true});
      }
      case 'set_voting': {
        const open=body.open===true;
        if(open){
          const [v,a]=await Promise.all([
            db(`SELECT COUNT(*)::int AS n FROM voters v JOIN classes c ON c.id=v.class_id WHERE c.program_name IS NOT NULL`),
            db('SELECT COUNT(*)::int AS n FROM assistants WHERE active=true')]);
          if(!v[0].n||!a[0].n) return respond({error:'Impor peserta dan tambahkan kandidat aktif sebelum voting dibuka.'},400);
        }
        await db("INSERT INTO settings(key,value) VALUES('voting_open',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[String(open)]);
        return respond({success:true});
      }
      default:return respond({error:'Aksi tidak dikenal.'},400);
    }
  } catch(error){
    console.error('Admin action error:',error);
    return respond({error:'Operasi gagal. Periksa format, duplikat atau koneksi database.'},500);
  }
}

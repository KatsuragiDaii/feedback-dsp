import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { isAdmin, validOrigin } from '../../../../lib/security';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';
export async function POST(request) {
  if (!validOrigin(request)) return NextResponse.json({error:'Akses tidak valid.'},{status:403});
  if (!(await isAdmin())) return NextResponse.json({error:'Login admin diperlukan.'},{status:401});
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({error:'BLOB_READ_WRITE_TOKEN belum disetel. Gunakan URL foto atau aktifkan Vercel Blob.'},{status:400});
  try {
    const form = await request.formData();
    const file = form.get('photo');
    if (!(file instanceof File) || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 4*1024*1024 || file.size===0) {
      return NextResponse.json({error:'Foto harus JPG, PNG atau WebP, ukuran maksimal 4 MB.'},{status:400});
    }
    const ext = file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const result = await put(`assistants/${randomUUID()}.${ext}`, file, {access:'public', contentType:file.type});
    return NextResponse.json({success:true,url:result.url});
  } catch (error) {
    console.error('Upload error:',error);
    return NextResponse.json({error:'Upload gagal, periksa koneksi Blob Store.'},{status:500});
  }
}

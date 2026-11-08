import { NextResponse } from 'next/server';
import { passwordIsValid, setAdminCookie, validOrigin } from '../../../../lib/security';
export const runtime = 'nodejs';
export async function POST(request) {
  if (!validOrigin(request)) return NextResponse.json({error:'Akses tidak valid.'},{status:403});
  if (Number(request.headers.get('content-length') || 0) > 2048) return NextResponse.json({error:'Permintaan terlalu besar.'},{status:413});
  try {
    const {password} = await request.json();
    if (!passwordIsValid(password)) return NextResponse.json({error:'Password admin salah atau belum dikonfigurasi.'},{status:401});
    await setAdminCookie();
    return NextResponse.json({success:true});
  } catch { return NextResponse.json({error:'Konfigurasi login admin belum valid.'},{status:500}); }
}

import { NextResponse } from 'next/server';
import { clearAdminCookie, validOrigin } from '../../../../lib/security';
export async function POST(request) {
  if (!validOrigin(request)) return NextResponse.json({error:'Akses tidak valid.'},{status:403});
  await clearAdminCookie();
  return NextResponse.json({success:true});
}

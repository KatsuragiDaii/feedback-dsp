import AdminClient from './AdminClient';
import {isAdmin} from '../../lib/security';
import {hasDatabase,getAdminData} from '../../lib/db';
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const loggedIn = await isAdmin();
  let data=null; let error='';
  if (loggedIn && hasDatabase()) {
    try { data = await getAdminData(); }
    catch(err) { console.error(err); error='Database belum diinisialisasi. Jalankan npm run db:init.'; }
  }
  return <AdminClient loggedIn={loggedIn} data={data} error={error || (!hasDatabase()?'DATABASE_URL belum disetel. Baca README.md untuk langkah setup.':'')}/>;
}

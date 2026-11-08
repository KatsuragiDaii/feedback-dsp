'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {
  Trophy,LayoutDashboard,UsersRound,UserRound,Settings2,LogOut,ArrowLeft,
  Vote,CheckCircle2,ShieldCheck,Download,UploadCloud,Plus,LockKeyhole,
  RefreshCw,Trash2,Pencil,ImageUp,AlertCircle,BarChart3,Clock3,Copy
} from 'lucide-react';
import {CATEGORIES} from '../../lib/constants';

function csvCell(v) {return `"${String(v??'').replaceAll('"','""')}"`;}
function downloadCsv(filename,rows) {
  const content='\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function readCsv(text) {
  const firstLine=text.split(/\r?\n/)[0]||'';
  const delim=(firstLine.match(/;/g)||[]).length>(firstLine.match(/,/g)||[]).length?';':',';
  const rows=[];let cols=[];let item='';let quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){if(quoted&&text[i+1]==='"'){item+='"';i++;}else quoted=!quoted;}
    else if(ch===delim&&!quoted){cols.push(item);item='';}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;cols.push(item);item='';if(cols.some(x=>x.trim()))rows.push(cols);cols=[];}
    else item+=ch;
  }
  cols.push(item);if(cols.some(x=>x.trim()))rows.push(cols);
  if(!rows.length)return [];
  const header=rows[0].map(v=>v.replace(/^\ufeff/,'').trim().toLowerCase().replaceAll(' ','_'));
  const hasHeader=header.includes('program_studi')&&header.includes('kelompok')&&header.includes('nim')&&header.includes('nama');
  const idx=hasHeader?['program_studi','kelompok','nim','nama'].map(h=>header.indexOf(h)):[0,1,2,3];
  return rows.slice(hasHeader?1:0).map(r=>({programName:(r[idx[0]]||'').replace(/^\ufeff/,'').trim(),
    groupNumber:(r[idx[1]]||'').trim(),nim:(r[idx[2]]||'').trim(),name:(r[idx[3]]||'').trim()}))
    .filter(r=>r.programName||r.groupNumber||r.nim||r.name);
}
const codesTable=(items)=>[['Program Studi','Kelompok','NIM','Nama','Kode Voting'],
  ...items.map(c=>[c.programName,c.groupNumber,c.nim,c.name,c.pin])];
function CandidatePicture({candidate}) {
  const [err,setErr]=useState(false);
  return <div className="assistant-photo">{candidate.photo_url&&!err
    ?<img src={candidate.photo_url} alt={`Foto ${candidate.name}`} onError={()=>setErr(true)}/>
    :<div className="photo-placeholder"><UserRound size={42}/><span>FOTO</span></div>}</div>;
}

export default function AdminClient({loggedIn,data,error}) {
  const router=useRouter();
  const [password,setPassword]=useState('');
  const [loggingIn,setLoggingIn]=useState(false);
  const [loginError,setLoginError]=useState('');
  const [tab,setTab]=useState('overview');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [errorMsg,setErrorMsg]=useState('');
  const [groupProgram,setGroupProgram]=useState('');
  const [groupNumber,setGroupNumber]=useState('');
  const [importText,setImportText]=useState('');
  const [credentials,setCredentials]=useState([]);
  const [importResult,setImportResult]=useState(null);
  const [search,setSearch]=useState('');
  const [programFilter,setProgramFilter]=useState('');
  const [groupFilter,setGroupFilter]=useState('');
  const [importProgress,setImportProgress]=useState(null);
  const [candidateForm,setCandidateForm]=useState({name:'',photoUrl:'',description:'',active:true});
  const [editing,setEditing]=useState(null);
  const [uploadFile,setUploadFile]=useState(null);

  async function login(event){
    event.preventDefault();setLoggingIn(true);setLoginError('');
    try{
      const response=await fetch('/api/admin/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setPassword('');router.refresh();
    }catch(err){setLoginError(err.message);}finally{setLoggingIn(false);}
  }
  async function logout(){await fetch('/api/admin/logout',{method:'POST'});router.refresh();}
  async function action(body,{onSuccess}={}){
    setBusy(true);setMessage('');setErrorMsg('');
    try{
      const response=await fetch('/api/admin/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Operasi gagal.');
      setMessage('Perubahan berhasil disimpan.');
      if(onSuccess)onSuccess(result);
      router.refresh();
      return result;
    }catch(err){setErrorMsg(err.message);return null;}
    finally{setBusy(false);}
  }
  async function uploadPhoto(){
    if(!uploadFile)return null;
    setBusy(true);setMessage('');setErrorMsg('');
    try{
      const form=new FormData();form.append('photo',uploadFile);
      const response=await fetch('/api/admin/upload',{method:'POST',body:form});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      setCandidateForm(prev=>({...prev,photoUrl:result.url}));
      setUploadFile(null);
      setMessage('Foto berhasil diunggah. Klik Simpan Kandidat untuk menyimpan data.');
      return result.url;
    }catch(err){setErrorMsg(err.message);return null;}finally{setBusy(false);}
  }
  async function saveCandidate(event){
    event.preventDefault();
    let url=candidateForm.photoUrl;
    if(uploadFile){const uploaded=await uploadPhoto();if(!uploaded)return;url=uploaded;}
    const body=editing?{action:'edit_assistant',assistantId:editing,...candidateForm,photoUrl:url}
      :{action:'add_assistant',...candidateForm,photoUrl:url};
    await action(body,{onSuccess:()=>{setCandidateForm({name:'',photoUrl:'',description:'',active:true});setEditing(null);setUploadFile(null);}});
  }
  function editCandidate(c){setEditing(String(c.id));setCandidateForm({name:c.name,photoUrl:c.photo_url||'',description:c.description||'',active:c.active});setTab('assistants');window.scrollTo({top:0,behavior:'smooth'});}
  function clearCandidate(){setEditing(null);setCandidateForm({name:'',photoUrl:'',description:'',active:true});setUploadFile(null);}

  if(!loggedIn)return <div className="site-shell">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark"><Trophy size={20}/></span><span>ASSISTANT <b>AWARDS.</b></span></Link></header>
    <main className="admin-login-card"><span className="brand-mark"><ShieldCheck size={21}/></span><div className="eyebrow">ADMIN ACCESS</div><h1>Panel Panitia</h1><p>Masuk untuk mengatur data peserta per program studi dan kelompok, foto asisten, jadwal voting, serta melihat rekap hasil.</p>
      {error&&<div className="admin-message admin-error">{error}</div>}{loginError&&<div className="admin-message admin-error">{loginError}</div>}
      <form onSubmit={login} className="admin-form"><label className="admin-label">Password admin<input required className="admin-input" type="password" autoComplete="current-password" placeholder="Masukkan password admin" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={loggingIn} className="primary-button">{loggingIn?'Memeriksa...':'Masuk ke Dashboard'}</button></form>
      <Link href="/" className="admin-outline"><ArrowLeft size={15}/> Kembali ke formulir voting</Link></main>
    <footer className="site-footer">Assistant of the Semester · Administrator</footer>
  </div>;

  if(!data)return <div className="site-shell"><header className="topbar"><Link className="brand" href="/"><span className="brand-mark"><Trophy size={20}/></span>ASSISTANT <b>AWARDS.</b></Link></header><main className="admin-shell"><div className="admin-message admin-error">{error||'Data admin belum tersedia.'}</div><p>Hubungkan database Neon, jalankan <code>npm run db:init</code>, kemudian buka kembali halaman ini.</p><button className="admin-outline" onClick={()=>router.refresh()}><RefreshCw size={16}/> Muat ulang</button></main></div>;

  const totalVoters=data.voters.length;
  const participation=totalVoters?Math.round(data.totalBallots/totalVoters*100):0;
  const visibleGroups=data.groups.filter(g=>!programFilter||g.program_name===programFilter);
  const filteredVoters=data.voters.filter(v=>(!programFilter||v.program_name===programFilter) &&
    (!groupFilter||String(v.class_id)===groupFilter) &&
    (`${v.nim||''} ${v.name} ${v.program_name} ${v.group_number}`).toLowerCase().includes(search.toLowerCase()));
  async function importAll(){
    const rows=readCsv(importText);
    if(!rows.length){setErrorMsg('CSV tidak memiliki baris peserta.');return;}
    if(rows.length>5000){setErrorMsg('Maksimal 5000 baris dalam satu file.');return;}
    setBusy(true);setErrorMsg('');setMessage('');setCredentials([]);setImportResult(null);
    let collected=[];let skipped=0;
    try{
      for(let offset=0;offset<rows.length;offset+=60){
        const response=await fetch('/api/admin/action',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'import_voters',rows:rows.slice(offset,offset+60)})});
        const result=await response.json();
        if(!response.ok)throw new Error(`Batch ${Math.floor(offset/60)+1}: ${result.error||'Impor gagal.'}`);
        collected=collected.concat(result.credentials||[]);skipped+=result.skipped||0;
        setCredentials([...collected]);setImportResult({added:collected.length,skipped});
        setImportProgress({processed:Math.min(offset+60,rows.length),total:rows.length});
      }
      if(collected.length)downloadCsv('kode-voting-RAHASIA.csv',codesTable(collected));
      setMessage(`${collected.length} mahasiswa berhasil didaftarkan, ${skipped} sudah ada. File kode voting berhasil disiapkan.`);
      setImportText('');router.refresh();
    }catch(err){setErrorMsg(err.message+' Unduh kode yang sudah berhasil sekarang sebelum memulai ulang.');router.refresh();}
    finally{setBusy(false);}
  }
  return <div className="site-shell"><header className="topbar"><Link className="brand" href="/"><span className="brand-mark"><Trophy size={20}/></span><span>ASSISTANT <b>AWARDS.</b></span></Link><div className="topbar-right"><span className="topbar-edition">ADMIN DASHBOARD</span><Link className="admin-link" href="/">Lihat website</Link></div></header>
    <main className="admin-shell">
      <div className="admin-header"><div><div className="eyebrow">CONTROL CENTER</div><h1>Dashboard Panitia</h1><p>Kelola voting Assistant of the Semester dari satu tempat.</p></div><div className="admin-actions"><span className={`admin-status ${data.votingOpen?'status-open':''}`}>{data.votingOpen?<CheckCircle2 size={14}/>:<Clock3 size={14}/>} {data.votingOpen?'Voting dibuka':'Voting ditutup'}</span><button className="admin-logout" onClick={logout}><LogOut size={15}/> Logout</button></div></div>
      <div className="admin-nav">{[
        ['overview','Ringkasan',LayoutDashboard],['voters','Pemilih & Kelompok',UsersRound],['assistants','Kandidat Asisten',UserRound],['settings','Pengaturan',Settings2]
      ].map(([key,label,Icon])=><button key={key} className={tab===key?'admin-active':''} onClick={()=>{setTab(key);setMessage('');setErrorMsg('')}}><Icon size={16}/>{label}</button>)}</div>
      {message&&<div className="admin-message"><CheckCircle2 size={16}/> {message}</div>}{errorMsg&&<div className="admin-message admin-error"><AlertCircle size={16}/> {errorMsg}</div>}

      {tab==='overview'&&<>
        <div className="stats-grid">{[
          ['Total Pemilih',totalVoters,UsersRound,`${data.programs.length} prodi · ${data.groups.length} kelompok`],
          ['Sudah Voting',data.totalBallots,Vote,'Formulir berhasil dikirim'],
          ['Partisipasi',`${participation}%`,BarChart3,'Dari total pemilih'],
          ['Kandidat',data.assistants.filter(x=>x.active).length,Trophy,'Asisten aktif']
        ].map(([label,value,Icon,desc])=><div className="stat-card" key={label}><div className="stat-card-head"><span>{label}</span><Icon size={20}/></div><strong>{value}</strong><small>{desc}</small></div>)}</div>
        <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Rekap Perolehan Suara</h2><p>Hanya jumlah agregat per kategori, tidak menampilkan pilihan masing-masing mahasiswa.</p></div><button className="admin-outline" onClick={()=>downloadCsv('rekap-voting.csv',[['Kategori','Asisten','Jumlah suara'],...data.results.map(r=>[CATEGORIES.find(c=>c.key===r.category)?.label,r.name,r.count])])}><Download size={15}/> Export CSV</button></div>
          <div className="admin-result-grid">{CATEGORIES.map(category=>{
            const entries=data.results.filter(r=>r.category===category.key);
            const max=Math.max(1,...entries.map(r=>r.count));
            return <div className="admin-result-card" key={category.key}><h3>{category.label}</h3>{entries.length===0?<p className="admin-muted">Belum ada suara untuk kategori ini.</p>:entries.map(r=><div className="result-row" key={r.assistant_id}><span title={r.name}>{r.name}</span><div className="result-bar"><div style={{width:`${r.count/max*100}%`}}/></div><b>{r.count}</b></div>)}</div>;
          })}</div></section>
      </>}

      {tab==='voters'&&<>
        <section className="admin-panel"><h2>Program Studi & Kelompok</h2><p>Lima program/jalur akan otomatis terdaftar ketika daftar mahasiswa diimpor. Kamu juga dapat membuat kelompok tambahan.</p>
          <form className="admin-toolbar" onSubmit={e=>{e.preventDefault();action({action:'add_group',programName:groupProgram,groupNumber:Number(groupNumber)},{onSuccess:()=>{setGroupProgram('');setGroupNumber('');}});}}>
            <input list="program-options" required className="admin-input" style={{maxWidth:300}} placeholder="Program studi / jalur" value={groupProgram} onChange={e=>setGroupProgram(e.target.value)}/>
            <datalist id="program-options">{data.programs.map(name=><option key={name} value={name}/>)}</datalist>
            <input required type="number" min="1" max="999" className="admin-input" style={{maxWidth:155}} placeholder="No. kelompok" value={groupNumber} onChange={e=>setGroupNumber(e.target.value)}/>
            <button className="primary-button" disabled={busy}><Plus size={17}/> Tambah kelompok</button>
          </form>
          <div className="admin-group-list">{data.programs.map(program=><div key={program} className="admin-group-row"><strong>{program}</strong><span>{data.groups.filter(g=>g.program_name===program).length} kelompok</span></div>)}</div>
        </section>
        <section className="admin-panel"><h2>Impor Mahasiswa dari Excel DSP</h2><p>Gunakan file <code>data/peserta-dsp.csv</code> dari ZIP proyek. File ini sudah berisi 1.113 mahasiswa dari enam Excel dan siap diunggah. Impor otomatis berjalan per 60 peserta.</p>
          <div className="csv-example">program_studi,kelompok,nim,nama{'\n'}Teknik Telekomunikasi,1,101012400273,DIASTRA AVILA ZANDRA{'\n'}Teknik Elektro INT,1,101022340327,ADNAN KUSUMA PUTRA</div>
          <label className="admin-label">Unggah file peserta (.csv)<input className="admin-input" type="file" accept=".csv,text/csv,text/plain" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];if(file){setImportText(await file.text());setImportProgress(null);}}}/></label>
          <label className="admin-label" style={{marginTop:16}}>Atau tempel CSV<textarea rows={5} className="admin-textarea" disabled={busy} value={importText} onChange={e=>{setImportText(e.target.value);setImportProgress(null);}} placeholder={'program_studi,kelompok,nim,nama\nTeknik Komputer,1,101032300089,AYOGA CANSER IBRAHIM'} /></label>
          <div className="import-hint"><ShieldCheck size={16}/> NIM adalah identitas unik pemilih, tetapi tidak tampil pada formulir publik. Kode voting pribadi hanya ditampilkan sekali. <strong>CSV kode otomatis diunduh setelah impor berhasil.</strong> Simpan di tempat privat dan bagikan satu per mahasiswa.</div>
          {importProgress&&<div className="import-progress"><div><strong>{importProgress.processed}/{importProgress.total}</strong> peserta telah diproses</div><div className="progress-track"><div style={{width:`${Math.round(importProgress.processed/importProgress.total*100)}%`}}/></div></div>}
          <button type="button" className="primary-button" disabled={busy||!importText.trim()} onClick={importAll}><UploadCloud size={17}/>{busy?'Memproses peserta...':`Impor ${importText.trim()?readCsv(importText).length:0} mahasiswa`}</button>
          {importResult&&<div className="cred-box"><h3>{importResult.added} peserta baru · {importResult.skipped} dilewati</h3><p>Unduh daftar kode sebelum menutup halaman. Jika sebagian batch gagal, kode peserta yang sudah berhasil tetap dapat diunduh di sini.</p>
            {credentials.length>0&&<><div className="cred-table">{credentials.slice(0,12).map((cred,i)=><div key={i}><span>{cred.programName}<small> · K{cred.groupNumber}</small></span><span>{cred.name}</span><code>{cred.pin}</code></div>)}{credentials.length>12&&<div>... dan {credentials.length-12} peserta lainnya di CSV.</div>}</div>
            <button className="admin-outline" onClick={()=>downloadCsv('kode-voting-RAHASIA.csv',codesTable(credentials))}><Download size={16}/> Unduh kode voting ({credentials.length})</button></>}
          </div>}
        </section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Daftar Pemilih ({data.voters.length})</h2><p>Filter program studi dan nomor kelompok untuk memeriksa nama/NIM dan status partisipasi.</p></div><button className="admin-outline" onClick={()=>downloadCsv('daftar-partisipasi.csv',[['Program Studi','Kelompok','NIM','Nama','Status'],...data.voters.map(v=>[v.program_name,v.group_number,v.nim,v.name,v.has_voted?'Sudah voting':'Belum voting'])])}><Download size={15}/> Ekspor CSV</button></div>
          <div className="admin-filter-row admin-toolbar"><input className="admin-input" placeholder="Cari nama atau NIM..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="admin-input" value={programFilter} onChange={e=>{setProgramFilter(e.target.value);setGroupFilter('')}}><option value="">Semua program studi</option>{data.programs.map(p=><option key={p} value={p}>{p}</option>)}</select>
            <select className="admin-input" disabled={!programFilter} value={groupFilter} onChange={e=>setGroupFilter(e.target.value)}><option value="">Semua kelompok</option>{visibleGroups.map(g=><option key={g.id} value={String(g.id)}>Kelompok {g.group_number}</option>)}</select>
          </div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nama / NIM</th><th>Program Studi</th><th>Kelompok</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>{filteredVoters.slice(0,200).map(v=><tr key={v.id}><td><strong>{v.name}</strong><div className="admin-help">{v.nim}</div></td><td>{v.program_name}</td><td>Kelompok {v.group_number}</td><td><span className={`mini-status ${v.has_voted?'':'no'}`}>{v.has_voted?'Sudah voting':'Belum voting'}</span></td><td><div className="admin-candidate-actions"><button disabled={busy} title="Buat kode voting baru" onClick={()=>{if(window.confirm(`Reset kode voting untuk ${v.name}?`))action({action:'reset_pin',voterId:String(v.id)},{onSuccess:result=>{setCredentials(result.credentials);setImportResult({added:1,skipped:0});window.alert(`Kode baru untuk ${v.name}: ${result.credentials[0].pin}\nCatat kode ini sekarang.`);}});}}><LockKeyhole size={14}/> Reset kode</button>{!v.has_voted&&<button disabled={busy} title="Hapus pemilih" onClick={()=>{if(window.confirm(`Hapus ${v.name} dari daftar?`))action({action:'delete_voter',voterId:String(v.id)});}}><Trash2 size={13}/></button>}</div></td></tr>)}</tbody></table></div>
          {filteredVoters.length>200&&<p className="admin-help">Menampilkan 200 dari {filteredVoters.length} hasil. Saring lebih detail atau unduh CSV lengkap.</p>}
        </section>
      </>}

      {tab==='assistants'&&<>
        <section className="admin-panel"><h2>{editing?'Edit Data Asisten':'Tambah Kandidat Asisten'}</h2><p>Setiap kandidat tampil dengan foto yang sama pada keempat kategori voting. Unggah foto langsung menggunakan Vercel Blob atau masukkan URL gambar HTTPS.</p>
          <form onSubmit={saveCandidate} className="admin-form cols" style={{marginTop:20}}>
            <label className="admin-label">Nama asisten<input required className="admin-input" minLength={2} maxLength={180} value={candidateForm.name} onChange={e=>setCandidateForm({...candidateForm,name:e.target.value})} placeholder="Nama lengkap asisten"/></label>
            <label className="admin-label">URL foto (opsional)<input className="admin-input" value={candidateForm.photoUrl} onChange={e=>setCandidateForm({...candidateForm,photoUrl:e.target.value})} placeholder="https://.../foto.jpg"/></label>
            <label className="admin-label span-2">Deskripsi singkat (opsional)<input className="admin-input" maxLength={280} value={candidateForm.description} onChange={e=>setCandidateForm({...candidateForm,description:e.target.value})} placeholder="Contoh: Asisten Laboratorium Komunikasi"/></label>
            <div className="admin-label span-2"><span>Upload foto kandidat</span><div className="admin-upload-row"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setUploadFile(e.target.files?.[0]||null)}/><span className="admin-help">JPG/PNG/WebP maksimal 4 MB. Butuh BLOB_READ_WRITE_TOKEN.</span></div></div>
            {editing&&<label className="admin-label span-2" style={{flexDirection:'row',alignItems:'center'}}><input type="checkbox" checked={candidateForm.active} onChange={e=>setCandidateForm({...candidateForm,active:e.target.checked})}/> Kandidat aktif dan dapat dipilih</label>}
            <div className="admin-toolbar span-2" style={{gridColumn:'1/-1',margin:0}}><button disabled={busy} className="primary-button"><ImageUp size={17}/>{busy?'Menyimpan...':editing?'Simpan Perubahan':'Tambahkan Kandidat'}</button>{editing&&<button className="admin-outline" type="button" onClick={clearCandidate}>Batal edit</button>}</div>
          </form>
        </section>
        <section className="admin-panel"><h2>Daftar Kandidat ({data.assistants.length})</h2><p>Gunakan Edit untuk mengganti foto, nama, deskripsi, atau menonaktifkan kandidat.</p>
          <div className="admin-candidate-grid">{data.assistants.map(candidate=><article className="admin-candidate" key={candidate.id}><CandidatePicture candidate={candidate}/><div className="admin-candidate-body"><h3>{candidate.name}</h3><p>{candidate.description||'Belum ada deskripsi.'}</p><span className={`mini-status ${candidate.active?'':'no'}`}>{candidate.active?'Aktif':'Nonaktif'}</span><div className="admin-candidate-actions" style={{marginTop:13}}><button onClick={()=>editCandidate(candidate)}><Pencil size={13}/> Edit</button><button disabled={busy} onClick={()=>{if(window.confirm(`Hapus kandidat ${candidate.name}? Kandidat yang sudah menerima suara tidak dapat dihapus.`))action({action:'delete_assistant',assistantId:String(candidate.id)});}}><Trash2 size={13}/> Hapus</button></div></div></article>)}</div>
          {data.assistants.length===0&&<p className="admin-muted">Belum ada kandidat. Tambahkan dari formulir di atas.</p>}
        </section>
      </>}

      {tab==='settings'&&<>
        <section className="admin-panel"><h2>Status Voting</h2><p>Atur apakah pemilih dapat mengirim formulir ke database.</p><div className="admin-status-section"><div><span className={`admin-status ${data.votingOpen?'status-open':''}`}>{data.votingOpen?'Voting sedang dibuka':'Voting sedang ditutup'}</span><p>{data.votingOpen?'Mahasiswa yang terdaftar dapat memilih dan mengirimkan suara.':'Formulir masih dapat dilihat, tetapi tombol kirim dinonaktifkan. Siapkan daftar program studi, kelompok, peserta, dan foto kandidat sebelum membuka voting.'}</p></div><button disabled={busy} className="primary-button" onClick={()=>{if(window.confirm(data.votingOpen?'Tutup voting sekarang?':'Buka voting untuk seluruh peserta terdaftar?'))action({action:'set_voting',open:!data.votingOpen});}}>{data.votingOpen?'Tutup Voting':'Buka Voting'}</button></div></section>
        <section className="admin-panel"><h2>Keamanan & Privasi</h2><div className="import-hint"><ShieldCheck size={16}/> Setiap peserta membutuhkan kode pribadi. Database menerapkan batas satu ballot per pemilih, bukan hanya berdasarkan cookie atau perangkat.</div><p>Hasil individual tidak ditampilkan di dashboard. Sebarkan kode melalui pesan privat, jangan mengunggah file kode ke situs atau grup publik.</p><p>Jangan masukkan file kode voting ke folder public atau repository GitHub. Untuk mengubah password admin, ganti nilai <code>ADMIN_PASSWORD</code> di Vercel Environment Variables, kemudian redeploy.</p></section>
      </>}
    </main><footer className="site-footer"><span>© 2026 Assistant of the Semester · Panel Panitia</span><span>Admin protected <ShieldCheck size={14}/></span></footer>
  </div>;
}

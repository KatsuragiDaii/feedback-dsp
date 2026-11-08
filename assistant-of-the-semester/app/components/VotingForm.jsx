'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {
  Trophy, Heart, Sparkles, Smile, Snowflake, Check, CheckCircle2,
  ShieldCheck, UsersRound, ArrowRight, LockKeyhole, Info, Clock3,
  PartyPopper, AlertCircle, UserRound, Medal, ClipboardCheck, ChevronRight
} from 'lucide-react';
import {CATEGORIES} from '../../lib/constants';
const ICON = {heart:Heart,sparkles:Sparkles,smile:Smile,snowflake:Snowflake};

function AssistantPhoto({assistant}) {
  const [failed,setFailed]=useState(false);
  const initials = assistant.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  return <div className="assistant-photo">
    {assistant.photo_url && !failed
      ? <img src={assistant.photo_url} alt={`Foto ${assistant.name}`} onError={()=>setFailed(true)} loading="lazy" />
      : <div className="photo-placeholder" aria-label={`Foto ${assistant.name} belum tersedia`}><UserRound size={52} strokeWidth={1.25}/><span>{initials}</span></div>}
  </div>;
}

function CandidateChoice({assistant,selected,onSelect}) {
  return <button type="button" className={`candidate-tile ${selected?'candidate-selected':''}`} onClick={onSelect} aria-pressed={selected}>
    <AssistantPhoto assistant={assistant}/>
    <div className="candidate-meta">
      <div className="candidate-text"><strong>{assistant.name}</strong>{assistant.description && <span>{assistant.description}</span>}</div>
      <span className="candidate-circle">{selected && <Check size={13} strokeWidth={3}/>}</span>
    </div>
  </button>;
}

export default function VotingForm({data,dataError}) {
  const [programName,setProgramName]=useState('');
  const [groupId,setGroupId]=useState('');
  const [voterId,setVoterId]=useState('');
  const [pin,setPin]=useState('');
  const [choices,setChoices]=useState({});
  const [confirm,setConfirm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');
  const availableGroups=useMemo(()=>data.groups.filter(g=>g.program_name===programName),[programName,data.groups]);
  const groupVoters=useMemo(()=>data.voters.filter(v=>String(v.class_id)===groupId),[groupId,data.voters]);
  const voter = data.voters.find(v=>String(v.id)===voterId);
  const chosen = CATEGORIES.filter(c=>choices[c.key]).length;
  const canVote = data.votingOpen && !data.demo && !dataError;
  const complete = programName && groupId && voterId && pin.trim() && chosen===4;

  async function sendVote() {
    setConfirm(false); setSaving(true); setError('');
    try {
      const response=await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({groupId,voterId,pin,choices})});
      const result=await response.json();
      if (!response.ok) throw new Error(result.error||'Voting belum berhasil.');
      setDone(true);
      window.scrollTo({top:0,behavior:'smooth'});
    } catch (err) { setError(err.message); window.scrollTo({top:400,behavior:'smooth'}); }
    finally {setSaving(false);}
  }

  if (done) return <div className="site-shell">
    <header className="topbar"><Link className="brand" href="/"><span className="brand-mark"><Trophy size={20}/></span><span>ASSISTANT <b>AWARDS.</b></span></Link></header>
    <main className="success-view"><div className="success-symbol"><PartyPopper size={54}/></div>
      <span className="eyebrow">VOTE SUCCESSFULLY SUBMITTED</span><h1>Suaramu sudah<br/><em>tercatat!</em></h1>
      <p>Terima kasih, <strong>{voter?.name}</strong>! Kamu sudah ikut menentukan Assistant of the Semester. Setiap nama hanya bisa melakukan voting satu kali.</p>
      <div className="success-confirm"><CheckCircle2 size={22}/> 4 kategori berhasil dipilih dan tersimpan di database.</div>
      <Link href="/" className="outline-link">Kembali ke halaman utama <ArrowRight size={16}/></Link>
    </main><footer className="site-footer">Assistant of the Semester · Vote with appreciation.</footer>
  </div>;

  return <div className="site-shell">
    <header className="topbar">
      <Link className="brand" href="/"><span className="brand-mark"><Trophy size={20}/></span><span>ASSISTANT <b>AWARDS.</b></span></Link>
      <div className="topbar-right"><span className="topbar-edition"><span className="status-dot"/> SEMESTER AWARDS</span><Link href="/admin" className="admin-link">Admin <ChevronRight size={14}/></Link></div>
    </header>
    <main className="main-container">
      <section className="hero">
        <div className="hero-orb hero-orb-one"/><div className="hero-orb hero-orb-two"/>
        <div className="hero-copy"><div className="hero-pill"><Sparkles size={14}/> THE MOST AWAITED CAMPUS AWARDS</div>
          <h1>Assistant of<br/><span>the Semester<span className="hero-period">.</span></span></h1>
          <p>Setiap asisten punya keistimewaan. Sekarang giliran kamu memberi apresiasi untuk mereka yang paling berkesan!</p>
          <div className="hero-detail"><span><Medal size={17}/> 4 kategori awards</span><span><UsersRound size={17}/> 1 mahasiswa, 1 suara</span></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="art-ring art-ring-outer"/><div className="art-ring art-ring-inner"/><span className="art-star art-star-one">✦</span><span className="art-star art-star-two">✧</span><div className="art-trophy"><Trophy size={104} strokeWidth={1.15}/></div><div className="art-ribbon">2026 EDITION</div></div>
      </section>
      {data.demo && <div className="notice notice-demo"><Info size={19}/><div><strong>Mode pratinjau</strong> — data mahasiswa dan kandidat di halaman ini hanya contoh. Sambungkan Neon PostgreSQL dan isi data melalui panel admin untuk mengaktifkan voting.</div></div>}
      {dataError && <div className="notice notice-error"><AlertCircle size={19}/> Data tidak dapat dimuat. Pastikan database sudah diinisialisasi menggunakan <code>npm run db:init</code>.</div>}
      {!data.votingOpen && !data.demo && !dataError && <div className="notice notice-pending"><Clock3 size={19}/><div><strong>Voting belum dibuka.</strong> Kamu dapat melihat daftar kandidat, tetapi pengiriman suara baru tersedia ketika panitia membuka voting.</div></div>}

      <div className="content-layout">
        <div className="form-main">
          <div className="form-heading"><div><div className="eyebrow">OFFICIAL VOTING FORM</div><h2>Formulir Voting</h2><p>Isi identitas dan pilih satu asisten di setiap kategori.</p></div><span className="form-step-count">01 — 05</span></div>

          <section className="form-card identity-card">
            <div className="card-accent"/>
            <div className="form-card-heading"><span className="step-icon"><UsersRound size={22}/></span><div><div className="step-caption">STEP 01</div><h3>Identitas Pemilih</h3><p>Pilih program studi, nomor kelompok, lalu nama kamu.</p></div></div>
            <div className="identity-fields">
              <label className="field"><span>Program Studi <b>*</b></span><div className="select-wrap"><select value={programName} onChange={e=>{setProgramName(e.target.value);setGroupId('');setVoterId('');setPin('');setError('')}}><option value="">Pilih program studi</option>{data.programs.map(p=><option key={p} value={p}>{p}</option>)}</select></div></label>
              <label className="field"><span>Nomor Kelompok <b>*</b></span><div className="select-wrap"><select disabled={!programName} value={groupId} onChange={e=>{setGroupId(e.target.value);setVoterId('');setPin('');setError('')}}><option value="">{programName?'Pilih kelompok':'Pilih program studi dahulu'}</option>{availableGroups.map(g=><option key={g.id} value={String(g.id)}>Kelompok {g.group_number}</option>)}</select></div></label>
              <label className="field full-field"><span>Nama lengkap <b>*</b></span><div className="select-wrap"><select disabled={!groupId} value={voterId} onChange={e=>{setVoterId(e.target.value);setPin('');setError('')}}><option value="">{!groupId?'Pilih kelompok terlebih dahulu':groupVoters.length?'Pilih nama kamu':'Belum ada mahasiswa di kelompok ini'}</option>{groupVoters.map(v=><option key={v.id} value={String(v.id)}>{v.name}</option>)}</select></div></label>
              <label className="field full-field"><span>Kode voting pribadi <b>*</b></span><div className="pin-input-wrap"><LockKeyhole size={19}/><input type="text" autoComplete="off" spellCheck="false" maxLength={64} placeholder="Masukkan kode dari panitia" value={pin} onChange={e=>setPin(e.target.value.toUpperCase())}/></div><small>Kode unik diberikan oleh panitia kepada masing-masing mahasiswa. Jangan bagikan kode milikmu.</small></label>
            </div>
          </section>

          <div className="categories-intro"><div className="eyebrow">PICK YOUR FAVORITES</div><h2>Siapa pilihanmu?</h2><p>Pilih <strong>1 asisten</strong> untuk setiap kategori. Kamu boleh memilih orang yang sama di kategori berbeda.</p></div>
          {CATEGORIES.map((category,index)=>{
            const Icon=ICON[category.icon];
            return <section className={`form-card category-card accent-${category.tint}`} key={category.key}>
              <div className="category-heading"><span className="category-icon"><Icon size={25}/></span><div className="category-title"><div className="step-caption">STEP {String(index+2).padStart(2,'0')} <span className="category-divider">/</span> AWARD {category.number}</div><h3>{category.label}</h3><p>{category.tagline}</p></div><div className={`picked-chip ${choices[category.key]?'picked-chip-done':''}`}>{choices[category.key]?<><Check size={13}/> Dipilih</>:'Pilih satu'}</div></div>
              {data.assistants.length ? <div className="candidate-grid">{data.assistants.map(assistant=><CandidateChoice key={assistant.id} assistant={assistant} selected={String(choices[category.key])===String(assistant.id)} onSelect={()=>{setChoices(prev=>({...prev,[category.key]:String(assistant.id)}));setError('')}}/>)}</div>
              : <div className="no-candidates"><UserRound size={35}/><p>Belum ada kandidat. Panitia dapat menambahkan asisten dan fotonya dari halaman Admin.</p></div>}
            </section>;
          })}
          <div className="submit-card"><div className="submit-note"><ShieldCheck size={26}/><div><h3>Siap mengirim voting?</h3><p>Pastikan semua pilihan sudah sesuai. Setelah dikirim, voting tidak bisa diubah atau diulang.</p></div></div>
            {error && <div className="inline-error"><AlertCircle size={18}/>{error}</div>}
            <button className="primary-button" disabled={!canVote || !complete || saving} onClick={()=>setConfirm(true)}>{saving?'Menyimpan...':!canVote?'Voting belum tersedia':'Kirim Voting Sekarang'}<ArrowRight size={20}/></button>
            <p className="privacy-note"><LockKeyhole size={13}/> Data pilihan hanya ditampilkan sebagai rekap keseluruhan kepada panitia.</p>
          </div>
        </div>

        <aside className="form-sidebar">
          <div className="sidebar-card progress-card"><div className="sidebar-top"><span>YOUR PROGRESS</span><ClipboardCheck size={18}/></div><div className="progress-figure"><strong>{chosen}</strong><span>/ 4</span></div><p>Kategori telah dipilih</p><div className="progress-track"><div style={{width:`${chosen*25}%`}}/></div>
            <div className="summary-list">{CATEGORIES.map(c=>{const Icon=ICON[c.icon];const picked=data.assistants.find(a=>String(a.id)===String(choices[c.key]));return <div key={c.key} className="summary-item"><span className={`summary-icon ${choices[c.key]?'summary-selected':''}`}><Icon size={15}/></span><div><strong>{c.label.replace('Asisten ','')}</strong><small>{picked?picked.name:'Belum dipilih'}</small></div>{picked && <CheckCircle2 size={15} className="summary-check"/>}</div>})}</div>
          </div>
          <div className="sidebar-card rule-card"><ShieldCheck size={24}/><h3>Voting yang adil</h3><p>Satu nama pemilih hanya dapat mengirim formulir satu kali. Verifikasi menggunakan kode pribadi dan tersimpan secara aman di database.</p><div className="rule-bottom"><CheckCircle2 size={16}/> Sistem one person, one vote</div></div>
          <div className="side-quote"><span>“</span>Every great assistant deserves a little recognition.<span>”</span></div>
        </aside>
      </div>
    </main>
    <footer className="site-footer"><span>© 2026 Assistant of the Semester. Made for appreciation.</span><span>Vote with heart. <Heart size={14} fill="currentColor"/></span></footer>
    {confirm && <div className="modal-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setConfirm(false)}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-icon"><ClipboardCheck size={31}/></div><h2 id="confirm-title">Konfirmasi voting</h2><p>Voting atas nama <strong>{voter?.name}</strong> ({programName} — Kelompok {data.groups.find(g=>String(g.id)===groupId)?.group_number}) akan dikirim dan tidak dapat diubah.</p>
      <div className="modal-choices">{CATEGORIES.map(c=><div key={c.key}><span>{c.label}</span><strong>{data.assistants.find(a=>String(a.id)===String(choices[c.key]))?.name}</strong></div>)}</div>
      <div className="modal-buttons"><button className="secondary-button" onClick={()=>setConfirm(false)}>Periksa lagi</button><button className="primary-button" onClick={sendVote}>Ya, kirim suara <ArrowRight size={16}/></button></div>
    </div></div>}
  </div>;
}

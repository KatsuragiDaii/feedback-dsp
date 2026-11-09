'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {
  Heart, Sparkles, Smile, Snowflake, Check, ArrowRight, LockKeyhole,
  Info, Clock3, AlertCircle, ClipboardCheck, ShieldCheck
} from 'lucide-react';
import {CATEGORIES} from '../../lib/constants';
import GateArt from './GateArt';
const ICON = {heart:Heart,sparkles:Sparkles,smile:Smile,snowflake:Snowflake};

function Photo({assistant}) {
  const [failed,setFailed]=useState(false);
  if (assistant.photo_url && !failed) {
    return <img className="fv-photo" src={assistant.photo_url} alt={`Foto ${assistant.name}`} loading="lazy" onError={()=>setFailed(true)}/>;
  }
  const initials = assistant.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
  return <div className="fv-photo fv-ph" role="img" aria-label={`Foto ${assistant.name} belum tersedia`}>{initials}</div>;
}

function Pick({assistant,name,selected,onChange}) {
  return <label className={`fv-pick ${selected?'on':''}`}>
    <Photo assistant={assistant}/>
    <input type="radio" name={name} value={assistant.id} checked={selected} onChange={onChange}/>
    <span className="fv-pick-b">
      <span className="fv-rad" aria-hidden="true"/>
      <span className="fv-pick-t"><strong>{assistant.name}</strong>{assistant.description && <small>{assistant.description}</small>}</span>
    </span>
  </label>;
}

function FieldError({children}) {
  return <div className="fv-errmsg" role="alert"><AlertCircle size={16}/><span>{children}</span></div>;
}

export default function VotingForm({data,dataError}) {
  const [step,setStep]=useState('gate');
  const [programName,setProgramName]=useState('');
  const [groupId,setGroupId]=useState('');
  const [voterId,setVoterId]=useState('');
  const [pin,setPin]=useState('');
  const [choices,setChoices]=useState({});
  const [gateTried,setGateTried]=useState(0);
  const [formTried,setFormTried]=useState(0);
  const [confirm,setConfirm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');
  const availableGroups=useMemo(()=>data.groups.filter(g=>g.program_name===programName),[programName,data.groups]);
  const groupVoters=useMemo(()=>data.voters.filter(v=>String(v.class_id)===groupId),[groupId,data.voters]);
  const voter = data.voters.find(v=>String(v.id)===voterId);
  const group = data.groups.find(g=>String(g.id)===groupId);
  const chosen = CATEGORIES.filter(c=>choices[c.key]).length;
  const canVote = data.votingOpen && !data.demo && !dataError;
  const gateMissing = {program:!programName,group:!groupId,voter:!voterId,pin:!pin.trim()};
  const gateComplete = !Object.values(gateMissing).some(Boolean);
  const complete = gateComplete && chosen===4;
  const assistantName = (id)=>data.assistants.find(a=>String(a.id)===String(id))?.name;

  useEffect(()=>{ window.scrollTo({top:0}); },[step,done]);
  useEffect(()=>{
    if (gateTried>0) document.querySelector('.fv-gf.err select, .fv-gf.err input')?.focus();
  },[gateTried]);
  useEffect(()=>{
    if (formTried>0) document.querySelector('.fv-q.err')?.scrollIntoView({block:'center',behavior:'smooth'});
  },[formTried]);
  useEffect(()=>{
    if (error) document.querySelector('.fv-banner')?.scrollIntoView({block:'center',behavior:'smooth'});
  },[error]);

  function goForm(e) {
    e.preventDefault();
    setGateTried(n=>n+1);
    if (!gateComplete) return;
    setError('');
    setStep('form');
  }
  function onSend(e) {
    e.preventDefault();
    setFormTried(n=>n+1);
    if (!canVote || !complete) return;
    setConfirm(true);
  }
  function clearForm() { setChoices({}); setFormTried(0); setError(''); }

  async function sendVote() {
    setConfirm(false); setSaving(true); setError('');
    try {
      const response=await fetch('/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({groupId,voterId,pin,choices})});
      const result=await response.json();
      if (!response.ok) throw new Error(result.error||'Voting belum berhasil.');
      setDone(true);
    } catch (err) { setError(err.message); }
    finally {setSaving(false);}
  }

  const notices = <>
    {data.demo && <div className="fv-notice demo"><Info size={18}/><div><strong>Mode pratinjau</strong> — data mahasiswa dan kandidat di halaman ini hanya contoh. Sambungkan Neon PostgreSQL dan isi data melalui panel admin untuk mengaktifkan voting.</div></div>}
    {dataError && <div className="fv-notice error"><AlertCircle size={18}/><div>Data tidak dapat dimuat. Pastikan database sudah diinisialisasi menggunakan <code>npm run db:init</code>.</div></div>}
    {!data.votingOpen && !data.demo && !dataError && <div className="fv-notice pending"><Clock3 size={18}/><div><strong>Voting belum dibuka.</strong> Kamu dapat melihat daftar kandidat, tetapi pengiriman suara baru tersedia ketika panitia membuka voting.</div></div>}
  </>;
  const footer = <footer className="fv-foot">© 2026 Assistant of the Semester <Link href="/admin">Admin</Link></footer>;

  if (done) return <div className="fv fv-form-page">
    <main className="fv-form-wrap">
      <header className="fv-card fv-head">
        <h1>Suaramu sudah tercatat</h1>
        <p className="fv-desc">Terima kasih, <strong>{voter?.name}</strong>! Kamu sudah ikut menentukan Assistant of the Semester. Setiap nama hanya bisa melakukan voting satu kali.</p>
      </header>
      <section className="fv-card">
        <p className="fv-lbl">Pilihanmu</p>
        <dl className="fv-summary">{CATEGORIES.map(c=><div key={c.key}><dt>{c.label.replace('Asisten ','')}</dt><dd>{assistantName(choices[c.key])}</dd></div>)}</dl>
      </section>
      <a className="fv-linkbtn" href="/">Kembali ke halaman utama <ArrowRight size={16}/></a>
    </main>
    {footer}
  </div>;

  if (step==='gate') return <div className="fv fv-gate-page">
    <main className="fv-gate-wrap">
      <section className="fv-gate-shell"><div className="fv-gate">
        <form className="fv-gate-form" onSubmit={goForm} noValidate>
          <div className="fv-gate-in">
            <p className="fv-kicker">Assistant of the Semester</p>
            <h1>Pilih prodi dan kelompokmu</h1>
            <p className="fv-sub">Pilih program studi dan nomor kelompok, lalu namamu. Masukkan kode voting pribadi dari panitia.</p>
            {notices}
            <div className={`fv-gf ${gateTried&&gateMissing.program?'err':''}`}>
              <label htmlFor="fv-program">Program Studi</label>
              <div className="fv-sel"><select id="fv-program" value={programName} aria-required="true" onChange={e=>{setProgramName(e.target.value);setGroupId('');setVoterId('');setPin('');setError('')}}>
                <option value="">Pilih program studi</option>{data.programs.map(p=><option key={p} value={p}>{p}</option>)}
              </select></div>
              <FieldError>Pilih program studimu.</FieldError>
            </div>
            <div className={`fv-gf ${gateTried&&gateMissing.group?'err':''}`}>
              <label htmlFor="fv-group">Nomor Kelompok</label>
              <div className="fv-sel"><select id="fv-group" disabled={!programName} value={groupId} aria-required="true" onChange={e=>{setGroupId(e.target.value);setVoterId('');setPin('');setError('')}}>
                <option value="">{programName?'Pilih nomor kelompok':'Pilih program studi dahulu'}</option>{availableGroups.map(g=><option key={g.id} value={String(g.id)}>Kelompok {g.group_number}</option>)}
              </select></div>
              <FieldError>Pilih nomor kelompokmu.</FieldError>
            </div>
            <div className={`fv-gf ${gateTried&&gateMissing.voter?'err':''}`}>
              <label htmlFor="fv-voter">Nama</label>
              <div className="fv-sel"><select id="fv-voter" disabled={!groupId} value={voterId} aria-required="true" onChange={e=>{setVoterId(e.target.value);setPin('');setError('')}}>
                <option value="">{!groupId?'Pilih kelompok dahulu':groupVoters.length?'Pilih namamu':'Belum ada mahasiswa di kelompok ini'}</option>{groupVoters.map(v=><option key={v.id} value={String(v.id)}>{v.name}</option>)}
              </select></div>
              <FieldError>Pilih namamu.</FieldError>
            </div>
            <div className={`fv-gf ${gateTried&&gateMissing.pin?'err':''}`}>
              <label htmlFor="fv-pin">Kode voting pribadi</label>
              <div className="fv-pinwrap"><LockKeyhole size={18}/><input id="fv-pin" type="text" autoComplete="off" spellCheck="false" maxLength={64} placeholder="Masukkan kode dari panitia" value={pin} aria-required="true" onChange={e=>setPin(e.target.value.toUpperCase())}/></div>
              <FieldError>Masukkan kode voting dari panitia.</FieldError>
              <p className="fv-hint">Kode unik untuk setiap mahasiswa. Jangan bagikan kodemu.</p>
            </div>
            <button className="fv-gate-btn" type="submit">Lanjut</button>
            <p className="fv-gate-note">Namamu tidak ada di daftar? <b>Hubungi panitia.</b></p>
          </div>
        </form>
        <div className="fv-gate-art" aria-hidden="true"><GateArt/></div>
      </div></section>
    </main>
    {footer}
  </div>;

  return <div className="fv fv-form-page">
    <main className="fv-form-wrap">
      <header className="fv-card fv-head">
        <h1>Assistant of the Semester</h1>
        <p className="fv-desc">Pilih satu asisten untuk setiap kategori. Kamu boleh memilih orang yang sama di kategori berbeda. Setelah dikirim, voting tidak bisa diubah atau diulang.</p>
        <p className="fv-req">* Menunjukkan pertanyaan wajib diisi</p>
      </header>
      {notices}
      <section className="fv-card fv-who">
        <div><p className="fv-lbl">Memilih sebagai</p><p className="fv-who-n">{voter?.name}</p><small>{programName} · Kelompok {group?.group_number}</small></div>
        <button className="fv-textbtn" type="button" onClick={()=>setStep('gate')}>Ganti</button>
      </section>
      <form className="fv-questions" onSubmit={onSend} noValidate>
        {CATEGORIES.map(category=>{
          const Icon=ICON[category.icon];
          const missing=formTried>0 && !choices[category.key];
          return <section className={`fv-card fv-q ${missing?'err':''}`} key={category.key}>
            <div className="fv-qt" id={`fv-q-${category.key}`}><span className={`fv-qicon tint-${category.tint}`}><Icon size={17}/></span><span>{category.label}<span className="fv-star" aria-hidden="true">*</span></span></div>
            <p className="fv-qd">{category.tagline}</p>
            {data.assistants.length
              ? <div className="fv-picks" role="radiogroup" aria-required="true" aria-labelledby={`fv-q-${category.key}`}>{data.assistants.map(assistant=>
                  <Pick key={assistant.id} assistant={assistant} name={`fv-${category.key}`} selected={String(choices[category.key])===String(assistant.id)}
                    onChange={()=>{setChoices(prev=>({...prev,[category.key]:String(assistant.id)}));setError('')}}/>)}</div>
              : <div className="no-candidates"><p>Belum ada kandidat. Panitia dapat menambahkan asisten dan fotonya dari halaman Admin.</p></div>}
            <FieldError>Ini adalah pertanyaan wajib.</FieldError>
          </section>;
        })}
        {error && <div className="fv-notice error fv-banner" role="alert"><AlertCircle size={18}/><div>{error}<button type="button" className="fv-textbtn" onClick={()=>setStep('gate')}>Periksa identitas dan kode voting</button></div></div>}
        <p className="fv-progress">{chosen} dari 4 kategori terisi</p>
        <div className="fv-actions">
          <button className="fv-send" type="submit" disabled={!canVote||saving}>{saving?'Menyimpan...':!canVote?'Voting belum tersedia':'Kirim'}{canVote&&!saving&&<ArrowRight size={17}/>}</button>
          <button className="fv-textbtn" type="button" onClick={clearForm}>Hapus formulir</button>
        </div>
        <p className="fv-note"><ShieldCheck size={14}/> Satu nama hanya bisa mengirim satu kali. Pilihanmu hanya terlihat sebagai rekap keseluruhan oleh panitia.</p>
      </form>
    </main>
    {footer}
    {confirm && <div className="modal-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setConfirm(false)}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-icon"><ClipboardCheck size={31}/></div><h2 id="confirm-title">Konfirmasi voting</h2><p>Voting atas nama <strong>{voter?.name}</strong> ({programName} — Kelompok {group?.group_number}) akan dikirim dan tidak dapat diubah.</p>
      <div className="modal-choices">{CATEGORIES.map(c=><div key={c.key}><span>{c.label}</span><strong>{assistantName(choices[c.key])}</strong></div>)}</div>
      <div className="modal-buttons"><button className="secondary-button" onClick={()=>setConfirm(false)}>Periksa lagi</button><button className="primary-button" onClick={sendVote}>Ya, kirim suara <ArrowRight size={16}/></button></div>
    </div></div>}
  </div>;
}

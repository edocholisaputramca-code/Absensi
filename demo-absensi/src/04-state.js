/* =====================================================================
   STATE & PENGATURAN
   ===================================================================== */
const state = {
  role:'piket', page:'dashboard', online:true, queue:[],
  clock:(function(){ const d=new Date(); d.setHours(6,40,0,0); return d; })(),
  today:{}, pulang:{}, checkins:[], perJam:{}, izin:[], unduh:[], audit:[],
  fJurusan:'semua', fKelas:'semua',
  settings:{
    jamMasuk:'06:45', toleransi:0, jamPulang:'15:00', jamRilis:'15:30',
    batasAbsen:'08:00', wajibSurat:true, formatNama:'Absensi_{kelas}_{tanggal}',
    jamKe:1, kelasPresensi:KELAS[0].id, kelasKartu:KELAS[0].id
  }
};
function jamBatas(){   // 06:45 → lewat sedetik saja sudah TERLAMBAT
  const m = state.settings.jamMasuk.split(':');
  const t = parseInt(m[0],10)*60 + parseInt(m[1],10) + state.settings.toleransi;
  return pad(Math.floor(t/60)%24) + ':' + pad(t%60);
}
const ROLES = {
  piket:  {nama:'Guru Piket',         pages:['absensi','kartu','presensi','izin','siswa','dashboard']},
  wali:   {nama:'Wali Kelas X TKJ 1', pages:['dashboard','kartu','presensi','izin','siswa','laporan','unduhan']},
  kaprog: {nama:'Ka. Jurusan / Kaprog',pages:['dashboard','laporan','unduhan','siswa']},
  admin:  {nama:'Admin / Tata Usaha', pages:['dashboard','absensi','kartu','presensi','siswa','izin','laporan','unduhan','pengaturan','audit']},
  kepsek: {nama:'Kepala Sekolah',     pages:['dashboard','laporan','unduhan']}
};
const NAV = [
  {g:'Utama', items:[['dashboard','📊','Dashboard']]},
  {g:'Operasional', items:[['absensi','📷','Absensi Gerbang'],['kartu','🪪','Kartu QR Siswa'],['presensi','🗂️','Presensi per Jam'],['izin','📝','Izin & Surat']]},
  {g:'Data & Laporan', items:[['siswa','👥','Data Siswa'],['laporan','📈','Laporan'],['unduhan','📥','Unduhan Excel']]},
  {g:'Sistem', items:[['pengaturan','⚙️','Pengaturan'],['audit','🔍','Jejak Audit']]}
];
function getSiswa(id){ for (let i=0;i<SISWA.length;i++) if (SISWA[i].id===id) return SISWA[i]; return null; }
function getKelas(id){ for (let i=0;i<KELAS.length;i++) if (KELAS[i].id===id) return KELAS[i]; return KELAS[0]; }
function getJurusan(id){ for (let i=0;i<JURUSAN.length;i++) if (JURUSAN[i].id===id) return JURUSAN[i]; return JURUSAN[0]; }
function namaSiswa(id){ const s = getSiswa(id); return s ? s.nama : id; }
function siswaKelas(kid){ return SISWA.filter(s => s.kelas === kid); }
function kelasTerfilter(){
  if (state.fKelas !== 'semua') return KELAS.filter(k => k.id === state.fKelas);
  if (state.fJurusan !== 'semua') return KELAS.filter(k => k.jurusan === state.fJurusan);
  return KELAS.slice();
}
function siswaTerfilter(){
  const ks = kelasTerfilter();
  return SISWA.filter(s => ks.some(k => k.id === s.kelas));
}
function userAktif(){ return ROLES[state.role].nama; }

/* ---------------- status hari ini ---------------- */
function menitSekarang(){ return state.clock.getHours()*60 + state.clock.getMinutes(); }
function menitDariJam(str){ const p = str.split(':'); return parseInt(p[0],10)*60 + parseInt(p[1],10); }
function lewatBatasAbsen(){ return menitSekarang() >= menitDariJam(state.settings.batasAbsen); }
function statusHariIni(sid){
  if (state.today[sid]) return state.today[sid].st;
  return lewatBatasAbsen() ? 'A' : null;
}
function hitungHariIni(daftar){
  const o = {H:0,T:0,S:0,I:0,D:0,A:0,B:0,belum:0};
  daftar.forEach(s => { const st = statusHariIni(s.id); if (st) o[st]++; else o.belum++; });
  return o;
}
function persenDari(list){
  if (!list.length) return 0;
  const ok = list.filter(x => x.st !== 'A' && x.st !== 'B').length;
  return Math.round(ok / list.length * 100);
}
function rekap(daftar, hariList){
  return daftar.map(s => {
    const o = {H:0,T:0,S:0,I:0,D:0,A:0,B:0}; let tot = 0;
    hariList.forEach(t => {
      let st;
      if (t === HARI_INI){ st = statusHariIni(s.id); if (!st) return; }
      else st = (HIST[s.id+'|'+t] || {st:'A'}).st;
      o[st]++; tot++;
    });
    o.siswa = s; o.total = Math.max(tot,1);
    o.persen = tot ? Math.round((tot - o.A - o.B) / tot * 100) : 100;
    return o;
  });
}
function logAudit(user, aksi, detail){
  state.audit.unshift({id:Date.now()+Math.random(), waktu:hhmm(state.clock), user:user, aksi:aksi, detail:detail});
  if (state.audit.length > 80) state.audit.pop();
}

/* ---------------- inisialisasi data hari ini ---------------- */
function initToday(){
  state.today = {}; state.pulang = {}; state.checkins = []; state.queue = [];
  SISWA.forEach(s => {
    const r = rnd(), risk = RISK_IDS.indexOf(s.id) >= 0;
    if (r < (risk?0.40:0.70)){
      const st = rnd() < 0.22 ? 'T' : 'H';
      const jam = st === 'T' ? '06:' + pad(ri(46,59)) : '06:' + pad(ri(15,44));
      state.today[s.id] = { st:st, jam:jam, metode: rnd()<0.85?'Kartu QR':'Input manual' };
      state.checkins.push({ sid:s.id, jam:jam, st:st, metode:state.today[s.id].metode });
    } else if (r < (risk?0.50:0.78)){
      const st = rnd() < 0.5 ? 'S' : 'I';
      state.today[s.id] = { st:st, jam:'—', metode:'Izin disetujui', note: st==='S'?'Surat sakit':'Surat izin' };
    }
  });
  state.checkins.sort((a,b)=> a.jam < b.jam ? 1 : -1);
}
function initIzin(){
  const k = KELAS[0].id;
  state.izin = [
    {id:'IZ01', sid:SISWA[2].id,  jenis:'Sakit', dari:HARI_INI, sampai:HARI_INI, alasan:'Demam, rawat jalan di Puskesmas', surat:'surat_dokter_2026003.pdf', nomor:'SD/09/001', status:'Menunggu', waktu:'06:10', pengaju:'Ibu Kusuma', fisik:false},
    {id:'IZ02', sid:SISWA[20].id, jenis:'Izin',  dari:HARI_INI, sampai:HARI_INI, alasan:'Acara pernikahan keluarga', surat:'surat_izin_2026021.jpg', nomor:'—', status:'Menunggu', waktu:'06:22', pengaju:'Ibu Santoso', fisik:true},
    {id:'IZ03', sid:SISWA[45].id, jenis:'Dispensasi', dari:HARI_INI, sampai:HARI_INI, alasan:'Lomba LKS tingkat kabupaten', surat:'surat_tugas_sekolah.pdf', nomor:'421/09/LKS', status:'Menunggu', waktu:'05:55', pengaju:'Kesiswaan', fisik:true},
    {id:'IZ04', sid:SISWA[9].id,  jenis:'Sakit', dari:HARI[HARI.length-3], sampai:HARI[HARI.length-2], alasan:'Sakit perut', surat:'surat_dokter_2026010.pdf', nomor:'SD/09/004', status:'Disetujui', waktu:'06:05', pengaju:'Ibu Maulana', fisik:true},
    {id:'IZ05', sid:SISWA[33].id, jenis:'Izin',  dari:HARI[HARI.length-4], sampai:HARI[HARI.length-4], alasan:'Tidak melampirkan surat', surat:'', nomor:'—', status:'Ditolak', waktu:'06:40', pengaju:'Ibu Yuliana', fisik:false}
  ];
}
function initAudit(){
  state.audit = [
    {id:1, waktu:'05:30', user:'Admin / Tata Usaha', aksi:'Ubah pengaturan', detail:'Jam masuk → 06:45 (batas terlambat 06:45)'},
    {id:2, waktu:'06:05', user:'Guru Piket', aksi:'Setujui izin', detail:'IZ04 — ' + namaSiswa(SISWA[9].id) + ' (Sakit, surat diterima)'},
    {id:3, waktu:'06:20', user:'Guru Piket', aksi:'Input manual', detail:namaSiswa(SISWA[5].id) + ' — kartu tertinggal'},
    {id:4, waktu:'06:46', user:'Sistem', aksi:'Tetapkan status', detail:'9 siswa otomatis TERLAMBAT (lewat 06:45)'}
  ];
}
initToday(); initIzin(); initAudit();

/* =====================================================================
   NAVIGASI
   ===================================================================== */
function setRole(r){
  state.role = r;
  if (ROLES[r].pages.indexOf(state.page) < 0) state.page = ROLES[r].pages[0];
  render();
}
function go(p){
  if (ROLES[state.role].pages.indexOf(p) < 0){ toast('Peran "' + ROLES[state.role].nama + '" tidak berhak membuka halaman ini', 'err'); return; }
  state.page = p; render(); window.scrollTo(0,0);
}
const JUDUL = {
  dashboard:'Dashboard', absensi:'Absensi Gerbang', presensi:'Presensi per Jam Pelajaran',
  izin:'Izin & Surat Keterangan', siswa:'Data Siswa', laporan:'Laporan Kehadiran',
  unduhan:'Unduhan File Excel', pengaturan:'Pengaturan', audit:'Jejak Audit', kartu:'Kartu QR Siswa'
};
function renderNav(){
  let h = '';
  NAV.forEach(g => {
    const items = g.items.filter(it => ROLES[state.role].pages.indexOf(it[0]) >= 0);
    if (!items.length) return;
    h += '<div class="grp">' + g.g + '</div>';
    items.forEach(it => { h += '<button class="' + (state.page===it[0]?'active':'') + '" onclick="go(\'' + it[0] + '\')"><span class="ic">' + it[1] + '</span>' + it[2] + '</button>'; });
  });
  document.getElementById('nav').innerHTML = h;
  document.getElementById('pageTitle').textContent = JUDUL[state.page] || '';
}
function aturJamDemo(h, m){ const d = new Date(state.clock); d.setHours(h, m, 0, 0); state.clock = d; render(); }
function render(){
  renderNav();
  document.getElementById('pageSub').textContent = {
    dashboard:'SMKN 1 Mojosari · ' + dmyLong(HARI_INI),
    absensi:'Batas terlambat pukul ' + jamBatas() + ' · jam demo ' + hhmm(state.clock),
    presensi:'Presensi per jam pelajaran oleh guru mapel',
    izin:'Pengajuan wajib melampirkan surat · dikonfirmasi guru piket',
    siswa:'Data siswa per kelas & jurusan',
    laporan:'Rekap harian & bulanan, dipisah per kelas',
    unduhan:'File Excel harian & bulanan per kelas',
    kartu:'Kartu absensi berisi QR code asli — siap cetak & laminasi',
    pengaturan:'Kebijakan jam, surat, dan penamaan file',
    audit:'Setiap perubahan tercatat permanen'
  }[state.page] || '';
  document.getElementById('roleSel').value = state.role;
  const ob = document.getElementById('offBtn');
  ob.textContent = state.online ? '🌐 Online' : '📴 Offline (' + state.queue.length + ')';
  ob.className = 'btn sm' + (state.online ? '' : ' red');
  const cf = document.getElementById('connFoot');
  cf.className = 'sidefoot' + (state.online ? '' : ' off');
  document.getElementById('connTxt').textContent = state.online ? 'Online · tersinkron'
    : 'Offline · ' + state.queue.length + ' antrean menunggu';
  const fn = {dashboard:pgDashboard, absensi:pgAbsensi, presensi:pgPresensi, izin:pgIzin,
              siswa:pgSiswa, laporan:pgLaporan, unduhan:pgUnduhan, pengaturan:pgSeting,
              audit:pgAudit, kartu:pgKartu}[state.page];
  document.getElementById('view').innerHTML = fn ? fn() : '';
  if (state.page === 'absensi') updateScanInfo();
}
let _lastSiap = null;
function clockTick(){
  state.clock = new Date(state.clock.getTime() + 1000);
  document.getElementById('clockPill').textContent = '🕒 ' + hhmm(state.clock) + ' (demo)';
  document.getElementById('jamPill').textContent = '⏰ Terlambat >' + jamBatas() + ' · rilis file ' + state.settings.jamRilis;
  if (state.page === 'absensi') updateScanInfo();
  if (state.page === 'unduhan'){ const s = fileSiap(); if (s !== _lastSiap){ _lastSiap = s; render(); } }
  if (state.page === 'dashboard' && state.clock.getSeconds() % 20 === 0) render();
}
setInterval(clockTick, 1000);
function toggleOffline(){
  state.online = !state.online;
  if (state.online){
    if (state.queue.length){
      const n = state.queue.length;
      state.queue.forEach(q => state.checkins.unshift(q));
      state.queue = [];
      logAudit('Sistem', 'Sinkronisasi offline', n + ' catatan kehadiran terkirim ke server');
      toast(n + ' catatan tersinkron', 'ok');
    } else toast('Kembali online', 'ok');
  } else {
    logAudit('Sistem', 'Mode offline', 'Koneksi terputus — kehadiran disimpan di antrean lokal perangkat');
    toast('OFFLINE: kehadiran tersimpan di perangkat, sinkron otomatis nanti', 'warn');
  }
  render();
}
function barChart(items){
  const w = 640, h = 160, pl = 26, pb = 22, bw = (w - pl - 10) / items.length;
  let s = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:auto">';
  [0,25,50,75,100].forEach(v => {
    const y = pb + (100-v)/100*(h-pb-12);
    s += '<line x1="' + pl + '" y1="' + y + '" x2="' + (w-6) + '" y2="' + y + '" stroke="#e2e8f0"/>';
    s += '<text x="' + (pl-6) + '" y="' + (y+3.5) + '" font-size="9" fill="#94a3b8" text-anchor="end">' + v + '</text>';
  });
  items.forEach((it,i) => {
    const bh = Math.max(2, it.v/100*(h-pb-12)), x = pl + i*bw + 3, y = h - pb - bh;
    const c = it.v>=95?'#16a34a':it.v>=88?'#2563eb':it.v>=80?'#f59e0b':'#dc2626';
    s += '<rect x="' + x + '" y="' + y + '" width="' + (bw-6) + '" height="' + bh + '" rx="3" fill="' + c + '"/>';
    s += '<text x="' + (x+(bw-6)/2) + '" y="' + (h-8) + '" font-size="9" fill="#64748b" text-anchor="middle">' + it.l + '</text>';
  });
  return s + '</svg>';
}
function donut(parts){
  const total = parts.reduce((a,b)=>a+b.v,0) || 1, r = 52, c = 2*Math.PI*r; let off = 0;
  let s = '<svg viewBox="0 0 140 140" style="width:140px;height:140px">';
  s += '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="18"/>';
  parts.forEach(p => {
    const len = p.v/total*c;
    s += '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + p.c + '" stroke-width="18" stroke-dasharray="'
      + len + ' ' + (c-len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)"/>';
    off += len;
  });
  return s + '<text x="70" y="68" text-anchor="middle" font-size="20" font-weight="700" fill="#0f172a">' + total
    + '</text><text x="70" y="84" text-anchor="middle" font-size="10" fill="#64748b">siswa</text></svg>';
}

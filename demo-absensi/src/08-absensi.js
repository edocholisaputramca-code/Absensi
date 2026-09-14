/* =====================================================================
   ABSENSI GERBANG
   ===================================================================== */
let scanSiswa = null, tabAbsen = 'masuk', filterAbsen = '';
function updateScanInfo(){
  const el = document.getElementById('scanInfo');
  if (el) el.innerHTML = '<b>' + (state.online ? '🟢 Online' : '🟡 Offline · antrean ' + state.queue.length) + '</b> · jam demo '
    + hhmm(state.clock) + ' · terlambat &gt; ' + jamBatas();
}
function pilihScan(id){
  const s = getSiswa(id); if (!s) return;
  if (state.today[id]){ toast(s.nama + ' sudah tercatat: ' + STATUS[state.today[id].st].l + ' (' + state.today[id].jam + ')', 'warn'); return; }
  scanSiswa = { sid:id, step:'konfirmasi' }; render();
  const b = document.getElementById('searchBox'); if (b) b.focus();
}
function acakScan(){
  const belum = SISWA.filter(s => !state.today[s.id]);
  if (!belum.length){ toast('Semua siswa sudah tercatat', 'warn'); return; }
  pilihScan(belum[ri(0, belum.length-1)].id);
}
function konfirmasiAbsen(){
  if (!scanSiswa) return;
  const id = scanSiswa.sid;
  const st = menitSekarang() <= menitDariJam(jamBatas()) ? 'H' : 'T';
  const rec = { sid:id, jam:hhmm(state.clock), st:st, metode:'Kartu QR' };
  if (state.online) state.checkins.unshift(rec); else state.queue.push(rec);
  state.today[id] = { st:st, jam:rec.jam, metode:'Kartu QR' + (state.online?'':' (antrean lokal)') };
  if (st === 'T') logAudit('Sistem', 'Terlambat', namaSiswa(id) + ' masuk ' + rec.jam + ' (lewat ' + jamBatas() + ')');
  scanSiswa = { sid:id, step:'hasil', st:st }; render();
}
function batalScan(){ scanSiswa = null; render(); }
function cariSiswa(q){
  q = (q||'').toLowerCase().trim();
  const box = document.getElementById('sugg'); if (!box) return;
  if (!q){ box.innerHTML = ''; return; }
  const res = SISWA.filter(s => s.nama.toLowerCase().indexOf(q) >= 0 || s.nis.indexOf(q) >= 0).slice(0,8);
  box.innerHTML = res.length ? res.map(s => '<div onclick="pilihScan(\'' + s.id + '\')"><span class="ava">' + initial(s.nama) + '</span>'
    + '<div><b>' + esc(s.nama) + '</b><div class="mini">' + s.nis + ' · ' + getKelas(s.kelas).nama + ' · ' + s.jurusan + '</div></div>'
    + '<div style="margin-left:auto">' + (state.today[s.id] ? badge(state.today[s.id].st) : '<span class="tag">Belum absen</span>') + '</div></div>').join('')
    : '<div style="padding:12px;color:#64748b;font-size:13px">Tidak ditemukan</div>';
}
let manualPilih = null;
function inputManual(){
  openModal('<h3>Input Manual — lupa / hilang kartu</h3><p class="hint">Wajib otentikasi guru piket dan tercatat di jejak audit.</p>'
    + '<div class="field"><label>Cari siswa (nama / NIS)</label><input type="text" id="mCari" oninput="cariManual(this.value)" placeholder="mis. 2026007"></div>'
    + '<div id="mSugg"></div>'
    + '<div class="field" style="margin-top:12px"><label>Alasan wajib</label><select id="mAlasan">'
    + '<option>Kartu tertinggal</option><option>Kartu rusak</option><option>Kartu hilang</option><option>Perangkat gagal membaca</option></select></div>'
    + '<div class="field"><label>PIN Guru Piket (demo: 1234)</label><input type="text" id="mPin" placeholder="••••"></div>'
    + '<div class="foot"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" onclick="simpanManual()">Simpan</button></div>');
}
function cariManual(q){
  q = (q||'').toLowerCase().trim();
  const box = document.getElementById('mSugg'); if (!box) return;
  if (!q){ box.innerHTML = ''; return; }
  const res = SISWA.filter(s => s.nama.toLowerCase().indexOf(q) >= 0 || s.nis.indexOf(q) >= 0).slice(0,6);
  box.innerHTML = res.length ? '<div class="sugg">' + res.map(s => '<div onclick="pilihManual(\'' + s.id + '\')">'
    + '<span class="ava">' + initial(s.nama) + '</span><div><b>' + esc(s.nama) + '</b><div class="mini">' + s.nis + ' · ' + getKelas(s.kelas).nama + '</div></div></div>').join('') + '</div>' : '';
}
function pilihManual(id){ manualPilih = id; document.getElementById('mCari').value = namaSiswa(id); document.getElementById('mSugg').innerHTML = ''; }
function simpanManual(){
  if (!manualPilih){ toast('Pilih siswa dulu', 'err'); return; }
  if (document.getElementById('mPin').value !== '1234'){ toast('PIN salah (demo: 1234)', 'err'); return; }
  const id = manualPilih, alasan = document.getElementById('mAlasan').value;
  const st = menitSekarang() <= menitDariJam(jamBatas()) ? 'H' : 'T';
  state.today[id] = { st:st, jam:hhmm(state.clock), metode:'Input manual (guru piket)', note:alasan };
  state.online ? state.checkins.unshift({sid:id, jam:hhmm(state.clock), st:st, metode:'Input manual'}) : state.queue.push({sid:id, jam:hhmm(state.clock), st:st, metode:'Input manual'});
  logAudit(userAktif(), 'Input manual', namaSiswa(id) + ' — ' + alasan);
  manualPilih = null; closeModal(); render(); toast('Kehadiran ' + namaSiswa(id) + ' tersimpan', 'ok');
}
function absenPulang(id){
  state.pulang[id] = hhmm(state.clock);
  logAudit(userAktif(), 'Absen pulang', namaSiswa(id) + ' pukul ' + hhmm(state.clock));
  toast('Pulang ' + namaSiswa(id) + ' tercatat', 'ok'); render();
}
function renderListAbsen(){ const el = document.getElementById('listAbsen'); if (el) el.innerHTML = listAbsenHTML(); }
function listAbsenHTML(){
  const q = (filterAbsen||'').toLowerCase();
  let list = tabAbsen==='masuk' ? SISWA.filter(s=>state.today[s.id])
    : tabAbsen==='belum' ? SISWA.filter(s=>!state.today[s.id]) : SISWA.slice();
  if (q) list = list.filter(s => s.nama.toLowerCase().indexOf(q)>=0 || getKelas(s.kelas).nama.toLowerCase().indexOf(q)>=0 || s.jurusan.toLowerCase().indexOf(q)>=0);
  if (!list.length) return '<div class="empty">Tidak ada data</div>';
  return '<div style="max-height:400px;overflow:auto">' + list.map(s => {
    const t = state.today[s.id], p = state.pulang[s.id];
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9">'
      + '<span class="ava ' + (t?(t.st==='H'?'g':t.st==='T'?'a':'p'):'r') + '">' + initial(s.nama) + '</span>'
      + '<div style="flex:1;min-width:0"><b style="font-size:13px">' + esc(s.nama) + '</b>'
      + '<div class="mini">' + getKelas(s.kelas).nama + ' · ' + s.jurusan + (t && t.note ? ' · ' + esc(t.note) : '') + '</div></div>'
      + (t ? '<span class="mini">' + t.jam + '</span> ' + badge(t.st) : '<span class="tag">Belum absen</span>')
      + (tabAbsen==='pulang' ? (p ? '<span class="tag on" style="margin-left:8px">Pulang ' + p + '</span>'
          : '<button class="btn sm" style="margin-left:8px" onclick="absenPulang(\'' + s.id + '\')">Catat pulang</button>') : '')
      + '</div>';
  }).join('') + '</div>';
}
function pgAbsensi(){
  const stScan = scanSiswa && scanSiswa.step === 'hasil' ? scanSiswa.st : null;
  let s = '<div class="card" style="margin-bottom:12px"><div class="card-head"><h3>⏰ Atur jam demo</h3>'
    + '<button class="btn sm" onclick="aturJamDemo(6,40)">06:40 (pagi)</button>'
    + '<button class="btn sm" onclick="aturJamDemo(6,50)">06:50 (terlambat)</button>'
    + '<button class="btn sm" onclick="aturJamDemo(15,35)">15:35 (sore)</button>'
    + '<div class="spacer"></div><span class="mini">Batas terlambat <b>' + jamBatas() + '</b> · jam pulang ' + state.settings.jamPulang + '</span></div></div>';
  s += '<div class="kiosk">';
  s += '<div class="card"><div class="card-head"><h3>📷 Kiosk Gerbang</h3><div class="spacer"></div><span class="mini" id="scanInfo"></span></div>';
  s += '<div class="scanner ' + (stScan==='H'?'ok':stScan?'late':'') + '">';
  if (scanSiswa && scanSiswa.step === 'konfirmasi'){
    const ss = getSiswa(scanSiswa.sid), kk = getKelas(ss.kelas);
    s += '<div style="text-align:center"><div class="qrframe">' + qrSvg(tokenSiswa(ss), 4, 2) + '<div class="scanline2"></div></div>'
      + '<div class="res">' + esc(ss.nama) + '<small>' + kk.nama + ' · ' + ss.jurusan + ' · NIS ' + ss.nis
      + ' · dipindai ' + hhmm(state.clock) + '</small></div></div>';
  } else if (scanSiswa && scanSiswa.step === 'hasil'){
    const ss = getSiswa(scanSiswa.sid);
    s += '<div class="res">' + (stScan==='H' ? '✅ HADIR (sebelum ' + jamBatas() + ')' : '⏰ TERLAMBAT (lewat ' + jamBatas() + ')')
      + '<small>' + esc(ss.nama) + ' · ' + getKelas(ss.kelas).nama + ' · ' + hhmm(state.clock)
      + (state.online ? ' · tersimpan di server' : ' · tersimpan di antrean lokal') + '</small></div>';
  } else {
    s += '<div class="frame"><div class="line"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div class="qr">🏷️</div></div></div>'
      + '<div class="res" style="font-size:13px;color:#94a3b8">Arahkan kartu QR siswa ke pemindai</div>';
  }
  s += '</div>';
  s += scanSiswa && scanSiswa.step === 'konfirmasi'
    ? '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn primary xl" style="flex:1" onclick="konfirmasiAbsen()">✔ Konfirmasi</button><button class="btn xl" onclick="batalScan()">✖</button></div>'
    : scanSiswa && scanSiswa.step === 'hasil'
    ? '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn primary xl" style="flex:1" onclick="batalScan()">Siswa Berikutnya</button></div>'
    : '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn primary xl" style="flex:1" onclick="acakScan()">🎲 Simulasikan Pemindaian</button><button class="btn xl" onclick="inputManual()">⌨️ Input Manual</button></div>';
  s += '<div class="hr"></div><div class="field" style="margin:0"><label>Cari siswa (nama / NIS)</label>'
    + '<input class="bigsearch" type="text" id="searchBox" placeholder="Ketik untuk mencari…" oninput="cariSiswa(this.value)"></div>'
    + '<div class="sugg" id="sugg"></div></div>';
  s += '<div class="card"><div class="card-head"><h3>Status Hari Ini</h3><div class="spacer"></div><span class="mini">'
    + Object.keys(state.today).length + '/' + SISWA.length + ' tercatat</span></div>'
    + '<div class="chips" style="margin-bottom:10px">'
    + ['masuk','belum','pulang'].map(t => '<button class="chip ' + (tabAbsen===t?'on':'') + '" onclick="tabAbsen=\'' + t + '\';render()">'
      + (t==='masuk'?'✔ Sudah absen':t==='belum'?'⏳ Belum absen':'🏠 Absen pulang') + '</button>').join('') + '</div>'
    + '<input type="text" placeholder="🔍 Filter nama / kelas / jurusan…" value="' + esc(filterAbsen) + '" oninput="filterAbsen=this.value;renderListAbsen()">'
    + '<div style="margin-top:10px" id="listAbsen">' + listAbsenHTML() + '</div></div>';
  s += '</div>';
  s += '<div class="card" style="margin-top:14px"><h3>📥 Antrean Offline</h3><p class="hint">Matikan <b>Mode Online</b> lalu absen — data tersimpan di perangkat dan tersinkron otomatis saat koneksi kembali.</p>'
    + (state.queue.length ? '<table><thead><tr><th>Siswa</th><th>Kelas</th><th>Jam</th><th>Status</th></tr></thead><tbody>'
      + state.queue.map(q => '<tr><td>' + esc(namaSiswa(q.sid)) + '</td><td>' + getKelas(getSiswa(q.sid).kelas).nama + '</td><td>' + q.jam + '</td><td>' + badge(q.st) + '</td></tr>').join('')
      + '</tbody></table>' : '<div class="empty">Tidak ada antrean tertunda ✅</div>') + '</div>';
  return s;
}

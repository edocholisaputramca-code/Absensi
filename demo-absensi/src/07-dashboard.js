/* =====================================================================
   DASHBOARD (bisa disaring per jurusan / per kelas)
   ===================================================================== */
function setFJurusan(v){ state.fJurusan = v; state.fKelas = 'semua'; render(); }
function setFKelas(v){ state.fKelas = v; if (v !== 'semua') state.fJurusan = 'semua'; render(); }
function filterBar(){
  return '<div class="rowflex" style="margin-bottom:14px">'
    + '<span class="mini">Filter:</span>'
    + '<div class="chips">'
    + '<button class="chip ' + (state.fJurusan==='semua' && state.fKelas==='semua' ? 'on':'') + '" onclick="setFJurusan(\'semua\')">Semua Kelas</button>'
    + JURUSAN.map(j => '<button class="chip ' + (state.fJurusan===j.id?'on':'') + '" onclick="setFJurusan(\'' + j.id + '\')" title="' + esc(j.nama) + '">' + j.id + '</button>').join('')
    + '</div>'
    + '<select style="max-width:230px" onchange="setFKelas(this.value)">'
    + '<option value="semua"' + (state.fKelas==='semua'?' selected':'') + '>— pilih kelas tertentu —</option>'
    + KELAS.map(k => '<option value="' + k.id + '"' + (state.fKelas===k.id?' selected':'') + '>' + k.nama + ' (' + k.jurusan + ')</option>').join('')
    + '</select></div>';
}
function pgDashboard(){
  const ss = siswaTerfilter();
  const h = hitungHariIni(ss);
  const hadir = h.H + h.T + h.S + h.I + h.D;
  const persen = ss.length ? Math.round(hadir / ss.length * 100) : 0;
  const label = state.fKelas !== 'semua' ? getKelas(state.fKelas).nama
    : state.fJurusan !== 'semua' ? 'Jurusan ' + getJurusan(state.fJurusan).id : 'Seluruh Sekolah';

  const trend = HARI.map(t => {
    const list = ss.map(s => ({ st: t===HARI_INI ? (statusHariIni(s.id)||'A') : (HIST[s.id+'|'+t]||{st:'A'}).st }));
    const p = dmy(t).split(' ');
    return { l: p[0] + '/' + p[1], v: persenDari(list) };
  });
  const perKelas = kelasTerfilter().map(k => {
    const l = siswaKelas(k.id).map(s => ({ st: statusHariIni(s.id) || 'A' }));
    return { k:k, persen: persenDari(l), n:l.length, alpa: l.filter(x=>x.st==='A').length };
  }).sort((a,b)=> b.persen - a.persen);
  const perJurusan = JURUSAN.map(j => {
    const ks = (state.fJurusan !== 'semua' ? (j.id===state.fJurusan?KELAS.filter(k=>k.jurusan===j.id):[])
      : (state.fKelas !== 'semua' ? KELAS.filter(k=>k.id===state.fKelas && k.jurusan===j.id) : KELAS.filter(k=>k.jurusan===j.id)));
    if (!ks.length) return null;
    let list = []; ks.forEach(k => siswaKelas(k.id).forEach(s => list.push({ st: statusHariIni(s.id) || 'A' })));
    return { j:j, n:list.length, persen: persenDari(list), kls: ks.length };
  }).filter(Boolean);
  const parts = [{v:h.H,c:'#16a34a',l:'Hadir'},{v:h.T,c:'#f59e0b',l:'Terlambat'},{v:h.S,c:'#3b82f6',l:'Sakit'},
    {v:h.I,c:'#7c3aed',l:'Izin'},{v:h.D,c:'#0d9488',l:'Dispensasi'},{v:h.A+h.belum,c:'#dc2626',l:'Tanpa keterangan'}].filter(p=>p.v>0);
  const perlu = rekap(ss, HARI).filter(r => r.A + r.B >= 3).sort((a,b)=>(b.A+b.B)-(a.A+a.B)).slice(0,6);

  let s = '<div class="banner">💡 <div><b>Demo SMK — tanpa notifikasi WA.</b> Semua hasil kehadiran diunduh sebagai '
    + '<b>file Excel per kelas</b>. Coba: ganti <b>peran</b> di kiri, absen di menu <b>Absensi Gerbang</b>, '
    + 'lalu buka <b>Unduhan Excel</b> dan atur jam demo ke <b>15:35</b> supaya file harian bisa diunduh.</div></div>';
  s += filterBar();
  s += '<div class="grid g4" style="margin-bottom:14px">'
    + '<div class="kpi b"><span class="bar"></span><div class="lab">Kehadiran hari ini</div><div class="val">' + persen + '%</div>'
    + '<div class="note">' + hadir + ' dari ' + ss.length + ' siswa · ' + label + '</div></div>'
    + '<div class="kpi g"><span class="bar"></span><div class="lab">Hadir (≤ ' + jamBatas() + ')</div><div class="val">' + h.H + '</div>'
    + '<div class="note">tidak terlambat</div></div>'
    + '<div class="kpi a"><span class="bar"></span><div class="lab">Terlambat</div><div class="val">' + h.T + '</div>'
    + '<div class="note">masuk lewat ' + jamBatas() + '</div></div>'
    + '<div class="kpi r"><span class="bar"></span><div class="lab">Tanpa keterangan</div><div class="val">' + (h.A+h.belum) + '</div>'
    + '<div class="note">' + h.belum + ' belum absen · ' + h.A + ' alpa</div></div></div>';
  s += '<div class="split" style="margin-bottom:14px">'
    + '<div class="card"><h3>Tren kehadiran 14 hari — ' + label + '</h3><p class="hint">Persentase hadir (H+T+S+I+D) per hari</p>'
    + barChart(trend) + '<div class="legend"><span><i style="background:#16a34a"></i> ≥95%</span><span><i style="background:#2563eb"></i> ≥88%</span>'
    + '<span><i style="background:#f59e0b"></i> ≥80%</span><span><i style="background:#dc2626"></i> &lt;80%</span></div></div>'
    + '<div class="card"><h3>Komposisi hari ini</h3><p class="hint">' + label + ' · ' + ss.length + ' siswa</p>'
    + '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' + donut(parts)
    + '<div style="flex:1;min-width:150px">' + parts.map(p => '<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:3px 0">'
      + '<span><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:' + p.c + ';margin-right:7px"></i>' + p.l + '</span><b>' + p.v + '</b></div>').join('')
    + '</div></div></div></div>';
  s += '<div class="split">';
  s += '<div class="card"><h3>Kehadiran per Kelas</h3><p class="hint">Diurutkan dari yang terbaik</p><div class="barlist">'
    + perKelas.map(p => '<div class="row"><span class="n">' + p.k.nama + '</span><span class="track"><i style="width:' + p.persen
      + '%;background:' + (p.persen>=90?'#16a34a':p.persen>=80?'#f59e0b':'#dc2626') + '"></i></span><span class="p">' + p.persen + '%</span></div>').join('')
    + '</div></div>';
  s += '<div class="card"><h3>Rekap per Jurusan</h3><p class="hint">Agregat dari kelas yang ditampilkan</p>'
    + '<table><thead><tr><th>Jurusan</th><th class="num">Kelas</th><th class="num">Siswa</th><th class="num">% Kehadiran</th></tr></thead><tbody>'
    + perJurusan.map(p => '<tr><td><b>' + p.j.id + '</b> <span class="mini">' + esc(p.j.nama) + '</span></td>'
      + '<td class="num">' + p.kls + '</td><td class="num">' + p.n + '</td>'
      + '<td class="num"><b style="color:' + (p.persen>=90?'#16a34a':p.persen>=80?'#f59e0b':'#dc2626') + '">' + p.persen + '%</b></td></tr>').join('')
    + '</tbody></table>'
    + '<div class="hr"></div><h3>⚠️ Perlu perhatian (14 hari)</h3>'
    + '<div style="max-height:190px;overflow:auto"><table><tbody>'
    + (perlu.length ? perlu.map(r => '<tr><td>' + esc(r.siswa.nama) + ' <span class="tag">' + getKelas(r.siswa.kelas).nama + '</span></td>'
        + '<td class="num"><b style="color:#dc2626">' + (r.A+r.B) + ' hari</b></td><td class="num">' + r.persen + '%</td></tr>').join('')
      : '<tr><td class="empty">Tidak ada 🎉</td></tr>') + '</tbody></table></div></div>';
  s += '</div>';
  s += '<div class="card" style="margin-top:14px"><div class="card-head"><h3>Aktivitas absensi terbaru</h3><div class="spacer"></div>'
    + '<button class="btn sm" onclick="go(\'absensi\')">Buka kiosk →</button></div><div class="feed">'
    + (state.checkins.length ? state.checkins.slice(0,8).map(c => {
        const st = getSiswa(c.sid);
        return '<div class="it"><span class="ava ' + (c.st==='H'?'g':c.st==='T'?'a':'p') + '">' + initial(namaSiswa(c.sid)) + '</span>'
          + '<div><b>' + esc(namaSiswa(c.sid)) + '</b> <span class="tag">' + getKelas(st.kelas).nama + '</span>'
          + '<div class="mini">' + esc(c.metode) + '</div></div><span class="t">' + c.jam + '</span>' + badge(c.st) + '</div>';
      }).join('') : '<div class="empty">Belum ada aktivitas</div>') + '</div></div>';
  return s;
}

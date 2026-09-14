/* =====================================================================
   UNDUHAN EXCEL
   ===================================================================== */
function fileSiap(){ return menitSekarang() >= menitDariJam(state.settings.jamRilis); }
function slug(s){ return s.replace(/[ /]+/g,'-'); }
function namaFile(jenis, kid){
  const k = getKelas(kid);
  return jenis === 'harian'
    ? 'Absensi_Harian_' + slug(k.nama) + '_' + HARI_INI + '.xlsx'
    : 'Rekap_Bulanan_' + slug(k.nama) + '_' + slug(BULAN_LABEL) + '.xlsx';
}
function barisHarian(kid){
  const k = getKelas(kid), ss = siswaKelas(kid), j = getJurusan(k.jurusan);
  const rows = [];
  rows.push([{v:'REKAP KEHADIRAN HARIAN SISWA', b:1}]);
  rows.push([{v:SEKOLAH.nama + '  —  Tahun Ajaran ' + SEKOLAH.tahun, b:1}]);
  rows.push(['Kelas: ' + k.nama + '    Jurusan: ' + j.id + ' - ' + j.nama + '    Wali Kelas: ' + k.wali]);
  rows.push(['Tanggal: ' + dmyLong(HARI_INI) + '    Jam masuk: ' + state.settings.jamMasuk + '    Batas terlambat: ' + jamBatas() + '    Jam pulang: ' + state.settings.jamPulang]);
  rows.push([]);
  rows.push([{v:'No',b:1},{v:'NIS',b:1},{v:'NISN',b:1},{v:'Nama Siswa',b:1},{v:'Kelas',b:1},{v:'Jurusan',b:1},
             {v:'Jam Masuk',b:1},{v:'Status',b:1},{v:'Jam Pulang',b:1},{v:'Keterangan',b:1}]);
  ss.forEach((s,i) => {
    const t = state.today[s.id], st = statusHariIni(s.id);
    rows.push([ i+1, s.nis, s.nisn, s.nama, k.nama, s.jurusan,
      (t && t.jam !== '—') ? t.jam : '—',
      STATUS[st] || 'Belum absen',
      state.pulang[s.id] || '—',
      t ? (t.note ? t.note : t.metode) : 'Tidak hadir tanpa keterangan' ]);
  });
  const h = hitungHariIni(ss);
  rows.push([]);
  rows.push([{v:'RINGKASAN KELAS', b:1}]);
  [['H','Hadir'],['T','Terlambat'],['S','Sakit'],['I','Izin'],['D','Dispensasi'],['A','Alpa']].forEach(x => rows.push([x[1], h[x[0]]]));
  rows.push(['Belum absen', h.belum]);
  rows.push(['Jumlah siswa', ss.length]);
  rows.push(['Persentase kehadiran', Math.round((ss.length - h.A) / ss.length * 100) + '%']);
  rows.push([]);
  rows.push(['Dibuat otomatis oleh sistem absensi digital · ' + dmyLong(HARI_INI) + ' ' + hhmm(state.clock)]);
  rows.push(['Guru Piket: ................................', '', '', 'Wali Kelas: ' + k.wali]);
  return rows;
}
function barisBulanan(kid){
  const k = getKelas(kid), j = getJurusan(k.jurusan), rows0 = rekap(siswaKelas(kid), HARI);
  const rows = [];
  rows.push([{v:'REKAP KEHADIRAN BULANAN SISWA', b:1}]);
  rows.push([{v:SEKOLAH.nama + '  —  Tahun Ajaran ' + SEKOLAH.tahun, b:1}]);
  rows.push(['Kelas: ' + k.nama + '    Jurusan: ' + j.id + ' - ' + j.nama + '    Wali Kelas: ' + k.wali]);
  rows.push(['Periode: ' + dmy(HARI[0]) + ' s.d. ' + dmy(HARI_INI) + '    Hari efektif: ' + HARI.length]);
  rows.push([]);
  rows.push([{v:'No',b:1},{v:'NIS',b:1},{v:'NISN',b:1},{v:'Nama Siswa',b:1},{v:'Kelas',b:1},{v:'Jurusan',b:1},
             {v:'H',b:1},{v:'T',b:1},{v:'S',b:1},{v:'I',b:1},{v:'D',b:1},{v:'A',b:1},
             {v:'Hari Efektif',b:1},{v:'% Kehadiran',b:1},{v:'Keterangan',b:1}]);
  rows0.forEach((r,i) => rows.push([ i+1, r.siswa.nis, r.siswa.nisn, r.siswa.nama, k.nama, r.siswa.jurusan,
    r.H, r.T, r.S, r.I, r.D, r.A, r.total, r.persen,
    r.A >= 3 ? 'Perlu perhatian' : (r.persen >= 95 ? 'Sangat baik' : '') ]));
  const t = rows0.reduce((a,r)=>({H:a.H+r.H,T:a.T+r.T,S:a.S+r.S,I:a.I+r.I,D:a.D+r.D,A:a.A+r.A}),{H:0,T:0,S:0,I:0,D:0,A:0});
  const persen = Math.round((t.H+t.T+t.S+t.I+t.D) / (rows0.length*HARI.length) * 100);
  rows.push([]);
  rows.push([{v:'RINGKASAN KELAS', b:1}]);
  [['H','Hadir'],['T','Terlambat'],['S','Sakit'],['I','Izin'],['D','Dispensasi'],['A','Alpa']].forEach(x => rows.push([x[1], t[x[0]]]));
  rows.push(['Jumlah siswa', rows0.length]);
  rows.push(['Persentase kehadiran kelas', persen + '%']);
  rows.push([]);
  rows.push(['Dibuat otomatis oleh sistem absensi digital · ' + dmyLong(HARI_INI) + ' ' + hhmm(state.clock)]);
  rows.push(['Wali Kelas: ' + k.wali, '', '', 'Mengetahui, Kepala Sekolah']);
  return rows;
}
function simpanFile(nama, bytes){
  try {
    const blob = new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
    return true;
  } catch(e){ return false; }
}
function unduh(jenis, kid){
  if (jenis === 'harian' && !fileSiap()){
    toast('File harian baru tersedia setelah jam pulang (' + state.settings.jamPulang + '), pukul ' + state.settings.jamRilis, 'warn');
    return;
  }
  const k = getKelas(kid);
  const rows = jenis === 'harian' ? barisHarian(kid) : barisBulanan(kid);
  const nama = namaFile(jenis, kid);
  const bytes = buildXlsxBytes([{ nama: k.nama, rows: rows }]);
  const ok = simpanFile(nama, bytes);
  state.unduh.unshift({ waktu:hhmm(state.clock), file:nama, jenis:jenis, oleh:userAktif(), kelas:k.nama });
  logAudit(userAktif(), 'Unduh rekap ' + jenis, k.nama + ' · ' + nama);
  render();
  if (ok) toast('File ' + nama + ' diunduh', 'ok');
  else { toast('Unduhan diblokir di panel pratinjau — buka pratinjau isi untuk melihat datanya', 'warn'); pratinjau(jenis, kid); }
}
function unduhSemua(jenis){
  if (jenis === 'harian' && !fileSiap()){ toast('File harian baru tersedia pukul ' + state.settings.jamRilis, 'warn'); return; }
  const ks = kelasTerfilter();
  const sheets = ks.map(k => ({ nama:k.nama, rows: jenis==='harian' ? barisHarian(k.id) : barisBulanan(k.id) }));
  const nama = (jenis==='harian' ? 'Absensi_Harian_Semua-Kelas_' + HARI_INI : 'Rekap_Bulanan_Semua-Kelas_' + slug(BULAN_LABEL)) + '.xlsx';
  const ok = simpanFile(nama, buildXlsxBytes(sheets));
  state.unduh.unshift({ waktu:hhmm(state.clock), file:nama, jenis:jenis + ' (gabungan)', oleh:userAktif(), kelas:ks.length + ' kelas' });
  logAudit(userAktif(), 'Unduh rekap ' + jenis + ' gabungan', ks.length + ' kelas · ' + nama);
  render();
  if (ok) toast('1 workbook berisi ' + ks.length + ' sheet diunduh', 'ok');
  else toast('Unduhan diblokir di panel pratinjau — berkas tetap bisa diunduh jika dibuka di browser', 'warn');
}
function pratinjau(jenis, kid){
  const k = getKelas(kid);
  const rows = jenis === 'harian' ? barisHarian(kid) : barisBulanan(kid);
  const maxCol = rows.reduce((a,r)=>Math.max(a,r.length),0);
  let h = '<h3>Pratinjau isi — ' + esc(namaFile(jenis, kid)) + '</h3>'
    + '<p class="hint">' + rows.length + ' baris · kolom A–' + colLetter(maxCol) + ' · sheet: <b>' + esc(k.nama) + '</b></p>'
    + '<div class="sheetprev"><table><tbody>'
    + rows.slice(0,40).map(r => '<tr>' + r.map(c => {
        const v = (c && c.v != null) ? c.v : c;
        return '<td' + (c && c.b ? ' style="font-weight:700;background:#f8fafc"' : '') + '>' + esc(v) + '</td>';
      }).join('') + '</tr>').join('')
    + '</tbody></table></div>';
  if (rows.length > 40) h += '<p class="hint" style="margin-top:8px">… dan ' + (rows.length-40) + ' baris lagi di dalam berkas.</p>';
  h += '<div class="foot"><button class="btn" onclick="closeModal()">Tutup</button>'
    + '<button class="btn primary" onclick="unduh(\'' + jenis + '\',\'' + kid + '\')">⬇ Unduh .xlsx</button></div>';
  openModal(h);
}
function pgUnduhan(){
  const siap = fileSiap();
  let s = '<div class="banner">📥 <div><b>Tanpa notifikasi WhatsApp.</b> Hasil absensi diunduh sebagai <b>file Excel per kelas</b>. '
    + 'Rekap <b>harian</b> otomatis tersedia setiap hari setelah jam pulang (pukul <b>' + state.settings.jamRilis + '</b>), '
    + 'rekap <b>bulanan</b> tersedia kapan saja dan diperbarui terus sampai akhir bulan. '
    + 'Penamaan file bisa diubah di Pengaturan.</div></div>';
  s += '<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>⏰ Status Ketersediaan</h3><div class="spacer"></div>'
    + '<button class="btn sm" onclick="aturJamDemo(6,40)">06:40</button>'
    + '<button class="btn sm" onclick="aturJamDemo(15,35)">Lewati ke 15:35</button></div>'
    + '<div class="grid g3">'
    + '<div class="kv"><span class="k">Jam sekarang (demo)</span><b>' + hhmm(state.clock) + '</b></div>'
    + '<div class="kv"><span class="k">Jam pulang</span><b>' + state.settings.jamPulang + '</b></div>'
    + '<div class="kv"><span class="k">File harian rilis</span><b>' + state.settings.jamRilis + '</b></div>'
    + '</div>'
    + (siap ? '<div class="rowflex" style="margin-top:12px"><span class="badge b-OK">✔ File harian SUDAH bisa diunduh</span></div>'
            : '<div class="rowflex" style="margin-top:12px"><span class="badge b-W">⏳ File harian belum tersedia — tersedia pukul ' + state.settings.jamRilis + '</span>'
              + '<button class="btn sm" onclick="aturJamDemo(15,35)">Lewati ke jam rilis (demo)</button></div>')
    + '</div>';
  s += filterBar();
  s += '<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>📄 Berkas per Kelas</h3><div class="spacer"></div>'
    + '<button class="btn primary sm" onclick="unduhSemua(\'harian\')">⬇ Semua Kelas — Harian</button>'
    + '<button class="btn primary sm" onclick="unduhSemua(\'bulanan\')">⬇ Semua Kelas — Bulanan</button></div>'
    + '<p class="hint">Satu kelas = satu file. Klik <b>Unduh</b> untuk menyimpan, atau <b>Pratinjau</b> untuk melihat isinya dulu.</p>';
  s += kelasTerfilter().map(k => {
    const nh = namaFile('harian', k.id), nb = namaFile('bulanan', k.id);
    const nSis = siswaKelas(k.id).length;
    return '<div class="card" style="margin-bottom:10px">'
      + '<div style="font-weight:700;font-size:14px;margin-bottom:10px">' + k.nama
      + ' <span class="tag">' + k.jurusan + '</span> <span class="mini">' + nSis + ' siswa · wali: ' + esc(k.wali) + '</span></div>'
      + '<div class="grid g2">'
      + '<div class="filecard"><div class="fic' + (siap?'':' lock') + '">XLSX</div>'
      + '<div class="meta"><b>Rekap Harian</b><span>' + esc(nh) + '<br>' + (siap ? 'Siap diunduh · ' + dmy(HARI_INI) : 'Tersedia ' + state.settings.jamRilis) + '</span></div>'
      + '<button class="btn sm" onclick="pratinjau(\'harian\',\'' + k.id + '\')">Pratinjau</button> '
      + '<button class="btn green sm" onclick="unduh(\'harian\',\'' + k.id + '\')">⬇ Unduh</button></div>'
      + '<div class="filecard"><div class="fic blue">XLSX</div>'
      + '<div class="meta"><b>Rekap Bulanan</b><span>' + esc(nb) + '<br>' + BULAN_LABEL + ' · ' + HARI.length + ' hari efektif</span></div>'
      + '<button class="btn sm" onclick="pratinjau(\'bulanan\',\'' + k.id + '\')">Pratinjau</button> '
      + '<button class="btn green sm" onclick="unduh(\'bulanan\',\'' + k.id + '\')">⬇ Unduh</button></div>'
      + '</div></div>';
  }).join('');
  s += '</div>';
  s += '<div class="card"><h3>Riwayat Unduhan</h3><p class="hint">Setiap pengunduhan tercatat di jejak audit.</p>'
    + (state.unduh.length ? '<div class="tblwrap"><table><thead><tr><th>Waktu</th><th>Kelas</th><th>Jenis</th><th>Nama File</th><th>Oleh</th></tr></thead><tbody>'
      + state.unduh.map(u => '<tr><td>' + u.waktu + '</td><td>' + esc(u.kelas) + '</td><td>' + esc(u.jenis) + '</td>'
        + '<td class="mono" style="background:none;color:inherit;padding:0">' + esc(u.file) + '</td><td>' + esc(u.oleh) + '</td></tr>').join('')
      + '</tbody></table></div>' : '<div class="empty">Belum ada berkas diunduh</div>') + '</div>';
  return s;
}

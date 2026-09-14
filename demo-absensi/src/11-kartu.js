/* =====================================================================
   KARTU QR SISWA
   ===================================================================== */
function setKelasKartu(v){ state.settings.kelasKartu = v; render(); }
function kartuHTML(s){
  const k = getKelas(s.kelas), j = getJurusan(s.jurusan), tk = tokenSiswa(s);
  return '<div class="kartu">'
    + '<div class="hd"><b>' + SEKOLAH.nama + '</b><span>KARTU ABSENSI</span></div>'
    + '<div class="bd">'
    + '<div class="foto">FOTO<br>3&times;4</div>'
    + '<div class="id"><div class="nm">' + esc(s.nama) + '</div>'
    + '<div class="r">NIS <b>' + s.nis + '</b> &middot; NISN ' + s.nisn + '</div>'
    + '<div class="r">Kelas <b>' + k.nama + '</b> &middot; ' + j.id + '</div>'
    + '<div class="r">' + esc(j.nama) + '</div></div>'
    + '<div class="qrbox">' + qrSvg(tk, 3, 2) + '<div class="t">' + tk + '</div></div>'
    + '</div>'
    + '<div class="ft"><span>TA ' + SEKOLAH.tahun + '</span><span>Bila hilang kembalikan ke TU</span></div>'
    + '</div>';
}
function lihatKartu(id){
  const s = getSiswa(id), k = getKelas(s.kelas), tk = tokenSiswa(s);
  openModal('<h3>Kartu Absensi — ' + esc(s.nama) + '</h3>'
    + '<p class="hint">QR ini berisi <b>token acak</b> (bukan NISN asli) sehingga tidak mudah ditebak atau dipalsukan.</p>'
    + '<div style="display:flex;justify-content:center;padding:6px 0 10px">' + kartuHTML(s) + '</div>'
    + '<div class="kv"><span class="k">Isi QR</span><b class="mono" style="background:#f1f5f9;color:#0f172a;padding:2px 6px;border-radius:5px">' + tk + '</b></div>'
    + '<div class="kv"><span class="k">Versi QR</span><b>v' + qrOf(tk).version + ' &middot; ' + qrOf(tk).size + '&times;' + qrOf(tk).size + ' modul &middot; level M</b></div>'
    + '<div class="kv"><span class="k">Kelas</span><b>' + k.nama + ' &middot; ' + s.jurusan + '</b></div>'
    + '<div class="kv"><span class="k">Status kartu</span><b>' + (s.versi ? '<span style="color:#b45309">cetak ulang ke-' + s.versi + ' (kartu lama dicabut)</span>' : '<span style="color:#15803d">aktif</span>') + '</b></div>'
    + '<div class="foot"><button class="btn" onclick="closeModal()">Tutup</button>'
    + '<button class="btn red" onclick="cabutKartu(\'' + id + '\')">🔄 Cabut & Terbit Ulang</button>'
    + '<button class="btn" onclick="unduhQrSiswa(\'' + id + '\')">⬇ QR (SVG)</button>'
    + '<button class="btn primary" onclick="window.print()">🖨 Cetak</button></div>');
}
function unduhQrSiswa(id){
  const s = getSiswa(id), tk = tokenSiswa(s);
  const svg = qrSvg(tk, 10, 4).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  const nama = 'QR_' + s.nis + '_' + s.nama.replace(/[^a-zA-Z0-9]+/g,'-') + '.svg';
  try {
    const blob = new Blob([svg], {type:'image/svg+xml'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    logAudit(userAktif(), 'Unduh QR siswa', s.nama + ' — ' + nama);
    toast('QR ' + s.nama + ' diunduh (' + nama + ')', 'ok');
  } catch(e){ toast('Unduhan diblokir di panel pratinjau', 'warn'); }
}
function cetakKartu(){
  logAudit(userAktif(), 'Cetak kartu QR', getKelas(state.settings.kelasKartu).nama);
  toast('Jendela cetak dibuka — pilih "Simpan sebagai PDF" bila ingin berkas digital', 'ok');
  setTimeout(()=>{ try { window.print(); } catch(e){} }, 250);
}
function pgKartu(){
  const kid = state.settings.kelasKartu;
  const daftar = kid === 'semua' ? SISWA : siswaKelas(kid);
  let s = '<div class="banner">🪪 <div><b>QR code pada kartu ini asli dan bisa dipindai</b> — dibuat langsung oleh sistem, '
    + 'tidak memerlukan internet. Isinya <b>token acak per siswa</b> (bukan NISN), jadi tidak bisa ditebak. '
    + 'Cetak pada kertas 120–180 gsm lalu laminasi, atau tempel stiker QR di kartu pelajar yang sudah ada.</div></div>';
  s += '<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>Kartu QR Siswa</h3><div class="spacer"></div>'
    + '<select style="max-width:250px" onchange="setKelasKartu(this.value)">'
    + '<option value="semua"' + (kid==='semua'?' selected':'') + '>Semua kelas (' + SISWA.length + ' siswa)</option>'
    + KELAS.map(k => '<option value="' + k.id + '"' + (k.id===kid?' selected':'') + '>' + k.nama + ' — ' + k.jurusan + '</option>').join('')
    + '</select> '
    + '<button class="btn primary sm" onclick="cetakKartu()">🖨 Cetak / Simpan PDF</button></div>'
    + '<p class="hint">' + daftar.length + ' kartu · ukuran kartu 85,6 × 54 mm (2 kartu per baris saat dicetak) · '
    + 'QR minimal 2 × 2 cm agar mudah dipindai.</p>'
    + '<div class="grid g3" style="margin-bottom:4px">'
    + '<div class="kv"><span class="k">Format QR</span><b>Level M (toleransi rusak ~15%)</b></div>'
    + '<div class="kv"><span class="k">Ukuran modul</span><b>25 × 25 (versi 2)</b></div>'
    + '<div class="kv"><span class="k">Isi token</span><b>SKM1.{NIS}.{acak}</b></div>'
    + '</div></div>';
  s += '<div class="kartu-wrap">' + daftar.map(st =>
      '<div style="width:344px">'
      + kartuHTML(st)
      + '<div class="rowflex no-print" style="margin-top:6px">'
      + '<button class="btn sm" onclick="lihatKartu(\'' + st.id + '\')">🔍 Perbesar</button>'
      + '<button class="btn sm" onclick="unduhQrSiswa(\'' + st.id + '\')">⬇ SVG</button>'
      + '<span class="mini">' + esc(getKelas(st.kelas).nama) + '</span></div></div>'
    ).join('') + '</div>';
  return s;
}

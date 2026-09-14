/* =====================================================================
   DATA SISWA
   ===================================================================== */
let cariSiswaQ = '';
function renderTabelSiswa(){
  const el = document.getElementById('tabelSiswa'); if (!el) return;
  const q = cariSiswaQ.toLowerCase();
  let list = siswaTerfilter();
  if (q) list = list.filter(s => s.nama.toLowerCase().indexOf(q)>=0 || s.nis.indexOf(q)>=0);
  el.innerHTML = list.length ? '<table><thead><tr><th>Siswa</th><th>NIS / NISN</th><th>Kelas</th><th>Jurusan</th>'
    + '<th class="num">% 14 hari</th><th class="num">Aksi</th></tr></thead><tbody>'
    + list.map(s => { const r = rekap([s], HARI)[0];
      return '<tr><td><div class="rowflex"><span class="ava">' + initial(s.nama) + '</span><div>' + esc(s.nama)
        + (s.aktif?'':' <span class="badge b-X">Nonaktif</span>') + '</div></div></td>'
        + '<td><div>' + s.nis + '</div><div class="mini">' + s.nisn + '</div></td>'
        + '<td>' + getKelas(s.kelas).nama + '</td><td><b>' + s.jurusan + '</b> <span class="mini">' + esc(getJurusan(s.jurusan).nama) + '</span></td>'
        + '<td class="num"><b style="color:' + (r.persen>=90?'#16a34a':r.persen>=80?'#f59e0b':'#dc2626') + '">' + r.persen + '%</b></td>'
        + '<td class="num"><button class="btn sm" onclick="lihatKartu(\'' + s.id + '\')">🪪 Kartu</button> '
        + '<button class="btn sm" onclick="editSiswa(\'' + s.id + '\')">Ubah</button></td></tr>'; }).join('')
    + '</tbody></table>' : '<div class="empty">Tidak ada data</div>';
}
function editSiswa(id){
  const s = getSiswa(id);
  openModal('<h3>Ubah Data Siswa</h3>'
    + '<div class="field"><label>Nama</label><input type="text" id="eNama" value="' + esc(s.nama) + '"></div>'
    + '<div class="field"><label>Kelas</label><select id="eKelas">' + KELAS.map(k =>
        '<option value="' + k.id + '"' + (k.id===s.kelas?' selected':'') + '>' + k.nama + ' — ' + k.jurusan + '</option>').join('') + '</select></div>'
    + '<div class="field"><label>Status</label><select id="eAktif"><option value="1"' + (s.aktif?' selected':'') + '>Aktif</option>'
    + '<option value="0"' + (s.aktif?'':' selected') + '>Nonaktif</option></select></div>'
    + '<div class="foot"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" onclick="simpanSiswa(\'' + id + '\')">Simpan</button></div>');
}
function simpanSiswa(id){
  const s = getSiswa(id);
  s.nama = document.getElementById('eNama').value || s.nama;
  s.kelas = document.getElementById('eKelas').value;
  s.jurusan = getKelas(s.kelas).jurusan;
  s.aktif = document.getElementById('eAktif').value === '1';
  logAudit(userAktif(), 'Ubah data siswa', s.nama + ' → ' + getKelas(s.kelas).nama);
  closeModal(); render(); toast('Data diperbarui', 'ok');
}
function tambahSiswa(){
  openModal('<h3>Tambah Siswa</h3>'
    + '<div class="field"><label>Nama</label><input type="text" id="bNama"></div>'
    + '<div class="field"><label>Kelas</label><select id="bKelas">' + KELAS.map(k => '<option value="' + k.id + '">' + k.nama + ' — ' + k.jurusan + '</option>').join('') + '</select></div>'
    + '<div class="foot"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" onclick="simpanBaru()">Tambah</button></div>');
}
function simpanBaru(){
  const nama = document.getElementById('bNama').value.trim();
  if (!nama){ toast('Nama wajib diisi', 'err'); return; }
  const k = getKelas(document.getElementById('bKelas').value);
  SISWA.push({ id:'S'+pad(SISWA.length+1), nis:'2026'+pad(SISWA.length+1), nisn:'0099'+SISWA.length, nama:nama,
    kelas:k.id, jurusan:k.jurusan, ortu:'—', wa:'—', aktif:true });
  logAudit(userAktif(), 'Tambah siswa', nama + ' — ' + k.nama);
  closeModal(); render(); toast('Siswa ditambahkan', 'ok');
}
function pgSiswa(){
  const s = '<div class="card"><div class="card-head"><h3>👥 Data Siswa</h3><div class="spacer"></div>'
    + '<button class="btn primary sm" onclick="tambahSiswa()">+ Tambah</button></div>'
    + '<p class="hint">' + SISWA.length + ' siswa · ' + KELAS.length + ' kelas · ' + JURUSAN.length + ' jurusan</p>'
    + filterBar()
    + '<input type="text" placeholder="🔍 Cari nama atau NIS…" style="max-width:320px;margin-bottom:12px" oninput="cariSiswaQ=this.value;renderTabelSiswa()">'
    + '<div id="tabelSiswa"></div></div>';
  setTimeout(renderTabelSiswa, 0);
  return s;
}

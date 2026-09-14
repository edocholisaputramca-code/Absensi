/* =====================================================================
   IZIN & SURAT — dikonfirmasi GURU PIKET, WAJIB ADA SURAT
   ===================================================================== */
let tabIzin = 'Menunggu';
function setTabIzin(t){ tabIzin = t; render(); }
function bisaApprove(){ return state.role === 'piket' || state.role === 'admin'; }
function approveIzin(id){
  if (!bisaApprove()){ toast('Hanya guru piket yang dapat mengonfirmasi izin', 'err'); return; }
  const z = state.izin.filter(x => x.id === id)[0]; if (!z) return;
  if (state.settings.wajibSurat && !z.surat && !z.fisik){
    toast('Tidak bisa disetujui: surat belum dilampirkan', 'err'); return;
  }
  z.status = 'Disetujui';
  if (z.dari <= HARI_INI && z.sampai >= HARI_INI){
    state.today[z.sid] = { st: z.jenis==='Sakit'?'S':z.jenis==='Izin'?'I':'D', jam:'—',
      metode:'Izin disetujui guru piket', note:(z.jenis==='Sakit'?'Surat sakit':'Surat izin') + (z.nomor && z.nomor!=='—' ? ' No. ' + z.nomor : '') };
  }
  logAudit(userAktif(), 'Konfirmasi izin', z.id + ' — ' + namaSiswa(z.sid) + ' (' + z.jenis + ', surat: ' + (z.surat || 'fisik') + ')');
  toast('Izin ' + z.id + ' dikonfirmasi — status kehadiran berubah', 'ok'); render();
}
function rejectIzin(id){
  if (!bisaApprove()){ toast('Hanya guru piket yang dapat menolak izin', 'err'); return; }
  const z = state.izin.filter(x => x.id === id)[0]; if (!z) return;
  z.status = 'Ditolak';
  logAudit(userAktif(), 'Tolak izin', z.id + ' — ' + namaSiswa(z.sid) + ' (' + z.jenis + ')');
  toast('Pengajuan ditolak', 'warn'); render();
}
function formIzin(){
  openModal('<h3>Pengajuan Izin / Sakit</h3>'
    + '<p class="hint">Wajib melampirkan <b>surat</b> (surat sakit dari dokter/puskesmas, atau surat izin dari orang tua). '
    + 'Jika surat diserahkan langsung ke guru piket, centang kotak di bawah.</p>'
    + '<div class="field"><label>Siswa</label><select id="zSiswa">' + SISWA.slice(0,30).map(s =>
        '<option value="' + s.id + '">' + esc(s.nama) + ' — ' + getKelas(s.kelas).nama + ' (' + s.jurusan + ')</option>').join('') + '</select></div>'
    + '<div class="grid g2" style="gap:10px">'
    + '<div class="field"><label>Jenis</label><select id="zJenis" onchange="labelSurat()"><option>Sakit</option><option>Izin</option><option>Dispensasi</option></select></div>'
    + '<div class="field"><label>Tanggal</label><input type="date" id="zTgl" value="' + HARI_INI + '"></div></div>'
    + '<div class="field"><label>Alasan</label><textarea id="zAlasan" placeholder="Contoh: Demam, rawat jalan di Puskesmas"></textarea></div>'
    + '<div class="field"><label id="labSurat">Unggah surat sakit (foto/PDF) — WAJIB</label><input type="file" id="zFile" accept="image/*,.pdf"></div>'
    + '<div class="field"><label>Nomor surat (jika ada)</label><input type="text" id="zNomor" placeholder="mis. SD/09/001"></div>'
    + '<div class="rowset"><div class="tx"><b>Surat fisik sudah diserahkan ke guru piket</b><span>Centang ini bila surat diserahkan langsung (langsung berstatus Disetujui)</span></div>'
    + '<label class="switch"><input type="checkbox" id="zFisik"><span class="sl"></span></label></div>'
    + '<div class="foot"><button class="btn" onclick="closeModal()">Batal</button><button class="btn primary" onclick="kirimIzin()">Kirim Pengajuan</button></div>');
}
function labelSurat(){
  const j = document.getElementById('zJenis').value, l = document.getElementById('labSurat');
  if (l) l.textContent = 'Unggah ' + (j==='Sakit'?'surat sakit (dokter/puskesmas)':j==='Izin'?'surat izin dari orang tua':'surat tugas / undangan') + ' — WAJIB';
}
function kirimIzin(){
  const file = document.getElementById('zFile');
  const fisik = document.getElementById('zFisik').checked;
  const ada = (file && file.files && file.files.length) || (file && file.value);
  if (state.settings.wajibSurat && !ada && !fisik){
    toast('Ditolak: surat wajib dilampirkan atau dicentang "surat fisik diserahkan"', 'err'); return;
  }
  const sid = document.getElementById('zSiswa').value;
  const id = 'IZ' + pad(state.izin.length + 1);
  let nmSurat = '';
  if (file && file.files && file.files.length) nmSurat = file.files[0].name;
  else if (file && file.value) nmSurat = String(file.value).split('\\').pop();
  state.izin.unshift({ id:id, sid:sid, jenis:document.getElementById('zJenis').value,
    dari:document.getElementById('zTgl').value, sampai:document.getElementById('zTgl').value,
    alasan:document.getElementById('zAlasan').value || '-', surat:nmSurat,
    nomor:document.getElementById('zNomor').value || '—', fisik:fisik,
    status: (fisik ? 'Disetujui' : 'Menunggu'), waktu:hhmm(state.clock), pengaju: userAktif() });
  if (fisik && document.getElementById('zTgl').value === HARI_INI){
    const t = state.izin[0];
    state.today[sid] = { st: t.jenis==='Sakit'?'S':t.jenis==='Izin'?'I':'D', jam:'—', metode:'Surat fisik diterima guru piket', note:'Surat diterima langsung' };
  }
  logAudit(userAktif(), 'Ajukan izin', id + ' — ' + namaSiswa(sid) + ' (' + document.getElementById('zJenis').value + ')');
  closeModal(); tabIzin = fisik ? 'Disetujui' : 'Menunggu'; render();
  toast(fisik ? 'Surat dicatat & langsung disetujui' : 'Pengajuan terkirim — menunggu konfirmasi guru piket', 'ok');
}
function pgIzin(){
  const list = state.izin.filter(z => tabIzin === 'Semua' || z.status === tabIzin);
  let s = '<div class="banner warn">📝 <div><b>Alur izin di sekolah ini:</b> siswa/orang tua menyerahkan <b>surat asli</b> '
    + '(surat sakit dari dokter/puskesmas atau surat izin dari orang tua) → <b>guru piket</b> memeriksa surat lalu '
    + '<b>menyetujui/menolak</b> di sini → status kehadiran berubah otomatis dari Alpa menjadi Sakit/Izin. '
    + 'Tanpa surat, pengajuan tidak dapat disetujui.</div></div>';
  s += '<div class="card"><div class="card-head"><h3>📝 Izin & Surat Keterangan</h3><div class="spacer"></div>'
    + '<span class="mini">Penyetuju: <b>Guru Piket</b></span> <button class="btn primary sm" onclick="formIzin()">+ Catat / Ajukan Izin</button></div>'
    + '<div class="chips" style="margin-bottom:12px">'
    + ['Menunggu','Disetujui','Ditolak','Semua'].map(t => {
        const n = t==='Semua' ? state.izin.length : state.izin.filter(z => z.status===t).length;
        return '<button class="chip ' + (tabIzin===t?'on':'') + '" onclick="setTabIzin(\'' + t + '\')">' + t + ' (' + n + ')</button>';
      }).join('') + '</div>';
  s += list.length ? list.map(z => {
    const ss = getSiswa(z.sid);
    return '<div class="card" style="margin-bottom:10px;border-left:4px solid ' + (z.status==='Disetujui'?'#16a34a':z.status==='Ditolak'?'#dc2626':'#f59e0b') + '">'
      + '<div class="rowflex"><span class="ava">' + initial(ss.nama) + '</span>'
      + '<div style="flex:1;min-width:0"><b>' + esc(ss.nama) + '</b> <span class="tag">' + getKelas(ss.kelas).nama + ' · ' + ss.jurusan + '</span>'
      + '<div class="mini">' + z.jenis + ' · ' + dmy(z.dari) + (z.sampai!==z.dari?' s.d. '+dmy(z.sampai):'') + ' · diajukan ' + z.waktu + ' oleh ' + esc(z.pengaju) + '</div></div>'
      + '<span class="badge b-' + (z.status==='Disetujui'?'OK':z.status==='Ditolak'?'NO':'W') + '">' + z.status + '</span></div>'
      + '<div style="margin-top:8px;font-size:13px">“' + esc(z.alasan) + '”</div>'
      + '<div class="rowflex" style="margin-top:8px">'
      + (z.surat ? '<span class="tag on">📎 ' + esc(z.surat) + '</span>' : '<span class="tag">📎 TANPA SURAT</span>')
      + (z.fisik ? '<span class="tag on">✋ Surat fisik diterima</span>' : '')
      + '<span class="tag">Nomor: ' + esc(z.nomor || '—') + '</span></div>'
      + (z.status === 'Menunggu' ? '<div class="rowflex" style="margin-top:10px">'
          + (bisaApprove()
              ? '<button class="btn green sm" onclick="approveIzin(\'' + z.id + '\')">✔ Guru Piket: Setujui</button>'
                + '<button class="btn red sm" onclick="rejectIzin(\'' + z.id + '\')">✖ Tolak</button>'
              : '<span class="mini">Menunggu konfirmasi <b>guru piket</b> — peran Anda hanya dapat melihat.</span>')
          + '</div>' : '')
      + '</div>';
  }).join('') : '<div class="empty">Tidak ada pengajuan pada kategori ini</div>';
  return s + '</div>';
}

/* =====================================================================
   PENGATURAN
   ===================================================================== */
function simpanSeting(){
  const g = id => document.getElementById(id).value;
  state.settings.jamMasuk = g('sMasuk');
  state.settings.toleransi = parseInt(g('sToleransi'),10) || 0;
  state.settings.jamPulang = g('sPulang');
  state.settings.jamRilis = g('sRilis');
  state.settings.batasAbsen = g('sBatas');
  state.settings.wajibSurat = document.getElementById('sWajib').checked;
  logAudit(userAktif(), 'Ubah pengaturan', 'Jam masuk ' + state.settings.jamMasuk + ' · batas terlambat ' + jamBatas()
    + ' · rilis file ' + state.settings.jamRilis + ' · wajib surat: ' + (state.settings.wajibSurat?'ya':'tidak'));
  toast('Pengaturan tersimpan', 'ok'); render();
}
function pgSeting(){
  const t = state.settings;
  let s = '<div class="split">';
  s += '<div class="card"><h3>⏰ Jam & Kebijakan</h3><p class="hint">Batas terlambat dihitung dari jam masuk + toleransi.</p>'
    + '<div class="grid g2" style="gap:10px">'
    + '<div class="field"><label>Jam masuk</label><input type="time" id="sMasuk" value="' + t.jamMasuk + '"></div>'
    + '<div class="field"><label>Toleransi (menit)</label><input type="number" id="sToleransi" value="' + t.toleransi + '"></div>'
    + '<div class="field"><label>Jam pulang</label><input type="time" id="sPulang" value="' + t.jamPulang + '"></div>'
    + '<div class="field"><label>Jam rilis file harian</label><input type="time" id="sRilis" value="' + t.jamRilis + '"></div>'
    + '<div class="field"><label>Batas absen masuk</label><input type="time" id="sBatas" value="' + t.batasAbsen + '"></div>'
    + '</div>'
    + '<div class="kv"><span class="k">Batas terlambat efektif</span><b>' + jamBatas() + '</b></div>'
    + '<div class="rowset"><div class="tx"><b>Izin wajib melampirkan surat</b><span>Tanpa surat sakit/surat izin, pengajuan tidak dapat disetujui</span></div>'
    + '<label class="switch"><input type="checkbox" id="sWajib"' + (t.wajibSurat?' checked':'') + '><span class="sl"></span></label></div>'
    + '<button class="btn primary" style="margin-top:12px" onclick="simpanSeting()">💾 Simpan</button></div>';
  s += '<div class="card"><h3>📄 Penamaan & Isi File Excel</h3>'
    + '<p class="hint">Pola penamaan saat ini:</p>'
    + '<div class="mono">Absensi_Harian_{kelas}_{tanggal}.xlsx&#10;Rekap_Bulanan_{kelas}_{bulan}.xlsx</div>'
    + '<div class="hr"></div>'
    + '<div class="kv"><span class="k">Pemisahan</span><b>1 file per kelas</b></div>'
    + '<div class="kv"><span class="k">Isi rekap harian</span><b>NIS, NISN, nama, jurusan, jam masuk, status, jam pulang, keterangan</b></div>'
    + '<div class="kv"><span class="k">Isi rekap bulanan</span><b>H/T/S/I/D/A, hari efektif, % kehadiran</b></div>'
    + '<div class="kv"><span class="k">Baris penutup</span><b>Ringkasan + kolom tanda tangan</b></div>'
    + '<div class="hr"></div><h3>🔄 Data Demo</h3>'
    + '<button class="btn red sm" onclick="location.reload()">Reset data demo</button></div>';
  s += '</div>';
  return s;
}

/* =====================================================================
   LAPORAN
   ===================================================================== */
function cetakSurat(sid){
  const s = getSiswa(sid), r = rekap([s], HARI)[0], k = getKelas(s.kelas);
  openModal('<h3>📄 Draft Surat Panggilan</h3><p class="hint">Dibuat otomatis bila ambang ketidakhadiran terlampaui.</p>'
    + '<div style="border:1px solid var(--line);border-radius:10px;padding:18px;font-size:13px;line-height:1.7">'
    + '<div style="text-align:center;font-weight:700">' + SEKOLAH.nama + '</div>'
    + '<div style="text-align:center;font-size:11.5px;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:12px">' + SEKOLAH.alamat + '</div>'
    + '<p style="text-align:center"><b>SURAT PANGGILAN ORANG TUA / WALI</b><br>No: 421.2/0' + (SISWA.indexOf(s)+1) + '/' + new Date().getFullYear() + '</p>'
    + '<p>Kepada Yth. orang tua/wali dari <b>' + esc(s.nama) + '</b> · NIS ' + s.nis + ' · Kelas ' + k.nama + ' (' + s.jurusan + ')</p>'
    + '<p>Putra/i Bapak/Ibu tercatat <b>tidak hadir tanpa keterangan ' + r.A + ' hari</b> pada periode ' + dmy(HARI[0])
    + ' s.d. ' + dmy(HARI_INI) + ' (kehadiran ' + r.persen + '%). Mohon hadir pada <b>Senin, 09.00</b> di ruang BK.</p>'
    + '<p style="text-align:right;margin-top:18px">Mojosari, ' + dmyLong(HARI_INI) + '<br>Wali Kelas ' + k.nama + '<br><br><br><b>' + esc(k.wali) + '</b></p></div>'
    + '<div class="foot"><button class="btn" onclick="closeModal()">Tutup</button>'
    + '<button class="btn primary" onclick="closeModal();toast(\'Masuk antrean cetak\',\'ok\')">🖨 Cetak</button></div>');
}
function pgLaporan(){
  const ss = siswaTerfilter(), rows = rekap(ss, HARI);
  const tot = rows.reduce((a,r)=>({H:a.H+r.H,T:a.T+r.T,S:a.S+r.S,I:a.I+r.I,D:a.D+r.D,A:a.A+r.A}),{H:0,T:0,S:0,I:0,D:0,A:0});
  const persen = ss.length ? Math.round((tot.H+tot.T+tot.S+tot.I+tot.D)/(ss.length*HARI.length)*100) : 0;
  let s = filterBar();
  s += '<div class="grid g4" style="margin-bottom:14px">'
    + '<div class="kpi g"><span class="bar"></span><div class="lab">Rata-rata kehadiran</div><div class="val">' + persen + '%</div><div class="note">' + HARI.length + ' hari efektif</div></div>'
    + '<div class="kpi b"><span class="bar"></span><div class="lab">Total hadir</div><div class="val">' + (tot.H+tot.T) + '</div><div class="note">H ' + tot.H + ' · T ' + tot.T + '</div></div>'
    + '<div class="kpi p"><span class="bar"></span><div class="lab">Sakit + Izin</div><div class="val">' + (tot.S+tot.I) + '</div><div class="note">ada surat</div></div>'
    + '<div class="kpi r"><span class="bar"></span><div class="lab">Alpa</div><div class="val">' + tot.A + '</div><div class="note">tanpa keterangan</div></div></div>';
  s += '<div class="card" style="margin-bottom:14px"><div class="card-head"><h3>📈 Rekap per Siswa</h3><div class="spacer"></div>'
    + '<span class="mini">' + ss.length + ' siswa</span></div>'
    + '<div class="tblwrap" style="max-height:420px"><table><thead><tr><th>Siswa</th><th>Kelas</th><th>Jur.</th>'
    + ['H','T','S','I','D','A'].map(c=>'<th class="num">'+c+'</th>').join('')
    + '<th class="num">%</th><th class="num">Tindakan</th></tr></thead><tbody>'
    + rows.map(r => '<tr><td><div class="rowflex"><span class="ava">' + initial(r.siswa.nama) + '</span><div>' + esc(r.siswa.nama)
      + '<div class="mini">' + r.siswa.nis + '</div></div></div></td><td>' + getKelas(r.siswa.kelas).nama + '</td><td>' + r.siswa.jurusan + '</td>'
      + ['H','T','S','I','D','A'].map(c=>'<td class="num">'+r[c]+'</td>').join('')
      + '<td class="num"><b style="color:' + (r.persen>=90?'#16a34a':r.persen>=85?'#f59e0b':'#dc2626') + '">' + r.persen + '%</b></td>'
      + '<td class="num">' + (r.persen<85 ? '<button class="btn red sm" onclick="cetakSurat(\'' + r.siswa.id + '\')">Surat</button>' : '') + '</td></tr>').join('')
    + '</tbody></table></div></div>';
  s += '<div class="card"><h3>Ringkasan per Kelas & Jurusan</h3><p class="hint">Periode ' + dmy(HARI[0]) + ' s.d. ' + dmy(HARI_INI) + '</p>'
    + '<div class="tblwrap"><table><thead><tr><th>Kelas</th><th>Jurusan</th><th class="num">Siswa</th>'
    + ['H','T','S','I','A'].map(c=>'<th class="num">'+c+'</th>').join('') + '<th class="num">%</th></tr></thead><tbody>'
    + kelasTerfilter().map(k => {
        const rs = rows.filter(r => r.siswa.kelas === k.id);
        const t = rs.reduce((a,r)=>({H:a.H+r.H,T:a.T+r.T,S:a.S+r.S,I:a.I+r.I,A:a.A+r.A}),{H:0,T:0,S:0,I:0,A:0});
        const p = rs.length ? Math.round((t.H+t.T+t.S+t.I)/(rs.length*HARI.length)*100) : 0;
        return '<tr><td><b>' + k.nama + '</b></td><td>' + k.jurusan + ' <span class="mini">' + esc(getJurusan(k.jurusan).nama) + '</span></td>'
          + '<td class="num">' + rs.length + '</td>' + ['H','T','S','I','A'].map(c=>'<td class="num">'+t[c]+'</td>').join('')
          + '<td class="num"><b style="color:' + (p>=90?'#16a34a':p>=85?'#f59e0b':'#dc2626') + '">' + p + '%</b></td></tr>';
      }).join('') + '</tbody></table></div></div>';
  return s;
}

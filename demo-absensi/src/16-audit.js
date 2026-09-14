/* =====================================================================
   AUDIT
   ===================================================================== */
function pgAudit(){
  return '<div class="banner">🔍 <div>Setiap tindakan tercatat <b>permanen (append-only)</b> — siapa, kapan, dan detailnya. '
    + 'Ini pengganti tanda tangan basah bila suatu saat data disengketakan.</div></div>'
    + '<div class="card"><div class="card-head"><h3>Jejak Audit</h3><div class="spacer"></div><span class="mini">' + state.audit.length + ' entri</span></div>'
    + '<div class="tblwrap"><table><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>'
    + state.audit.map(a => '<tr><td>' + a.waktu + '</td><td>' + esc(a.user) + '</td><td>' + badge('X', a.aksi) + '</td><td>' + esc(a.detail) + '</td></tr>').join('')
    + '</tbody></table></div></div>';
}

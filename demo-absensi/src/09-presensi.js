/* =====================================================================
   PRESENSI PER JAM PELAJARAN
   ===================================================================== */
function jamKey(){ return state.settings.kelasPresensi + '|' + state.settings.jamKe; }
function initPerJam(){
  const k = jamKey();
  if (state.perJam[k]) return state.perJam[k];
  const o = {};
  siswaKelas(state.settings.kelasPresensi).forEach(s => {
    const r = rnd();
    o[s.id] = r<0.82?'H':r<0.87?'T':r<0.90?'S':r<0.94?'I':r<0.97?'A':'B';
  });
  state.perJam[k] = o; return o;
}
function setStatusJam(id, st){ initPerJam()[id] = st; render(); }
function tandaiSemua(st){ const o = initPerJam(); Object.keys(o).forEach(k => o[k] = st); render(); }
function simpanPresensi(){
  const o = initPerJam();
  const mapel = MAPEL[(state.settings.jamKe-1) % MAPEL.length];
  logAudit(userAktif(), 'Simpan presensi jam ke-' + state.settings.jamKe,
    getKelas(state.settings.kelasPresensi).nama + ' · ' + mapel + ' · ' + Object.keys(o).length + ' siswa');
  toast('Presensi tersimpan', 'ok'); render();
}
function pgPresensi(){
  const ss = siswaKelas(state.settings.kelasPresensi), o = initPerJam();
  ss.forEach(s => { if (!o[s.id]) o[s.id] = 'H'; });
  const ring = {H:0,T:0,S:0,I:0,D:0,A:0,B:0};
  Object.keys(o).forEach(k => ring[o[k]]++);
  let s = '<div class="card" style="margin-bottom:14px"><div class="grid g3">'
    + '<div class="field" style="margin:0"><label>Kelas</label><select onchange="state.settings.kelasPresensi=this.value;render()">'
    + KELAS.map(k => '<option value="' + k.id + '"' + (k.id===state.settings.kelasPresensi?' selected':'') + '>' + k.nama + ' — ' + k.jurusan + '</option>').join('') + '</select></div>'
    + '<div class="field" style="margin:0"><label>Jam ke-</label><select onchange="state.settings.jamKe=parseInt(this.value);render()">'
    + [1,2,3,4,5,6,7,8].map(j => '<option value="' + j + '"' + (j===state.settings.jamKe?' selected':'') + '>Jam ke-' + j + ' — ' + MAPEL[(j-1)%MAPEL.length] + '</option>').join('') + '</select></div>'
    + '<div class="field" style="margin:0"><label>Tindakan cepat</label><div class="rowflex">'
    + '<button class="btn sm" onclick="tandaiSemua(\'H\')">Semua Hadir</button><button class="btn sm" onclick="tandaiSemua(\'A\')">Semua Alpa</button></div></div></div></div>';
  s += '<div class="stat-strip" style="margin-bottom:14px">'
    + ['H','T','S','I','D','A','B'].map(c => '<div><b style="color:' + (c==='H'?'#16a34a':c==='T'?'#f59e0b':c==='A'||c==='B'?'#dc2626':c==='D'?'#0d9488':'#2563eb') + '">' + ring[c] + '</b><span>' + STATUS[c] + '</span></div>').join('') + '</div>';
  s += '<div class="card"><div class="card-head"><h3>' + getKelas(state.settings.kelasPresensi).nama + ' · Jam ke-' + state.settings.jamKe + ' · ' + MAPEL[(state.settings.jamKe-1)%MAPEL.length] + '</h3>'
    + '<div class="spacer"></div><button class="btn primary sm" onclick="simpanPresensi()">💾 Simpan</button></div>'
    + '<div class="pgrid">' + ss.map(st => '<div class="pcard"><div class="nm"><span class="ava">' + initial(st.nama) + '</span>'
      + '<div style="min-width:0"><div style="font-size:13px">' + esc(st.nama) + '</div><div class="mini">' + st.nis + '</div></div></div>'
      + '<div class="btns">' + ['H','T','S','I','D','A','B'].map(c => '<button data-s="' + c + '" class="' + (o[st.id]===c?'on':'')
      + '" onclick="setStatusJam(\'' + st.id + '\',\'' + c + '\')">' + c + '</button>').join('') + '</div></div>').join('') + '</div>'
    + '<p class="hint" style="margin-top:12px">H = Hadir · T = Terlambat · S = Sakit · I = Izin · D = Dispensasi · A = Alpa · B = Bolos (tidak hadir di jam ini)</p></div>';
  return s;
}

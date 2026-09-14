/* =====================================================================
   DEMO ABSENSI DIGITAL — SMKN 1 MOJOSARI
   Data simulasi. Semua berjalan di dalam browser, tanpa server.
   ===================================================================== */
/* ---------------- util dasar ---------------- */
let _seed = 20260914;
function rnd(){ _seed = (_seed * 1664525 + 1013904223) % 4294967296; return _seed / 4294967296; }
function ri(a,b){ return a + Math.floor(rnd()*(b-a+1)); }
function pad(n){ return (n<10?'0':'') + n; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function hhmm(d){ return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function iso(d){ return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function dmy(s){ const p = s.split('-'); return parseInt(p[2],10) + ' ' + BULAN[parseInt(p[1],10)-1].slice(0,3) + ' ' + p[0]; }
function dmyLong(s){ const p = s.split('-'); return parseInt(p[2],10) + ' ' + BULAN[parseInt(p[1],10)-1] + ' ' + p[0]; }
function initial(nm){ return nm.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
const STATUS = { H:'Hadir', T:'Terlambat', S:'Sakit', I:'Izin', D:'Dispensasi', A:'Alpa', B:'Bolos' };
function badge(code, label){ return '<span class="badge b-' + (code||'X') + '">' + esc(label || STATUS[code] || '—') + '</span>'; }
function toast(msg, kind){
  const el = document.createElement('div');
  el.className = 'toast ' + (kind||''); el.textContent = msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='.3s'; setTimeout(()=>el.remove(),300); }, 2800);
}
function openModal(html){ document.getElementById('dialog').innerHTML = html; document.getElementById('modal').classList.add('on'); }
function closeModal(){ document.getElementById('modal').classList.remove('on'); }

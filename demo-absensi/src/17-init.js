/* ---------------- init ---------------- */
(function init(){
  document.getElementById('roleSel').innerHTML = Object.keys(ROLES).map(k => '<option value="' + k + '">' + ROLES[k].nama + '</option>').join('');
  clockTick(); render();
})();

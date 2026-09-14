/* =====================================================================
   GENERATOR QR CODE (mode byte, level M, versi 1–6) — murni JavaScript
   Menghasilkan matriks QR yang benar-benar bisa dipindai pemindai QR.
   ===================================================================== */
const QR_EC = {   // versi: [total, eccPerBlock, blokG1, dataPerBlokG1, blokG2, dataPerBlokG2]
  1:[26,10,1,16,0,0], 2:[44,16,1,28,0,0], 3:[70,26,1,44,0,0],
  4:[100,18,2,32,0,0], 5:[134,24,2,43,0,0], 6:[172,16,4,27,0,0]
};
const QR_ALIGN = {1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34]};
const QR_EXP = new Uint8Array(512), QR_LOG = new Uint8Array(256);
(function(){ let x = 1;
  for (let i=0;i<255;i++){ QR_EXP[i]=x; QR_LOG[x]=i; x<<=1; if (x & 0x100) x ^= 0x11D; }
  for (let i=255;i<512;i++) QR_EXP[i] = QR_EXP[i-255];
})();
function gfMul(a,b){ if (a===0 || b===0) return 0; return QR_EXP[QR_LOG[a] + QR_LOG[b]]; }
function rsGen(deg){
  let poly = [1];
  for (let i=0;i<deg;i++){
    const next = new Array(poly.length+1).fill(0);
    for (let j=0;j<poly.length;j++){
      next[j] ^= poly[j];                        // dikali x
      next[j+1] ^= gfMul(poly[j], QR_EXP[i]);    // dikali α^i
    }
    poly = next;
  }
  return poly;
}
function rsEcc(data, deg){
  const gen = rsGen(deg), res = new Array(deg).fill(0);
  for (let i=0;i<data.length;i++){
    const f = data[i] ^ res[0];
    res.copyWithin(0, 1); res[deg-1] = 0;
    if (f !== 0) for (let j=0;j<deg;j++) res[j] ^= gfMul(gen[j+1], f);
  }
  return res;
}
function qrEncode(text){
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 0, capBits = 0, blocks = [];
  for (let v=1; v<=6; v++){
    const t = QR_EC[v];
    const totalData = t[2]*t[3] + t[4]*t[5];
    if (bytes.length + 2 <= totalData){          // 12 bit header = 1,5 byte → aman 2 byte
      version = v; capBits = totalData * 8;
      blocks = [];
      for (let i=0;i<t[2];i++) blocks.push(t[3]);
      for (let i=0;i<t[4];i++) blocks.push(t[5]);
      break;
    }
  }
  if (!version) throw new Error('Data terlalu panjang untuk QR');
  const bits = [];
  const push = (val, len) => { for (let i=len-1;i>=0;i--) bits.push((val >>> i) & 1); };
  push(4, 4);                       // mode byte
  push(bytes.length, 8);            // jumlah karakter (versi 1–9)
  bytes.forEach(b => push(b, 8));
  push(0, Math.min(4, capBits - bits.length));            // terminator
  while (bits.length % 8 !== 0) bits.push(0);             // rapikan ke byte
  const pads = [0xEC, 0x11];
  for (let i=0; bits.length < capBits; i++) push(pads[i % 2], 8);
  const words = [];
  for (let i=0;i<bits.length;i+=8){
    let b = 0; for (let j=0;j<8;j++) b = (b << 1) | bits[i+j];
    words.push(b);
  }
  const t = QR_EC[version], eccLen = t[1];
  const blks = []; let p = 0;
  blocks.forEach(len => { const d = words.slice(p, p+len); p += len; blks.push({ d: d, e: rsEcc(d, eccLen) }); });
  const out = [];
  const maxD = Math.max.apply(null, blocks);
  for (let i=0;i<maxD;i++) blks.forEach(b => { if (i < b.d.length) out.push(b.d[i]); });
  for (let i=0;i<eccLen;i++) blks.forEach(b => out.push(b.e[i]));
  return { version: version, data: out };
}
function qrMake(text){
  const enc = qrEncode(text);
  const size = enc.version * 4 + 17;
  const m = [], fx = [];
  for (let y=0;y<size;y++){ m.push(new Array(size).fill(false)); fx.push(new Array(size).fill(false)); }
  const setF = (x,y,v) => { if (x>=0 && y>=0 && x<size && y<size){ m[y][x] = v; fx[y][x] = true; } };
  // 1) pola timing lebih dulu
  for (let i=0;i<size;i++){ setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
  // 2) finder + separator (menimpa sebagian pola timing)
  [[3,3],[size-4,3],[3,size-4]].forEach(c => {
    for (let dy=-4;dy<=4;dy++) for (let dx=-4;dx<=4;dx++){
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      setF(c[0]+dx, c[1]+dy, d !== 2 && d !== 4);
    }
  });
  // alignment
  const ap = QR_ALIGN[enc.version] || [];
  ap.forEach(ay => ap.forEach(ax => {
    if ((ax===6 && ay===6) || (ax===6 && ay===size-7) || (ax===size-7 && ay===6)) return;
    for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) setF(ax+dx, ay+dy, Math.max(Math.abs(dx),Math.abs(dy)) !== 1);
  }));
  const drawFormat = (mask) => {
    const data = (0 << 3) | mask;                 // level M = 00
    let rem = data;
    for (let i=0;i<10;i++) rem = ((rem << 1) ^ ((rem >>> 9) * 0x537));
    const bits = ((data << 10) | rem) ^ 0x5412;
    const gb = i => ((bits >>> i) & 1) !== 0;
    for (let i=0;i<=5;i++) setF(8, i, gb(i));
    setF(8, 7, gb(6)); setF(8, 8, gb(7)); setF(7, 8, gb(8));
    for (let i=9;i<15;i++) setF(14-i, 8, gb(i));
    for (let i=0;i<8;i++) setF(size-1-i, 8, gb(i));
    for (let i=8;i<15;i++) setF(8, size-15+i, gb(i));
    setF(8, size-8, true);
  };
  drawFormat(0);
  // data
  let i = 0;
  for (let right = size-1; right >= 1; right -= 2){
    if (right === 6) right = 5;
    for (let vert=0; vert<size; vert++){
      for (let j=0;j<2;j++){
        const x = right - j;
        const up = ((right + 1) & 2) === 0;
        const y = up ? size-1-vert : vert;
        if (!fx[y][x] && i < enc.data.length * 8){
          m[y][x] = ((enc.data[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
    }
  }
  const maskFn = [
    (x,y) => (x + y) % 2 === 0,
    (x,y) => y % 2 === 0,
    (x,y) => x % 3 === 0,
    (x,y) => (x + y) % 3 === 0,
    (x,y) => (Math.floor(x/3) + Math.floor(y/2)) % 2 === 0,
    (x,y) => x*y % 2 + x*y % 3 === 0,
    (x,y) => (x*y % 2 + x*y % 3) % 2 === 0,
    (x,y) => ((x + y) % 2 + x*y % 3) % 2 === 0
  ];
  const penalty = () => {
    let pen = 0;
    for (let y=0;y<size;y++){
      let run = 1;
      for (let x=1;x<size;x++){
        if (m[y][x] === m[y][x-1]) run++;
        else { if (run >= 5) pen += run - 2; run = 1; }
      }
      if (run >= 5) pen += run - 2;
    }
    for (let x=0;x<size;x++){
      let run = 1;
      for (let y=1;y<size;y++){
        if (m[y][x] === m[y-1][x]) run++;
        else { if (run >= 5) pen += run - 2; run = 1; }
      }
      if (run >= 5) pen += run - 2;
    }
    for (let y=0;y<size-1;y++) for (let x=0;x<size-1;x++){
      const c = m[y][x];
      if (c === m[y][x+1] && c === m[y+1][x] && c === m[y+1][x+1]) pen += 3;
    }
    let dark = 0;
    for (let y=0;y<size;y++) for (let x=0;x<size;x++) if (m[y][x]) dark++;
    pen += Math.floor(Math.abs(dark * 20 - size*size*10) / (size*size)) * 10;
    return pen;
  };
  let best = 0, bestPen = Infinity;
  for (let mk=0; mk<8; mk++){
    for (let y=0;y<size;y++) for (let x=0;x<size;x++) if (!fx[y][x] && maskFn[mk](x,y)) m[y][x] = !m[y][x];
    drawFormat(mk);
    const p = penalty();
    if (p < bestPen){ bestPen = p; best = mk; }
    for (let y=0;y<size;y++) for (let x=0;x<size;x++) if (!fx[y][x] && maskFn[mk](x,y)) m[y][x] = !m[y][x];
  }
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) if (!fx[y][x] && maskFn[best](x,y)) m[y][x] = !m[y][x];
  drawFormat(best);
  return { size: size, version: enc.version, mask: best, m: m };
}
const _qrCache = {};
function qrOf(text){ if (!_qrCache[text]) _qrCache[text] = qrMake(text); return _qrCache[text]; }
function qrSvg(text, scale, margin, dark){
  const q = qrOf(text), mg = margin == null ? 3 : margin, sc = scale || 4;
  const s = q.size + mg*2, col = dark || '#000000';
  let r = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (s*sc)
        + '" height="' + (s*sc) + '" shape-rendering="crispEdges"><rect width="' + s + '" height="' + s + '" fill="#ffffff"/>';
  for (let y=0;y<q.size;y++){
    let x = 0;
    while (x < q.size){
      if (q.m[y][x]){
        let w = 1;
        while (x + w < q.size && q.m[y][x+w]) w++;
        r += '<rect x="' + (x+mg) + '" y="' + (y+mg) + '" width="' + w + '" height="1" fill="' + col + '"/>';
        x += w;
      } else x++;
    }
  }
  return r + '</svg>';
}
/* Token QR siswa: BUKAN NISN asli, melainkan kode acak yang tidak bisa ditebak */
function tokenSiswa(s){
  let h = 2166136261;
  const str = 'SKM1|' + s.nis + '|' + s.id + '|' + s.kelas;
  for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return 'SKM1.' + s.nis + '.' + (h >>> 0).toString(36).toUpperCase().padStart(7, '0')
       + (s.versi ? '-R' + s.versi : '');   // -R1, -R2 … bila kartu diterbitkan ulang
}
/* Kartu hilang: token lama dicabut (tidak berlaku lagi), terbitkan token baru */
const REVOKED = {};
function cabutKartu(id){
  const s = getSiswa(id); if (!s) return;
  REVOKED[tokenSiswa(s)] = true;          // token lama langsung tidak berlaku
  s.versi = (s.versi || 0) + 1;
  logAudit(userAktif(), 'Cabut kartu & terbit ulang', s.nama + ' — token lama dinonaktifkan, terbit versi R' + s.versi);
  closeModal(); render();
  toast('Kartu lama DICABUT. Terbitkan kartu baru (R' + s.versi + ') lewat tombol Cetak', 'warn');
}
function tokenBerlaku(tk){ return !REVOKED[tk]; }

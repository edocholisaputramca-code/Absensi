/* =====================================================================
   PEMBUAT FILE EXCEL (.xlsx) — murni JavaScript, tanpa pustaka eksternal
   ===================================================================== */
const CRC_T = (function(){
  const t = new Uint32Array(256);
  for (let n=0;n<256;n++){ let c=n; for (let k=0;k<8;k++) c = (c & 1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1); t[n]=c>>>0; }
  return t;
})();
function crc32(bytes){
  let c = 0xFFFFFFFF;
  for (let i=0;i<bytes.length;i++) c = CRC_T[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function colLetter(n){ let s=''; while(n>0){ const m=(n-1)%26; s = String.fromCharCode(65+m) + s; n = Math.floor((n-1)/26); } return s; }
function xmlEsc(v){
  return String(v==null?'':v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
}
/* rows: array baris; tiap baris array sel. {v:…, b:1} = tebal. Angka dikirim sebagai angka. */
function sheetXml(rows){
  let widths = [];
  rows.forEach(r => r.forEach((c,i) => {
    const len = String((c && c.v != null) ? c.v : c).length + 2;
    if (!widths[i] || len > widths[i]) widths[i] = Math.min(len, 42);
  }));
  let x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
  if (widths.length){
    x += '<cols>';
    widths.forEach((w,i) => { x += '<col min="' + (i+1) + '" max="' + (i+1) + '" width="' + (w||10) + '" customWidth="1"/>'; });
    x += '</cols>';
  }
  x += '<sheetData>';
  rows.forEach((r, ri) => {
    x += '<row r="' + (ri+1) + '">';
    r.forEach((c, ci) => {
      const val = (c && c.v != null) ? c.v : c;
      const bold = (c && c.b) ? ' s="1"' : '';
      const ref = colLetter(ci+1) + (ri+1);
      if (val === '' || val == null) { x += '<c r="' + ref + '"' + bold + '/>'; }
      else if (typeof val === 'number' && isFinite(val)) { x += '<c r="' + ref + '"' + bold + '><v>' + val + '</v></c>'; }
      else { x += '<c r="' + ref + '" t="inlineStr"' + bold + '><is><t xml:space="preserve">' + xmlEsc(val) + '</t></is></c>'; }
    });
    x += '</row>';
  });
  return x + '</sheetData></worksheet>';
}
function zipStore(files){
  const parts = [], central = []; let offset = 0;
  files.forEach(f => {
    const nm = new TextEncoder().encode(f.name);
    const data = f.data;
    const crc = crc32(data);
    const lh = new Uint8Array(30 + nm.length); const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true); lv.setUint16(10, 0, true); lv.setUint16(12, 0x21, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
    lv.setUint16(26, nm.length, true); lv.setUint16(28, 0, true);
    lh.set(nm, 30);
    parts.push(lh, data);
    const ch = new Uint8Array(46 + nm.length); const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true); cv.setUint16(12, 0, true); cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
    cv.setUint16(28, nm.length, true); cv.setUint16(30, 0, true); cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true); cv.setUint16(36, 0, true); cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true); ch.set(nm, 46);
    central.push(ch);
    offset += lh.length + data.length;
  });
  const cdSize = central.reduce((a,c)=>a+c.length, 0);
  const eocd = new Uint8Array(22); const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(4, 0, true); ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true); ev.setUint16(20, 0, true);
  const all = parts.concat(central, [eocd]);
  const total = all.reduce((a,c)=>a+c.length, 0);
  const out = new Uint8Array(total); let p = 0;
  all.forEach(c => { out.set(c, p); p += c.length; });
  return out;
}
const STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
  + '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>'
  + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
  + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
  + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
/* sheets: [{nama, rows}] → Uint8Array siap diunduh */
function buildXlsxBytes(sheets){
  const enc = new TextEncoder();
  const parts = [];
  parts.push({ name:'[Content_Types].xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + sheets.map((s,i)=>'<Override PartName="/xl/worksheets/sheet' + (i+1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')
    + '</Types>') });
  parts.push({ name:'_rels/.rels', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    + '</Relationships>') });
  parts.push({ name:'xl/workbook.xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
    + sheets.map((s,i)=>'<sheet name="' + xmlEsc(s.nama) + '" sheetId="' + (i+1) + '" r:id="rId' + (i+1) + '"/>').join('')
    + '</sheets></workbook>') });
  parts.push({ name:'xl/_rels/workbook.xml.rels', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + sheets.map((s,i)=>'<Relationship Id="rId' + (i+1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i+1) + '.xml"/>').join('')
    + '<Relationship Id="rId' + (sheets.length+1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + '</Relationships>') });
  parts.push({ name:'xl/styles.xml', data: enc.encode(STYLES_XML) });
  sheets.forEach((s,i) => { parts.push({ name:'xl/worksheets/sheet' + (i+1) + '.xml', data: enc.encode(sheetXml(s.rows)) }); });
  return zipStore(parts);
}

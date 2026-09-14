#!/usr/bin/env node
/* =====================================================================
   build.js — penyusun (bundler) sederhana untuk demo absensi
   ---------------------------------------------------------------------
   Menggabungkan berkas-berkas di folder src/ menjadi:
     • index.html  → SATU berkas utuh (CSS + JS ditanam di dalam)
                     siap dibagikan / dibuka langsung / dikirim via WA
     • dev.html    → memuat berkas src/ satu per satu (untuk mengedit,
                     perubahan langsung terlihat cukup dengan refresh)

   Cara pakai:   node build.js      (atau:  bash build.sh)
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SRC = path.join(DIR, 'src');
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

const head = read('_head.html').trim();
const body = read('_body.html').trim();
const css  = read('00-style.css').trim();

/* urutan berkas JS ditentukan oleh nomor di depan nama berkas */
const jsFiles = fs.readdirSync(SRC)
  .filter(f => /^\d\d-.*\.js$/.test(f))
  .sort();

const jsInline = jsFiles
  .map(f => '/* ================= berkas: src/' + f + ' ================= */\n' + read(f).trim())
  .join('\n\n');

/* ---------- 1. index.html : satu berkas, self-contained ---------- */
const standalone = [
  head,
  '<style>',
  css,
  '</style>',
  '</head>',
  '<body>',
  body,
  '<script>',
  jsInline,
  '</' + 'script>',
  '</body>',
  '</html>', ''
].join('\n');
fs.writeFileSync(path.join(DIR, 'index.html'), standalone);

/* ---------- 2. dev.html : berkas terpisah (untuk mengedit) ---------- */
const linked = [
  head,
  '<link rel="stylesheet" href="src/00-style.css">',
  '</head>',
  '<body>',
  body,
  jsFiles.map(f => '<script src="src/' + f + '"></' + 'script>').join('\n'),
  '</body>',
  '</html>', ''
].join('\n');
fs.writeFileSync(path.join(DIR, 'dev.html'), linked);

const size = fs.statSync(path.join(DIR, 'index.html')).size;
console.log('✅ build selesai');
console.log('   berkas JS digabung : ' + jsFiles.length);
console.log('   → index.html       : ' + (size/1024).toFixed(0) + ' KB (berkas tunggal)');
console.log('   → dev.html         : versi pengembangan (memuat src/)');

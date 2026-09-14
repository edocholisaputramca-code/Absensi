/* =====================================================================
   DATA MASTER — struktur SMK (jurusan + kelas)
   ===================================================================== */
const SEKOLAH = { nama:'SMKN 1 MOJOSARI', npsn:'20512345', alamat:'Jl. Raya Mojosari, Kab. Mojokerto', tahun:'2026/2027' };
const JURUSAN = [
  {id:'TKJ',  nama:'Teknik Komputer & Jaringan'},
  {id:'MM',   nama:'Multimedia'},
  {id:'AKL',  nama:'Akuntansi & Keuangan Lembaga'},
  {id:'OTKP', nama:'Otomatisasi & Tata Kelola Perkantoran'},
  {id:'TKR',  nama:'Teknik Kendaraan Ringan'}
];
const KELAS = [
  {id:'X-TKJ1',  nama:'X TKJ 1',   jurusan:'TKJ',  wali:'Sri Wahyuni, S.Pd'},
  {id:'X-TKJ2',  nama:'X TKJ 2',   jurusan:'TKJ',  wali:'Agus Salim, S.Kom'},
  {id:'XI-TKJ1', nama:'XI TKJ 1',  jurusan:'TKJ',  wali:'Ratna Dewi, S.Kom'},
  {id:'X-MM1',   nama:'X MM 1',    jurusan:'MM',   wali:'Bambang S., S.Sn'},
  {id:'XI-MM1',  nama:'XI MM 1',   jurusan:'MM',   wali:'Nur Hidayah, S.Sn'},
  {id:'X-AKL1',  nama:'X AKL 1',   jurusan:'AKL',  wali:'Endang S., S.Pd'},
  {id:'XI-AKL1', nama:'XI AKL 1',  jurusan:'AKL',  wali:'Yulianto, S.Pd'},
  {id:'X-OTKP1', nama:'X OTKP 1',  jurusan:'OTKP', wali:'Dewi Sartika, S.Pd'},
  {id:'XI-TKR1', nama:'XI TKR 1',  jurusan:'TKR',  wali:'Slamet Riyadi, S.Pd'},
  {id:'XII-TKR1',nama:'XII TKR 1', jurusan:'TKR',  wali:'Joko Susilo, S.Pd'}
];
const DEPAN = ['Ahmad','Andi','Anisa','Bagas','Bunga','Citra','Dewi','Dimas','Eka','Fajar','Fitri','Galih','Hana','Hendra','Indah','Ilham','Joko','Kartika','Laila','Lukman','Maya','Muhammad','Nadia','Nanda','Nurul','Putri','Rafi','Rani','Rendra','Rizky','Salsa','Sandi','Sinta','Taufik','Tiara','Umar','Vina','Wildan','Yoga','Yuni','Zahra','Zaki','Adinda','Bayu','Gita','Rina','Surya','Wulan','Rahmat','Sukma','Teguh','Utami','Wahyu','Yusuf','Amanda','Bimo','Dinda','Farhan','Hafiz','Intan','Kevin','Laras','Marvin','Nabila','Oscar','Pandu','Qori','Restu','Salma','Tania','Vino','Winda','Yolanda'];
const BELAKANG = ['Fauzi','Saputra','Ramadhani','Pratama','Lestari','Handayani','Wijaya','Kusuma','Nugroho','Anggraini','Setiawan','Permata','Hidayat','Sari','Maulana','Putra','Ayu','Firmansyah','Septiani','Hakim','Ananda','Wibowo','Rahmawati','Kurniawan','Utami','Santoso','Aprilia','Nugraha','Halimah','Susanto','Yuliana','Prasetyo','Damayanti','Aditya','Nabila','Firdaus','Amelia','Siregar','Oktaviani','Mahendra','Khairunnisa','Alfiansyah','Puspita','Rahmat','Maharani','Gunawan','Cahyani','Febriansyah','Wahyudi','Zulkifli','Ardiyansyah','Prayoga','Kusumawardani','Hartono','Maryati','Sanusi','Effendi','Mardiansyah'];
const MAPEL = ['Matematika','B. Indonesia','B. Inggris','Produktif TKJ','Produktif MM','PJOK','Seni Budaya','PPKn','Informatika','PKK'];

const SISWA = [];
(function(){
  let n = 0;
  KELAS.forEach(k => {
    for (let i=0;i<8;i++){
      SISWA.push({
        id:'S' + pad(n+1),
        nis:'2026' + pad(n+1),
        nisn:'00' + (3123456700 + n*7),
        nama: DEPAN[n % DEPAN.length] + ' ' + BELAKANG[(n*7) % BELAKANG.length],
        kelas:k.id, jurusan:k.jurusan,
        ortu:'Ibu/Bpk ' + BELAKANG[(n*11) % BELAKANG.length],
        wa:'0812' + (10000000 + n*137),
        aktif:true
      });
      n++;
    }
  });
})();
const RISK_IDS = ['S03','S18','S35','S52','S67'];

/* 14 hari sekolah terakhir */
const HARI = (function(){
  const out = [], d = new Date();
  if (d.getDay() === 0 || d.getDay() === 6){ while (d.getDay() !== 5) d.setDate(d.getDate()-1); }
  out.unshift(iso(d));
  while (out.length < 14){ d.setDate(d.getDate()-1); if (d.getDay()!==0 && d.getDay()!==6) out.unshift(iso(d)); }
  return out;
})();
const HARI_INI = HARI[HARI.length-1];
const BULAN_LABEL = BULAN[new Date().getMonth()] + ' ' + new Date().getFullYear();

/* riwayat kehadiran hari sebelumnya */
const HIST = {};
HARI.forEach(t => SISWA.forEach(s => {
  const risk = RISK_IDS.indexOf(s.id) >= 0;
  const r = rnd();
  let st, jam = '06:' + pad(ri(15,44));
  if (r < (risk?0.52:0.84)) st = 'H';                     // hadir sebelum 06:45
  else if (r < (risk?0.74:0.93)) { st='T'; jam='06:'+pad(ri(46,59)); }
  else if (r < (risk?0.84:0.955)) { st='S'; jam='—'; }
  else if (r < (risk?0.91:0.978)) { st='I'; jam='—'; }
  else { st='A'; jam='—'; }
  HIST[s.id+'|'+t] = { st: st, jam: jam, pulang: (st==='H'||st==='T') ? '15:' + pad(ri(0,10)) : '—' };
}));

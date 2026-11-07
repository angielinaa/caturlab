// Materi edukasi ditulis sendiri. Tambahkan pelajaran baru cukup dengan menambah objek di sini.
export const LESSONS = [
  {
    id: 'pembukaan-dasar',
    title: 'Prinsip dasar pembukaan',
    level: 'Pemula',
    summary: 'Tiga hal yang harus kamu lakukan di 10 langkah pertama.',
    sections: [
      { h: 'Tiga prinsip', p: [
        'Kuasai tengah papan (e4, d4, e5, d5) dengan pion atau bidak.',
        'Kembangkan kuda dan gajah sebelum menggerakkan bidak yang sama dua kali.',
        'Rokade lebih awal supaya rajamu aman dan bentengmu aktif.',
      ] },
      { h: 'Kesalahan yang sering terjadi', p: [
        'Mengeluarkan ratu terlalu cepat sehingga mudah diusir dan kamu kehilangan tempo.',
        'Banyak menggerakkan pion pinggir tanpa tujuan.',
        'Lupa rokade sampai raja diserang di tengah.',
      ] },
    ],
    checklist: ['Apakah tengah papan sudah kupegang?', 'Berapa bidak yang belum keluar?', 'Kapan aku rokade?'],
  },
  {
    id: 'cct',
    title: 'Kebiasaan CCT: Check, Capture, Threat',
    level: 'Pemula',
    summary: 'Cara paling cepat mengurangi blunder.',
    sections: [
      { h: 'Sebelum setiap langkah', p: [
        'Check: adakah skak yang bisa dilakukan lawan setelah langkahku?',
        'Capture: adakah bidakku yang bisa dimakan, terutama yang tidak terlindungi?',
        'Threat: apa ancaman lawan berikutnya? Lakukan juga hal yang sama untuk dirimu sendiri.',
      ] },
      { h: 'Cara melatihnya', p: [
        'Lakukan CCT selama 10 detik di setiap langkah, bahkan di game santai.',
        'Setelah game, buka Review dan lihat blunder mana yang bisa dicegah dengan CCT.',
      ] },
    ],
    checklist: ['Cek skak lawan', 'Cek bidak menggantung', 'Cek ancaman lawan'],
  },
  {
    id: 'taktik-fork-pin',
    title: 'Taktik: fork, pin, dan skewer',
    level: 'Menengah',
    summary: 'Tiga pola taktik yang paling sering memenangkan material.',
    fen: '2q3k1/8/8/3N4/8/8/8/6K1 w - - 0 1',
    arrow: ['d5', 'e7'],
    caption: 'Contoh fork: Ne7+ menyerang raja dan ratu sekaligus.',
    sections: [
      { h: 'Fork (garpu)', p: ['Satu bidak menyerang dua target sekaligus. Kuda paling sering melakukannya.'] },
      { h: 'Pin (tusuk)', p: ['Bidak lawan tidak boleh bergerak karena di belakangnya ada bidak yang lebih berharga (misalnya raja).'] },
      { h: 'Skewer (sate)', p: ['Kebalikan pin: bidak berharga diserang lebih dulu dan harus pindah, lalu bidak di belakangnya dimakan.'] },
    ],
    checklist: ['Cari bidak lawan yang sejajar', 'Cari skak yang memaksa', 'Hitung balasan lawan'],
  },
  {
    id: 'mate-dasar',
    title: 'Pola skakmat dasar',
    level: 'Pemula',
    summary: 'Back-rank mate dan kerja sama ratu dengan raja.',
    fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
    arrow: ['a1', 'a8'],
    caption: 'Back-rank mate: Ra8#.',
    sections: [
      { h: 'Back-rank mate', p: ['Raja terkurung oleh pion sendiri di baris terakhir. Buat "jendela" (luft) agar rajamu tidak mengalami ini.'] },
      { h: 'Ratu didukung raja', p: ['Ratu yang diberi skak dari dekat dan dilindungi bidak lain sering langsung skakmat.'] },
    ],
    checklist: ['Apakah rajaku punya ruang keluar?', 'Apakah raja lawan terkurung?'],
  },
  {
    id: 'endgame-dasar',
    title: 'Dasar endgame',
    level: 'Menengah',
    summary: 'Raja aktif, bidak lolos, dan oposisi.',
    sections: [
      { h: 'Raja menjadi bidak aktif', p: ['Di endgame raja aman untuk maju. Gunakan untuk mendukung pion dan menyerang pion lawan.'] },
      { h: 'Bidak lolos', p: ['Pion yang tidak bisa dihentikan pion lawan sangat berbahaya. Dukung dengan raja dan benteng dari belakang.'] },
      { h: 'Oposisi', p: ['Dua raja berhadapan dengan satu kotak di antaranya. Pihak yang tidak harus melangkah memegang oposisi.'] },
    ],
    checklist: ['Rajaku sudah aktif?', 'Siapa yang punya bidak lolos?', 'Apakah ada zugzwang?'],
  },
  {
    id: 'nilai-bidak',
    title: 'Nilai bidak dan penukaran',
    level: 'Pemula',
    summary: 'Kapan menukar dan kapan tidak.',
    sections: [
      { h: 'Nilai kasar', p: ['Pion 1, kuda 3, gajah 3, benteng 5, ratu 9.'] },
      { h: 'Aturan menukar', p: [
        'Saat unggul material, tukar bidak untuk menyederhanakan.',
        'Saat tertinggal, hindari penukaran dan cari kerumitan.',
        'Nilai di atas hanya panduan: posisi dan aktivitas bidak bisa mengubah segalanya.',
      ] },
    ],
    checklist: ['Siapa unggul material?', 'Apakah penukaran ini menguntungkanku?'],
  },
];
 
export const QUICK_TIPS = [
  'Lakukan CCT (Check, Capture, Threat) sebelum setiap langkah.',
  'Review setiap game kalahmu: cari 3 kesalahan terbesar, abaikan yang kecil.',
  'Latih 10-15 menit puzzle taktik setiap hari, konsisten lebih baik daripada lama sekali-sekali.',
  'Pelajari satu pembukaan sederhana untuk putih dan satu untuk hitam, bukan banyak sekaligus.',
  'Jangan langsung bermain langkah pertama yang terpikir. Cari minimal dua kandidat.',
  'Perhatikan waktu: jangan terlalu cepat di posisi kritis, jangan terlalu lama di posisi biasa.',
  'Pelajari endgame dasar, karena banyak game ditentukan di sana.',
  'Tulis pola kesalahan berulangmu (misalnya sering lupa bidak menggantung) dan fokus memperbaikinya.',
];

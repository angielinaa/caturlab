import { PIECE_NAME } from './tactics.js';

// Penjelasan berbasis aturan (tanpa AI). Nanti bisa ditambah penjelasan dari LLM.
const name = (t) => PIECE_NAME[t];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Menyebut bidaknya, bukan hanya petaknya: { piece: 'n', from: 'g1', to: 'f3', san: 'Nf3' }
// menjadi "kuda dari g1 ke f3 (Nf3)".
export function moveText(x) {
  return `${name(x.piece)} dari ${x.from} ke ${x.to} (${x.san})`;
}

function whyText(why) {
  if (!why) return '';
  const reply = why.reply ? moveText({ ...why.reply, san: why.replySan }) : '';
  switch (why.kind) {
    case 'mate':
      return ` Lawan bisa membalas dengan ${reply}, langsung skakmat.`;
    case 'mateThreat':
      return reply
        ? ` Setelah ini lawan punya jalan menuju skakmat, mulai dari ${reply}.`
        : ' Langkah ini membuka jalan skakmat bagi lawan.';
    case 'hanging':
      return ` Lawan membalas dengan ${reply} dan memakan ${name(why.piece)}mu di ${why.square}${
        why.movedPiece ? ' (bidak yang baru kamu pindahkan)' : ''
      }. Kamu tidak bisa membalas karena bidak itu menggantung (tidak terlindungi).`;
    case 'badTrade':
      return ` Lawan membalas dengan ${reply}. Penukaran ini merugikan karena ${name(why.piece)}mu lebih berharga daripada ${name(
        why.attacker,
      )} lawan.`;
    case 'trade':
      return ` Lawan membalas dengan ${reply}, menangkap ${name(why.piece)}mu di ${why.square}, dan posisimu jadi lebih sulit.`;
    case 'check':
      return ` Lawan membalas dengan skak: ${reply}. Ia mengambil inisiatif.`;
    case 'threat':
      return ` Lawan membalas dengan ${reply}, yang mengancam ${name(why.piece)}mu di ${why.square}. Ancaman ini yang membuat posisimu merosot.`;
    default:
      return ` Balasan terkuat lawan adalah ${reply}.`;
  }
}

// Penjelasan utama: apa kualitas langkah ini dan kenapa.
export function explainMove(m) {
  if (!m) return 'Pilih sebuah langkah di daftar untuk melihat penjelasannya.';
  const loss = Math.round(m.loss);
  const mt = m.piece ? cap(moveText(m)) : m.san;
  const hadMateNote =
    m.hadMate && !['best', 'great'].includes(m.cls) ? ' Kamu punya jalan menuju skakmat, tapi langkah ini melewatkannya.' : '';
  switch (m.cls) {
    case 'great':
      return `${mt} adalah langkah sangat baik: alternatif lain di posisi ini jauh lebih buruk, dan kamu menemukan jalan terbaiknya.`;
    case 'best':
      return `${mt} adalah langkah terbaik atau setara dengan terbaik. Pertahankan!`;
    case 'good':
      return `${mt} langkah yang bagus. Selisihnya dengan yang terbaik kecil (sekitar ${loss}% peluang menang).`;
    case 'inaccuracy':
      return `${mt} kurang akurat: kamu kehilangan sekitar ${loss}% peluang menang.${hadMateNote}${whyText(m.why)}`;
    case 'mistake':
      return `${mt} sebuah kesalahan: sekitar ${loss}% peluang menang hilang.${hadMateNote}${whyText(m.why)}`;
    case 'miss': {
      const slip =
        m.prevLoss >= 10
          ? 'Lawanmu baru saja salah langkah, tapi langkahmu tidak memanfaatkannya.'
          : 'Kamu punya jalan yang lebih kuat di posisi ini.';
      return `${mt} melewatkan peluang. ${slip} Sekitar ${loss}% peluang menang terlewat.${hadMateNote}${whyText(m.why)}`;
    }
    default:
      return `${mt} adalah blunder: sekitar ${loss}% peluang menang hilang.${hadMateNote}${whyText(m.why)}`;
  }
}

// Penjelasan langkah yang lebih baik. Kosong jika langkahmu sudah bagus.
export function explainBetter(m) {
  if (!m || !m.better || ['best', 'great', 'good'].includes(m.cls)) return '';
  const b = m.better;
  const lead = `Langkah yang lebih kuat: ${moveText(b)}.`;
  switch (b.kind) {
    case 'mate':
      return `${lead} Langkah ini langsung skakmat.`;
    case 'matePlan':
      return `${lead} Langkah ini menjaga jalanmu menuju skakmat.`;
    case 'capture':
      return `${lead} Kamu bisa memakan ${name(b.captured)} lawan di ${b.to}${b.safe ? ' tanpa bisa dibalas' : ''}.`;
    case 'check':
      return `${lead} Langkah ini memberi skak sehingga lawan harus menanggapi.`;
    case 'rescue':
      return `${lead} Langkah ini menyelamatkan ${name(b.piece)}mu di ${b.from} yang sedang diserang.`;
    case 'castle':
      return `${lead} Rajamu jadi aman dan bentengmu aktif.`;
    default:
      return `${lead} Engine menilai ini langkah terbaik di posisi ini.`;
  }
}

// Tips singkat yang muncul sesuai jenis kesalahan.
export function tipForClass(cls) {
  if (cls === 'blunder') return 'Sebelum melangkah, biasakan cek CCT: Check, Capture, Threat milik lawan.';
  if (cls === 'mistake') return 'Tanya dirimu: apa yang dimaui lawan setelah langkahku? Cari ancamannya dulu.';
  if (cls === 'miss') return 'Setelah lawan salah, berhenti sejenak: cari skak, tangkapan, dan ancaman yang bisa kamu manfaatkan.';
  if (cls === 'inaccuracy') return 'Bandingkan 2-3 kandidat langkah, jangan langsung ambil yang pertama terpikir.';
  return '';
}
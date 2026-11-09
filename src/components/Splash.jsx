import { useEffect, useState } from 'react';

// Layar pembuka: logo muncul dengan animasi, lalu tombol "Mulai sekarang" masuk ke aplikasi.
export default function Splash({ onStart }) {
  const [leaving, setLeaving] = useState(false);

  // Setelah tombol ditekan, tunggu animasi keluar selesai baru pindah ke aplikasi.
  useEffect(() => {
    if (!leaving) return undefined;
    const timer = setTimeout(onStart, 550);
    return () => clearTimeout(timer);
  }, [leaving, onStart]);

  return (
    <div className={`splash${leaving ? ' leaving' : ''}`}>
      <div className="splash-inner">
        <svg className="splash-logo" viewBox="0 0 120 120" role="img" aria-label="Logo CaturLab">
          <rect className="logo-bg" x="6" y="6" width="108" height="108" rx="28" />
          <g className="logo-pawn">
            <circle cx="60" cy="40" r="12" />
            <rect x="47" y="54" width="26" height="6" rx="3" />
            <path d="M50 60 H70 C72 72 78 80 82 88 H38 C42 80 48 72 50 60 Z" />
            <rect x="33" y="88" width="54" height="10" rx="5" />
          </g>
        </svg>
        <h1 className="splash-title" aria-label="CaturLab">
          {'CaturLab'.split('').map((ch, i) => (
            <span key={i} aria-hidden="true" style={{ '--i': i }}>
              {ch}
            </span>
          ))}
        </h1>
        <p className="splash-tag">Main, review, dan belajar catur. Gratis di browser-mu.</p>
        <button type="button" className="splash-btn" onClick={() => setLeaving(true)} disabled={leaving}>
          Mulai sekarang
        </button>
      </div>
    </div>
  );
}
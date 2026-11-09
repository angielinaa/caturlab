import { useState } from 'react';
import { useEngine } from './hooks/useEngine.js';
import { clearProfile, loadLastGame, loadProfile, saveLastGame, saveProfile } from './lib/storage.js';
import { emptyProfile, mergeProfiles } from './lib/weakness.js';
import LearnPage from './pages/LearnPage.jsx';
import PlayPage from './pages/PlayPage.jsx';
import PuzzlePage from './pages/PuzzlePage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import TipsPage from './pages/TipsPage.jsx';
import Splash from './components/Splash.jsx';
 
const TABS = [
  ['play', 'Main'],
  ['review', 'Review'],
  ['puzzle', 'Puzzle'],
  ['learn', 'Belajar'],
  ['tips', 'Tips & Profil'],
];
 
export default function App() {
  const getEngine = useEngine();
  const [tab, setTab] = useState('play');
  const [lessonId, setLessonId] = useState('pembukaan-dasar');
  const [profile, setProfile] = useState(loadProfile);
  const [lastGame] = useState(loadLastGame); // dibaca sekali, hanya untuk mengisi kotak PGN Review
  const [incoming, setIncoming] = useState(null); // game yang baru selesai dimainkan
  const [entered, setEntered] = useState(false); // false = tampilkan layar pembuka dulu
 
  function addToProfile(gameProfile) {
    setProfile((old) => {
      const next = mergeProfiles(old, gameProfile);
      saveProfile(next);
      return next;
    });
  }
 
  // Game selesai: simpan, kirim ke Review (dianalisis otomatis), lalu pindah tab.
  function finishGame(game) {
    saveLastGame(game);
    setIncoming({ key: Date.now(), pgn: game.pgn, color: game.color });
    setTab('review');
  }
 
  function openLesson(id) {
    setLessonId(id);
    setTab('learn');
  }
 if (!entered) return <Splash onStart={() => setEntered(true)} />;
 
  return (
    <>
      <header className="hero">
        <div className="container">
          <h1>CaturLab</h1>
          <p>Main lawan engine, lalu review tiap langkahmu dengan replay, puzzle, dan materi belajar. Gratis, jalan di browser-mu.</p>
        </div>
      </header>
      <nav className="tabs container" aria-label="Menu utama">
        {TABS.map(([id, label]) => (
          <button type="button" key={id} className={id === tab ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      <main className="container">
        {/* Main dan Review tetap dipasang agar game dan hasilnya tidak hilang saat pindah tab */}
        <div hidden={tab !== 'play'}>
          <PlayPage getEngine={getEngine} onFinish={finishGame} active={tab === 'play'} />
        </div>
        <div hidden={tab !== 'review'}>
          <ReviewPage
            getEngine={getEngine}
            onProfileUpdate={addToProfile}
            incoming={incoming}
            initialGame={lastGame}
            active={tab === 'review'}
          />
        </div>
        {tab === 'puzzle' && <PuzzlePage />}
        {tab === 'learn' && <LearnPage lessonId={lessonId} onSelect={setLessonId} />}
        {tab === 'tips' && (
          <TipsPage
            profile={profile}
            onOpenLesson={openLesson}
            onReset={() => {
              clearProfile();
              setProfile(emptyProfile());
            }}
          />
        )}
      </main>
      <footer className="container footer">
        Engine: Stockfish (GPLv3) · Library: chess.js, react-chessboard · Materi dan puzzle ditulis sendiri.
      </footer>
    </>
  );
}

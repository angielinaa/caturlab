import { useState } from 'react';
import { useEngine } from './hooks/useEngine.js';
import { clearProfile, loadProfile, saveProfile } from './lib/storage.js';
import { emptyProfile, mergeProfiles } from './lib/weakness.js';
import LearnPage from './pages/LearnPage.jsx';
import PuzzlePage from './pages/PuzzlePage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import TipsPage from './pages/TipsPage.jsx';
 
const TABS = [
  ['review', 'Review'],
  ['puzzle', 'Puzzle'],
  ['learn', 'Belajar'],
  ['tips', 'Tips & Profil'],
];
 
export default function App() {
  const getEngine = useEngine();
  const [tab, setTab] = useState('review');
  const [lessonId, setLessonId] = useState('pembukaan-dasar');
  const [profile, setProfile] = useState(loadProfile);
 
  function addToProfile(gameProfile) {
    setProfile((old) => {
      const next = mergeProfiles(old, gameProfile);
      saveProfile(next);
      return next;
    });
  }
 
  function openLesson(id) {
    setLessonId(id);
    setTab('learn');
  }
 
  return (
    <>
      <header className="hero">
        <div className="container">
          <h1>CaturLab</h1>
          <p>Latihan catur dengan review otomatis, puzzle, dan materi belajar. Gratis, jalan di browser-mu.</p>
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
        {/* Review tetap dipasang agar hasilnya tidak hilang saat pindah tab */}
        <div hidden={tab !== 'review'}>
          <ReviewPage getEngine={getEngine} onProfileUpdate={addToProfile} />
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

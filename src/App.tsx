import React, { useState, useRef, useCallback } from 'react';
import './App.css';

const DEFAULTS = {
  pomodoro: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function App() {
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [durations, setDurations] = useState({ ...DEFAULTS });
  const [secondsLeft, setSecondsLeft] = useState(durations.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [background, setBackground] = useState<string | null>(() => {
    const saved = localStorage.getItem('pomodoro-background');
    if (saved) return saved;
    // Default to public/_.jpeg if no custom background
    return process.env.PUBLIC_URL + '/_.jpeg';
  });
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const handleAutoAdvance = useCallback(() => {
    if (mode === 'pomodoro') {
      setPomodoroCount(prev => prev + 1);
      // After 4 pomodoros, take a long break
      if (pomodoroCount >= 3) {
        setMode('longBreak');
        setPomodoroCount(0); // Reset count
      } else {
        setMode('shortBreak');
      }
    } else if (mode === 'shortBreak' || mode === 'longBreak') {
      setMode('pomodoro');
    }
    // Auto-start the next timer
    setTimeout(() => {
      setIsRunning(true);
    }, 1000); // 1 second delay to show the mode change
  }, [mode, pomodoroCount]);

  React.useEffect(() => {
    setSecondsLeft(durations[mode]);
  }, [mode, durations]);

  // Sound effect URLs for each timer
  const SOUNDS = {
    pomodoro: process.env.PUBLIC_URL + '/timer-terminer-342934.mp3',
    shortBreak: process.env.PUBLIC_URL + '/rainbow-countdown-289372.mp3',
    longBreak: process.env.PUBLIC_URL + '/microwave-timer-117077.mp3',
  };

  // Play sound when timer is up
  const playSound = (mode: Mode) => {
    let key: keyof typeof SOUNDS = 'pomodoro';
    if (mode === 'shortBreak') key = 'shortBreak';
    else if (mode === 'longBreak') key = 'longBreak';
    const audio = new window.Audio(SOUNDS[key]);
    audio.currentTime = 0;
    audio.play();
    // Play only the first 3 seconds
    const stopTimeout = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 3000);
    audio.onended = () => clearTimeout(stopTimeout);
  };

  // Timer effect: use endTime for accuracy
  React.useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft(() => {
        if (!endTime) return 0;
        const diff = Math.round((endTime - Date.now()) / 1000);
        if (diff <= 0) {
          setIsRunning(false);
          clearInterval(timerRef.current!);
          playSound(mode);
          handleAutoAdvance();
          return 0;
        }
        return diff;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [isRunning, handleAutoAdvance, mode, endTime]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(durations[mode]);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setIsRunning(false);
    // Reset pomodoro count when manually changing modes
    if (newMode === 'pomodoro') {
      setPomodoroCount(0);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const backgroundData = event.target?.result as string;
        setBackground(backgroundData);
        localStorage.setItem('pomodoro-background', backgroundData);
      };
      reader.readAsDataURL(file);
    }
  };

  // List of preset images in the public folder
  const PRESET_IMAGES = [
    '/_.jpeg',
    '/preset_1.gif',
    '/preset_2.webp',
    '/preset_3.jpg',
    '/preset_4.jpg',
    '/preset_5.jpg',
  ];

  return (
    <div
      className="App"
      style={background ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <div className="app-container" style={{ marginTop: 32, marginBottom: 32, padding: 24 }}>
        <h1>Pomodoro Timer</h1>
        <div className="mode-buttons">
          <button onClick={() => handleModeChange('pomodoro')} className={mode === 'pomodoro' ? 'active' : ''}>Pomodoro</button>
          <button onClick={() => handleModeChange('shortBreak')} className={mode === 'shortBreak' ? 'active' : ''}>Short Break</button>
          <button onClick={() => handleModeChange('longBreak')} className={mode === 'longBreak' ? 'active' : ''}>Long Break</button>
        </div>
        <div className="timer-display">{formatTime(secondsLeft)}</div>
        <div className="timer-controls">
          {!isRunning ? (
            <button onClick={handleStart}>Start</button>
          ) : (
            <button onClick={handlePause}>Pause</button>
          )}
          <button onClick={handleReset}>Reset</button>
        </div>
        <div className="settings">
          <h2>Timer Settings</h2>
          <label>
            Pomodoro (minutes):
            <input
              type="number"
              min={1}
              value={durations.pomodoro / 60}
              onChange={e => setDurations(d => ({ ...d, pomodoro: Number(e.target.value) * 60 }))}
            />
          </label>
          <label>
            Short Break (minutes):
            <input
              type="number"
              min={1}
              value={durations.shortBreak / 60}
              onChange={e => setDurations(d => ({ ...d, shortBreak: Number(e.target.value) * 60 }))}
            />
          </label>
          <label>
            Long Break (minutes):
            <input
              type="number"
              min={1}
              value={durations.longBreak / 60}
              onChange={e => setDurations(d => ({ ...d, longBreak: Number(e.target.value) * 60 }))}
            />
          </label>
        </div>
        <div className="background-upload" style={{ marginTop: '2rem' }}>
          <h2>Customize Background</h2>
          <input type="file" accept="image/*" onChange={handleBackgroundChange} />
          {/* Preset background options */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1rem', marginBottom: '10px' }}>
            {PRESET_IMAGES.map((img, idx) => (
              <div key={img} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={process.env.PUBLIC_URL + img}
                  alt={img}
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: background === (process.env.PUBLIC_URL + img) ? '2px solid #333' : '1px solid #ccc', cursor: 'pointer' }}
                  onClick={() => {
                    setBackground(process.env.PUBLIC_URL + img);
                    localStorage.setItem('pomodoro-background', process.env.PUBLIC_URL + img);
                  }}
                />
                <span style={{ fontSize: 12, marginTop: 4 }}>{`Preset ${idx + 1}`}</span>
              </div>
            ))}
          </div>
          {background && (
            <button 
              onClick={() => {
                setBackground(null);
                localStorage.removeItem('pomodoro-background');
              }}
              style={{ marginLeft: '10px' }}
            >
              Clear Background
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

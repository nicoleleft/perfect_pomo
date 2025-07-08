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
    return localStorage.getItem('pomodoro-background');
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

  React.useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          clearInterval(timerRef.current!);
          // Auto-advance to next mode
          handleAutoAdvance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [isRunning, handleAutoAdvance]);

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

  return (
    <div
      className="App"
      style={background ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <div className="app-container">
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

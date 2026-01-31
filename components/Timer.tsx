
import React, { useState, useEffect } from 'react'; // Pull in core React functionality

// Define what props (inputs) this component expects from its parent
interface Props {
  onTimerEnd: () => void; // A function to run when the clock hits zero
  onStartLock: () => void; // A function to run when the "Go" button is clicked
  onPauseRequest: () => void; // A function to ask the user to verify password to pause
  onResumeRequest: () => void; // A function to resume without password
  isActive: boolean; // Is the countdown currently active?
  isPaused: boolean; // Is the countdown currently paused?
}

// The component that manages the "Pomodoro" style focus timer
const Timer: React.FC<Props> = ({ onTimerEnd, onStartLock, onPauseRequest, onResumeRequest, isActive, isPaused }) => {
  // --- STATE ---
  const [timeLeft, setTimeLeft] = useState(0); // The remaining seconds in the countdown
  const [durationHours, setDurationHours] = useState(0); // The chosen hours for the session
  const [durationMinutes, setDurationMinutes] = useState(25); // The chosen minutes for the session
  const [initialTotalSeconds, setInitialTotalSeconds] = useState(0); // Stores the starting total seconds for progress calculation

  // This runs when the user sets their time and clicks the "Go" button
  const startTimer = () => {
    const totalSeconds = (durationHours * 3600) + (durationMinutes * 60); // Convert hours and minutes to total seconds
    if (totalSeconds <= 0) return; // Don't start if time is zero
    
    setInitialTotalSeconds(totalSeconds); // Save the starting point for the progress bar
    setTimeLeft(totalSeconds); // Initialize the countdown
    onStartLock(); // Notify the parent that focus mode has begun
  };

  // THE TICKING ENGINE: This effect handles the actual countdown logic
  useEffect(() => {
    // If timer is off, paused, or finished, stop the effect
    if (!isActive || timeLeft <= 0 || isPaused) return;

    // Create a recurring timer that fires every 1000 milliseconds (1 second)
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        // If we only had 1 second left, the next tick is zero
        if (prev <= 1) {
          clearInterval(interval); // Destroy the interval immediately
          onTimerEnd(); // Trigger the end-of-timer action
          return 0;
        }
        return prev - 1; // Otherwise, just subtract one second
      });
    }, 1000);

    // CLEANUP: This stops the timer if the component is closed or the effect restarts
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onTimerEnd, isPaused]);

  // A helper function that formats seconds into a string like "01:02:05" (HH:MM:SS)
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600); // Calculate whole hours
    const mins = Math.floor((totalSeconds % 3600) / 60); // Calculate remaining minutes
    const secs = totalSeconds % 60; // Calculate remaining seconds
    
    // padStart adds a '0' to the front if the number is only 1 digit long
    const hDisplay = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : ''; // Only show hours if they exist
    const mDisplay = mins.toString().padStart(2, '0');
    const sDisplay = secs.toString().padStart(2, '0');
    
    return `${hDisplay}${mDisplay}:${sDisplay}`;
  };

  // --- RENDERING OPTION 1: THE RUNNING CLOCK ---
  if (isActive && timeLeft > 0) {
    // Calculate what percentage of the total time is remaining for the visual ring
    const progress = (timeLeft / initialTotalSeconds) * 100;
    
    return (
      <div className={`p-8 rounded-[2rem] shadow-2xl text-white transition-all duration-500 ${isPaused ? 'bg-slate-800 dark:bg-slate-800' : 'bg-indigo-900 dark:bg-indigo-950'}`}>
        <div className="flex justify-between items-center mb-6">
          {/* THE PROGRESS RING VISUAL */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* The gray background of the ring */}
              <circle className="text-white/10" strokeWidth="3" stroke="currentColor" fill="transparent" r="16" cx="18" cy="18" />
              {/* The colored progress part of the ring */}
              <circle className="text-indigo-400" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - progress} stroke="currentColor" fill="transparent" r="16" cx="18" cy="18" />
            </svg>
            {/* The icon in the middle of the ring changes based on status */}
            <i className={`fas absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs ${isPaused ? 'fa-pause' : 'fa-bolt'}`}></i>
          </div>
          {/* THE DIGITAL TIME DISPLAY */}
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{isPaused ? 'Paused' : 'Focusing'}</p>
            <p className="text-4xl font-mono font-black tracking-tight">{formatTime(timeLeft)}</p>
          </div>
        </div>
        {/* BUTTON TO PAUSE OR RESUME */}
        <button onClick={isPaused ? onResumeRequest : onPauseRequest} className="w-full py-4 rounded-2xl bg-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all">
          {isPaused ? 'Resume Session' : 'Pause Focus'}
        </button>
      </div>
    );
  }

  // --- RENDERING OPTION 2: THE SETUP SCREEN ---
  return (
    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-[2rem] shadow-sm">
      <h4 className="font-black mb-6 text-slate-800 dark:text-white uppercase text-xs tracking-widest">Focus Session</h4>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {/* THE HOURS INPUT BOX */}
          <div className="relative flex-1">
            <input 
              type="number" 
              min="0"
              max="99"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl px-4 py-4 font-black text-slate-900 dark:text-white focus:border-indigo-500 transition-all outline-none text-center" 
              value={durationHours} 
              onChange={(e) => setDurationHours(Math.max(0, parseInt(e.target.value) || 0))} 
            />
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-5 text-[8px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">Hours</span>
          </div>

          <div className="flex items-center text-slate-300 dark:text-slate-700 font-black">:</div>

          {/* THE MINUTES INPUT BOX */}
          <div className="relative flex-1">
            <input 
              type="number" 
              min="0"
              max="59"
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl px-4 py-4 font-black text-slate-900 dark:text-white focus:border-indigo-500 transition-all outline-none text-center" 
              value={durationMinutes} 
              onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} 
            />
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-5 text-[8px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">Mins</span>
          </div>
        </div>

        {/* THE "GO" START BUTTON */}
        <button 
          onClick={startTimer} 
          className="mt-2 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
        >
          Start Deep Focus
        </button>
      </div>
    </div>
  );
};

export default Timer;

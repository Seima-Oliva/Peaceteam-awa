
import React from 'react'; // Pull in standard React functionality

// Define what values this component needs to work
interface Props {
  onStart: () => void; // A function to trigger the login/signup screen
  darkMode: boolean; // The current theme state
  onToggleDark: () => void; // A function to flip the theme
}

// The high-impact landing page component for MOMO
const Home: React.FC<Props> = ({ onStart, darkMode, onToggleDark }) => {
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      
      {/* NAVIGATION BAR SECTION */}
      <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
        {/* LOGO & NAME */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center overflow-hidden p-1.5 shadow-lg shadow-indigo-500/20">
            <img src="MomoLogo.PNG" alt="MOMO Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white">MOMO</span>
        </div>
        {/* THE DARK MODE TOGGLE BUTTON */}
        <button 
          onClick={onToggleDark} 
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-transparent dark:border-slate-800 transition-all active:scale-90 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <i className={`fas ${darkMode ? 'fa-sun text-yellow-400' : 'fa-moon text-indigo-600'}`}></i>
        </button>
      </nav>

      {/* HERO SECTION - THE CENTER PIECE */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        
        {/* THE LOGO SLOT - The provided shield logo */}
        <div className="relative mb-12 group">
          {/* Animated glow background behind the logo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className={`relative w-48 h-48 ${darkMode ? 'bg-slate-900' : 'bg-white'} rounded-[3rem] flex items-center justify-center border-4 border-slate-100 dark:border-slate-800 shadow-2xl p-6 overflow-hidden`}>
             <img src="MomoLogo.PNG" alt="MOMO Logo" className="w-full h-full object-contain animate-in zoom-in duration-500" />
          </div>
          
          {/* A small "check" badge on the side of the logo */}
          <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
             <i className="fas fa-check text-emerald-500 text-xl"></i>
          </div>
        </div>

        {/* TITLES & SUBTITLES */}
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
          MOMO
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-300 max-w-md font-medium tracking-wide leading-relaxed">
          <span className="block mt-2 font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-sm mb-2">Mask On, Mind On</span>
          The ultimate productivity guard for researchers, students, and teachers. 
        </p>

        {/* THE MAIN ACTION BUTTON AREA */}
        <div className="mt-12 space-y-4 w-full max-w-xs">
          <div className="p-1 rounded-[2.25rem] bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-500/20">
            <button 
              onClick={onStart}
              className="w-full bg-slate-950 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER AREA */}
      <footer className="p-12 border-t border-slate-100 dark:border-slate-900 text-center">
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-4 font-medium italic">
          Ready to reclaim your focus?
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={onStart} 
            className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
          >
            Sign Up / Sign In
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Home;

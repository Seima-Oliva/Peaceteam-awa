
import React, { useState, useEffect } from 'react'; // Import React and standard hooks
import { UserRole, UserProfile } from '../types'; // Import our custom data blueprints

// Define what the parent component (App.tsx) needs to provide to this component
interface Props {
  onComplete: (profile: UserProfile) => void; // A function that handles the finished profile
}

// The component that handles Email Sign-up, Sign-in, and Guest access
const ProfileSetup: React.FC<Props> = ({ onComplete }) => {
  // --- STATE FOR USER INPUTS ---
  const [email, setEmail] = useState(''); // Stores what the user types in the Email box
  const [name, setName] = useState(''); // Stores what the user types in the Name box
  const [role, setRole] = useState<UserRole>(UserRole.UNSET); // Stores which role button was clicked
  const [password, setPassword] = useState(''); // Stores the first password typed
  const [confirmPassword, setConfirmPassword] = useState(''); // Stores the second "confirm" password

  // --- LOGIC STATES ---
  const [isKnownUser, setIsKnownUser] = useState(false); // True if we found the email in our saved list
  const [error, setError] = useState<string | null>(null); // Stores error messages to show the user
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]); // A list of all people saved on this device

  // This runs as soon as the component loads to retrieve the list of saved users
  useEffect(() => {
    const saved = localStorage.getItem('momo_registered_users'); // Look for the 'momo_registered_users' item
    if (saved) {
      setRegisteredUsers(JSON.parse(saved)); // Turn the saved text back into a list of users
    }
  }, []);

  // This runs every time the email text changes to check if the user already has an account
  useEffect(() => {
    const user = registeredUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      setIsKnownUser(true); // If found, we switch the UI to "Sign In" mode
      setRole(user.role); // Automatically select their saved role
    } else {
      setIsKnownUser(false); // If not found, we stay in "Sign Up" mode
    }
  }, [email, registeredUsers]);

  // A function to handle users who want to skip the account creation
  const handleGuest = () => {
    if (role === UserRole.UNSET) {
      setError("Please pick a role to continue as guest.");
      return;
    }
    onComplete({
      name: 'Guest User',
      role: role,
      isLocked: false,
      isGuest: true
    });
  };

  // The main function that handles the Submit button click
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    setError(null); 

    if (role === UserRole.UNSET) {
      setError("A field must be chosen: Please select a role.");
      return;
    }

    if (isKnownUser) {
      const user = registeredUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (user && user.passwordHash === password) {
        onComplete(user); 
      } else {
        setError("Incorrect password for this email."); 
      }
      return;
    }

    if (!name || !password || !email) {
      setError("Please fill in all fields to create your account.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const newProfile: UserProfile = {
      name,
      role,
      email: email.toLowerCase(),
      passwordHash: password,
      isLocked: false
    };

    const updatedList = [...registeredUsers, newProfile];
    localStorage.setItem('momo_registered_users', JSON.stringify(updatedList));
    
    onComplete(newProfile);
  };

  // --- DRAWING THE UI ---
  return (
    <div className="max-w-md mx-auto mt-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
      <div className="text-center mb-8">
        <div className="bg-white dark:bg-slate-800 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border-2 border-slate-50 dark:border-slate-700 p-4">
          <img src="MomoLogo.PNG" alt="MOMO Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">{isKnownUser ? 'Welcome Back' : 'Get Started'}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{isKnownUser ? 'Sign in to your MOMO account' : 'Create your focus persona'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {!isKnownUser && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Display Name</label>
            <input
              type="text"
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="How should we call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Your Focus Role</label>
          <div className="grid grid-cols-3 gap-2">
            {[UserRole.RESEARCHER, UserRole.STUDENT, UserRole.TEACHER].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  if (error?.includes("role")) setError(null);
                }}
                className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-tighter transition-all ${
                  role === r
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-indigo-100 dark:hover:border-indigo-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Master Password</label>
            <input
              type="password"
              required
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {!isKnownUser && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Confirm Password</label>
              <input
                type="password"
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 dark:text-red-400 text-[10px] font-black uppercase text-center bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100 dark:border-red-900 flex items-center justify-center gap-2 animate-bounce">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98]"
        >
          {isKnownUser ? 'Sign In' : 'Finalize Setup'}
        </button>

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
          <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase">OR</span>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
        </div>

        <button
          type="button"
          onClick={handleGuest}
          className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
        >
          <i className="fas fa-user-secret mr-2 opacity-50"></i> Continue as Guest
        </button>
      </form>
    </div>
  );
};

export default ProfileSetup;

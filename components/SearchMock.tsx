
import React, { useState, useMemo } from 'react'; // Pull in React and state-management hooks
import { UserRole, SearchResult } from '../types'; // Pull in our custom data blueprints
import { validateAndSearch } from '../services/geminiService'; // Pull in our AI search logic
import { BLOCKED_SITES, BLOCKED_TLDS } from '../constants'; // Pull in our list of blocked sites

// Define what information this component needs from the parent dashboard
interface Props {
  role: UserRole;
  history: string[];
  onAddHistory: (query: string) => void;
  onDeleteItem: (query: string) => void;
  onClearHistory: () => void;
}

// The component that handles the search bar, AI validation, and result filtering
const SearchMock: React.FC<Props> = ({ role, history, onAddHistory, onDeleteItem, onClearHistory }) => {
  // --- COMPONENT STATE ---
  const [query, setQuery] = useState(''); // The text currently typed in the search bar
  const [loading, setLoading] = useState(false); // True while waiting for the AI response
  const [allResults, setAllResults] = useState<SearchResult[]>([]); // The full list of links found
  const [visibleCount, setVisibleCount] = useState(6); // Controls how many results are currently on screen
  const [error, setError] = useState<string | null>(null); // Stores error messages if a search fails
  const [showHistoryView, setShowHistoryView] = useState(false); // Toggle between search results and history panel
  const [historyFilter, setHistoryFilter] = useState(''); // Text to filter the history list

  // Filter history based on user input for "Search in History"
  const filteredHistory = useMemo(() => {
    return history.filter(item => item.toLowerCase().includes(historyFilter.toLowerCase()));
  }, [history, historyFilter]);

  // The function that runs when the user clicks the "Search" button
  const handleSearch = async (e?: React.FormEvent, explicitQuery?: string) => {
    if (e) e.preventDefault(); // Stop the page from refreshing on form submit
    const searchQuery = explicitQuery || query;
    if (!searchQuery.trim()) return; // Don't do anything if the search box is empty

    setLoading(true); // Show the loading spinner
    setError(null); // Clear any previous errors
    setAllResults([]); // Clear any previous results
    setVisibleCount(6); // Reset the "Load More" counter
    setShowHistoryView(false); // Close history view to show results
    if (!explicitQuery) setQuery(searchQuery);

    try {
      const aiResponse = await validateAndSearch(searchQuery, role);
      
      if (!aiResponse.isValid) {
        setError(aiResponse.reason);
        setLoading(false);
        return;
      }

      // Successful validation: add to history
      onAddHistory(searchQuery);

      const results = aiResponse.suggestedLinks.map(link => {
        const url = link.url.toLowerCase(); 
        
        // --- FILTERING LOGIC ---
        const isBlockedTLD = BLOCKED_TLDS.some(tld => url.endsWith(tld));
        const isBlockedSite = BLOCKED_SITES.some(site => url.includes(site));
        const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
        const isLearningPath = url.includes('youtube.com/learning');
        
        const isAllowedRole = role === UserRole.STUDENT || role === UserRole.TEACHER;
        const isExplicitVideoSearch = searchQuery.toLowerCase().includes('video') || searchQuery.toLowerCase().includes('youtube');
        const allowYoutubeException = isAllowedRole && (isLearningPath || isExplicitVideoSearch);

        let isBlocked = isBlockedTLD || isBlockedSite || (isYoutube && !allowYoutubeException);

        return {
          ...link,
          isTrusted: url.includes('.gov') || url.includes('.edu') || url.includes('.org'),
          isBlocked,
          blockReason: isBlocked ? 'Restricted by focus filter.' : ''
        };
      });

      setAllResults(results);
    } catch (err) {
      setError('Search failed. Please try again later.');
    } finally {
      setLoading(false); // Hide the loading spinner
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* FULL SCREEN SEARCHING OVERLAY (Centered Pop-up) */}
      {loading && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500"></div>
          
          {/* Pop-up Container */}
          <div className="relative bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border border-white/20 dark:border-slate-800 text-center max-w-sm w-full animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="mb-10 flex justify-center gap-2 h-16 items-end">
              {/* WAVING LOADING BAR PILLARS - 7 Pillars for a wider wave */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="w-2 bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300 rounded-full animate-bounce"
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                    height: `${30 + (i % 4) * 15}%`
                  }}
                ></div>
              ))}
            </div>
            
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Filtering your search...</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-relaxed px-2">
              Our AI is analyzing sources to ensure they meet <span className="text-indigo-600 dark:text-indigo-400 font-black">academic relevance</span> and safety standards for your role.
            </p>
            
            <div className="mt-10 flex justify-center items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-150"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/60">MOMO Engine Active</span>
            </div>
          </div>
        </div>
      )}

      {/* HEADER WITH TOGGLE */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
          <i className={`fas ${showHistoryView ? 'fa-clock-rotate-left' : 'fa-search'} text-slate-200 dark:text-slate-700`}></i> 
          {showHistoryView ? 'Full Search History' : 'Search Engine'}
        </h3>
        <button 
          onClick={() => setShowHistoryView(!showHistoryView)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            showHistoryView 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}
        >
          {showHistoryView ? 'Close History' : `History (${history.length})`}
        </button>
      </div>

      {!showHistoryView ? (
        <>
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-[1.25rem] py-5 pl-12 pr-32 font-bold text-slate-900 dark:text-white focus:border-indigo-500 transition-all outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                placeholder={role === UserRole.RESEARCHER ? "Search academic topics..." : "Search topics, videos, or lectures..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black hover:bg-indigo-700 transition-colors disabled:opacity-50">
                Search
              </button>
            </form>

            {history.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-500">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Recent:</span>
                {history.slice(0, 4).map((h, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSearch(undefined, h)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[10px] font-bold transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                  >
                    {h}
                  </button>
                ))}
                {history.length > 4 && (
                  <button onClick={() => setShowHistoryView(true)} className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-widest ml-1">+{history.length - 4} more</button>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-6 rounded-2xl font-bold border border-red-100 dark:border-red-900 animate-in fade-in duration-300">
              <i className="fas fa-info-circle mr-2"></i> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allResults.slice(0, visibleCount).map((res, idx) => (
              <div 
                key={idx} 
                className={`group flex flex-col h-full rounded-[2rem] border-2 transition-all duration-300 overflow-hidden ${
                  res.isBlocked 
                    ? 'opacity-40 grayscale border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pointer-events-none' 
                    : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                {res.thumbnailUrl && (
                  <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={res.thumbnailUrl} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {res.isTrusted && !res.isBlocked && (
                      <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                         <i className="fas fa-check-circle mr-1"></i> Trusted
                      </div>
                    )}
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-black text-sm leading-tight text-slate-900 dark:text-white line-clamp-2 mb-3">
                    {res.isBlocked ? res.title : <a href={res.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{res.title}</a>}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-1">{res.snippet}</p>
                  <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between mt-auto">
                    <span className="text-slate-400 dark:text-slate-600 text-[10px] font-bold truncate max-w-[120px]">{new URL(res.url).hostname}</span>
                    {res.isBlocked ? (
                      <span className="text-red-500 text-[9px] uppercase font-black tracking-widest">Blocked</span>
                    ) : (
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all">
                        <i className="fas fa-arrow-right text-slate-200 dark:text-slate-700 text-xs group-hover:text-indigo-500"></i>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allResults.length > visibleCount && (
            <div className="flex justify-center pt-8">
              <button onClick={() => setVisibleCount(v => v + 6)} className="px-10 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all">Load More Results</button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <i className="fas fa-filter absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600"></i>
              <input type="text" placeholder="Search within history..." className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-white focus:border-indigo-500 outline-none text-sm" value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)} />
            </div>
            <button onClick={onClearHistory} className="px-6 py-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-2 border-red-100 dark:border-red-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Clear All</button>
          </div>
          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {filteredHistory.map((item, idx) => (
              <div key={idx} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-2xl cursor-pointer" onClick={() => handleSearch(undefined, item)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-400"><i className="fas fa-magnifying-glass text-xs"></i></div>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{item}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-times"></i></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchMock;

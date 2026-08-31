import React, { useState, useEffect } from 'react';

const SUGGESTIONS = ['Dracula', 'The Great Gatsby', 'Frankenstein', '1984', 'Pride and Prejudice'];

// Helper to determine greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'A crisp morning to you,';
  if (hour < 18) return 'A productive afternoon to you,';
  return 'A stellar evening to you,';
};

export default function BirthdayRecommender() {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [greeting] = useState(getGreeting());

  const fetchRecommendations = async (searchTitle, directFromCard = false) => {
    const titleToSearch = (searchTitle || query).trim();
    if (!titleToSearch) return;

    if (!directFromCard) {
      setQuery(titleToSearch); // Update the input field if it's not a direct card exploration
    } else {
      setQuery(titleToSearch);
    }
    
    setLoading(true);
    setError('');
    setHasSearched(true);
    
    try {
      const response = await fetch('https://iain-book-recommender.onrender.com/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleToSearch, top_n: 6 })
      });
      
      if (!response.ok) {
        throw new Error('Our neural archivist could not find that specific literary artifact. Try another classic or check spelling.');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err.message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (title) => {
    fetchRecommendations(title);
  };

  const handleCardExplore = (title) => {
    fetchRecommendations(title, true);
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-fuchsia-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[40%] w-[400px] h-[400px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Retro-futuristic static grain overlay for texture */}
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/black-linen.png')] opacity-[0.12] pointer-events-none" />

      <main className="relative max-w-4xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Playful Header Container */}
        <div className="text-center space-y-3 max-w-2xl flex flex-col items-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-200 text-xs font-semibold tracking-wide mb-8 backdrop-blur-md shadow-inner animate-fade-in-down">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            Iain's AI Archivist • Codename: LUNA v2.4
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent transform hover:scale-[1.03] transition-transform duration-300 cursor-pointer">
            Happy 24th, Iain 🚀📚
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed pt-2">
            {greeting} Iain! I am LUNA, your cybernetic librarian. Submit a title and I'll generate semantic vectors to uncover similar literary treasures.
          </p>
        </div>

        {/* Interactive Search Box */}
        <div className="w-full max-w-2xl mt-10">
          <form 
            onSubmit={(e) => { e.preventDefault(); fetchRecommendations(); }}
            className="relative flex items-center group"
          >
            {/* The Outer Glow Ring - Animated on Focus */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-fuchsia-600 rounded-2xl blur opacity-30 group-focus-within:opacity-80 transition duration-300" />
            <div className="relative w-full flex items-center bg-[#0d1425]/90 border border-slate-700/80 rounded-2xl p-2.5 backdrop-blur-2xl shadow-2xl focus-within:border-cyan-500/80 transition-all">
              <span className="pl-4 text-cyan-400 group-focus-within:animate-pulse">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a favored work (e.g. Frankenstein)..."
                className="w-full bg-transparent py-3.5 px-4 text-slate-100 placeholder:text-slate-500 focus:outline-none text-base font-medium tracking-tight"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-black font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-sm whitespace-nowrap cursor-pointer disabled:cursor-not-allowed group-focus-within:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Engaging Archivist...
                  </span>
                ) : 'Execute Exploration'}
              </button>
            </div>
          </form>

          {/* Holographic Chip Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-xs text-slate-400 group">
            <span className="text-slate-500 group-hover:animate-pulse">Discoverable Artifacts:</span>
            {SUGGESTIONS.map((title) => (
              <button
                key={title}
                onClick={() => handleChipClick(title)}
                className="px-3 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/80 hover:text-cyan-200 border border-cyan-800/40 hover:border-cyan-500/50 transition-colors cursor-pointer backdrop-blur-md"
              >
                {title}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Status Display (Error or Loading) */}
        {(error || loading) && (
          <div className="mt-12 w-full max-w-2xl">
            {error && (
              <div className="w-full p-4.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm font-medium tracking-tight text-center backdrop-blur-md shadow-inner animate-pulse-fast">
                ⚠️ {error}
              
              </div>
            )}
            
            {loading && (
              <div className="w-full text-center text-slate-500 text-sm pt-4 flex items-center justify-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                 Connecting to vector space... mapping semantic neighbors...
              </div>
            )}
          </div>
        )}

        {/* Staggered Recommendations Grid */}
        {!loading && recommendations.length > 0 && (
          <div className="w-full mt-12 space-y-4">
            <div className="flex items-center justify-between text-xs tracking-wider uppercase text-cyan-400 font-bold px-1 animate-fade-in-down">
              <span>Artifact Coordinates Discovered</span>
              <span>Vector Similarity (Nearest Neighbor)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 group-hover:animate-subtle-glitch">
              {recommendations.map((book, idx) => {
                const scorePercent = (book.similarity_score * 100).toFixed(1);
                // Create custom circular score display color based on score
                const scoreColor = scorePercent > 90 ? 'cyan' : scorePercent > 80 ? 'fuchsia' : 'slate';
                
                return (
                  <div
                    key={idx}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                    className="group relative p-6 rounded-2xl bg-[#0f1a2d]/80 hover:bg-[#15203a] border border-cyan-900/60 hover:border-cyan-500/50 backdrop-blur-3xl transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between animate-fade-in-up transform hover:scale-[1.01] hover:translate-y-[-2px] cursor-default"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-cyan-200 transition-colors line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        {/* Circular similarity score indicator */}
                        <div className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-slate-900 border-4 border-${scoreColor}-500/30 group-hover:border-${scoreColor}-500/80 transition-colors`}>
                           <span className={`text-${scoreColor}-300 text-sm font-bold font-mono tracking-tighter`}>{scorePercent}%</span>
                        </div>
                      </div>

                      {book.subjects && book.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-1">
                          {book.subjects.slice(0, 3).map((subject, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[11px] font-medium bg-slate-800/80 text-slate-400 px-3 py-1 rounded-md border border-slate-700/60"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-cyan-900/70 flex items-center justify-between text-xs text-slate-500 group">
                      <span className="font-mono text-cyan-800 group-hover:text-cyan-700">COORD: {book.work_id}</span>
                      {/* Discovery Loop Action! */}
                      <button 
                        onClick={() => handleCardExplore(book.title)}
                        className="text-fuchsia-400 group-hover:text-fuchsia-300 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1.5 font-semibold group-hover:scale-105"
                      >
                         Map Artifact
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Refined Empty State */}
        {!loading && hasSearched && recommendations.length === 0 && !error && (
          <div className="mt-16 text-center text-slate-500 text-sm max-w-lg p-10 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed animate-fade-in-up">
            Our archivists successfully navigated the semantic vector space, but found no matches near these coordinates. The specified title might reside beyond our current indexing matrix. Try mapping an established classic artifact.
          </div>
        )}
      </main>
    </div>
  );
}
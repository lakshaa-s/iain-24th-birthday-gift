import React, { useState } from 'react';

const SUGGESTIONS = ['Dracula', 'The Great Gatsby', 'Frankenstein', '1984', 'Pride and Prejudice'];

export default function BirthdayRecommender() {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const fetchRecommendations = async (searchTitle) => {
    const titleToSearch = searchTitle || query;
    if (!titleToSearch.trim()) return;

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
        throw new Error('Title not found in the vector index. Try another classic or check spelling.');
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
    setQuery(title);
    fetchRecommendations(title);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[110px] pointer-events-none" />

      <main className="relative max-w-4xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-xs font-medium tracking-wide mb-6 backdrop-blur-md shadow-inner">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Neural Semantic Search • 24th Edition
        </div>

        {/* Main Title */}
        <div className="text-center space-y-3 max-w-2xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Happy 24th, Iain 📚
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            A bespoke book discovery engine trained on high-dimensional semantic embeddings. Enter any title to map the closest literary coordinates.
          </p>
        </div>

        {/* Search Box */}
        <div className="w-full max-w-2xl mt-10">
          <form 
            onSubmit={(e) => { e.preventDefault(); fetchRecommendations(); }}
            className="relative flex items-center group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
            <div className="relative w-full flex items-center bg-[#111827]/90 border border-slate-700/80 rounded-2xl p-2 backdrop-blur-xl shadow-2xl focus-within:border-indigo-500/80 transition-all">
              <span className="pl-4 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a favorite book (e.g. Dracula)..."
                className="w-full bg-transparent py-3 px-4 text-slate-100 placeholder:text-slate-500 focus:outline-none text-base"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 text-sm whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Embedding...
                  </span>
                ) : 'Explore'}
              </button>
            </div>
          </form>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-400">
            <span className="text-slate-500">Quick test:</span>
            {SUGGESTIONS.map((title) => (
              <button
                key={title}
                onClick={() => handleChipClick(title)}
                className="px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-indigo-950/80 hover:text-indigo-300 border border-slate-700/60 hover:border-indigo-500/40 transition-colors cursor-pointer"
              >
                {title}
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-8 max-w-2xl w-full p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm text-center backdrop-blur-md">
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-10">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse space-y-4">
                <div className="h-5 bg-slate-800 rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-4 bg-slate-800 rounded w-16" />
                  <div className="h-4 bg-slate-800 rounded w-20" />
                </div>
                <div className="h-2 bg-slate-800 rounded w-full mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Recommendations Grid */}
        {!loading && recommendations.length > 0 && (
          <div className="w-full mt-12 space-y-4">
            <div className="flex items-center justify-between text-xs tracking-wider uppercase text-slate-400 font-semibold px-1">
              <span>Nearest Neighbor Matches</span>
              <span>Cosine Similarity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((book, idx) => {
                const scorePercent = (book.similarity_score * 100).toFixed(1);
                return (
                  <div
                    key={idx}
                    className="group relative p-6 rounded-2xl bg-[#111827]/60 hover:bg-[#151e32]/90 border border-slate-800 hover:border-indigo-500/40 backdrop-blur-md transition-all duration-300 shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {book.title}
                        </h3>
                        <span className="shrink-0 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-indigo-950/70 border border-indigo-500/30 text-indigo-300">
                          {scorePercent}%
                        </span>
                      </div>

                      {book.subjects && book.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {book.subjects.slice(0, 3).map((subject, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[11px] font-medium bg-slate-800/80 text-slate-400 px-2.5 py-0.5 rounded-md border border-slate-700/50"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono">ID: {book.work_id}</span>
                      <span className="text-indigo-400/80 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        Rank #{idx + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && hasSearched && recommendations.length === 0 && !error && (
          <div className="mt-12 text-center text-slate-500 text-sm">
            No direct vector neighbors found. Try refining your query.
          </div>
        )}
      </main>
    </div>
  );
}
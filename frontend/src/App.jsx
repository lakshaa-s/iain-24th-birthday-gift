import React, { useState } from 'react';

export default function BirthdayRecommender() {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecommendations = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://iain-book-recommender.onrender.com/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: query, top_n: 5 })
      });
      
      if (!response.ok) throw new Error('Book not found in database. Check spelling or try another title!');
      
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-16 px-4 font-sans">
      <div className="max-w-2xl w-full space-y-8">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-indigo-400">
            Happy 24th, Iain! 🎂
          </h1>
          <p className="text-lg text-slate-400">
            A custom recommendation engine powered by your personal library embeddings. Search a book you love to discover related titles.
          </p>
        </div>

        <form onSubmit={fetchRecommendations} className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a book title (e.g. Dracula)..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 px-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-6 py-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="text-red-400 text-center bg-red-400/10 py-3 rounded-lg border border-red-400/20">
            {error}
          </div>
        )}

        <div className="space-y-4 pt-4">
          {recommendations.map((book, idx) => (
            <div key={idx} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-indigo-500/50 transition-colors">
              <h3 className="text-xl font-bold text-slate-100">{book.title}</h3>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {book.subjects && book.subjects.map((subject, sIdx) => (
                  <span key={sIdx} className="text-xs font-medium bg-slate-700 text-slate-300 px-3 py-1 rounded-full">
                    {subject}
                  </span>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between items-center text-sm text-slate-400 border-t border-slate-700 pt-4">
                <span>Match Score: {(book.similarity_score * 100).toFixed(1)}%</span>
                <span className="font-mono text-xs">{book.work_id}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
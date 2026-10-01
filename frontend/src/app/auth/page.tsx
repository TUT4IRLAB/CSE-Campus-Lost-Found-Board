'use client';

import { useEffect, useState } from 'react';

// Define the blueprint structure for what an item looks like
interface Item {
  id: number;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location: string;
  date_recorded: string;
  image_url?: string;
  status: string;
}

export default function Home() {
  // State variables for tracking backend data array and search criteria
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // Empty string means "All"
  const [loading, setLoading] = useState(true);

  // Hook to pull information from the server as soon as the webpage opens
  useEffect(() => {
    fetchItems();
  }, [typeFilter]); // Reloads lists automatically if the student clicks tabs

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Build search params URL variables safely
      let url = `http://localhost:5000/api/items?`;
      if (typeFilter) url += `type=${typeFilter}&`;
      if (search) url += `search=${search}`;

      const response = await fetch(url);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error connecting to backend database server:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper trigger function when student clicks the search magnifying glass / keyboard Enter key
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* 1. TOP DOCK TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200/80 px-6 py-4 shadow-sm shadow-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">TUT Campus Board</h1>
            <p className="text-xs text-slate-400 font-medium">Real-time Lost & Found Tracking</p>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href="/auth" 
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Sign In
            </a>
            <a 
              href="/post-item" 
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/10 transition"
            >
              Report Item
            </a>
          </div>
        </div>
      </nav>

      {/* 2. BODY MAIN CONTENT SPACE */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* FILTERS & SEARCH ROW BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          
          {/* A. Segmented Control Switch Tabs for Types */}
          <div className="flex items-center bg-slate-200/60 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setTypeFilter('')}
              className={`flex-1 md:flex-none px-5 py-2 text-sm font-bold rounded-lg transition ${typeFilter === '' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All Notices
            </button>
            <button 
              onClick={() => setTypeFilter('lost')}
              className={`flex-1 md:flex-none px-5 py-2 text-sm font-bold rounded-lg transition ${typeFilter === 'lost' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Lost Items
            </button>
            <button 
              onClick={() => setTypeFilter('found')}
              className={`flex-1 md:flex-none px-5 py-2 text-sm font-bold rounded-lg transition ${typeFilter === 'found' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Found Items
            </button>
          </div>

          {/* B. Search Query Form Input */}
          <form onSubmit={handleSearchSubmit} className="flex w-full md:w-96 gap-2">
            <input 
              type="text"
              placeholder="Search by keyword (e.g. Student card, key)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
            />
            <button 
              type="submit"
              className="px-4 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition shadow-sm"
            >
              Search
            </button>
          </form>
        </div>

        {/* 3. GRID CONTENT CONTAINER AREA */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-medium">Fetching active notices from campus servers...</div>
        ) : items.length === 0 ? (
          <div className="text-center bg-white border border-slate-100 rounded-2xl py-16 px-4 shadow-sm">
            <p className="text-lg font-bold text-slate-600">No active notice board postings found</p>
            <p className="text-sm text-slate-400 mt-1">Try adapting your filters or reporting a new item above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6">
                  {/* Item Badging tags */}
                  <span className={`inline-block px-2.5 py-1 text-xs font-black tracking-wider uppercase rounded-md mb-4 ${
                    item.type === 'lost' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {item.type}
                  </span>

                  <h3 className="text-lg font-extrabold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Footer Metadata Blocks */}
                <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100/80 text-xs text-slate-400 font-medium space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="font-bold text-slate-400">📍 Location:</span> {item.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-400">📅 Date:</span> {new Date(item.date_recorded).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

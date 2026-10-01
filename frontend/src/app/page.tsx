'use client';

import { useEffect, useState } from 'react';



interface Item {
  id: number;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location: string;
  date_recorded: string;
  image_url?: string;
  status: string;
  user_id: number;
}
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  // --- AUTHENTICATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true); // Toggles between Login and Register forms
  const [studentNumber, setStudentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // --- NOTICE BOARD STATE ---
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [boardLoading, setBoardLoading] = useState(false);

  // Check if session exists on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsLoggedIn(true);
      setUserToken(token);
      const parsedUser = JSON.parse(storedUser);
      setCurrentUserId(parsedUser.id);
    }
  }, []);

  // Fetch notices automatically when authenticated
  useEffect(() => {
    if (isLoggedIn) {
      fetchItems();
    }
  }, [isLoggedIn, typeFilter]);

  // --- HANDLING LOGIN AND REGISTRATION SUBMISSIONS ---
   const handleAuthSubmit = async (e: any) => {
    e.preventDefault();
    setAuthMessage('');
    setIsAuthError(false);

    // Determine backend target dynamically
    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';
    const backendUrl = `http://localhost:5000${endpoint}`;

    const payload = isLoginView
      ? { student_number: studentNumber, password }
      : { student_number: studentNumber, first_name: firstName, last_name: lastName, email, password };

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      if (isLoginView) {
        // Successful Login flow
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUserToken(data.token);
        setCurrentUserId(data.user.id);
        setIsLoggedIn(true);
      } else {
        // Successful Registration flow
        setIsAuthError(false);
        setAuthMessage('Registration successful! You can now sign in.');
        setIsLoginView(true); // Switch user directly to login pane
        setPassword(''); // Clear secret string input field value safely
      }
    } catch (error: any) {
      setIsAuthError(true);
      setAuthMessage(error.message || 'Could not connect to authentication gateway server.');
    }
  };

  // --- HANDLING LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserToken(null);
    setCurrentUserId(null);
    setItems([]);
  };

  // --- FETCH FEED ---
  const fetchItems = async () => {
    setBoardLoading(true);
    try {
      let url = `http://localhost:5000/api/items?`;
      if (typeFilter) url += `type=${typeFilter}&`;
      if (search) url += `search=${search}`;

      const response = await fetch(url);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setBoardLoading(false);
    }
  };

  // --- RESOLVING AN ITEM ---
  const handleResolveItem = async (itemId: number) => {
    if (!userToken) return;

    if (!confirm('Are you sure you want to mark this item as found/resolved? It will be removed from the active notice board.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/items/${itemId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update item status.');
      }

      fetchItems();
    } catch (error: any) {
      alert(error.message || 'Error updating item status.');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  // ========================================================
  // VIEW SCREEN 1: DYNAMIC GATEKEEPER COMPONENT (LOGIN / REGISTER PANE)
  // ========================================================
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-blue-600 tracking-tight">TUT Campus Board</h2>
            <p className="mt-2 text-sm text-slate-500">
              {isLoginView ? 'Sign in to access the system registry' : 'Create your student system profile'}
            </p>
          </div>

          {authMessage && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-medium border ${
              isAuthError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {authMessage}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Student Number</label>
              <input 
                type="text" required value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} 
                className="w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-700" 
                placeholder="e.g. 224874316"
              />
            </div>

            {/* Injected Registration Fields Render Block */}
            {!isLoginView && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
                    <input 
                      type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Surname</label>
                    <input 
                      type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">TUT Email Address</label>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                    placeholder="student@tut4life.ac.za"
                    className="w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-700"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Security Password</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-700" 
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="w-full py-3.5 mt-2 rounded-xl bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700 transition">
              {isLoginView ? 'Unlock Access Board' : 'Register Account'}
            </button>
          </form>

          {/* DYNAMIC REGISTER LINK SWITCH TOGGLE */}
          <div className="mt-6 text-center text-sm">
            <button 
              onClick={() => { setIsLoginView(!isLoginView); setAuthMessage(''); }}
              className="text-blue-600 hover:underline font-semibold"
            >
              {isLoginView ? "Don't have an account? Sign up here" : "Already have an account? Log in here"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW SCREEN 2: NOTICE BOARD TIMELINE FEED
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200/80 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">TUT Campus Board</h1>
            <p className="text-xs text-slate-400 font-medium">Authorized Student Access Session Active</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition">Sign Out</button>
            <a href="/post-item" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition">Report Item</a>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center bg-slate-200/60 p-1 rounded-xl w-full md:w-auto">
            <button onClick={() => setTypeFilter('')} className={`px-5 py-2 text-sm font-bold rounded-lg transition ${typeFilter === '' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>All Notices</button>
            <button onClick={() => setTypeFilter('lost')} className={`px-5 py-2 text-sm font-bold rounded-lg transition ${typeFilter === 'lost' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Lost Items</button>
            <button onClick={() => setTypeFilter('found')} className={`px-5 py-2 text-sm font-bold rounded-lg transition ${typeFilter === 'found' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Found Items</button>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex w-full md:w-96 gap-2">
            <input type="text" placeholder="Search item keywords..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border text-sm" />
            <button type="submit" className="px-4 py-2.5 text-sm font-bold text-white bg-slate-800 rounded-xl">Search</button>
          </form>
        </div>

        {boardLoading ? (
          <div className="text-center py-12 text-slate-400 font-medium">Consulting digital database pool archive...</div>
        ) : items.length === 0 ? (
          <div className="text-center bg-white border rounded-2xl py-16 px-4"><p className="text-lg font-bold text-slate-600">No active notices logged on system</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden group">
                
                {/* Image layout container */}
                {item.image_url && item.image_url.startsWith('data:image') && (
                  <div className="w-full h-48 overflow-hidden bg-slate-100 border-b border-slate-100">
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-block px-2.5 py-1 text-xs font-black uppercase rounded-md ${item.type === 'lost' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.type}</span>
                    {item.user_id === currentUserId && (
                      <button 
                        onClick={() => handleResolveItem(item.id)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline border border-emerald-200 bg-emerald-50 px-2 py-1 rounded-md transition"
                      >
                        ✓ Mark as Found
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-blue-600 transition">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{item.description}</p>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t text-xs text-slate-400 space-y-1">
                  <div>📍 <span className="font-bold">Location:</span> {item.location}</div>
                  <div>📅 <span className="font-bold">Date:</span> {new Date(item.date_recorded).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

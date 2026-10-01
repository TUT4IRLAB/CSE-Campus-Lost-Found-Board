'use client';

import { useState, useEffect } from 'react';

export default function PostItemPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('lost');
  const [location, setLocation] = useState('');
  const [dateRecorded, setDateRecorded] = useState('');
  const [imageBase64, setImageBase64] = useState<string>(''); // Holds file conversion text string
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsError(true);
      setMessage('Access Denied. You must log in first to report items.');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } else {
      setUserToken(token);
    }
  }, []);

  // Handler function to read image file and encode it to base64 text
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject files larger than 2MB to protect database performance storage margins
    if (file.size > 2 * 1024 * 1024) {
      alert('File size too large. Please select an image under 2MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string); // Stores the string value
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!userToken) return;

    try {
      const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendBaseUrl}/api/items`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          title,
          description,
          type,
          location,
          date_recorded: dateRecorded,
          image_url: imageBase64 || null // Sends the Base64 image text string to the API
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit the posting.');
      }

      setIsError(false);
      setMessage('Notice successfully posted with image to the public campus feed!');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error: any) {
      setIsError(true);
      setMessage(error.message || 'Error communicating with server.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Report Campus Item</h2>
            <p className="text-xs text-slate-400 mt-0.5">Publish a notice to the university bulletin directory</p>
          </div>
          <a href="/" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Cancel and Return
          </a>
        </div>

        {message && (
          <div className={`p-4 mb-5 rounded-xl text-sm font-medium border ${
            isError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notice Type</label>
              <select 
                value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 font-bold text-slate-700"
              >
                <option value="lost">🛑 Lost Item</option>
                <option value="found">✅ Found Item</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date Misplaced / Discovered</label>
              <input 
                type="date" required value={dateRecorded} onChange={(e) => setDateRecorded(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Item Headline Title</label>
            <input 
              type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken screen iPhone 13 or Student ID Card"
              className="w-full px-4 py-2.5 rounded-xl border text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Campus Physical Location Reference</label>
            <input 
              type="text" required value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Building 4 Room 118 or Main Gate Cafeteria"
              className="w-full px-4 py-2.5 rounded-xl border text-slate-700"
            />
          </div>

          {/* IMAGE ATTACHMENT COMPONENT ELEMENT FILE PICKER */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Attach Item Photograph</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition"
            />
            {imageBase64 && (
              <div className="mt-3 relative w-32 h-32 border rounded-xl overflow-hidden bg-slate-50">
                <img src={imageBase64} alt="Preview file capture thumbnail" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Detailed Description / Instructions</label>
            <textarea 
              rows={3} required value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide explicit descriptive attributes..."
              className="w-full px-4 py-2.5 rounded-xl border text-slate-700 resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={!userToken}
            className="w-full py-3.5 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-extrabold text-white shadow-md transition disabled:bg-slate-300"
          >
            Publish Notice Board Post
          </button>

        </form>
      </div>
    </div>
  );
}

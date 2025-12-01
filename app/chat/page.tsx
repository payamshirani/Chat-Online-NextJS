'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!name.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('name', data.name);
        window.location.href = '/chat';
      } else {
        alert('خطایی رخ داد!');
      }
    } catch (err) {
      alert('اتصال به سرور برقرار نشد!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-8">چت روم تلگرامی</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && login()}
          placeholder="اسمت چیه؟"
          className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-full focus:outline-none focus:border-indigo-500 transition mb-8"
          disabled={loading}
        />
        <button
          onClick={login}
          disabled={loading || !name.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-5 rounded-full text-2xl transition shadow-xl"
        >
          {loading ? 'در حال ورود...' : 'ورود به چت'}
        </button>
      </div>
    </div>
  );
}
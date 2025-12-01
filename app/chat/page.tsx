'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as signalR from '@microsoft/signalr';

interface Message {
  id: string;
  name: string;
  text: string;
  time: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // امنیت: اگر توکن نبود → برگردون به صفحه ورود
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/');
      return;
    }
  }, [router]);

  const myName = typeof window !== 'undefined' ? localStorage.getItem('name') || 'بی‌نام' : 'بی‌نام';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://192.168.137.44:5028/chathub', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.start()
      .then(() => {
        setConnected(true);
        console.log('SignalR متصل شد');
      })
      .catch(err => console.error('اتصال SignalR شکست خورد:', err));

    connection.on('ReceiveMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    connection.on('UserJoined', (id: string, name: string) => {
      setMessages(prev => [...prev, { id: '', name: '', text: `${name} وارد چت شد`, time: '' }]);
    });

    connection.on('UserLeft', () => {
      // اختیاری: می‌تونی اینجا هم اطلاع بدی
    });

    return () => {
      connection.stop();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !connectionRef.current) return;
    connectionRef.current.invoke('SendMessage', input.trim());
    setInput('');
  };

  if (!localStorage.getItem('token')) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-xl">در حال انتقال به صفحه ورود...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* هدر */}
      <header className="bg-indigo-600 text-white p-5 shadow-lg">
        <h1 className="text-2xl font-bold">چت روم تلگرامی</h1>
        <p className="text-sm opacity-90">خوش اومدی {myName}!</p>
      </header>

      {/* لیست پیام‌ها */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.id === connectionRef.current?.connectionId ? 'justify-end' : 'justify-start'}`}
          >
            {m.text.includes('وارد چت شد') ? (
              <p className="text-center text-gray-500 italic text-sm w-full">{m.text}</p>
            ) : (
              <div
                className={`max-w-xs md:max-w-md px-5 py-3 rounded-2xl shadow ${
                  m.id === connectionRef.current?.connectionId
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {m.id !== connectionRef.current?.connectionId && (
                  <p className="font-bold text-indigo-600 text-sm mb-1">{m.name}</p>
                )}
                <p className="break-words">{m.text}</p>
                <p className="text-xs opacity-70 text-right mt-1">{m.time}</p>
              </div>
            )}
          </div>
        ))}
        {typingUsers.length > 0 && (
          <p className="text-gray-500 italic text-sm text-center">
            {typingUsers.join('، ')} در حال تایپ...
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ورودی پیام */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="پیام بزن..."
            className="flex-1 px-5 py-4 border rounded-full focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold transition"
          >
            ارسال
          </button>
        </div>
      </div>
    </div>
  );
}
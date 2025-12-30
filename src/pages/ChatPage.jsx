import React, { useEffect, useMemo, useState } from 'react';
import { formatSundayLabel } from '../lib/date.js';

export default function ChatPage({ week, onToast }) {
  const weekKey = week?.sunday ?? 'unknown';
  const CHAT_KEY = useMemo(() => `zamar_chat_${weekKey}`, [weekKey]);

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      if (!raw) return [{ id: 'seed', author: 'System', text: 'Chat is ready. (mock)' }];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [{ id: 'seed', author: 'System', text: 'Chat is ready. (mock)' }];
    }
  });

  const [author, setAuthor] = useState('Anonymous');
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      if (!raw) {
        setMessages([{ id: 'seed', author: 'System', text: 'Chat is ready. (mock)' }]);
        return;
      }
      const parsed = JSON.parse(raw);
      setMessages(Array.isArray(parsed) ? parsed : []);
    } catch {
      setMessages([{ id: 'seed', author: 'System', text: 'Chat is ready. (mock)' }]);
    }
  }, [CHAT_KEY]);

  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages, null, 2));
  }, [CHAT_KEY, messages]);

  function submit() {
    const t = text.trim();
    if (!t) return;
    const a = author.trim() || 'Anonymous';
    setMessages((prev) => [{ id: String(Date.now()), author: a, text: t }, ...prev]);
    setText('');
    onToast?.('Message posted');
  }

  return (
    <section className="card">
      <div className="cardHead">
        <div>
          <div className="weekLabel">{week ? formatSundayLabel(week.sunday) : '-'}</div>
          <div className="weekHint">Casual messages for this week (mock).</div>
        </div>
      </div>

      <div className="chat">
        <div className="chatComposer">
          <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
          <div className="chatRow">
            <input
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Say something…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
            <button className="primaryBtn" onClick={submit} style={{ minWidth: 96 }}>
              Post
            </button>
          </div>
          <div className="chatHint">Stored per-week in localStorage (mock).</div>
        </div>

        <div className="chatList" aria-label="Chat messages">
          {messages.map((m) => (
            <div key={m.id} className="bubble">
              <div className="bubbleHead">
                <div className="bubbleAuthor">{m.author}</div>
              </div>
              <div className="bubbleText">{m.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

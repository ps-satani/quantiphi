import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';

export default function ChatWidget({ username, assistant }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([]);
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);
    try {
      const { reply, mode } = await api.chat(username, question, history);
      setMessages((m) => [...m, { role: 'assistant', content: reply, mode }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: err.message, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button className="chat-fab" onClick={() => setOpen(true)}>
        Ask about @{username}
      </button>
    );
  }

  return (
    <div className="chat-panel" role="dialog" aria-label="Portfolio assistant">
      <div className="chat-head">
        <strong>Portfolio assistant</strong>
        <span className="muted">{assistant.aiEnabled ? 'AI' : 'Rule-based'}</span>
        <button className="ghost close" onClick={() => setOpen(false)} aria-label="Close">×</button>
      </div>

      <div className="chat-body">
        {messages.length === 0 && (
          <div className="chat-suggestions">
            <p className="muted">Ask anything about this developer's GitHub work:</p>
            {assistant.suggestions.map((q) => (
              <button key={q} className="ghost suggestion" onClick={() => ask(q)}>{q}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}${m.error ? ' error' : ''}`}>{m.content}</div>
        ))}
        {loading && <div className="msg assistant muted">Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. Do they know Docker?" maxLength={500} />
        <button type="submit" disabled={loading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}

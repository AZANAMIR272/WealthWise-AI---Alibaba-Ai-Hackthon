'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Loader2, Bot, Volume2, User } from 'lucide-react';
import { useLang } from '@/lib/i18n';

interface ChatMsg {
  role: 'user' | 'bot';
  text: string;
  time: string;
  factors?: string[];
}

export function FloatingChat() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'bot', text: lang === 'en'
      ? 'Assalam o Alaikum! I\'m your AI Financial Coach. Ask me anything — in English, Urdu, or Roman Urdu! 🇵🇰'
      : 'السلام علیکم! میں آپ کا AI مالی کوچ ہوں۔ مجھ سے کچھ بھی پوچھیں — انگریزی، اردو یا رومن اردو میں! 🇵🇰',
      time: now(), factors: [] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  function now() {
    return new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  }

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice commands not supported in this browser. Try Chrome.'); return; }

    const recognition = new SR();
    recognition.lang = 'ur-PK';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => sendMsg(transcript), 300);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, []);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const clean = text.replace(/\*\*/g, '').replace(/[#•\-]/g, '').replace(/\n/g, '. ');
    const utter = new SpeechSynthesisUtterance(clean.slice(0, 500));
    utter.lang = 'ur-PK';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  };

  const sendMsg = async (text?: string) => {
    const q = text || input;
    if (!q.trim() || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text: q, time: now() }]);
    setLoading(true);

    try {
      const history = msgs.map(m => ({ role: m.role === 'user' ? 'user' : 'coach', content: m.text }));
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history }),
      });

      // Add empty bot message immediately, then fill it as stream arrives
      const botIdx = Date.now();
      setMsgs(prev => [...prev, { role: 'bot', text: '', time: now() }]);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let factors: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Check for metadata marker
        const metaIdx = fullText.indexOf('\n__META__');
        if (metaIdx >= 0) {
          try {
            const meta = JSON.parse(fullText.slice(metaIdx + 9));
            factors = meta.factors || [];
          } catch {}
          fullText = fullText.slice(0, metaIdx);
          break;
        }

        // Update bot message in real-time
        const displayText = fullText.trim();
        setMsgs(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'bot') {
            updated[updated.length - 1] = { ...last, text: displayText };
          }
          return updated;
        });
      }

      // Final update with metadata
      const finalText = fullText.trim() || (lang === 'en' ? 'Sorry, I couldn\'t respond right now.' : 'معذرت، ابھی جواب نہیں دے سکتا۔');
      setMsgs(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'bot') {
          updated[updated.length - 1] = { ...last, text: finalText, factors };
        }
        return updated;
      });
    } catch {
      setMsgs(prev => [...prev, { role: 'bot', text: lang === 'en' ? 'Connection error. Please try again.' : 'کنکشن خرابی۔ دوبارہ کوشش کریں۔', time: now() }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = lang === 'en'
    ? ['How is my health score?', 'What\'s my safe-to-spend?', 'Where am I overspending?', 'Is my emergency fund OK?']
    : ['میرا صحت اسکور کیسا ہے؟', 'خرچ کرنے کی حد کتنی ہے؟', 'کہاں زیادہ خرچ ہو رہا ہے؟', 'ایمرجنسی فنڈ ٹھیک ہے؟'];

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-2xl shadow-emerald-500/40 hover:scale-110 transition-all flex items-center justify-center group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center text-[8px] font-bold text-emerald-900 animate-pulse">AI</span>
          <span className="absolute right-16 bg-surface-secondary text-text-primary text-xs px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border-secondary">
            {lang === 'en' ? 'Chat with AI Coach' : 'AI کوچ سے بات کریں'}
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-3 lg:bottom-4 lg:right-4 z-50 w-[380px] max-w-[calc(100vw-1.5rem)] h-[560px] max-h-[calc(100vh-8.5rem)] lg:max-h-[calc(100vh-6rem)] rounded-2xl bg-surface-primary border border-border-secondary shadow-2xl shadow-black/20 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold">WealthWise AI Coach</p>
                <p className="text-[10px] text-emerald-100/80">{lang === 'en' ? 'Online • Urdu / English / Roman Urdu' : 'آن لائن • اردو / انگریزی / رومن اردو'}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-secondary/50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-surface-primary border border-border-secondary text-text-primary rounded-bl-md'
                }`}>
                  {m.role === 'bot' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Bot className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-semibold text-emerald-600">AI Coach</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  {m.factors && m.factors.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border-secondary/50">
                      <p className="text-[10px] font-semibold text-emerald-600 mb-1">{lang === 'en' ? 'Why?' : 'کیوں؟'}</p>
                      {m.factors.slice(0, 3).map((f, j) => (
                        <p key={j} className="text-[10px] text-text-muted">• {f}</p>
                      ))}
                    </div>
                  )}
                  <div className={`flex items-center gap-2 mt-1.5 ${m.role === 'user' ? 'justify-end' : 'justify-between'}`}>
                    <span className="text-[10px] opacity-50">{m.time}</span>
                    {m.role === 'bot' && (
                      <button onClick={() => speak(m.text)} className="p-0.5 rounded hover:bg-emerald-500/10 transition-colors" title={lang === 'en' ? 'Listen' : 'سنیں'}>
                        <Volume2 className="w-3 h-3 text-emerald-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-primary border border-border-secondary rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                    <span className="text-xs text-text-muted">{lang === 'en' ? 'Thinking...' : 'سوچ رہا ہوں...'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          {msgs.length <= 2 && (
            <div className="px-3 py-2 border-t border-border-secondary flex gap-1.5 overflow-x-auto">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMsg(q)}
                  className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border-secondary bg-surface-primary">
            <div className="flex items-center gap-2">
              <button
                onClick={listening ? stopListening : startListening}
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-surface-tertiary text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10'
                }`}
                title={listening ? (lang === 'en' ? 'Stop listening' : 'سننا بند کریں') : t('voiceCmd')}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                placeholder={listening
                  ? (lang === 'en' ? '🎤 Listening...' : '🎤 سن رہا ہوں...')
                  : (lang === 'en' ? 'Ask anything...' : 'کچھ بھی پوچھیں...')}
                className="flex-1 px-3 py-2 rounded-xl bg-surface-secondary border border-border-secondary text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />

              <button
                onClick={() => sendMsg()}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {listening && (
              <p className="text-[10px] text-center text-red-500 mt-1.5 animate-pulse">
                {lang === 'en' ? '🎤 Listening... Speak in Urdu/English' : '🎤 سن رہا ہوں... اردو/انگریزی میں بولیں'}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

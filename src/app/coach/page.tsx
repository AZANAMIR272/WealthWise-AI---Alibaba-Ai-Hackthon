'use client';
import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useCurrentUser } from '@/lib/use-current-user';
import { LogoIcon } from '@/components/logo';
import { useLang } from '@/lib/i18n';
import { TrendingUp, Send, Loader2, Bot, User, Lightbulb, Brain, Mic, MicOff, Volume2 } from 'lucide-react';

interface Message {
  role: 'user' | 'coach';
  content: string;
  factors?: string[];
  timestamp: Date;
}

const SUGGESTIONS = [
  "Why is my financial health score low?",
  "Where am I spending too much?",
  "How can I save Rs. 20,000?",
  "Can I afford a Rs. 60,000 laptop?",
  "How long to build an emergency fund?",
  "Mera financial score kaisa hai?",
  "Meri savings kaise barha sakte hain?",
  "Kya main emergency fund ke liye kaafi save kar raha hoon?",
];

export default function CoachPage() {
  const currentUser = useCurrentUser();
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'coach',
      content: lang === 'en'
        ? `Assalam o Alaikum! I'm your AI Financial Coach. I analyze your **actual financial data** to give you personalized advice — not generic tips.\n\nAsk me anything about your finances in English, Urdu, or Roman Urdu:\n• "Why is my health score low?"\n• "Where am I spending too much?"\n• "How can I save more?"\n• "Can I afford this?"\n\nEvery recommendation includes a **Why?** explanation so you understand the reasoning.`
        : `السلام علیکم! میں آپ کا AI مالی کوچ ہوں۔ میں آپ کا **اصل مالی ڈیٹا** تجزیہ کر کے آپ کو ذاتی مشورہ دیتا ہوں — عام نہیں۔\n\nمجھ سے اپنے مالیات کے بارے میں پوچھیں:\n• "میرا صحت اسکور کیوں کم ہے؟"\n• "میں کہاں زیادہ خرچ کر رہا ہوں؟"\n• "میں مزید کیسے بچا سکتا ہوں؟"\n\nہر سفارش میں **کیوں؟** وضاحت شامل ہے۔`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice commands not supported. Use Chrome browser.'); return; }
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
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); setListening(false); }
  };

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const clean = text.replace(/\*\*/g, '').replace(/[#•\-]/g, '').replace(/\n/g, '. ');
    const utter = new SpeechSynthesisUtterance(clean.slice(0, 600));
    utter.lang = 'ur-PK';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = async (text?: string) => {
    const question = text || input;
    if (!question.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: question, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'coach',
        content: data.answer || (lang === 'en' ? 'Sorry, I had trouble responding. Please try again.' : 'معذرت، مجھے جواب دینے میں مشکل ہوئی۔ دوبارہ کوشش کریں۔'),
        factors: data.factors,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'coach',
        content: lang === 'en' ? 'I had some difficulty. Please try again.' : 'مجھے ابھی تھوڑی مشکل ہو رہی ہے۔ دوبارہ کوشش کریں۔',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar userName={currentUser?.name || 'User'} />
      <main className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col max-w-[900px] w-full mx-auto p-4 lg:p-8 pt-16 lg:pt-8">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <LogoIcon size="md" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t('coachTitle')}</h1>
                <p className="text-muted text-xs font-medium">{t('coachSubtitle')} • {lang === 'en' ? 'Urdu / English / Roman Urdu' : 'اردو / انگریزی / رومن اردو'}</p>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'coach' && (
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-500" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-surface border border-surface-border text-foreground rounded-bl-md'
                }`}>
                  <div className="text-sm whitespace-pre-line leading-relaxed">
                    {msg.content.split('**').map((part, j) =>
                      j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : <span key={j}>{part}</span>
                    )}
                  </div>
                  {msg.factors && msg.factors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-surface-border/50">
                      <p className="text-[10px] font-semibold text-primary-500 mb-1.5 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> {t('why')}
                      </p>
                      {msg.factors.map((f, j) => (
                        <p key={j} className="text-[10px] text-muted">• {f}</p>
                      ))}
                    </div>
                  )}
                  {msg.role === 'coach' && i > 0 && (
                    <button onClick={() => speakResponse(msg.content)} className="mt-2 flex items-center gap-1 text-[10px] text-primary-500 hover:text-primary-400 transition-colors">
                      <Volume2 className="w-3 h-3" /> {lang === 'en' ? 'Listen' : 'سنیں'}
                    </button>
                  )}
                  <p className={`text-[9px] mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-foreground/60'}`}>
                    {msg.timestamp.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gold-500" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-500" />
                </div>
                <div className="bg-surface border border-surface-border rounded-2xl px-4 py-3 rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                    <span className="text-sm text-muted">{lang === 'en' ? 'Analyzing your financial data...' : 'آپ کے مالی ڈیٹا کا تجزیہ ہو رہا ہے...'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="mb-3">
              <p className="text-xs text-muted mb-2">{lang === 'en' ? 'Try asking:' : 'یہ پوچھ کر دیکھیں:'}</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-[11px] text-foreground/80 hover:text-foreground hover:border-primary-500/30 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <button
              onClick={listening ? stopListening : startListening}
              className={`flex-shrink-0 w-12 rounded-xl flex items-center justify-center transition-all ${
                listening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-surface border border-surface-border text-muted hover:text-primary-500'
              }`}
              title={listening ? 'Stop' : t('voiceCmd')}
            >
              {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={listening
                ? (lang === 'en' ? '🎤 Listening... Speak in Urdu/English' : '🎤 سن رہا ہوں... اردو/انگریزی میں بولیں')
                : t('askCoach')}
              className="flex-1 px-4 py-3 rounded-xl bg-surface border border-surface-border text-foreground placeholder-muted/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-xl bg-primary-600 text-white font-medium text-sm hover:bg-primary-500 transition-colors disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {listening && (
            <p className="text-center text-xs text-red-500 mt-2 animate-pulse">
              {lang === 'en' ? '🎤 Listening... Speak in Urdu or English' : '🎤 سن رہا ہوں... اردو یا انگریزی میں بولیں'}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

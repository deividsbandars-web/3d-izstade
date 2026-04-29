import { useState, useEffect, useRef } from 'react';
import { expoService } from '../../services/expoService';
import '../../components/calculator/styles/CalculatorPro.css';
import {
  GLOBAL_CHAT_OPEN_EVENT,
  type GlobalChatOpenDetail,
} from './globalChatEvents';

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [shouldFocusInput, setShouldFocusInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Async wrapper to avoid synchronous setState during render
      const initChat = async () => {
        try {
          const data = await expoService.getMessages();
          setMessages(data);
        } catch (e) {
          console.error(e);
        }
      };
      
      initChat();

      const sub = expoService.subscribeToChat((payload) => {
        setMessages(prev => [...prev, payload.new]);
      });
      return () => { sub.unsubscribe(); };
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const onOpenChat = (event: Event) => {
      const detail = (event as CustomEvent<GlobalChatOpenDetail>).detail;
      setShouldFocusInput(detail?.focusInput !== false);
      setIsOpen(true);
    };

    window.addEventListener(GLOBAL_CHAT_OPEN_EVENT, onOpenChat as EventListener);
    return () => {
      window.removeEventListener(GLOBAL_CHAT_OPEN_EVENT, onOpenChat as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !shouldFocusInput) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      setShouldFocusInput(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen, shouldFocusInput]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    try {
      await expoService.sendMessage(msg);
      // AI Response Simulation
      if (msg.toLowerCase().includes('hello') || msg.toLowerCase().includes('čau')) {
        setTimeout(() => expoService.sendMessage("Hello! I am Warpala AI Support. How can I help you with your project today?", true), 1000);
      } else if (msg.toLowerCase().includes('kalkulator') || msg.toLowerCase().includes('aprēķināt')) {
        setTimeout(() => expoService.sendMessage("Sveiki! Dodieties uz sadaļu 'CALCULATORS' augšējā izvēlnē, lai izmantotu mūsu rīkus.", true), 1000);
      } else {
        setTimeout(() => expoService.sendMessage("Esmu saņēmis jūsu ziņu. Kā AI aģents es drīzumā sniegšu atbildi.", true), 1000);
      }
    } catch (err) { console.error(err); }
  }

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Jūsu pārlūks neatbalsta balss atpazīšanu.');
      return;
    }
    
    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'lv-LV';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
      {/* CHAT BUBBLE */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          aria-label="Open global chat"
          style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          💬
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="glass-card" style={{ width: '350px', height: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div style={{ padding: '15px 20px', background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
              WARPALA LIVE SUPPORT
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.is_ai ? 'flex-start' : 'flex-end', maxWidth: '80%', padding: '12px 15px', borderRadius: '15px', background: m.is_ai ? 'rgba(255,255,255,0.05)' : '#3b82f6', color: '#fff', fontSize: '0.85rem', position: 'relative' }}>
                {m.content}
                <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '5px', textAlign: m.is_ai ? 'left' : 'right' }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
            <input 
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type or speak..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 15px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            />
            <button 
              type="button" 
              onClick={toggleVoice}
              style={{ 
                background: isListening ? '#ef4444' : 'rgba(255,255,255,0.1)', 
                border: 'none', borderRadius: '10px', width: '40px', color: '#fff', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              🎤
            </button>
            <button type="submit" style={{ display: 'none' }}></button>
          </form>
        </div>
      )}
    </div>
  );
}

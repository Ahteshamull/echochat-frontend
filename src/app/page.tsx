'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  Zap, 
  Shield, 
  ArrowRight, 
  CheckCircle,
  Code,
  Laptop,
  Flame
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  const [simMessages, setSimMessages] = useState([
    { sender: 'other', name: 'Ada Lovelace', text: 'Can everyone see new messages in real-time?', time: '05:20 PM' },
    { sender: 'me', name: 'Me', text: 'Yes, syncing instantly without reload!', time: '05:21 PM' }
  ]);
  const [simInput, setSimInput] = useState('');
  const [isSimTyping, setIsSimTyping] = useState(false);
  const simMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll simulator messages
  useEffect(() => {
    simMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages, isSimTyping]);

  const handleSimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim()) return;

    const userMsg = simInput;
    setSimInput('');

    // Append user message
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSimMessages(prev => [...prev, {
      sender: 'me',
      name: 'Me',
      text: userMsg,
      time: timeStr
    }]);

    // Trigger typing response
    setTimeout(() => {
      setIsSimTyping(true);
      
      setTimeout(() => {
        setIsSimTyping(false);
        const botResponses = [
          "Wow, that was fast! The real EchoChat application uses the exact same instant sync mechanism.",
          "Indeed! EchoChat relies on optimized WebSockets (Socket.io) to deliver messages with sub-second latency.",
          "Did you notice how the chat container automatically scrolled down to display this message? That's our smart scroll lock at work!",
          "Feel free to click the 'Get Started' button above to experience the real dashboard with multi-user group chat!"
        ];
        const randomReply = botResponses[Math.floor(Math.random() * botResponses.length)];
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        setSimMessages(prev => [...prev, {
          sender: 'other',
          name: 'Ada Lovelace',
          text: randomReply,
          time: replyTime
        }]);
      }, 1500);
    }, 800);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  } as const;

  return (
    <div className="flex flex-col min-h-screen bg-bg-midnight gradient-bg overflow-x-hidden relative">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full border-b border-border-line glass-panel sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              Echo<span className="text-indigo-400">Chat</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#tech" className="hover:text-white transition-colors">Tech Stack</a>
            <a href="#about" className="hover:text-white transition-colors">Assignment Details</a>
          </nav>

          <div className="flex items-center space-x-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all flex items-center justify-center"
              title="GitHub Repository"
            >
              <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>

            {isAuthenticated ? (
              <Link 
                href="/chat"
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link 
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 flex flex-col items-center flex-1 relative z-10">
        <motion.div 
          className="text-center max-w-3xl space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>Premium Web Application</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            A New Era of <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-400 bg-clip-text text-transparent">
              Real-Time Messaging
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            EchoChat brings together state-of-the-art WebSockets, a premium glassmorphic interface, and seamless synchronization.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href={isAuthenticated ? "/chat" : "/login"}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <a 
              href="#features"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-center"
            >
              Explore Features
            </a>
          </div>
        </motion.div>

        {/* Animated App Mockup Preview */}
        <motion.div 
          className="w-full max-w-4xl mt-16 md:mt-24 relative"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Glowing backdrop under mockup */}
          <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-3xl pointer-events-none transform translate-y-10" />
          
          <div className="glass-effect rounded-3xl p-3 border border-white/10 shadow-2xl relative overflow-hidden aspect-[16/9] flex">
            {/* Sidebar Mockup */}
            <div className="w-[30%] border-r border-white/5 pr-3 hidden sm:flex flex-col space-y-3">
              <div className="h-10 bg-white/5 rounded-xl flex items-center px-3 text-xs text-slate-400">
                Search...
              </div>
              <div className="flex-1 space-y-2 overflow-hidden">
                {[
                  { name: 'Awesome Group', msg: 'Good morning everyone! 👋', type: 'group', unread: true },
                  { name: 'Ada Lovelace', msg: 'The API client is working perfectly!', type: 'direct', unread: false },
                  { name: 'Alan Turing', msg: 'Websocket channel connected.', type: 'direct', unread: false }
                ].map((chat, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl flex items-center space-x-2.5 transition-all ${idx === 0 ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs">
                      {chat.name[0]}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white truncate">{chat.name}</span>
                        {chat.unread && <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{chat.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area Mockup */}
            <div className="flex-1 flex flex-col pl-3">
              <div className="h-10 border-b border-white/5 flex items-center justify-between pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                    A
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Awesome Group</span>
                    <span className="text-[8px] text-teal-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping" />
                      <span>Real-time connected</span>
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-slate-300">3 members</span>
                </div>
              </div>

              {/* Chat bubbles container */}
              <div className="flex-1 py-2 overflow-y-auto max-h-[170px] custom-scrollbar flex flex-col space-y-3 p-1 text-xs text-left">
                {simMessages.map((msg, idx) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-start space-x-2 ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}
                    >
                      {!isMe && (
                        <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">
                          AL
                        </div>
                      )}
                      <div className={`p-2.5 rounded-2xl max-w-[80%] ${
                        isMe 
                          ? 'bg-bg-bubble-me text-white rounded-tr-none text-right' 
                          : 'bg-bg-bubble-other text-slate-100 rounded-tl-none text-left'
                      }`}>
                        {!isMe && <p className="font-semibold text-[8px] text-indigo-400 mb-0.5">{msg.name}</p>}
                        <p className="text-[10px] leading-relaxed break-words">{msg.text}</p>
                        <span className="text-[7.5px] text-white/40 block mt-1 text-right">{msg.time}</span>
                      </div>
                      {isMe && (
                        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">
                          ME
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {isSimTyping && (
                  <div className="flex items-start space-x-2 animate-pulse self-start justify-start">
                    <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                      AL
                    </div>
                    <div className="p-2 py-1.5 rounded-2xl rounded-tl-none bg-bg-bubble-other text-slate-400 max-w-[70%]">
                      <span className="text-[9px] flex items-center space-x-1">
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={simMessagesEndRef} />
              </div>

              {/* Input Mockup Form */}
              <form 
                onSubmit={handleSimSubmit}
                className="h-10 mt-3 bg-white/5 border border-white/5 focus-within:border-indigo-500/40 rounded-xl flex items-center justify-between px-3 text-xs text-slate-300 transition-all shrink-0"
              >
                <input 
                  type="text" 
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder="Type a message to test..."
                  className="bg-transparent border-none outline-none text-white flex-1 mr-2 placeholder-slate-500 text-[11px]"
                />
                <button 
                  type="submit"
                  disabled={!simInput.trim() || isSimTyping}
                  className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 text-white disabled:text-slate-500 transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shrink-0"
                  aria-label="Send message in simulator"
                >
                  →
                </button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <section id="features" className="w-full pt-32 pb-20">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Modern Features</h2>
            <p className="text-slate-400">Everything you need for a robust and high-performing messaging experience.</p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-indigo-500/30 transition-all text-left" variants={itemVariants}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Real-Time Messaging</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Send and receive messages instantly without page refresh using Socket.io WebSockets.
              </p>
            </motion.div>

            <motion.div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-indigo-500/30 transition-all text-left" variants={itemVariants}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Group Chats & Controls</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Create group rooms with multiple members. Admins can manage roles, rename groups, and manage participants.
              </p>
            </motion.div>

            <motion.div className="glass-panel p-8 rounded-3xl space-y-4 hover:border-indigo-500/30 transition-all text-left" variants={itemVariants}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Smart Scroll Lock</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Auto-scrolls to the bottom on new messages. Automatically locks if you scroll up to inspect chat history.
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Tech Stack Section */}
        <section id="tech" className="w-full py-16 border-t border-b border-white/5 bg-white/[0.01]">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h3 className="text-2xl font-bold text-white">Powered by a Modern Tech Stack</h3>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { name: 'Next.js 15 (App)', desc: 'Framework' },
                { name: 'TypeScript', desc: 'Type Safety' },
                { name: 'Tailwind CSS v4', desc: 'Styling' },
                { name: 'Zustand', desc: 'State Manager' },
                { name: 'Socket.io', desc: 'Real-time WS' },
                { name: 'Framer Motion', desc: 'Animations' }
              ].map((stack, idx) => (
                <div key={idx} className="glass-panel px-5 py-3 rounded-2xl text-left border border-white/5 flex items-center space-x-3 hover:bg-white/5 transition-all">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs text-slate-400 block">{stack.desc}</span>
                    <span className="text-sm font-semibold text-white">{stack.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Assignments details */}
        <section id="about" className="w-full pt-24 text-left max-w-4xl mx-auto space-y-8">
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Laptop className="w-6 h-6 text-indigo-400" />
              <span>Senior Frontend Assignment Specifications</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
              <div className="space-y-3">
                <h4 className="font-bold text-white text-base">Part 1: Real-Time Chat App</h4>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>One-step authentication using phone and name.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>Manage 1-to-1 chats and group rooms.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>REST request pipeline with real-time WebSocket notifications.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white text-base">Part 2 & 3: Landing Page & Documentation</h4>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>Fluid responsive layout, glassmorphic themes, and typography.</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>Explain choices, trade-offs, and details in documentation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 mt-20 relative z-10 glass-panel">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 space-y-4 md:space-y-0">
          <span>&copy; 2026 EchoChat. Senior Frontend Engineer Take-Home Assignment.</span>
          <div className="flex space-x-6">
            <span className="text-indigo-400 font-bold">Deadline: August 22, 2026 at 4:00 PM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

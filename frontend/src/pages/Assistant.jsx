import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, HelpCircle, Layers, ShieldCheck, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getAssistantBriefing, sendAssistantMessage } from '../utils/api';
import HexLogo from '../components/shared/HexLogo';

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '### Welcome to INFRAWATCH Intelligence Core\n\nI am your specialized AI Infrastructure Analyst with real-time access to the **1,775 central infrastructure projects database** across India.\n\nAsk me about project risk profiles, state-level execution delays, cost overrun drivers, or specific project recommendations.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const [showBriefingMobile, setShowBriefingMobile] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadBriefing() {
      try {
        const res = await getAssistantBriefing();
        setBriefing(res);
      } catch (err) {
        console.error('Failed to load briefing:', err);
      }
    }
    loadBriefing();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const text = queryText || inputVal;
    if (!text.trim() || loading) return;

    const newHistory = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInputVal('');
    setLoading(true);
    setShowBriefingMobile(false);

    try {
      const res = await sendAssistantMessage(text, newHistory);
      setMessages([...newHistory, { role: 'assistant', content: res.reply, count: res.matching_projects_count }]);
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages([...newHistory, { role: 'assistant', content: 'Connection issue reaching intelligence model. Please retry.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-105px)] sm:h-[calc(100vh-130px)] flex flex-col lg:flex-row gap-4 sm:gap-6">
      {/* MOBILE BRIEFING TOGGLE */}
      <div className="lg:hidden shrink-0">
        <button
          onClick={() => setShowBriefingMobile(!showBriefingMobile)}
          className="w-full flex items-center justify-between p-3 rounded-full glass-pill text-xs font-semibold text-[#1B1C1A]"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#D97706]" /> View Strategic War Room Briefing
          </span>
          {showBriefingMobile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* LEFT 30% — INTELLIGENCE BRIEFING & PROMPT CHIPS */}
      <div className={`lg:w-[320px] flex flex-col gap-4 shrink-0 ${showBriefingMobile ? 'block' : 'hidden lg:flex'}`}>
        <div className="glass-card p-5 rounded-2xl space-y-4 flex-1 overflow-y-auto max-h-[300px] lg:max-h-none">
          <div className="flex items-center gap-2 pb-3 border-b border-[rgba(61,58,52,0.08)]">
            <Sparkles size={16} className="text-[#D97706]" />
            <h2 className="font-serif text-sm sm:text-base font-bold text-[#1B1C1A]">Strategic War Room Briefing</h2>
          </div>

          {/* Briefing Bullets */}
          <div className="space-y-2.5">
            {(briefing?.briefing_items || [
              '127 CRITICAL alerts active across central monitoring.',
              '62 projects flagged with risk score above 65/100.',
              'Railways & Highways represent 71% of schedule slippage.',
              'Land acquisition stalls identified as top delay driver.'
            ]).map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#FAF9F5]/80 border border-[rgba(61,58,52,0.08)] text-[11px] sm:text-xs text-[#655E4E] leading-relaxed">
                <span className="font-mono text-[#D97706] font-bold mr-1.5">●</span>
                {item}
              </div>
            ))}
          </div>

          {/* Suggested Question Chips */}
          <div className="pt-2 space-y-2">
            <span className="text-[10px] font-bold text-[#8D8574] uppercase tracking-wider block">
              Suggested Inquiries
            </span>
            <div className="space-y-1.5">
              {(briefing?.suggested_questions || [
                'Which projects are most likely to exceed budget?',
                'Show me high-risk road projects in Bihar',
                'What are the top drivers of cost overrun?',
                'Compare sector performance'
              ]).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-2.5 rounded-xl bg-[#FAF9F5]/70 border border-[rgba(61,58,52,0.1)] hover:bg-[#EFECE6] hover:border-[rgba(61,58,52,0.22)] text-[11px] text-[#3D3A34] font-medium transition-all line-clamp-1"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT 70% — CHAT CONSOLE */}
      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden min-w-0 shadow-lg">
        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 sm:gap-3.5 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="shrink-0 mt-1">
                  <HexLogo size={26} />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-2xl p-4 sm:p-5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#1E1E1E] text-[#FAF9F5] border border-white/10 rounded-2xl rounded-br-xs shadow-md'
                    : 'glass-sand text-[#1B1C1A] rounded-2xl rounded-bl-xs border border-[rgba(61,58,52,0.08)] shadow-xs prose prose-stone prose-xs'
                }`}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>

                {m.count && (
                  <div className="mt-3 pt-2.5 border-t border-[rgba(61,58,52,0.08)] text-[10px] font-mono text-[#8D8574] flex items-center justify-between">
                    <span>{m.count} records indexed</span>
                    <span className="badge-nominal rounded-full px-2 py-0.5 font-semibold text-[10px]">Grounded ✓</span>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#1E1E1E] text-[#FAF9F5] border border-white/10 flex items-center justify-center shrink-0 mt-1 font-bold shadow-xs">
                  <User size={13} className="text-[#D97706]" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5 sm:gap-3">
              <HexLogo size={26} active={true} />
              <div className="p-3 rounded-2xl glass-card text-xs text-[#D97706] font-mono flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D97706] animate-bounce" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D97706] animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D97706] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-[#655E4E]">Synthesizing sovereign intelligence...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Glass Prompt Bar */}
        <div className="p-3 sm:p-4 border-t border-[rgba(61,58,52,0.08)] bg-[#FAF9F5]/90 backdrop-blur-md flex items-center gap-2.5 sm:gap-3">
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Interrogate central portfolio risk, delays, cost escalation drivers..."
            rows={1}
            className="flex-1 bg-white border border-[rgba(61,58,52,0.15)] rounded-full px-4 py-2.5 text-xs text-[#1B1C1A] placeholder-[#8D8574] focus:outline-none focus:border-[#1E1E1E] resize-none font-sans transition-colors shadow-2xs"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || loading}
            className="btn-sovereign-primary p-2.5 sm:p-3 disabled:opacity-40 transition-all shrink-0 flex items-center justify-center"
          >
            <Send size={15} className="text-[#D97706]" />
          </button>
        </div>
      </div>
    </div>
  );
}

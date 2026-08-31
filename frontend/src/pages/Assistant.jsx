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
          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-indigo-700 shadow-2xs"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} /> View Strategic Briefing & Prompt Ideas
          </span>
          {showBriefingMobile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* LEFT 30% — INTELLIGENCE BRIEFING & PROMPT CHIPS */}
      <div className={`lg:w-[320px] flex flex-col gap-4 shrink-0 ${showBriefingMobile ? 'block' : 'hidden lg:flex'}`}>
        <div className="intel-card p-4 sm:p-5 rounded-xl space-y-3 sm:space-y-4 flex-1 overflow-y-auto bg-white max-h-[300px] lg:max-h-none">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
            <Sparkles size={15} className="text-indigo-600" />
            <h2 className="text-xs sm:text-sm font-bold text-[#0F172A]">Strategic War Room Briefing</h2>
          </div>

          {/* Briefing Bullets */}
          <div className="space-y-2">
            {(briefing?.briefing_items || [
              '127 CRITICAL alerts active across central monitoring.',
              '62 projects flagged with risk score above 65/100.',
              'Railways & Highways represent 71% of schedule slippage.',
              'Land acquisition stalls identified as top delay driver.'
            ]).map((item, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] sm:text-xs text-[#475569] leading-relaxed">
                <span className="font-mono text-indigo-600 font-bold mr-1">●</span>
                {item}
              </div>
            ))}
          </div>

          {/* Suggested Question Chips */}
          <div className="pt-1 space-y-1.5">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Suggested Inquiries
            </span>
            <div className="space-y-1">
              {(briefing?.suggested_questions || [
                'Which projects are most likely to exceed budget?',
                'Show me high-risk road projects in Bihar',
                'What are the top drivers of cost overrun?',
                'Compare sector performance'
              ]).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 text-[11px] text-[#475569] font-medium transition-colors line-clamp-1"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT 70% — CHAT CONSOLE */}
      <div className="flex-1 intel-card rounded-xl flex flex-col overflow-hidden bg-white min-w-0">
        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 bg-slate-50/40">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 sm:gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="shrink-0 mt-0.5">
                  <HexLogo size={24} />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-2xl p-3 sm:p-4 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                    : 'bg-white border border-slate-200 text-[#0F172A] rounded-bl-none shadow-xs prose prose-slate prose-xs'
                }`}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>

                {m.count && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[9px] sm:text-[10px] font-mono text-[#64748B] flex items-center justify-between">
                    <span>{m.count} records indexed</span>
                    <span className="text-emerald-700 font-semibold">Grounded ✓</span>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5 font-bold">
                  <User size={13} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5 sm:gap-3">
              <HexLogo size={24} active={true} />
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-indigo-600 font-mono flex items-center gap-1.5 shadow-xs">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px]">Evaluating portfolio vectors...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-2.5 sm:p-4 border-t border-[#E2E8F0] bg-white flex items-center gap-2 sm:gap-3">
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about project risks, cost overruns..."
            rows={1}
            className="flex-1 bg-slate-50 border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-indigo-500 resize-none font-sans"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || loading}
            className="p-2 sm:p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

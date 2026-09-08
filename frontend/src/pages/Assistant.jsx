import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Cpu,
  Zap,
  Radio
} from 'lucide-react';
import { 
  getAssistantBriefing, 
  sendAssistantMessage, 
  getAssistantStatus, 
  configureAssistantKey 
} from '../utils/api';
import HexLogo from '../components/shared/HexLogo';

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '### Welcome to INFRAWATCH Sovereign AI Core\n\nI am your specialized AI Infrastructure Analyst with live analytical access to the **1,760+ central infrastructure projects database** across India.\n\nAsk me to diagnose project risk profiles, evaluate state-level execution delays, identify systemic cost overrun triggers, or formulate targeted administrative intervention orders.',
      provider: 'MoSPI-Domain-RAG'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const [showBriefingMobile, setShowBriefingMobile] = useState(false);
  
  // AI Core Status & Config State
  const [aiStatus, setAiStatus] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [configFeedback, setConfigFeedback] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [b, st] = await Promise.all([
          getAssistantBriefing().catch(() => null),
          getAssistantStatus().catch(() => null)
        ]);
        setBriefing(b);
        setAiStatus(st);
      } catch (err) {
        console.error('Failed to load briefing/status:', err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const refreshAiStatus = async () => {
    try {
      const st = await getAssistantStatus();
      setAiStatus(st);
    } catch (err) {
      console.error('Status refresh error:', err);
    }
  };

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
      setMessages([
        ...newHistory, 
        { 
          role: 'assistant', 
          content: res.reply, 
          count: res.matching_projects_count,
          provider: res.provider 
        }
      ]);
      // Update status if needed
      refreshAiStatus();
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages([
        ...newHistory, 
        { 
          role: 'assistant', 
          content: 'Connection issue reaching intelligence model. Please check configuration or retry.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setConfigSaving(true);
    setConfigFeedback(null);

    try {
      const res = await configureAssistantKey(selectedProvider, apiKeyInput.trim());
      setConfigFeedback({ type: 'success', message: res.message || 'AI Core Key successfully validated!' });
      setApiKeyInput('');
      await refreshAiStatus();
      setTimeout(() => {
        setShowConfigModal(false);
        setConfigFeedback(null);
      }, 1500);
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err.message || 'Verification failed. Please check key.';
      setConfigFeedback({ type: 'error', message: errMsg });
    } finally {
      setConfigSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPills = [
    'Top Cost Overrun Drivers in Maharashtra',
    'Evaluate High-Risk Railway Corridors',
    'Draft PMG Statutory Notice for Stalled Highways',
    'Which projects have physical vs financial divergence > 20%?'
  ];

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] sm:h-[calc(100vh-130px)] flex flex-col lg:flex-row gap-3 sm:gap-6">
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
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(61,58,52,0.08)]">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#D97706]" />
              <h2 className="font-serif text-sm sm:text-base font-bold text-[#1B1C1A]">Strategic War Room Briefing</h2>
            </div>
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

          {/* Suggested Inquiries */}
          <div className="pt-2 space-y-2">
            <span className="text-[10px] font-bold text-[#8D8574] uppercase tracking-wider block font-mono">
              Executive Inquiries
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
                  className="w-full text-left p-2.5 rounded-xl bg-[#FAF9F5]/70 border border-[rgba(61,58,52,0.1)] hover:bg-[#EFECE6] hover:border-[rgba(61,58,52,0.22)] text-[11px] text-[#3D3A34] font-medium transition-all line-clamp-1 cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT 70% — CHAT CONSOLE & TELEMETRY */}
      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden min-w-0 shadow-lg">
        {/* TOP TELEMETRY STRIP */}
        <div className="px-4 sm:px-6 py-3 border-b border-[rgba(61,58,52,0.08)] bg-[#FAF9F5]/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${aiStatus?.is_cloud_llm ? 'bg-[#4A5D4E] animate-pulse' : 'bg-[#D97706]'}`} />
              <span className="font-mono text-xs font-bold text-[#1B1C1A]">
                {aiStatus?.displayName || 'INFRAWATCH Sovereign AI Core'}
              </span>
            </div>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block ${
              aiStatus?.is_cloud_llm ? 'bg-[#4A5D4E]/10 text-[#4A5D4E] border border-[#4A5D4E]/20' : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20'
            }`}>
              {aiStatus?.is_cloud_llm ? 'Live Cloud LLM' : 'MoSPI Domain RAG'}
            </span>
          </div>

          <button
            onClick={() => setShowConfigModal(true)}
            className="btn-sovereign-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:shadow-xs"
          >
            <Settings size={13} className="text-[#D97706]" />
            <span>Configure AI Core</span>
          </button>
        </div>

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

                {m.role === 'assistant' && (
                  <div className="mt-3 pt-2.5 border-t border-[rgba(61,58,52,0.08)] text-[10px] font-mono text-[#8D8574] flex items-center justify-between">
                    <span>{m.count ? `${m.count} records indexed` : 'Live Infrastructure Intelligence'}</span>
                    <span className="font-semibold text-[10px] text-[#4A5D4E] flex items-center gap-1">
                      <ShieldCheck size={11} />
                      {m.provider ? m.provider : (aiStatus?.model || 'Grounded')}
                    </span>
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
                <span className="text-[11px] font-medium text-[#655E4E]">
                  Synthesizing sovereign intelligence via {aiStatus?.displayName || 'AI Core'}...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Inquiry Pills */}
        <div className="px-4 py-2 bg-[#FAF9F5]/90 border-t border-[rgba(61,58,52,0.06)] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono font-bold uppercase text-[#8D8574] shrink-0">Quick:</span>
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pill)}
              disabled={loading}
              className="px-3 py-1 rounded-full bg-white border border-[rgba(61,58,52,0.12)] hover:border-[#1E1E1E] text-[10px] text-[#1B1C1A] font-medium shrink-0 transition-all cursor-pointer hover:shadow-2xs"
            >
              {pill}
            </button>
          ))}
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
            className="btn-sovereign-primary p-2.5 sm:p-3 disabled:opacity-40 transition-all shrink-0 flex items-center justify-center cursor-pointer"
          >
            <Send size={15} className="text-[#D97706]" />
          </button>
        </div>
      </div>

      {/* CONFIGURE AI CORE MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#FAF9F5] w-full max-w-lg rounded-2xl border border-[rgba(61,58,52,0.15)] shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(61,58,52,0.08)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#1E1E1E] text-[#FAF9F5]">
                  <Cpu size={18} className="text-[#D97706]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1B1C1A]">Configure AI Core</h3>
                  <p className="text-[11px] text-[#8D8574]">Connect Google Gemini API or Groq for real-time generative intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#EFECE6] text-[#8D8574] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Provider Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#1B1C1A] block uppercase">
                Select LLM Provider:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('gemini')}
                  className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                    selectedProvider === 'gemini'
                      ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]'
                      : 'bg-white text-[#1B1C1A] border-[rgba(61,58,52,0.15)] hover:border-[#1E1E1E]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Google Gemini</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#D97706] text-white">Recommended</span>
                  </div>
                  <p className={`text-[10px] ${selectedProvider === 'gemini' ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>
                    Gemini 2.5 Flash (1M token window, deep reasoning)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('groq')}
                  className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                    selectedProvider === 'groq'
                      ? 'bg-[#1E1E1E] text-[#FAF9F5] border-[#1E1E1E]'
                      : 'bg-white text-[#1B1C1A] border-[rgba(61,58,52,0.15)] hover:border-[#1E1E1E]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Groq Cloud</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#2C3E50] text-white">Ultra-Fast</span>
                  </div>
                  <p className={`text-[10px] ${selectedProvider === 'groq' ? 'text-[#EFECE6]' : 'text-[#8D8574]'}`}>
                    Llama 3.1 8B Instant (low-latency execution)
                  </p>
                </button>
              </div>
            </div>

            {/* 30-Second API Key Guide Box */}
            <div className="p-3.5 rounded-xl bg-[#EFECE6]/80 border border-[rgba(61,58,52,0.1)] space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-[#1B1C1A]">
                <span className="flex items-center gap-1.5">
                  <Key size={13} className="text-[#D97706]" />
                  How to get a {selectedProvider === 'gemini' ? 'Google Gemini' : 'Groq'} API key:
                </span>
                <a
                  href={selectedProvider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://console.groq.com/keys'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#D97706] hover:underline flex items-center gap-1 font-mono font-semibold"
                >
                  <span>Open {selectedProvider === 'gemini' ? 'AI Studio' : 'Groq Console'}</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#655E4E]">
                <li>Sign in with your standard Google account (100% free, no credit card required).</li>
                <li>Click <strong>"Create API Key"</strong> and copy your key.</li>
                <li>Paste it below and click <strong>"Test & Connect AI Core"</strong>.</li>
              </ol>
            </div>

            {/* Input Form */}
            <form onSubmit={handleConfigureKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-[#1B1C1A] block uppercase">
                  Enter {selectedProvider === 'gemini' ? 'Gemini' : 'Groq'} API Key:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={selectedProvider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[rgba(61,58,52,0.2)] text-[#1B1C1A] font-mono focus:outline-none focus:border-[#1E1E1E]"
                  />
                </div>
              </div>

              {/* Feedback Alert */}
              {configFeedback && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  configFeedback.type === 'success' 
                    ? 'bg-[#4A5D4E]/10 text-[#4A5D4E] border border-[#4A5D4E]/20' 
                    : 'bg-[#C25E3E]/10 text-[#C25E3E] border border-[#C25E3E]/20'
                }`}>
                  {configFeedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{configFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="btn-sovereign-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={configSaving || !apiKeyInput.trim()}
                  className="btn-sovereign-primary px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  {configSaving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap size={13} className="text-[#D97706]" />}
                  <span>{configSaving ? 'Verifying Key Connection...' : 'Test & Connect AI Core'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


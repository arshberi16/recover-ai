import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Cpu,
  Loader2,
  Database,
  PlusCircle,
  Trash2,
  History,
  MessageSquare,
  X,
  Clock,
  ChevronRight
} from 'lucide-react';
import type { InsightQueryResponse } from '../types';
import { queryAIInsights } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface AIInsightsPageProps {
  onNavigateTab: (tab: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text?: string;
  responseData?: InsightQueryResponse;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const DEFAULT_WELCOME_MSG: ChatMessage = {
  role: 'assistant',
  text: "Hello! I am your RecoverAI Revenue Intelligence Analyst. Ask me any question about your payment failure patterns, issuer bank gateway trends, or transaction recovery priorities."
};

const createNewSessionObj = (): ChatSession => ({
  id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  title: 'New Conversation',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [DEFAULT_WELCOME_MSG]
});

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({ onNavigateTab }) => {
  const userEmail = localStorage.getItem('recoverai_user_email') || 'demo';
  const sessionsStorageKey = `recoverai_chat_sessions_${userEmail}`;
  const activeIdStorageKey = `recoverai_active_session_id_${userEmail}`;

  const [questionInput, setQuestionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Initialize Sessions Array from LocalStorage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(sessionsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse chat sessions:", e);
    }
    const initialSession = createNewSessionObj();
    return [initialSession];
  });

  // Active Session ID
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedActiveId = localStorage.getItem(activeIdStorageKey);
    if (savedActiveId && sessions.some(s => s.id === savedActiveId)) {
      return savedActiveId;
    }
    return sessions[0]?.id || createNewSessionObj().id;
  });

  // Active Session Object
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || createNewSessionObj();

  // Save sessions to LocalStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(sessionsStorageKey, JSON.stringify(sessions));
      localStorage.setItem(activeIdStorageKey, activeSessionId);
    } catch (e) {
      console.error("Failed to save sessions to localStorage:", e);
    }
  }, [sessions, activeSessionId, sessionsStorageKey, activeIdStorageKey]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 80);
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession.messages.length, loading]);

  useEffect(() => {
    let timer1: any, timer2: any;
    if (loading) {
      setLoadingStep(1);
      timer1 = setTimeout(() => setLoadingStep(2), 800);
      timer2 = setTimeout(() => setLoadingStep(3), 2000);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading]);

  const suggestedQuestions = [
    "Why did revenue loss increase this week?",
    "Which payment method has the highest failure rate?",
    "Which bank should we investigate?",
    "What should I prioritize today?",
    "How much revenue can we potentially recover?",
    "Explain TXN-8921"
  ];

  const handleAskQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMessage = queryText.trim();
    setQuestionInput('');

    // Append User Message
    const userMsgObj: ChatMessage = { role: 'user', text: userMessage };
    
    // Update active session in state
    setSessions(prevSessions => {
      return prevSessions.map(s => {
        if (s.id === currentSession.id) {
          const updatedMessages = [...s.messages, userMsgObj];
          const newTitle = s.title === 'New Conversation' ? userMessage : s.title;
          return {
            ...s,
            title: newTitle,
            updatedAt: new Date().toISOString(),
            messages: updatedMessages
          };
        }
        return s;
      });
    });

    setLoading(true);
    scrollToBottom();

    try {
      const response = await queryAIInsights(userMessage, '30d', userEmail);
      const assistantMsgObj: ChatMessage = { role: 'assistant', responseData: response };

      setSessions(prevSessions => {
        return prevSessions.map(s => {
          if (s.id === currentSession.id) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, assistantMsgObj]
            };
          }
          return s;
        });
      });
    } catch (e) {
      const errorMsgObj: ChatMessage = { 
        role: 'assistant', 
        text: "Apologies, I encountered an issue analyzing your transaction telemetry. Please try again." 
      };

      setSessions(prevSessions => {
        return prevSessions.map(s => {
          if (s.id === currentSession.id) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, errorMsgObj]
            };
          }
          return s;
        });
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleStartNewChat = () => {
    const newSess = createNewSessionObj();
    setSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
    setIsHistoryDrawerOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setIsHistoryDrawerOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSession = sessions.find(s => s.id === id);
    const sessionTitle = targetSession ? `"${targetSession.title}"` : 'this chat session';
    const confirmed = window.confirm(
      `Are you sure you want to delete ${sessionTitle}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    const remaining = sessions.filter(s => s.id !== id);
    if (remaining.length === 0) {
      const fresh = createNewSessionObj();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleClearAllHistory = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL saved chat sessions and history?\n\nThis action cannot be undone."
    );
    if (!confirmed) return;

    const fresh = createNewSessionObj();
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
    localStorage.removeItem(sessionsStorageKey);
    localStorage.removeItem(activeIdStorageKey);
    setIsHistoryDrawerOpen(false);
  };

  const handleActionNavigation = (targetPage: string) => {
    onNavigateTab(targetPage || 'recovery');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto relative">
      {/* Page Title & History Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            RecoverAI Revenue Intelligence Analyst
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Conversational AI powered by RecoverAI Neural Engine, grounded in real database telemetry & ML scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<History className="w-4 h-4 text-blue-500" />}
            onClick={() => setIsHistoryDrawerOpen(true)}
          >
            Chat History ({sessions.length})
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={handleStartNewChat}
          >
            + New Chat
          </Button>
        </div>
      </div>

      {/* SUGGESTED PROMPTS GRID */}
      <Card className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-blue-100 dark:border-slate-800 p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            Suggested Intelligence Queries
          </span>
          <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-blue-500" />
            Active Session: <strong className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{currentSession.title}</strong>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskQuestion(q)}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-2xs text-left"
            >
              "{q}"
            </button>
          ))}
        </div>
      </Card>

      {/* CONVERSATIONAL CHAT CONTAINER */}
      <div className="space-y-6">
        {currentSession.messages.map((item, index) => (
          <div key={index} className="flex items-start gap-4">
            {item.role === 'assistant' ? (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Bot className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                YOU
              </div>
            )}

            <div className="flex-1 space-y-3">
              {item.text && (
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  item.role === 'user' 
                    ? 'bg-blue-600 text-white font-medium self-end max-w-xl shadow-xs' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}>
                  {item.text}
                </div>
              )}

              {item.responseData && (
                <Card className="border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-md space-y-5 p-6">
                  {/* Intelligence Source & Intent Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Intent: {item.responseData.intent.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.responseData.source === 'gemini' ? (
                        <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[11px] font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" /> RecoverAI Neural Core
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-blue-500" /> Analytics Engine (Fallback)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direct AI Answer */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Direct Business Intelligence Summary</div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      "{item.responseData.answer}"
                    </p>
                  </div>

                  {/* Key Findings List */}
                  {item.responseData.key_findings?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Key Drivers & Telemetry Findings</div>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {item.responseData.key_findings.map((f, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">{f.title}</div>
                              <div className="text-slate-600 dark:text-slate-300 mt-0.5">{f.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supporting Metrics Pills */}
                  {item.responseData.supporting_metrics?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Verified Database Metrics</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {item.responseData.supporting_metrics.map((m, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                            <div className="text-[10px] text-slate-400 font-medium">{m.label}</div>
                            <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5">{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actionable Recommendations */}
                  {item.responseData.recommended_actions?.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actionable Recovery Recommendations</div>
                      <div className="space-y-2">
                        {item.responseData.recommended_actions.map((act, i) => (
                          <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
                                  Priority: {act.priority}
                                </span>
                                <span className="text-xs text-blue-200">{act.impact}</span>
                              </div>
                              <div className="text-xs font-semibold text-white mt-1">{act.action}</div>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-400 text-white border-none shrink-0"
                              icon={<ArrowRight className="w-4 h-4" />}
                              onClick={() => handleActionNavigation(act.target_page)}
                            >
                              Execute Workflow
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-4 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <div className="flex-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 text-xs space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                {loadingStep === 1 && "Fetching transaction telemetry & bank failure records from RecoverAI Telemetry Store..."}
                {loadingStep === 2 && "Invoking RecoverAI Neural reasoning model with database context..."}
                {loadingStep === 3 && "Validating structured financial metrics & generating recovery action plan..."}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                Live database context grounded in 600 verified telemetry records
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* INPUT FORM BAR */}
      <div className="pt-4 sticky bottom-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleAskQuestion(questionInput); }}
          className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xl"
        >
          <input
            type="text"
            placeholder="Ask RecoverAI AI Analyst about payment failure patterns, bank codes, or specific transactions (e.g. TXN-8921)..."
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <Button
            type="submit"
            disabled={!questionInput.trim() || loading}
            icon={<Send className="w-4 h-4" />}
          >
            Ask AI Analyst
          </Button>
        </form>
      </div>

      {/* SLIDE-OUT CHAT HISTORY DRAWER */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Saved Chat Sessions</h2>
              </div>
              <button 
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {sessions.length} Saved Conversation{sessions.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={handleClearAllHistory}
                className="text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All History
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sessions.map((sess) => {
                const isActive = sess.id === currentSession.id;
                const msgCount = sess.messages.length - 1; // exclude welcome
                return (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`font-bold text-xs truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {sess.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(sess.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span>{msgCount <= 0 ? 'Fresh Session' : `${msgCount} message${msgCount > 1 ? 's' : ''}`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        title="Delete Session"
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                icon={<PlusCircle className="w-4 h-4" />}
                onClick={handleStartNewChat}
              >
                + Start New Chat Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

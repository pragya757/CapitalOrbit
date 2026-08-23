'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react'
import type { CopilotResponse } from '@/lib/types'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMessage {
  id: string
  sender: 'user' | 'copilot'
  text: string
  data?: CopilotResponse
  timestamp: string
}

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEvidenceId, setShowEvidenceId] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_msg',
      sender: 'copilot',
      text: 'Hello! I am your CapitalOrbit Copilot. Ask me about your failed payments, revenue at risk, financial health, category spending, cash flow, 90-day forecast, or purchase affordability.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const quickPrompts = [
    'Why did payments fail today?',
    'How is my financial health?',
    'Where am I spending the most?',
    'What will my balance look like in 90 days?',
    'Can I afford ₹20,000?',
    'Give me a complete financial summary.',
  ]

  const handleSend = async (customQuery?: string) => {
    const textToSend = (customQuery || query).trim()
    if (!textToSend || loading) return

    const userMsgId = `user_${Date.now()}`
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setQuery('')
    setLoading(true)

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      })

      const json: CopilotResponse = await res.json()

      const copilotMsg: ChatMessage = {
        id: `copilot_${Date.now()}`,
        sender: 'copilot',
        text: json.answer || json.disclaimer || 'Analysis complete.',
        data: json,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, copilotMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `copilot_err_${Date.now()}`,
          sender: 'copilot',
          text: 'Apologies, I encountered an issue processing your query. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge className="bg-red-500 text-white text-[9px] font-extrabold uppercase">Critical</Badge>
      case 'HIGH':
        return <Badge className="bg-[#E9785B] text-white text-[9px] font-bold uppercase">High Risk</Badge>
      case 'MEDIUM':
        return <Badge className="bg-[#D8A84E] text-white text-[9px] font-bold uppercase">Medium Risk</Badge>
      case 'LOW':
        return <Badge className="bg-[#72B8A5] text-white text-[9px] font-bold uppercase">Low Risk</Badge>
      default:
        return <Badge variant="outline" className="text-[9px] font-bold uppercase border-[#0B192C]/20">Info</Badge>
    }
  }

  return (
    <>
      {/* Floating Action Trigger Button (Navy Blue Theme) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="hidden sm:flex items-center gap-2 bg-[#0B192C] text-white px-3.5 py-2 rounded-full shadow-xl border border-[#38BDF8]/40 text-xs font-serif font-bold cursor-pointer hover:bg-[#1E293B] transition-colors"
              onClick={() => setIsOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span>Ask Copilot</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0B192C] text-white shadow-2xl border-2 border-[#38BDF8]/50 focus:outline-none"
          aria-label="Open CapitalOrbit AI Copilot"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-[#F8FAFC]" />
          ) : (
            <div className="relative">
              <Bot className="h-7 w-7 text-[#38BDF8]" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#38BDF8]"></span>
              </span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Floating Chat Panel (Navy Blue Header & Elements) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] max-h-[640px] shadow-2xl rounded-3xl border border-[#0B192C]/20 dark:border-[#38BDF8]/30 bg-[#FFFCF7] dark:bg-[#0B192C] overflow-hidden flex flex-col text-xs"
          >
            {/* Panel Header - Navy Blue */}
            <div className="p-4 bg-[#0B192C] text-white flex items-center justify-between border-b border-[#38BDF8]/30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white shadow-sm border border-white/20">
                  <Bot className="h-5 w-5 text-[#38BDF8]" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    CapitalOrbit Copilot
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">Data-Grounded Financial AI</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 bg-white/10 text-[#F8FAFC] border-white/20 font-bold text-[9px]">
                  <Sparkles className="h-3 w-3 text-[#38BDF8]" /> Deterministic AI
                </Badge>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 text-[#F8FAFC] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Prompts Chips */}
            <div className="p-2.5 bg-[#F1F5F9]/80 dark:bg-[#1E293B]/80 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] shrink-0 pl-1">Ask:</span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="text-[10px] font-semibold text-[#0B192C] dark:text-[#F8FAFC] bg-white dark:bg-[#0B192C] border border-[#CBD5E1] dark:border-[#334155] hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] rounded-full px-2.5 py-1 shrink-0 transition-colors shadow-none"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Message History Stream */}
            <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[380px]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2 items-start',
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.sender === 'copilot' && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0B192C] text-white shrink-0 mt-0.5 shadow-sm border border-[#38BDF8]/30">
                      <Bot className="h-3.5 w-3.5 text-[#38BDF8]" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'rounded-2xl p-3 max-w-[85%] space-y-2 transition-all shadow-none',
                      msg.sender === 'user'
                        ? 'bg-[#0B192C] text-white rounded-tr-none border border-[#38BDF8]/30'
                        : 'bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#0B192C] dark:text-[#F8FAFC] rounded-tl-none'
                    )}
                  >
                    {/* Header Intent & Severity */}
                    {msg.sender === 'copilot' && msg.data && (
                      <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0] dark:border-[#334155] text-[9px]">
                        <span className="font-bold tracking-wider text-[#64748B] dark:text-[#94A3B8] uppercase">
                          Intent: {msg.data.intent.replace(/_/g, ' ')}
                        </span>
                        {getSeverityBadge(msg.data.severity)}
                      </div>
                    )}

                    {/* Main Text Answer */}
                    <p className="text-xs leading-relaxed">{msg.text}</p>

                    {/* Metrics Grid */}
                    {msg.data?.metrics && msg.data.metrics.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[10px]">
                        {msg.data.metrics.map((m, idx) => (
                          <div key={idx} className="rounded-lg bg-white dark:bg-[#0B192C] border border-[#E2E8F0] dark:border-[#334155] p-1.5 space-y-0.5">
                            <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] block truncate">{m.label}</span>
                            <span className="font-bold text-[#0B192C] dark:text-[#F8FAFC] block truncate">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {msg.data?.recommendations && msg.data.recommendations.length > 0 && (
                      <div className="space-y-1 pt-1 text-[10px]">
                        <span className="font-bold text-[#E9785B] flex items-center gap-1 text-[9px] uppercase tracking-wider">
                          <Lightbulb className="h-3 w-3 text-[#D8A84E]" /> Recommendations
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[#64748B] dark:text-[#94A3B8]">
                          {msg.data.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Evidence Drawer Toggle */}
                    {msg.data?.evidence && msg.data.evidence.length > 0 && (
                      <div className="pt-1">
                        <button
                          onClick={() => setShowEvidenceId(showEvidenceId === msg.id ? null : msg.id)}
                          className="flex items-center justify-between w-full text-[9px] font-bold text-[#64748B] dark:text-[#94A3B8] hover:text-[#0B192C] dark:hover:text-[#F8FAFC] pt-1 border-t border-[#E2E8F0] dark:border-[#334155]"
                        >
                          <span>{showEvidenceId === msg.id ? 'Hide Evidence' : 'Show Deterministic Evidence'}</span>
                          {showEvidenceId === msg.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>

                        {showEvidenceId === msg.id && (
                          <div className="mt-1.5 space-y-1 p-2 rounded-lg bg-white dark:bg-[#0B192C] border border-[#E2E8F0] dark:border-[#334155] text-[9px]">
                            {msg.data.evidence.map((e, idx) => (
                              <div key={idx} className="space-y-0.5 border-b border-[#E2E8F0] dark:border-[#334155] last:border-0 pb-1 last:pb-0">
                                <div className="font-bold text-[#0B192C] dark:text-[#F8FAFC]">{e.label}</div>
                                <div className="text-[#64748B] dark:text-[#94A3B8]">{e.value}</div>
                                <div className="text-[8px] text-[#E9785B] italic">Source: {e.source}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-[8px] opacity-60 text-right font-mono">{msg.timestamp}</div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#E9785B] text-white shrink-0 mt-0.5 shadow-sm">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Bar - Navy Blue Accent Button */}
            <div className="p-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0B192C] flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Copilot about failed payments, health, cash flow..."
                disabled={loading}
                className="h-9 text-xs rounded-xl border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B]"
              />
              <Button
                onClick={() => handleSend()}
                disabled={loading || !query.trim()}
                className="h-9 px-3.5 bg-[#0B192C] hover:bg-[#1E293B] text-white font-bold rounded-xl shrink-0 gap-1.5 text-xs border border-[#38BDF8]/40"
              >
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#38BDF8]" /> : <Send className="h-3.5 w-3.5 text-[#38BDF8]" />}
                <span>Send</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

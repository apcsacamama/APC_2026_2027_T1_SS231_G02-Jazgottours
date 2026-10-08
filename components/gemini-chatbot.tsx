"use client"

import React, { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function GeminiChatbot() {
  const [session, setSession] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Hello! How can I assist you with your El Nido adventure today?" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Listen for Supabase session changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Auto-scroll chat window
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userText = input.trim()
    setMessages((prev) => [...prev, { role: "user", text: userText }])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ prompt: userText }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to reach AI concierge.")

      setMessages((prev) => [...prev, { role: "bot", text: data.reply }])
    } catch (err: any) {
      toast.error(err.message || "Failed to send message.")
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Sorry, I am having trouble connecting right now." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Only render for logged-in users
  if (!session) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 h-[460px] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#ce9136] text-white p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-sm tracking-wide">JazGot AI Concierge</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Chat Transcript */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] p-3 rounded-xl leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#ce9136] text-white ml-auto rounded-tr-none shadow-sm"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white text-slate-400 border border-slate-200 p-2.5 rounded-xl rounded-tl-none inline-block text-xs">
                Thinking...
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tours, fees, inclusions..."
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#ce9136] text-slate-900"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#ce9136] hover:bg-[#b87d2b] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#ce9136] hover:bg-[#b87d2b] text-white p-4 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 group"
          aria-label="Open AI Tour Assistant"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
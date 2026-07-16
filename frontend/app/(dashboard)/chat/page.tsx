'use client'

import { useState, useRef, useEffect } from 'react'  // ← THIS WAS MISSING!
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Sparkles, Copy, Check, User, Bot, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

function ChatMessage({ message, isTyping }: { message: any, isTyping?: boolean }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-4 py-6',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn('max-w-[80%] space-y-2', isUser && 'order-first')}>
        {isUser ? (
          <div className="rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            {isTyping ? (
              <div className="flex gap-1 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
                {message.agent_used && (
                  <Badge variant="outline" className="mt-2 gap-1">
                    <Sparkles className="h-3 w-3" />
                    Agent: {message.agent_used}
                  </Badge>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
          <User className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  )
}

export default function ChatPage() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">AI Assistant</h1>
          <Badge variant="default" className="text-[10px] bg-green-500">
            Online
          </Badge>
        </div>
        <button
          onClick={clearMessages}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Start a conversation</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Ask me about products, orders, or get AI-powered recommendations
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <ChatMessage
                message={{ id: 'typing', role: 'assistant', content: '' }}
                isTyping
              />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="pt-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
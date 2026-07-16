import { useState, useCallback } from 'react'
import { chatService } from '@/services/api'
import { ChatMessage } from '@/types'

export function useChat(userId: number = 1) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await chatService.sendMessage(query, userId)
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp),
        agent_used: response.agent_used,
        products_found: response.products_found,
        error: response.error,
      }
      
      setMessages((prev) => [...prev, assistantMessage])
      
      if (!response.success) {
        setError(response.error || 'Failed to get response')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        error: err.message,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const regenerateLast = useCallback(async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      const lastAssistantIndex = [...messages].reverse().findIndex(m => m.role === 'assistant')
      if (lastAssistantIndex !== -1) {
        const newMessages = messages.slice(0, messages.length - lastAssistantIndex - 1)
        setMessages(newMessages)
        await sendMessage(lastUserMessage.content)
      }
    }
  }, [messages, sendMessage])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    regenerateLast,
    setMessages,
  }
}
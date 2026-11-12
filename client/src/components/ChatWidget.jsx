import React, { useContext, useRef, useState } from 'react'

import { askChat, getMyPlayedCourses, getMyPlayRounds } from '../apiClient'
import { UserContext } from '../context/UserContext'
import '../styles/ChatWidget.css'

const MAX_LENGTH = 500
const GREETING = "Hi I'm TeeBox, your AI assistant. If you have any questions about the courses and their information, feel free to ask me."

// Maps the `fetch` name the server asks for to the function that actually gets that
// data. Played-round data lives in Firestore, which only the signed-in browser can read,
// so the server can only ask for it, not fetch it itself (see apiClient.askChat). The
// handicap is simpler still — it's already sitting in the signed-in user's profile here,
// so getMyHandicap below is built per-render to read it straight from context, no
// network call at all.
const FETCHERS = { getMyPlayedCourses, getMyPlayRounds }

// A small chat widget, open on every page, collapsed to a corner button until clicked.
// Conversation state lives here and survives closing the panel, just not a page reload.
function ChatWidget () {
  const { user } = useContext(UserContext)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const listEnd = useRef(null)

  const scrollToEnd = () => listEnd.current?.scrollIntoView?.({ behavior: 'smooth' })

  const send = async (text) => {
    const question = text.trim()
    if (!question || sending) return
    // Captured before the new message is added to state: what the golfer already said is
    // what makes a short follow-up ("what about Wellington instead") understandable. This
    // never leaves the browser tab's own memory beyond being sent along with the request.
    const history = messages
    setError(null)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setSending(true)
    try {
      let result = await askChat(question, { history })
      if (result.needsData) {
        const { intent, args, fetch: fetchName } = result.needsData
        const data = fetchName === 'getMyHandicap'
          ? { handicap: user?.handicap ?? null }
          : await (FETCHERS[fetchName] ? FETCHERS[fetchName]() : Promise.resolve([]))
        result = await askChat(question, { context: { intent, args, data } })
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: result.reply || "Sorry, I didn't catch that." }])
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
      setTimeout(scrollToEnd, 0)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    send(input)
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-widget-panel" role="dialog" aria-label="AI Chatbot">
          <div className="chat-widget-header">
            <span>AI Chatbot</span>
            <button type="button" className="chat-widget-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>

          <div className="chat-widget-log" role="log" aria-live="polite">
            <p className="chat-widget-bubble chat-widget-bubble-assistant">{GREETING}</p>
            {messages.map((message, index) => (
              <p key={index} className={`chat-widget-bubble chat-widget-bubble-${message.role}`}>
                {message.text}
              </p>
            ))}
            {sending && <p className="chat-widget-bubble chat-widget-bubble-assistant chat-widget-bubble-pending">Thinking…</p>}
            <div ref={listEnd} />
          </div>

          {error && <p className="chat-widget-error" role="alert">{error}</p>}

          <form className="chat-widget-form" onSubmit={handleSubmit}>
            <input
              className="input"
              type="text"
              value={input}
              maxLength={MAX_LENGTH}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question…"
              aria-label="Ask a question"
            />
            <button type="submit" disabled={sending || input.trim().length < 2}>
              {sending ? '…' : 'Ask'}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-widget-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Hide chat' : 'AI Chatbot'}
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  )
}

export default ChatWidget

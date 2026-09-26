import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'

const STORAGE_KEY = 'trisha-chat-history'
const API_URL = 'http://localhost:3000'

const createLocalChat = () => ({
  id: crypto.randomUUID(),
  backendId: null,
  title: 'New conversation',
  updatedAt: Date.now(),
  messages: []
})

const Home = () => {
  const [chats, setChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [activeChatId, setActiveChatId] = useState(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}:active`) || ''
    } catch {
      return ''
    }
  })
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [connection, setConnection] = useState('connecting')
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const socketRef = useRef(null)
  const pendingRef = useRef(null)
  const bottomRef = useRef(null)
  const activeChat = chats.find((chat) => chat.id === activeChatId)
  const sortedChats = [...chats].sort((first, second) => second.updatedAt - first.updatedAt)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
      localStorage.setItem(`${STORAGE_KEY}:active`, activeChatId)
    } catch {
      // Conversation state remains available for the current session.
    }
  }, [chats, activeChatId])

  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnection('connected')
      setNotice('')
    })
    socket.on('disconnect', () => setConnection('disconnected'))
    socket.on('connect_error', () => setConnection('disconnected'))
    socket.on('ai-response', (response) => {
      if (pendingRef.current?.backendId === response.chat) {
        window.clearTimeout(pendingRef.current.timeout)
        pendingRef.current = null
        setSending(false)
      }

      setChats((currentChats) => currentChats.map((chat) => (
        chat.backendId === response.chat
          ? {
              ...chat,
              updatedAt: Date.now(),
              messages: [...chat.messages, {
                id: crypto.randomUUID(),
                role: 'model',
                content: response.content
              }]
            }
          : chat
      )))
    })
    socket.on('ai-error', (error) => {
      if (pendingRef.current) {
        window.clearTimeout(pendingRef.current.timeout)
        pendingRef.current = null
        setSending(false)
      }
      setNotice(error.message || 'The assistant could not respond. Please try again.')
    })

    return () => {
      socket.disconnect()
      if (pendingRef.current) window.clearTimeout(pendingRef.current.timeout)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeChatId, activeChat?.messages.length])

  const startNewChat = () => {
    const chat = createLocalChat()
    setChats((currentChats) => [chat, ...currentChats])
    setActiveChatId(chat.id)
    setInput('')
    setNotice('')
    setSidebarOpen(false)
  }

  const selectChat = (chatId) => {
    setActiveChatId(chatId)
    setSidebarOpen(false)
    setNotice('')
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    const chat = activeChat || createLocalChat()
    if (!activeChat) {
      setChats((currentChats) => [chat, ...currentChats])
      setActiveChatId(chat.id)
    }

    const localChatId = chat.id
    const userMessage = { id: crypto.randomUUID(), role: 'user', content }
    setChats((currentChats) => currentChats.map((item) => (
      item.id === localChatId
        ? {
            ...item,
            title: item.messages.length === 0 ? content.slice(0, 42) : item.title,
            updatedAt: Date.now(),
            messages: [...item.messages, userMessage]
          }
        : item
    )))
    setInput('')
    setNotice('')

    try {
      let backendChatId = chat.backendId
      if (!backendChatId) {
        const response = await axios.post(
          `${API_URL}/api/chat`,
          { title: content.slice(0, 42) },
          { withCredentials: true }
        )
        backendChatId = response.data.chat.id
        setChats((currentChats) => currentChats.map((item) => (
          item.id === localChatId ? { ...item, backendId: backendChatId } : item
        )))
      }

      const socket = socketRef.current
      if (!socket?.connected) {
        throw new Error('Connect to the assistant by signing in and starting the backend.')
      }

      setSending(true)
      const timeout = window.setTimeout(() => {
        pendingRef.current = null
        setSending(false)
        setNotice('The assistant did not respond. Check that the chat socket is running, then try again.')
      }, 30000)
      pendingRef.current = { backendId: backendChatId, timeout }
      socket.emit('ai-msg', { chat: backendChatId, content })
    } catch (error) {
      setSending(false)
      setNotice(
        error.response?.data?.message ||
        error.message ||
        'Could not send your message. Please try again.'
      )
    }
  }

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <main className="chat-app">
      {sidebarOpen && (
        <button
          className="chat-scrim"
          type="button"
          aria-label="Close conversations menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`chat-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Conversations">
        <div className="sidebar-heading">
          <a className="chat-brand" href="/" aria-label="Trisha home">
            <span className="chat-brand-mark" aria-hidden="true">t.</span>
            <span>trisha</span>
          </a>
          <button
            className="icon-button sidebar-close"
            type="button"
            aria-label="Close conversations menu"
            onClick={() => setSidebarOpen(false)}
          >×</button>
        </div>

        <button className="new-chat-button" type="button" onClick={startNewChat}>
          <span aria-hidden="true">+</span> New conversation
        </button>

        <div className="conversation-section">
          <p className="sidebar-label">Recent</p>
          {sortedChats.length > 0 ? (
            <nav className="conversation-list" aria-label="Previous chats">
              {sortedChats.map((chat) => (
                <button
                  className={`conversation-item${chat.id === activeChatId ? ' is-active' : ''}`}
                  type="button"
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  title={chat.title}
                >
                  <span className="conversation-dot" aria-hidden="true" />
                  <span>{chat.title}</span>
                </button>
              ))}
            </nav>
          ) : (
            <p className="empty-history">Your conversations will appear here.</p>
          )}
        </div>

        <div className="sidebar-account">
          <span className="account-avatar" aria-hidden="true">Y</span>
          <div className="account-copy">
            <span>Your space</span>
            <span>Personal account</span>
          </div>
          <Link className="account-link" to="/login" aria-label="Sign in">↗</Link>
        </div>
      </aside>

      <section className="chat-main">
        <header className="chat-topbar">
          <button
            className="icon-button menu-button"
            type="button"
            aria-label="Open conversations menu"
            onClick={() => setSidebarOpen(true)}
          >☰</button>
          <div className="topbar-title">
            <span className="assistant-presence" aria-hidden="true" />
            <span>Trisha</span>
            <span className="topbar-caption">AI assistant</span>
          </div>
          <span className={`connection-state is-${connection}`}>
            <span className="connection-dot" />
            {connection === 'connected' ? 'Online' : connection === 'connecting' ? 'Connecting' : 'Offline'}
          </span>
        </header>

        {notice && (
          <div className="chat-notice" role="status">
            <span>{notice}</span>
            {notice.toLowerCase().includes('sign in') || notice.toLowerCase().includes('login') ? (
              <Link to="/login">Sign in</Link>
            ) : null}
            <button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button>
          </div>
        )}

        <div className="chat-scroll-area">
          {activeChat?.messages.length ? (
            <div className="message-thread" aria-live="polite" aria-label="Chat messages">
              {activeChat.messages.map((message) => (
                <article className={`message-row message-${message.role}`} key={message.id}>
                  {message.role === 'model' && <span className="message-avatar" aria-hidden="true">t.</span>}
                  <div className="message-content">
                    {message.role === 'model' && <span className="message-author">Trisha</span>}
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}
              {sending && (
                <div className="message-row message-model" role="status" aria-label="Trisha is thinking">
                  <span className="message-avatar" aria-hidden="true">t.</span>
                  <div className="typing-indicator"><i /><i /><i /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="welcome-panel">
              <span className="welcome-mark" aria-hidden="true">t.</span>
              <p className="welcome-kicker">A little space to think</p>
              <h1>What’s on your mind?</h1>
              <p className="welcome-copy">Ask a question, untangle an idea, or just start somewhere.</p>
              <div className="prompt-list" aria-label="Try asking">
                {[
                  'Help me plan my week',
                  'Explain something I’m learning',
                  'Help me get started on an idea'
                ].map((prompt) => (
                  <button type="button" key={prompt} onClick={() => setInput(prompt)}>
                    <span aria-hidden="true">↗</span>{prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="composer-wrap">
          <form className="chat-composer" onSubmit={sendMessage}>
            <label className="visually-hidden" htmlFor="chat-message">Message Trisha</label>
            <textarea
              id="chat-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message Trisha..."
              rows="1"
              maxLength="8000"
              disabled={sending}
            />
            <div className="composer-tools">
              <span>Shift + Enter for a new line</span>
              <button
                className="send-button"
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || sending}
              >↑</button>
            </div>
          </form>
          <p className="composer-disclaimer">Trisha can make mistakes. Check important details.</p>
        </footer>
      </section>
    </main>
  )
}

export default Home
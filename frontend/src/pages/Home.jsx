import { Children, isValidElement, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_URL } from "../config";
const createLocalChat = () => ({
  id: crypto.randomUUID(),
  backendId: null,
  title: "New conversation",
  updatedAt: Date.now(),
  messages: [],
});
const getPlainText = (node) =>
  Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number")
        return String(child);
      return isValidElement(child) ? getPlainText(child.props.children) : "";
    })
    .join("");
const Home = () => {
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChatId, setActiveChatId] = useState("");
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connection, setConnection] = useState("connecting");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState("");
  const [copiedCodeKey, setCopiedCodeKey] = useState("");
  const socketRef = useRef(null);
  const pendingRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const sortedChats = [...chats].sort(
    (first, second) => second.updatedAt - first.updatedAt,
  );
  useEffect(() => {
    let isMounted = true;
    axios
      .get(`${API_URL}/api/chat`, {
        withCredentials: true,
      })
      .then((response) => {
        if (!isMounted) return;
        const history = response.data.chats.map((chat) => ({
          ...chat,
          backendId: chat.id,
        }));
        setChats(history);
        setActiveChatId(history[0]?.id || "");
      })
      .catch((error) => {
        if (isMounted) {
          setNotice(
            error.response?.data?.message ||
              "Could not load your conversations.",
          );
        }
      });
    axios
      .get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      })
      .then((response) => {
        if (isMounted) setCurrentUser(response.data.user);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);
  useEffect(() => {
    const socket = io(API_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnection("connected");
      setNotice("");
    });
    socket.on("disconnect", () => setConnection("disconnected"));
    socket.on("connect_error", () => setConnection("disconnected"));
    socket.on("ai-response", (response) => {
      const pending = pendingRef.current;
      if (pendingRef.current?.backendId === response.chat) {
        window.clearTimeout(pendingRef.current.timeout);
        pendingRef.current = null;
        setSending(false);
      }
      setChats((currentChats) =>
        currentChats.map((chat) =>
          chat.backendId === response.chat
            ? {
                ...chat,
                updatedAt: Date.now(),
                messages: [
                  ...(pending?.mode === "replace"
                    ? chat.messages.slice(0, pending.keepMessages)
                    : chat.messages
                  ).map((message) =>
                    message.id === pending?.localMessageId
                      ? {
                          ...message,
                          id: response.userMessageId || message.id,
                        }
                      : message,
                  ),
                  {
                    id: response.id || crypto.randomUUID(),
                    role: "model",
                    content: response.content,
                  },
                ],
              }
            : chat,
        ),
      );
    });
    socket.on("ai-error", (error) => {
      const pending = pendingRef.current;
      if (pending) {
        window.clearTimeout(pending.timeout);
        pendingRef.current = null;
        setSending(false);
        if (pending.previousMessages) {
          setChats((currentChats) =>
            currentChats.map((chat) =>
              chat.backendId === pending.backendId
                ? {
                    ...chat,
                    messages: pending.previousMessages,
                  }
                : chat,
            ),
          );
        }
      }
      setNotice(
        error.message || "The assistant could not respond. Please try again.",
      );
    });
    return () => {
      socket.disconnect();
      if (pendingRef.current) window.clearTimeout(pendingRef.current.timeout);
    };
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeChatId, activeChat?.messages.length]);
  const startNewChat = () => {
    const chat = createLocalChat();
    setChats((currentChats) => [chat, ...currentChats]);
    setActiveChatId(chat.id);
    setInput("");
    setNotice("");
    setSidebarOpen(false);
  };
  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    setSidebarOpen(false);
    setNotice("");
  };
  const deleteChat = async (chat) => {
    try {
      if (chat.backendId) {
        await axios.delete(`${API_URL}/api/chat/${chat.backendId}`, {
          withCredentials: true,
        });
      }
      const remainingChats = sortedChats.filter((item) => item.id !== chat.id);
      setChats((currentChats) =>
        currentChats.filter((item) => item.id !== chat.id),
      );
      setActiveChatId((currentId) =>
        currentId === chat.id ? remainingChats[0]?.id || "" : currentId,
      );
      setNotice("");
    } catch (error) {
      setNotice(
        error.response?.data?.message || "Could not delete this conversation.",
      );
    }
  };
  const logout = async () => {
    setLoggingOut(true);
    try {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        },
      );
      setCurrentUser(null);
      setChats([]);
      setActiveChatId("");
      socketRef.current?.disconnect();
      setNotice("You have been signed out.");
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          "Could not sign out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  };
  const encodeFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          mimeType: file.type,
          data: String(reader.result).split(",")[1],
        });
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  const chooseFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      setNotice("Attach up to 5 files per message.");
    } else if (
      files.some((file) => file.size > 8 * 1024 * 1024) ||
      files.reduce(
        (total, file) => total + file.size,
        selectedFiles.reduce((sum, file) => sum + file.size, 0),
      ) >
        8 * 1024 * 1024
    ) {
      setNotice("Attachments must total 8 MB or less.");
    } else {
      setSelectedFiles((current) => [...current, ...files]);
      setNotice("");
    }
    event.target.value = "";
  };
  const beginEdit = (message) => {
    setEditingMessage(message);
    setInput(message.content);
    setSelectedFiles([]);
    setNotice("");
  };
  const regenerateResponse = (message) => {
    if (sending || !activeChat?.backendId) return;
    const messageIndex = activeChat.messages.findIndex(
      (item) => item.id === message.id,
    );
    const userMessage = activeChat.messages
      .slice(0, messageIndex)
      .reverse()
      .find((item) => item.role === "user");
    if (!userMessage) return;
    const socket = socketRef.current;
    if (!socket?.connected) {
      setNotice(
        "Connect to the assistant by signing in and starting the backend.",
      );
      return;
    }
    const previousMessages = activeChat.messages;
    setChats((currentChats) =>
      currentChats.map((chat) =>
        chat.id === activeChat.id
          ? {
              ...chat,
              messages: chat.messages.slice(0, messageIndex),
            }
          : chat,
      ),
    );
    setSending(true);
    const timeout = window.setTimeout(() => {
      const pending = pendingRef.current;
      pendingRef.current = null;
      setSending(false);
      if (pending?.previousMessages) {
        setChats((currentChats) =>
          currentChats.map((chat) =>
            chat.backendId === pending.backendId
              ? {
                  ...chat,
                  messages: pending.previousMessages,
                }
              : chat,
          ),
        );
      }
      setNotice(
        "The assistant did not respond. Check that the chat socket is running, then try again.",
      );
    }, 90000);
    pendingRef.current = {
      backendId: activeChat.backendId,
      mode: "replace",
      keepMessages: messageIndex,
      previousMessages,
      timeout,
    };
    socket.emit("chat-operation", {
      operation: "regenerate",
      chat: activeChat.backendId,
      messageId: message.id,
    });
  };
  const copyResponse = async (message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(""), 1600);
    } catch {
      setNotice("Could not copy the response. Check clipboard permissions.");
    }
  };
  const copyCode = async (messageId, code) => {
    const key = `${messageId}:${code}`;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeKey(key);
      window.setTimeout(() => {
        setCopiedCodeKey((current) => (current === key ? "" : current));
      }, 1600);
    } catch {
      setNotice("Could not copy the code. Check clipboard permissions.");
    }
  };
  const sendMessage = async (event) => {
    event.preventDefault();
    const content = input.trim();
    if ((!content && !selectedFiles.length) || sending) return;
    const chat = activeChat || createLocalChat();
    if (!activeChat) {
      setChats((currentChats) => [chat, ...currentChats]);
      setActiveChatId(chat.id);
    }
    const localChatId = chat.id;
    const operation = editingMessage ? "edit" : "send";
    let attachments;
    try {
      attachments = await Promise.all(selectedFiles.map(encodeFile));
    } catch (error) {
      setNotice(error.message || "Could not read the selected files.");
      return;
    }
    const userMessage = {
      id: editingMessage?.id || crypto.randomUUID(),
      role: "user",
      content: content || "Please review the attached file(s).",
      attachments: attachments.map(({ name, mimeType }) => ({
        name,
        mimeType,
      })),
    };
    const currentMessageIndex = chat.messages.findIndex(
      (item) => item.id === editingMessage?.id,
    );
    setChats((currentChats) =>
      currentChats.map((item) =>
        item.id === localChatId
          ? {
              ...item,
              title:
                item.messages.length === 0 ? content.slice(0, 42) : item.title,
              updatedAt: Date.now(),
              messages: editingMessage
                ? [...item.messages.slice(0, currentMessageIndex), userMessage]
                : [...item.messages, userMessage],
            }
          : item,
      ),
    );
    setInput("");
    setSelectedFiles([]);
    setEditingMessage(null);
    setNotice("");
    try {
      let backendChatId = chat.backendId;
      if (!backendChatId) {
        const response = await axios.post(
          `${API_URL}/api/chat`,
          {
            title: content.slice(0, 42),
          },
          {
            withCredentials: true,
          },
        );
        backendChatId = response.data.chat.id;
        setChats((currentChats) =>
          currentChats.map((item) =>
            item.id === localChatId
              ? {
                  ...item,
                  backendId: backendChatId,
                }
              : item,
          ),
        );
      }
      const socket = socketRef.current;
      if (!socket?.connected) {
        throw new Error(
          "Connect to the assistant by signing in and starting the backend.",
        );
      }
      setSending(true);
      const timeout = window.setTimeout(() => {
        const pending = pendingRef.current;
        pendingRef.current = null;
        setSending(false);
        if (pending?.previousMessages) {
          setChats((currentChats) =>
            currentChats.map((item) =>
              item.backendId === pending.backendId
                ? {
                    ...item,
                    messages: pending.previousMessages,
                  }
                : item,
            ),
          );
        }
        setNotice(
          "The assistant did not respond. Check that the chat socket is running, then try again.",
        );
      }, 90000);
      pendingRef.current = {
        backendId: backendChatId,
        mode: operation === "edit" ? "replace" : "append",
        keepMessages:
          operation === "edit" ? currentMessageIndex + 1 : undefined,
        localMessageId: userMessage.id,
        previousMessages: chat.messages,
        timeout,
      };
      socket.emit("chat-operation", {
        operation,
        chat: backendChatId,
        content,
        messageId: editingMessage?.id,
        attachments,
      });
    } catch (error) {
      setSending(false);
      setChats((currentChats) =>
        currentChats.map((item) =>
          item.id === localChatId
            ? {
                ...item,
                messages: chat.messages,
              }
            : item,
        ),
      );
      setNotice(
        error.response?.data?.message ||
          error.message ||
          "Could not send your message. Please try again.",
      );
    }
  };
  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };
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

      <aside
        className={`chat-sidebar${sidebarOpen ? " is-open" : ""}`}
        aria-label="Conversations"
      >
        <div className="sidebar-heading">
          <a className="chat-brand" href="/" aria-label="Trisha home">
            <span className="chat-brand-mark" aria-hidden="true">
              t.
            </span>
            <span>trisha</span>
          </a>
          <button
            className="icon-button sidebar-close"
            type="button"
            aria-label="Close conversations menu"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        <button
          className="new-chat-button"
          type="button"
          onClick={startNewChat}
        >
          <span aria-hidden="true">+</span> New conversation
        </button>

        <div className="conversation-section">
          <p className="sidebar-label">Recent</p>
          {sortedChats.length > 0 ? (
            <nav className="conversation-list" aria-label="Previous chats">
              {sortedChats.map((chat) => (
                <div className="conversation-entry" key={chat.id}>
                  <button
                    className={`conversation-item${chat.id === activeChatId ? " is-active" : ""}`}
                    type="button"
                    onClick={() => selectChat(chat.id)}
                    title={chat.title}
                  >
                    <span className="conversation-dot" aria-hidden="true" />
                    <span>{chat.title}</span>
                  </button>
                  <button
                    className="conversation-delete"
                    type="button"
                    aria-label={`Delete ${chat.title}`}
                    title="Delete conversation"
                    onClick={() => deleteChat(chat)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </nav>
          ) : (
            <p className="empty-history">
              Your conversations will appear here.
            </p>
          )}
        </div>

        <div className="sidebar-account">
          <span className="account-avatar" aria-hidden="true">
            {currentUser?.fullname?.firstname?.charAt(0)?.toUpperCase() || "Y"}
          </span>
          <div className="account-copy">
            <span>
              {currentUser
                ? `${currentUser.fullname.firstname} ${currentUser.fullname.lastname}`
                : "Your space"}
            </span>
            <span>{currentUser?.email_id || "Personal account"}</span>
          </div>
          {currentUser ? (
            <button
              className="account-link account-logout"
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={logout}
              disabled={loggingOut}
            >
              {loggingOut ? "…" : "↪"}
            </button>
          ) : (
            <Link
              className="account-link"
              to="/login"
              aria-label="Sign in"
              title="Sign in"
            >
              ↗
            </Link>
          )}
        </div>
      </aside>

      <section className="chat-main">
        <header className="chat-topbar">
          <button
            className="icon-button menu-button"
            type="button"
            aria-label="Open conversations menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="topbar-title">
            <span className="assistant-presence" aria-hidden="true" />
            <span>Trisha</span>
            <span className="topbar-caption">AI assistant</span>
          </div>
          <span className={`connection-state is-${connection}`}>
            <span className="connection-dot" />
            {connection === "connected"
              ? "Online"
              : connection === "connecting"
                ? "Connecting"
                : "Offline"}
          </span>
        </header>

        {notice && (
          <div className="chat-notice" role="status">
            <span>{notice}</span>
            {notice.toLowerCase().includes("sign in") ||
            notice.toLowerCase().includes("login") ? (
              <Link to="/login">Sign in</Link>
            ) : null}
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}

        <div className="chat-scroll-area">
          {activeChat?.messages.length ? (
            <div
              className="message-thread"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {activeChat.messages.map((message) => (
                <article
                  className={`message-row message-${message.role}`}
                  key={message.id}
                >
                  {message.role === "model" && (
                    <span className="message-avatar" aria-hidden="true">
                      t.
                    </span>
                  )}
                  <div className="message-content">
                    {message.role === "model" && (
                      <span className="message-author">Trisha</span>
                    )}
                    {message.role === "model" ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          pre: ({ children }) => {
                            const codeNode =
                              Children.toArray(children).find(isValidElement);
                            const code = getPlainText(children);
                            const language =
                              codeNode?.props?.className?.match(
                                /language-([\w-]+)/,
                              )?.[1] || "Code";
                            const codeKey = `${message.id}:${code}`;
                            return (
                              <div className="code-block">
                                <div className="code-block-header">
                                  <span>{language}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyCode(message.id, code)}
                                  >
                                    {copiedCodeKey === codeKey
                                      ? "Copied"
                                      : "Copy"}
                                  </button>
                                </div>
                                <pre>{children}</pre>
                              </div>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    {message.attachments?.length > 0 && (
                      <div className="message-attachments">
                        {message.attachments.map((file) => (
                          <span
                            className="attachment-chip"
                            key={`${file.name}-${file.mimeType}`}
                          >
                            <span aria-hidden="true">▧</span>
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="message-actions">
                      {message.role === "user" && (
                        <button
                          type="button"
                          onClick={() => beginEdit(message)}
                          disabled={sending}
                        >
                          Edit &amp; resend
                        </button>
                      )}
                      {message.role === "model" && (
                        <>
                          <button
                            type="button"
                            onClick={() => copyResponse(message)}
                          >
                            {copiedMessageId === message.id ? "Copied" : "Copy"}
                          </button>
                          <button
                            type="button"
                            onClick={() => regenerateResponse(message)}
                            disabled={sending}
                          >
                            Regenerate
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              {sending && (
                <div
                  className="message-row message-model"
                  role="status"
                  aria-label="Trisha is thinking"
                >
                  <span className="message-avatar" aria-hidden="true">
                    t.
                  </span>
                  <div className="typing-indicator">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="welcome-panel">
              <span className="welcome-mark" aria-hidden="true">
                t.
              </span>
              <p className="welcome-kicker">A little space to think</p>
              <h1>What’s on your mind?</h1>
              <p className="welcome-copy">
                Ask a question, untangle an idea, or just start somewhere.
              </p>
              <div className="prompt-list" aria-label="Try asking">
                {[
                  "Help me plan my week",
                  "Explain something I’m learning",
                  "Help me get started on an idea",
                ].map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => setInput(prompt)}
                  >
                    <span aria-hidden="true">↗</span>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="composer-wrap">
          {editingMessage && (
            <div className="edit-banner">
              <span>Editing message</span>
              <button
                type="button"
                onClick={() => {
                  setEditingMessage(null);
                  setInput("");
                }}
              >
                Cancel
              </button>
            </div>
          )}
          {selectedFiles.length > 0 && (
            <div className="selected-files" aria-label="Files to attach">
              {selectedFiles.map((file, index) => (
                <span className="attachment-chip" key={`${file.name}-${index}`}>
                  {file.name}
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() =>
                      setSelectedFiles((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <form className="chat-composer" onSubmit={sendMessage}>
            <label className="visually-hidden" htmlFor="chat-message">
              Message Trisha
            </label>
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
              <div className="composer-actions">
                <input
                  ref={fileInputRef}
                  className="visually-hidden"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,image/png,image/jpeg,image/webp,image/gif"
                  onChange={chooseFiles}
                  aria-label="Attach files"
                />
                <button
                  className="attach-button"
                  type="button"
                  aria-label="Attach files"
                  title="Attach PDF, DOCX, TXT, or image files"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  ＋
                </button>
                <button
                  className="send-button"
                  type="submit"
                  aria-label={
                    editingMessage ? "Resend edited message" : "Send message"
                  }
                  disabled={(!input.trim() && !selectedFiles.length) || sending}
                >
                  ↑
                </button>
              </div>
            </div>
          </form>
          <p className="composer-disclaimer">
            Trisha can make mistakes. Check important details.
          </p>
        </footer>
      </section>
    </main>
  );
};
export default Home;

import React, { useState, useEffect, useRef } from "react";
import api from "./api"; // Your axios instance

function ChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const chatEndRef = useRef(null);

  // Identity Sync: Priority to Props, fallback to Storage
  const currentUserEmail = user?.Email || localStorage.getItem("userEmail");

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get("/api/messages");
      setMessages(res.data);
    } catch (err) {
      console.log("Chat sync error", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3s
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(scrollToBottom, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await api.post("/api/messages", { Content: text });
      // Instant UI update for the sender
      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      alert("System could not broadcast message.");
    }
  };

  return (
    <div className="chat-widget-root">
      <style>{`
        .chat-widget-root { position: fixed; bottom: 30px; right: 30px; z-index: 10000; font-family: 'Inter', sans-serif; }
        
        /* THE FLOATING TRIGGER */
        .chat-btn {
          width: 65px; height: 65px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: white; font-size: 26px; border: none; cursor: pointer;
          box-shadow: 0 8px 32px rgba(124, 58, 237, 0.5);
          display: flex; align-items: center; justify-content: center;
          transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .chat-btn:hover { transform: scale(1.1) rotate(5deg); box-shadow: 0 12px 40px rgba(124, 58, 237, 0.7); }

        /* THE CHAT WINDOW */
        .chat-window {
          width: 360px; height: 500px; margin-bottom: 20px;
          background: #161533; border: 1px solid #2d2b55;
          border-radius: 24px; display: flex; flexDirection: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chat-header {
          padding: 20px; background: linear-gradient(90deg, #1e1b4b, #161533);
          border-bottom: 1px solid #2d2b55; display: flex; justify-content: space-between; align-items: center;
        }
        .chat-header span { font-weight: 800; font-size: 14px; letter-spacing: 0.5px; color: #fff; }

        .msg-area {
          flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px;
          background: radial-gradient(circle at top right, #1a1935, #12112a);
        }

        /* CUSTOM SCROLLBAR */
        .msg-area::-webkit-scrollbar { width: 5px; }
        .msg-area::-webkit-scrollbar-track { background: transparent; }
        .msg-area::-webkit-scrollbar-thumb { background: #2d2b55; border-radius: 10px; }

        .msg-row { display: flex; flex-direction: column; max-width: 85%; }
        .msg-row.me { align-self: flex-end; align-items: flex-end; }
        .msg-row.them { align-self: flex-start; align-items: flex-start; }

        .sender-tag { font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
        
        .bubble {
          padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.5;
          word-break: break-word; position: relative;
        }
        .bubble.me { 
          background: #7c3aed; color: white; border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
        }
        .bubble.them { 
          background: #2d2b55; color: #e2e8f0; border-bottom-left-radius: 4px;
        }

        .chat-form { padding: 15px; background: #0b0a1a; border-top: 1px solid #2d2b55; display: flex; gap: 10px; }
        .chat-input {
          flex: 1; background: #1a1935; border: 1px solid #2d2b55; border-radius: 12px;
          padding: 12px 15px; color: white; outline: none; transition: 0.2s;
        }
        .chat-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
        
        .send-action-btn {
          background: #7c3aed; color: white; border: none; width: 45px;
          border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .send-action-btn:hover { background: #6d28d9; }
      `}</style>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>NETWORK CHAT</span>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}
            >
              ✕
            </button>
          </div>
          
          <div className="msg-area">
            {messages.map((m, i) => {
              const isMe = m.SenderEmail === currentUserEmail;
              return (
                <div key={i} className={`msg-row ${isMe ? "me" : "them"}`}>
                  <span className="sender-tag">{isMe ? "You" : m.SenderName}</span>
                  <div className={`bubble ${isMe ? "me" : "them"}`}>
                    {m.Content}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={send} className="chat-form">
            <input 
              className="chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Transmit message..."
              autoFocus
            />
            <button type="submit" className="send-action-btn">➤</button>
          </form>
        </div>
      )}

      {/* FLOATING TRIGGER */}
      <button className="chat-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}

export default ChatWidget;


import React, { useState, useEffect, useRef } from "react";
import api from "./api";

function ChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const currentUserEmail = user?.Email || localStorage.getItem("userEmail");

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchMessages = async () => {
    try {
      const res = await api.get("/api/messages");
      setMessages(res.data);
    } catch (e) { console.log("Chat fetch error"); }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const int = setInterval(fetchMessages, 4000);
      return () => clearInterval(int);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const tempMsg = {
      SenderEmail: currentUserEmail,
      SenderName: user?.Name || "You",
      Content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);
    setText("");

    try {
      await api.post("/api/messages", { Content: text });
    } catch (err) {
      console.error("Message send failed");
    }
  };

  return (
    <div className="chat-widget-root">
      <style>{`
        .chat-widget-root { position: fixed; bottom: 28px; right: 28px; z-index: 9999; font-family: 'Inter', sans-serif; }

        .chat-btn {
          width: 68px; height: 68px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          color: white; font-size: 28px; border: none; cursor: pointer;
          box-shadow: 0 10px 40px rgba(124, 58, 237, 0.6);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.4);
        }
        .chat-btn:hover { transform: scale(1.15) rotate(8deg); box-shadow: 0 15px 50px rgba(124, 58, 237, 0.8); }

        .chat-window {
          width: 380px; height: 560px; margin-bottom: 18px;
          background: #0f0e24; border: 1px solid #3b3766;
          border-radius: 26px; display: flex; flex-direction: column;
          box-shadow: 0 25px 70px rgba(0,0,0,0.7); overflow: hidden;
          animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes popIn { from { opacity: 0; transform: scale(0.7) translateY(40px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        .chat-header {
          padding: 18px 22px; background: linear-gradient(90deg, #1e1b4b, #2a2666);
          border-bottom: 1px solid #4c477a; display: flex; justify-content: space-between; align-items: center;
        }
        .msg-area {
          flex: 1; padding: 22px; overflow-y: auto; background: #0a0920;
          display: flex; flex-direction: column; gap: 16px;
        }
        .msg-area::-webkit-scrollbar { width: 6px; }
        .msg-area::-webkit-scrollbar-thumb { background: #4c477a; border-radius: 10px; }

        .msg-row { max-width: 82%; }
        .msg-row.me { align-self: flex-end; }
        .bubble {
          padding: 13px 17px; border-radius: 20px; font-size: 14.2px; line-height: 1.5;
          position: relative;
        }
        .bubble.me {
          background: #7c3aed; color: white; border-bottom-right-radius: 6px;
        }
        .bubble.them {
          background: #1f1d38; color: #e0dfff; border-bottom-left-radius: 6px;
        }
        .sender-tag { font-size: 10.5px; color: #8b87b0; margin-bottom: 3px; font-weight: 600; }

        .chat-form { padding: 16px; background: #0a0920; border-top: 1px solid #3b3766; display: flex; gap: 10px; }
        .chat-input {
          flex: 1; background: #1a1833; border: 1px solid #4c477a; border-radius: 16px;
          padding: 14px 18px; color: white; outline: none; font-size: 14.5px;
        }
        .chat-input:focus { border-color: #a78bfa; box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.15); }

        .send-btn {
          background: #7c3aed; color: white; border: none; width: 48px; height: 48px;
          border-radius: 14px; cursor: pointer; font-size: 20px;
        }
      `}</style>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span style={{fontWeight:800, letterSpacing:'0.5px'}}>TEAM NETWORK</span>
            <button onClick={() => setIsOpen(false)} style={{background:'none', border:'none', color:'#aaa', fontSize:'20px'}}>✕</button>
          </div>

          <div className="msg-area">
            {messages.map((m, i) => {
              const isMe = m.SenderEmail === currentUserEmail;
              return (
                <div key={i} className={`msg-row ${isMe ? "me" : ""}`}>
                  <span className="sender-tag">{isMe ? "You" : m.SenderName}</span>
                  <div className={`bubble ${isMe ? "me" : "them"}`}>
                    {m.Content}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="chat-form">
            <input
              className="chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              autoFocus
            />
            <button type="submit" className="send-btn">↑</button>
          </form>
        </div>
      )}

      <button className="chat-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}

export default ChatWidget;

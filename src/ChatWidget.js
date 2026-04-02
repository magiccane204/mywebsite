import React, { useState, useEffect, useRef } from "react";
import api from "./api"; // Your axios instance

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const chatEndRef = useRef(null);
  const userEmail = localStorage.getItem("email"); // Get current user

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get("/api/messages");
      setMessages(res.data);
    } catch (err) { console.log("Chat error", err); }
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
      await api.post("/api/messages", { Content: text });
      setText("");
      fetchMessages();
    } catch (err) { alert("Failed to send"); }
  };

  return (
    <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 9999 }}>
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="bitrix-card" style={{
          width: "300px", height: "400px", marginBottom: "15px",
          display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
        }}>
          <div style={{ padding: "10px", borderBottom: "1px solid #eee", fontWeight: "bold", display: 'flex', justifyContent: 'space-between' }}>
            <span>Company Chat</span>
            <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: "10px", background: "#fdfdfd" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ 
                marginBottom: "10px", 
                textAlign: m.SenderEmail === userEmail ? "right" : "left" 
              }}>
                <div style={{ fontSize: "10px", color: "#888" }}>{m.SenderName}</div>
                <div style={{ 
                  display: "inline-block", padding: "8px 12px", borderRadius: "12px",
                  background: m.SenderEmail === userEmail ? "#7c3aed" : "#e5e7eb",
                  color: m.SenderEmail === userEmail ? "white" : "black",
                  maxWidth: "80%", wordBreak: "break-word"
                }}>
                  {m.Content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={send} style={{ padding: "10px", borderTop: "1px solid #eee", display: "flex" }}>
            <input 
              style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type message..."
            />
            <button type="submit" style={{ marginLeft: "5px", background: "#7c3aed", color: "white", border: "none", borderRadius: "4px", padding: "0 10px" }}>➤</button>
          </form>
        </div>
      )}

      {/* FLOATING CIRCLE BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "60px", height: "60px", borderRadius: "50%", 
          background: "#7c3aed", color: "white", fontSize: "24px",
          border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.4)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}

export default ChatWidget;

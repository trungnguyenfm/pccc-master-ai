"use client";
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { AI_SCRIPT } from '../../../ai_script';
import './consult.css';

export default function ConsultDashboard() {
  const [activeProject, setActiveProject] = useState('Karaoke A');
  const [projects, setProjects] = useState(['Karaoke A', 'Kho B']);
  
  // Trạng thái thu thập thông tin công trình
  const [projectInfo, setProjectInfo] = useState({
    scale: '', tier: 'A', area: '', fireResistance: 'I', totalArea: '', location: '', height: '', logic: ''
  });

  // Tự xây dựng AI Chat Hook 100% Native (Triệt tiêu mọi lỗi từ Vercel SDK)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], projectInfo })
      });

      if (!response.ok) throw new Error(await response.text());

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      // Tạo trước bong bóng chat của AI
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Cập nhật từng chữ lả tả rơi
        setMessages(prev => {
          const newArray = [...prev];
          const lastMsg = newArray[newArray.length - 1];
          lastMsg.content += chunk;
          return newArray;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Kết nối tới Não Bộ AI bị gián đoạn. Vui lòng thử lại.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar không đổi */}
      <aside className="sidebar">
        <h1 className="sidebar-brand">PCCC Master Pro</h1>
        <div className="sidebar-section">
          <p className="sidebar-section-title">DỰ ÁN</p>
          <ul className="project-list">
            {projects.map(proj => (
              <li 
                key={proj} 
                className={`project-item ${activeProject === proj ? 'active' : ''}`}
                onClick={() => setActiveProject(proj)}
              >
                {proj}
              </li>
            ))}
          </ul>
        </div>
        <button className="btn-new-project">+ Dự án mới</button>
      </aside>

      {/* Main Content chia 2 nửa */}
      <main className="main-content">
        <header className="main-header">
          <h2 className="header-title">Dự án: {activeProject}</h2>
          <button className="btn-fullscreen">Fullscreen</button>
        </header>

        <div className="dashboard-split">
          {/* Nửa trái: Form nhập liệu PCCC */}
          <section className="form-section split-left">
            <h3 className="form-title">Thông số Công Trình</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Quy mô (Số tầng nổi/hầm)</label>
                <input type="text" placeholder="VD: 10 tầng nổi, 2 tầng hầm" onChange={(e)=>setProjectInfo({...projectInfo, scale: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Hạng sản xuất (nếu có)</label>
                <select value={projectInfo.tier} onChange={(e)=>setProjectInfo({...projectInfo, tier: e.target.value})}>
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="Không có">Không có / Dân dụng</option>
                </select>
              </div>
              <div className="form-group">
                <label>Diện tích sàn (m²)</label>
                <input type="text" placeholder="VD: 500" onChange={(e)=>setProjectInfo({...projectInfo, area: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Bậc chịu lửa</label>
                <select value={projectInfo.fireResistance} onChange={(e)=>setProjectInfo({...projectInfo, fireResistance: e.target.value})}>
                  <option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option><option value="V">V</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tổng diện tích</label>
                <input type="text" placeholder="VD: 1.2ha" onChange={(e)=>setProjectInfo({...projectInfo, totalArea: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Vị trí</label>
                <input type="text" placeholder="Khoảng cách đường..." onChange={(e)=>setProjectInfo({...projectInfo, location: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Chiều cao PCCC (m)</label>
                <input type="text" placeholder="VD: 45.5" onChange={(e)=>setProjectInfo({...projectInfo, height: e.target.value})}/>
              </div>
              <div className="form-group full-width">
                <label>Công năng chi tiết từng tầng</label>
                <textarea rows={3} placeholder="Ví dụ: Tầng 1: Để xe, Tầng 2: Văn phòng..." onChange={(e)=>setProjectInfo({...projectInfo, logic: e.target.value})}></textarea>
              </div>
            </div>
            
            <p className="hint-text mt-4 text-gray-500 text-sm italic">
              *Hệ thống AI sẽ tự động đọc các thông số này mỗi khi bạn đặt câu hỏi.
            </p>
          </section>

          {/* Nửa phải: Cửa sổ Chat bot AI */}
          <section className="chat-section split-right">
            <h3 className="form-title">Chuyên Gia AI Thẩm Duyệt</h3>
            
            <div className="chat-history">
              {messages.length === 0 && (
                <div className="chat-welcome">
                  <p>
                    {AI_SCRIPT.welcome_message.split('\n').map((line, i) => (
                      <Fragment key={i}>
                        {line}
                        <br />
                      </Fragment>
                    ))}
                  </p>
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`chat-message ${m.role}`}>
                  <div className="message-bubble">{m.content}</div>
                </div>
              ))}
              {isLoading && <div className="chat-message assistant"><div className="message-bubble loading">AI đang lật mở 106 cuốn tài liệu rà soát...</div></div>}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-input-area">
              <input 
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi, ví dụ: 'Ban công nhỏ 1.2m có cần lắp Spinkler?'"
                disabled={isLoading}
              />
              <button className="chat-send-btn" type="submit" disabled={isLoading || !input.trim()}>
                Hỏi
              </button>
            </form>
          </section>

        </div>
      </main>
    </div>
  );
}

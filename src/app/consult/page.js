"use client";
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { AI_SCRIPT } from '../../../ai_script';
import './consult.css';

export default function ConsultDashboard() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  const [activeProject, setActiveProject] = useState('Dự án mặc định');
  const [projects, setProjects] = useState(['Dự án mặc định']);
  const [isPaidUser, setIsPaidUser] = useState(false);
  
  const [projectInfo, setProjectInfo] = useState({
    scale: '', tier: 'A', area: '', fireResistance: 'I', totalArea: '', location: '', height: '', logic: ''
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. KIỂM TRA ĐĂNG NHẬP
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        // Sau khi có user, load dự án riêng của user này
        initUserProjects(user.id);
      }
    };
    checkUser();
  }, [supabase, router]);

  // 2. KHỞI TẠO DỮ LIỆU RIÊNG CHO USER
  const initUserProjects = (userId) => {
    const savedProjects = localStorage.getItem(`pccc_projects_${userId}`);
    const savedActive = localStorage.getItem(`pccc_active_${userId}`);
    const savedTier = localStorage.getItem(`pccc_tier_${userId}`);

    if (savedTier) setIsPaidUser(savedTier === 'pro');
    
    if (savedProjects) {
      const list = JSON.parse(savedProjects);
      setProjects(list);
      const current = savedActive || list[0];
      setActiveProject(current);
      loadProjectData(current, userId);
    } else {
      loadProjectData('Dự án mặc định', userId);
    }
  };

  const loadProjectData = (projectName, userId) => {
    const key = `pccc_data_${userId}_${projectName}`;
    const savedData = localStorage.getItem(key);
    if (savedData) {
      const { info, chat } = JSON.parse(savedData);
      setProjectInfo(info || { scale: '', tier: 'A', area: '', fireResistance: 'I', totalArea: '', location: '', height: '', logic: '' });
      setMessages(chat || []);
    } else {
      setProjectInfo({ scale: '', tier: 'A', area: '', fireResistance: 'I', totalArea: '', location: '', height: '', logic: '' });
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`pccc_projects_${user.id}`, JSON.stringify(projects));
  }, [projects, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`pccc_active_${user.id}`, activeProject);
    const data = JSON.stringify({ info: projectInfo, chat: messages });
    localStorage.setItem(`pccc_data_${user.id}_${activeProject}`, data);
  }, [projectInfo, messages, activeProject, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSelectProject = (name) => {
    if (name === activeProject) return;
    setActiveProject(name);
    loadProjectData(name, user?.id);
  };

  const handleNewProject = () => {
    if (!isPaidUser && projects.length >= 2) return;

    const name = prompt("Nhập tên dự án mới:");
    if (name && name.trim()) {
      const newName = name.trim();
      if (projects.includes(newName)) return alert("Dự án này đã tồn tại!");
      
      setProjects([...projects, newName]);
      setActiveProject(newName);
      setProjectInfo({ scale: '', tier: 'A', area: '', fireResistance: 'I', totalArea: '', location: '', height: '', logic: '' });
      setMessages([]);
    }
  };

  const handleEditProjectName = (e) => {
    e.stopPropagation();
    const newNameRaw = prompt("Đổi tên dự án thành:", activeProject);
    if (newNameRaw && newNameRaw.trim() && newNameRaw.trim() !== activeProject) {
      const newName = newNameRaw.trim();
      if (projects.includes(newName)) return alert("Tên dự án này đã bị trùng!");
      
      const oldKey = `pccc_data_${user.id}_${activeProject}`;
      const newKey = `pccc_data_${user.id}_${newName}`;
      const oldData = localStorage.getItem(oldKey);
      if (oldData) localStorage.setItem(newKey, oldData);
      localStorage.removeItem(oldKey);

      setProjects(projects.map(p => p === activeProject ? newName : p));
      setActiveProject(newName);
    }
  };

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
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
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

  if (!user) return <div style={{ backgroundColor: '#0d0d0d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Đang xác thực...</div>;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="user-profile" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <img src={user.user_metadata.avatar_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.user_metadata.full_name}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', cursor: 'pointer' }} onClick={handleLogout}>Đăng xuất →</p>
          </div>
        </div>

        <h1 className="sidebar-brand">
          PCCC Master <span className="tier-badge pro">Pro</span>
        </h1>
        <div className="sidebar-section">
          <p className="sidebar-section-title">
            DANH SÁCH DỰ ÁN ({projects.length}/2) 
            {!isPaidUser && <span className="tier-badge free">Free</span>}
          </p>
          <ul className="project-list">
            {projects.map(proj => (
              <li 
                key={proj} 
                className={`project-item ${activeProject === proj ? 'active' : ''}`}
                onClick={() => handleSelectProject(proj)}
              >
                <span>{proj}</span>
                {activeProject === proj && (
                  <button className="btn-edit-project" onClick={handleEditProjectName} title="Sửa tên dự án">
                    ✏️
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <button 
          className="btn-new-project" 
          onClick={handleNewProject}
          disabled={!isPaidUser && projects.length >= 2}
        >
          {!isPaidUser && projects.length >= 2 ? "Hết lượt (Nâng Pro)" : "+ Dự án mới"}
        </button>
        
        <p 
          style={{ fontSize: '10px', color: '#333', cursor: 'pointer', marginTop: '10px' }}
          onClick={() => {
            const next = !isPaidUser;
            setIsPaidUser(next);
            localStorage.setItem(`pccc_tier_${user.id}`, next ? 'pro' : 'free');
          }}
        >
          {isPaidUser ? "[Gói PRO - Không giới hạn]" : "[Gói FREE - Click để lên PRO]"}
        </p>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h2 className="header-title">Đang làm: {activeProject}</h2>
          <button className="btn-fullscreen">Fullscreen</button>
        </header>

        <div className="dashboard-split">
          <section className="form-section split-left">
            <h3 className="form-title">Thông số Công Trình</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Quy mô (Số tầng nổi/hầm)</label>
                <input type="text" value={projectInfo.scale} placeholder="VD: 10 tầng nổi" onChange={(e)=>setProjectInfo({...projectInfo, scale: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Hạng sản xuất</label>
                <select value={projectInfo.tier} onChange={(e)=>setProjectInfo({...projectInfo, tier: e.target.value})}>
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="Không có">Không có / Dân dụng</option>
                </select>
              </div>
              <div className="form-group">
                <label>Diện tích sàn (m²)</label>
                <input type="text" value={projectInfo.area} placeholder="500" onChange={(e)=>setProjectInfo({...projectInfo, area: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Bậc chịu lửa</label>
                <select value={projectInfo.fireResistance} onChange={(e)=>setProjectInfo({...projectInfo, fireResistance: e.target.value})}>
                  <option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option><option value="V">V</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tổng diện tích</label>
                <input type="text" value={projectInfo.totalArea} placeholder="1.2ha" onChange={(e)=>setProjectInfo({...projectInfo, totalArea: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Chiều cao PCCC (m)</label>
                <input type="text" value={projectInfo.height} placeholder="45.5" onChange={(e)=>setProjectInfo({...projectInfo, height: e.target.value})}/>
              </div>
              <div className="form-group full-width">
                <label>Công năng / Tum / Hầm</label>
                <textarea rows={3} value={projectInfo.logic} placeholder="..." onChange={(e)=>setProjectInfo({...projectInfo, logic: e.target.value})}></textarea>
              </div>
            </div>
          </section>

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
              {isLoading && <div className="chat-message assistant"><div className="message-bubble loading">Đang suy nghĩ ...</div></div>}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-input-area">
              <input 
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi tại đây..."
                disabled={isLoading}
              />
              <button className="chat-send-btn" type="submit" disabled={isLoading || !input.trim()}>Hỏi</button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

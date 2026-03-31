"use client";
import React, { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';
import "./globals.css";

export default function RootLayout({ children }) {
  const supabase = createSupabaseBrowser();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Lắng nghe thay đổi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <nav className="navbar glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 1000 }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" className="logo">
              <span className="logo-icon">🔥</span>
              <span>PCCC<span className="text-gradient">AI</span></span>
            </Link>
            
            <div className="nav-links desktop-only" style={{ display: 'flex', gap: '32px' }}>
              <Link href="/">Trang chủ</Link>
              <Link href="/pricing">Bảng giá</Link>
              <Link href="/guide">Hướng dẫn</Link>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {user ? (
                <>
                  <Link href="/consult" className="btn btn-primary" style={{ padding: '8px 24px' }}>Dashboard</Link>
                  <img src={user.user_metadata.avatar_url} alt="User" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-secondary desktop-only" style={{ padding: '8px 24px' }}>Đăng nhập</Link>
                  <Link href="/consult" className="btn btn-primary" style={{ padding: '8px 24px' }}>Bắt đầu</Link>
                </>
              )}
            </div>
          </div>
        </nav>
        
        <main style={{ flex: 1 }}>
          {children}
        </main>
        
        <footer style={{ padding: '32px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center', marginTop: 'auto', backgroundColor: 'var(--surface-color)' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="logo" style={{ fontSize: '1.25rem' }}>
              <span className="logo-icon" style={{ width: '24px', height: '24px', fontSize: '12px' }}>🔥</span>
              <span>PCCC<span className="text-gradient">AI</span></span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-disabled)' }}>&copy; 2026 PCCC AI Consulting. Giải pháp tư vấn an toàn cháy nổ.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

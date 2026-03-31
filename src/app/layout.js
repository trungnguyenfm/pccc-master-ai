import "./globals.css";
import Link from 'next/link';

export const metadata = {
  title: "AI Tư Vấn PCCC - Chuyên Gia Thông Minh",
  description: "Trợ lý AI giúp tư vấn thiết kế, thẩm duyệt các tiêu chuẩn Phòng cháy chữa cháy (PCCC) chuyên nghiệp, an toàn, ngay lập tức và tuân thủ các quy định hiện hành.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <nav className="navbar glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky' }}>
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

            <div style={{ display: 'flex', gap: '16px' }}>
              <Link href="/login" className="btn btn-secondary desktop-only" style={{ padding: '8px 24px' }}>Đăng nhập</Link>
              <Link href="/consult" className="btn btn-primary" style={{ padding: '8px 24px' }}>Bắt đầu</Link>
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

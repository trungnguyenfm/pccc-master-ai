import Link from 'next/link';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="section-py" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,87,34,0.15) 0%, rgba(13,15,18,0) 70%)', zIndex: -1 }}></div>

        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <div className="glass-panel" style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '30px', margin: '0 auto 32px auto', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255, 87, 34, 0.3)' }}>
            ✨ Giải pháp tư vấn PCCC 4.0
          </div>
          
          <h1 style={{ marginBottom: '24px' }}>
            Tư Vấn Thẩm Duyệt <span className="text-gradient">PCCC</span><br />Tự Động & Lập Tức
          </h1>
          
          <p style={{ fontSize: '1.25rem', marginBottom: '40px', color: 'var(--text-secondary)' }}>
            Mô hình AI chuyên biệt đã đọc hàng ngàn trang quy chuẩn VN. Khai báo thông tin công trình để nhận giải đáp chuẩn xác trong vài giây thay vì phải chờ đợi nhiều ngày.
          </p>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/consult" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
              Tư vấn ngay — Miễn phí 10 câu hỏi
            </Link>
            <Link href="#how-it-works" className="btn btn-secondary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
              Tìm hiểu quy trình
            </Link>
          </div>

          {/* Abstract Interface Preview Image / Box */}
          <div className="glass-panel" style={{ marginTop: '64px', height: '300px', borderRadius: '16px 16px 0 0', borderBottom: 'none', background: 'linear-gradient(to bottom, var(--surface-hover), var(--bg-color))', position: 'relative', display: 'flex', flexDirection: 'column', padding: '24px', textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--error-color)'}}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--warning-color)'}}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success-color)'}}></div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-disabled)', marginLeft: '12px', marginTop: '-2px' }}>AI Consulting Chat</span>
            </div>
            
            {/* Fake Chat bubbles */}
            <div style={{ alignSelf: 'flex-end', background: 'var(--primary-color)', padding: '12px 16px', borderRadius: '16px 16px 0 16px', marginBottom: '24px', fontSize: '0.9rem', maxWidth: '70%' }}>
              Cho tôi hỏi, tôi đang xây nhà kho thiết bị điện tử diện tích 2000m2, bậc chịu lửa bậc II thì khối lượng nước chữa cháy ngoài nhà là bao nhiêu?
            </div>
            
            <div style={{ alignSelf: 'flex-start', background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '16px 16px 16px 0', fontSize: '0.9rem', maxWidth: '85%', lineHeight: 1.6 }}>
              <strong style={{ color: 'white' }}>Chuyên gia AI:</strong> Theo QCVN 06:2022/BXD (Bảng 11), với kho chứa hàng hóa (hạng nguy hiểm cháy C), khối tích tương đương 2000m2 x 1 tầng (khoảng 10,000 m³), bậc chịu lửa II, thì lưu lượng nước chữa cháy ngoài nhà cần thiết là...
            </div>
            
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to bottom, rgba(13,15,18,0), rgba(13,15,18,1))' }}></div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section-py" style={{ backgroundColor: 'var(--surface-color)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ marginBottom: '16px' }}>Hoạt động đơn giản</h2>
            <p style={{ maxWidth: '600px', margin: '0 auto' }}>Trải nghiệm luồng tư vấn thiết kế nhanh chóng với mô hình Freemium độc đáo, tích hợp thanh toán tự động tiện lợi.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <div className="glass-panel" style={{ padding: '40px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.2) 0%, rgba(255, 87, 34, 0) 100%)', border: '1px solid rgba(255, 87, 34, 0.3)', color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', margin: '0 auto 32px auto' }}>
                📝
              </div>
              <h3 style={{ marginBottom: '16px' }}>1. Nhập liệu dự án</h3>
              <p>Điền các thông số cơ bản về công trình (diện tích, hạng mục, số tầng). Thông tin này được cấu hình làm nền tảng ngữ cảnh cho AI.</p>
            </div>
            
            <div className="glass-panel" style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.2) 0%, rgba(255, 87, 34, 0) 100%)', border: '1px solid rgba(255, 87, 34, 0.3)', color: 'var(--primary-color)', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', margin: '0 auto 32px auto' }}>
                🤖
              </div>
              <h3 style={{ marginBottom: '16px' }}>2. Nhận 10 câu trả lời</h3>
              <p>Bạn có 10 lượt trò chuyện hoàn toàn miễn phí. AI sẽ trích dẫn chi tiết quy chuẩn, điều luật tương ứng với thắc mắc của bạn.</p>
            </div>

            <div className="glass-panel" style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.2) 0%, rgba(255, 87, 34, 0) 100%)', border: '1px solid rgba(255, 87, 34, 0.3)', color: 'var(--primary-color)', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', margin: '0 auto 32px auto' }}>
                ⚡
              </div>
              <h3 style={{ marginBottom: '16px' }}>3. Quét QR Gia hạn</h3>
              <p>Mở rộng hạn mức dễ dàng với mã VietQR (PayOS). Hệ thống xác nhận thanh toán trong 2s và tự động mở khóa chat ngay.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-py" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ marginBottom: '24px' }}>Sẵn sàng nhận tư vấn chuyên sâu?</h2>
          <p style={{ marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>Bắt đầu hoàn toàn miễn phí, không cần thẻ tín dụng để sử dụng 10 câu hỏi đầu tiên. Chúng tôi đem kiến trúc sư PCCC phục vụ ngay trên bàn làm việc của bạn.</p>
          <Link href="/consult" className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '1.25rem' }}>
            Bắt đầu khảo sát thông tin công trình
          </Link>
        </div>
      </section>
    </div>
  );
}

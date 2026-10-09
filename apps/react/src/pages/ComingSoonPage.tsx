import React, { useState } from 'react';
import { useHead } from '../lib/useHead';

export function ComingSoonPage() {
  useHead({
    title: 'Nội dung sẽ được cập nhật sớm · Hán ngữ Sơ Tâm',
    description: 'Trang này đang trong quá trình hoàn thiện.',
  });

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Giả lập lưu email thành công
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className="container" style={{ padding: '60px 20px 100px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/assets/logo.png" alt="Sơ Tâm" style={{ height: 60, marginBottom: 32 }} onError={(e) => (e.currentTarget.style.display = 'none')} />
      
      <h1 style={{ color: 'var(--c-red-dark)', marginBottom: 16 }}>Nội dung sẽ được cập nhật sớm</h1>
      <p style={{ color: 'var(--c-text-soft)', marginBottom: 40, maxWidth: 500 }}>
        Chúng tôi đang hoàn thiện nội dung cho phần này. Hãy để lại email để nhận thông báo ngay khi trang web ra mắt!
      </p>

      {submitted ? (
        <div style={{ background: 'var(--c-bg-soft)', color: 'var(--c-red-dark)', padding: '16px 24px', borderRadius: 8, fontWeight: 500 }}>
          Cảm ơn bạn! Chúng tôi sẽ thông báo đến bạn sớm nhất.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 400 }}>
          <input
            type="email"
            required
            placeholder="Địa chỉ email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid var(--c-border)',
              borderRadius: 6,
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Đăng ký
          </button>
        </form>
      )}
    </div>
  );
}

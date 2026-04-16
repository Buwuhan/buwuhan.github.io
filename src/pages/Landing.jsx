import { useCloud } from '../context/CloudContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const { user, login } = useCloud();
  const navigate = useNavigate();

  const handleStart = () => {
    if (user) {
      navigate('/app');
    } else {
      login();
    }
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src="/favicon.svg" alt="Buwuhan Logo" width="32" height="32" style={{ marginRight: '8px' }} />
          Buwuhan Tracker
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            Kelola Sumbangan Hajatan <br />
            <span className="text-gold">Tanpa Ribet.</span>
          </h1>
          <p className="hero-subtitle">
            Buwuhan Tracker membantu Anda mencatat sumbangan yang diterima dan diberikan saat hajatan. 
            Modern, ringkas, dan sepenuhnya dalam kendali Anda.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={handleStart} style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
              {user ? 'Buka Dashboard' : 'Masuk dengan Google'}
            </button>
            {!user && (
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/app')} style={{ padding: '14px 32px', fontSize: '1.1rem', backgroundColor: 'transparent', border: '1px solid var(--gold-500)', color: 'var(--gold-400)' }}>
                Lanjut Tanpa Login (Lokal)
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Fitur Utama</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <span className="feature-icon">✍️</span>
            <h3 className="feature-h">Catat Cepat</h3>
            <p className="feature-p">
              Input sumbangan dalam hitungan detik. Mendukung sumbangan berupa uang maupun barang (beras, rokok, dll).
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3 className="feature-h">Pantau Saldo</h3>
            <p className="feature-p">
              Ketahui siapa yang perlu "dibalas" sumbangannya dan berapa nominalnya secara otomatis.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👥</span>
            <h3 className="feature-h">Buku Tamu Digital</h3>
            <p className="feature-p">
              Kelola daftar tamu dan riwayat interaksi mereka di setiap acara yang Anda selenggarakan.
            </p>
          </div>
        </div>
      </section>

      {/* Transparency / Google Drive Section */}
      <section className="transparency-section">
        <div className="transparency-content">
          <div className="google-drive-badge">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" width="24" height="24" alt="Google Drive" />
            <span style={{ fontWeight: 600 }}>Powered by Google Drive</span>
          </div>
          <h2 className="section-title" style={{ marginTop: 0 }}>Privasi Anda Prioritas Kami</h2>
          <p className="hero-subtitle" style={{ maxWidth: '700px' }}>
            Buwuhan Tracker menggunakan **Google Drive App Data Folder** untuk menyimpan data Anda. 
            Ini berarti:
          </p>
          <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 40, textAlign: 'left' }}>
            <div style={{ padding: 20 }}>
              <h4 style={{ color: 'var(--gold-400)', marginBottom: 10 }}>Pemilikan Data Penuh</h4>
              <p className="text-sm">Data hanya tersimpan di akun Google Anda, bukan di server kami.</p>
            </div>
            <div style={{ padding: 20 }}>
              <h4 style={{ color: 'var(--gold-400)', marginBottom: 10 }}>Aman & Terenkripsi</h4>
              <p className="text-sm">Menggunakan standar keamanan kelas dunia dari Google.</p>
            </div>
            <div style={{ padding: 20 }}>
              <h4 style={{ color: 'var(--gold-400)', marginBottom: 10 }}>Tanpa Biaya Server</h4>
              <p className="text-sm">Anda tidak perlu membayar biaya berlangganan penyimpanan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-links">
          <a href="/privacy.html" className="footer-link">Kebijakan Privasi</a>
          <a href="/terms.html" className="footer-link">Syarat & Ketentuan</a>
          <a href="https://github.com/buwuhan/buwuhan.github.io" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
        </div>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>
          © 2026 Buwuhan Tracker. Dibuat untuk melestarikan tradisi dengan cara modern.
        </p>
      </footer>
    </div>
  );
}

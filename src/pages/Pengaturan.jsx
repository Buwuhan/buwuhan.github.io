import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useCloud } from '../context/CloudContext.jsx';
import { eksporJSON, imporJSON, DEFAULT_JENIS_BARANG } from '../utils/storage.js';

export default function Pengaturan() {
  const { data, simpanProfile, tambahJenisBarang, hapusJenisBarang, loadFromExternal, resetData } = useApp();
  const { user, syncStatus, login, logout, deleteCloudFile, load, providerType, clientIdMissing } = useCloud();

  const [profile, setProfile] = useState({ namaKeluarga: data.profile?.namaKeluarga || '' });
  const [savedProfile, setSavedProfile] = useState(false);
  const [namaBarangBaru, setNamaBarangBaru] = useState('');
  const [importError, setImportError] = useState('');
  const [importOk, setImportOk] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFinished, setDeleteFinished] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const fileRef = useRef();

  const addDebug = (msg) => {
    console.log('[DEBUG-RESET]', msg);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleSimpanProfile = (e) => {
    e.preventDefault();
    simpanProfile(profile);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
  };

  const handleTambahBarang = (e) => {
    e.preventDefault();
    if (!namaBarangBaru.trim()) return;
    tambahJenisBarang(namaBarangBaru.trim());
    setNamaBarangBaru('');
  };

  const handleEkspor = () => eksporJSON(data);

  const handleImpor = async (e) => {
    setImportError(''); setImportOk(false);
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await imporJSON(file);
      if (!imported.orang && !imported.transaksi) throw new Error('Format data tidak dikenali.');
      if (confirm(`Import akan mengganti SEMUA data yang ada. Lanjutkan?\n(${imported.orang?.length || 0} orang, ${imported.transaksi?.length || 0} transaksi, ${imported.acara?.length || 0} acara)`)) {
        loadFromExternal(imported);
        setImportOk(true);
        setTimeout(() => setImportOk(false), 3000);
      }
    } catch (err) {
      setImportError(err.message);
    }
    e.target.value = '';
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetData = () => setShowConfirm(true);

  const executeReset = async () => {
    setShowConfirm(false);
    setIsDeleting(true);
    setDeleteFinished(false);
    setDebugLog(['Menghubungkan ke layanan...']);
    
    try {
      // 1. Cloud Delete
      if (user) {
        addDebug('Membersihkan data di Google Drive...');
        try {
          await deleteCloudFile();
          addDebug('✅ Data Cloud berhasil dihapus.');
        } catch (driveErr) {
          addDebug(`⚠️ Lewati Cloud: ${driveErr.message}`);
        }
      } else {
        addDebug('ℹ️ Sesi cloud tidak aktif, lanjut ke data lokal.');
      }

      // 2. Local State Reset
      addDebug('Menghapus data aplikasi (Orang/Acara/Transaksi)...');
      if (resetData) {
        resetData();
        addDebug('✅ Data aplikasi berhasil dikosongkan.');
      }

      // 3. Browser Storage Clear
      addDebug('Membersihkan memori browser (LocalStorage)...');
      localStorage.clear();
      sessionStorage.clear();
      addDebug('✅ Memori browser bersih.');

      addDebug('──────────────────────────────────');
      addDebug('✔️ SELURUH DATA BERHASIL DIHAPUS.');
      setDeleteFinished(true);
    } catch (err) {
      addDebug(`❌ ERROR: ${err.message}`);
      setDeleteFinished(true); // Biarkan user reload meski error
    }
  };

  return (
    <div>
      {/* Loading Overlay saat menghapus */}
      {isDeleting && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.9)', color: 'white',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(10px)', padding: '20px'
        }}>
          {!deleteFinished ? (
            <div className="sync-spinner" style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--rose-400)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>✅</div>
          )}
          
          <p style={{ marginTop: 20, fontWeight: 700, fontSize: '1.4rem', textAlign: 'center' }}>
            {deleteFinished ? 'Data Berhasil Dihapus' : 'Menghapus Data Permanen...'}
          </p>
          
          <div style={{ marginTop: 20, background: '#111', padding: '15px', borderRadius: 12, width: '100%', maxWidth: '500px', maxHeight: '30vh', overflowY: 'auto', fontSize: '0.85rem', fontFamily: 'monospace', border: '1px solid #333', color: '#aaa' }}>
            {debugLog.map((line, i) => <div key={i} style={{ marginBottom: 4 }}>{line}</div>)}
          </div>

          {deleteFinished && (
            <button 
              className="btn btn-primary" 
              style={{ marginTop: 30, padding: '12px 30px', fontSize: '1rem' }}
              onClick={() => window.location.reload()}
            >
              🔄 Muat Ulang Aplikasi
            </button>
          )}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan ⚙️</h1>
          <p className="page-subtitle">Profil, barang, dan sinkronisasi data</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ─── Profil ─── */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>👨‍👩‍👧 Profil Keluarga</h3>
          <form onSubmit={handleSimpanProfile}>
            <div className="form-group">
              <label className="form-label">Nama Keluarga</label>
              <input
                placeholder="Contoh: Santoso"
                value={profile.namaKeluarga}
                onChange={e => setProfile(p => ({ ...p, namaKeluarga: e.target.value }))}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Akan ditampilkan sebagai judul di halaman Dashboard.
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              {savedProfile ? '✅ Tersimpan' : 'Simpan Profil'}
            </button>
          </form>
        </div>

        {/* ─── Jenis Barang ─── */}
        <div className="card">
          <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 700 }}>📦 Jenis Barang Sumbangan</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Tambah atau hapus jenis barang yang biasa disumbangkan di daerah Anda.
          </p>

          <form onSubmit={handleTambahBarang} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              placeholder="Contoh: Telur, Sabun, Kue..."
              value={namaBarangBaru}
              onChange={e => setNamaBarangBaru(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>+ Tambah</button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.jenisBarang.map(b => {
              const isBawaan = DEFAULT_JENIS_BARANG.includes(b);
              return (
                <div key={b} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999,
                  background: isBawaan ? 'var(--bg-card-2)' : 'var(--accent-glow)',
                  border: `1px solid ${isBawaan ? 'var(--border)' : 'rgba(217,119,6,0.3)'}`,
                  fontSize: '0.82rem',
                }}>
                  <span style={{ color: isBawaan ? 'var(--text-secondary)' : 'var(--gold-400)' }}>{b}</span>
                  <button
                    onClick={() => hapusJenisBarang(b)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', padding: 0, lineHeight: 1 }}
                    title="Hapus"
                  >✕</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Sinkronisasi Cloud ─── */}
        <div className="card">
          <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 700 }}>☁️ Sinkronisasi Cloud</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Pilih layanan cloud untuk mencadangkan data Anda secara otomatis & aman.
          </p>

          <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
            {/* Opsi Google Drive */}
            <div style={{
              padding: '16px', borderRadius: 'var(--radius-md)',
              border: `2px solid ${providerType === 'google_drive' ? 'var(--gold-400)' : 'var(--border)'}`,
              background: providerType === 'google_drive' ? 'rgba(217,119,6,0.05)' : 'transparent',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5h-6.86z" fill="#0066DA"/>
                  <path d="M16.29 3.5l-6.86 11.5 3.43 6 6.86-11.5h-3.43z" fill="#00AA47"/>
                  <path d="M22.85 15l-3.43-6h-13.71l3.43 6h13.71z" fill="#FFBA00"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Google Drive</span>
                {providerType === 'google_drive' && <span style={{ fontSize: '0.7rem', color: 'var(--gold-400)', marginLeft: 'auto' }}>Aktiif</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gratis, data disimpan di folder privat Drive Anda.</div>
            </div>

            {/* Opsi Managed Cloud (Coming Soon) */}
            <div style={{
              padding: '16px', borderRadius: 'var(--radius-md)',
              border: '2px solid var(--border)',
              background: 'var(--bg-card-2)',
              opacity: 0.6, cursor: 'not-allowed', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 5, right: -25, background: 'var(--rose-500)',
                color: 'white', fontSize: '0.6rem', padding: '2px 30px', transform: 'rotate(45deg)',
                fontWeight: 700, textTransform: 'uppercase'
              }}>Soon</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '1.25rem' }}>✨</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Buwuhan Cloud Pro</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Layanan premium dengan sinkronisasi instan via browser/app.</div>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            {clientIdMissing ? (
              <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: 'var(--gold-400)', marginBottom: 8 }}>⚠️ Konfigurasi Diperlukan</div>
                <ol style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20 }}>
                  <li>Buka <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-400)' }}>console.cloud.google.com</a></li>
                  <li>Aktifkan <strong>Google Drive API</strong> & buat <strong>OAuth 2.0 Client ID</strong></li>
                  <li>Tambahkan domain Anda di <em>Authorized origins</em></li>
                  <li>Isi <code style={{ background: 'var(--bg-card-3)', padding: '1px 6px', borderRadius: 4 }}>VITE_GOOGLE_CLIENT_ID</code> di env</li>
                </ol>
              </div>
            ) : user ? (
              <div>
                <div className="user-card" style={{ marginBottom: 12 }}>
                  <img src={user.picture} alt={user.name} />
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <span className={`badge ${syncStatus === 'synced' ? 'badge-green' : syncStatus === 'syncing' ? 'badge-gold' : 'badge-gray'}`} style={{ marginLeft: 'auto' }}>
                    {syncStatus === 'synced' ? '✅ Tersinkron' : syncStatus === 'syncing' ? '🔄 Menyinkron...' : '⚠️ Error'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={load}>🔄 Sync Manual</button>
                  <button className="btn btn-danger btn-sm" onClick={logout}>Keluar Akun</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-google" onClick={login}>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Masuk dengan Google
              </button>
            )}
          </div>
        </div>

        {/* ─── Ekspor / Impor Manual ─── */}
        <div className="card">
          <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 700 }}>📁 Backup Manual</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Unduh data sebagai file JSON untuk disimpan di Google Drive, flashdisk, atau dikirim via WhatsApp.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleEkspor}>
              ⬇️ Ekspor Data (.json)
            </button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              ⬆️ Impor dari File
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImpor} />
          </div>

          {importError && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--rose-400)', fontSize: '0.82rem' }}>
              ❌ {importError}
            </div>
          )}
          {importOk && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--sage-400)', fontSize: '0.82rem' }}>
              ✅ Data berhasil diimpor!
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-card-2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', lineHeight: 1.7 }}>
            <strong>Cara berbagi ke HP lain:</strong><br />
            1. Klik <em>Ekspor Data</em> → file `.json` terunduh<br />
            2. Upload file ke Google Drive / kirim via WhatsApp<br />
            3. Di HP lain, buka aplikasi ini → klik <em>Impor dari File</em>
          </div>
        </div>

        {/* ─── Statistik ─── */}
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: '1rem', fontWeight: 700 }}>📊 Statistik Data</h3>
          <div className="grid-3">
            {[
              { label: 'Orang', value: data.orang.length, icon: '👤' },
              { label: 'Acara', value: data.acara.length, icon: '🎊' },
              { label: 'Transaksi', value: data.transaksi.length, icon: '📋' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.5rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Reset ─── */}
        <div className="card" style={{ borderColor: 'rgba(244,63,94,0.2)' }}>
          <h3 style={{ marginBottom: 4, fontSize: '1rem', fontWeight: 700, color: 'var(--rose-400)' }}>⚠️ Zona Berbahaya</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Hapus semua data. Pastikan sudah ekspor backup sebelumnya.
          </p>
          
          {!showConfirm ? (
            <button className="btn btn-danger btn-sm" onClick={handleResetData}>
              🗑️ Hapus Semua Data
            </button>
          ) : (
            <div style={{ 
              background: 'rgba(244,63,94,0.05)', 
              padding: '15px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px dashed var(--rose-400)' 
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--rose-400)', fontWeight: 700, marginBottom: 12 }}>
                Yakin ingin menghapus DATA LOKAL & CLOUD secara permanen?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger btn-sm" onClick={executeReset}>
                  YA, Hapus Sekarang
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirm(false)}>
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

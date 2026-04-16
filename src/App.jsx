import { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Sidebar, { MobileNav } from './components/Layout/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BukuTamu from './pages/BukuTamu.jsx';
import DetailOrang from './pages/DetailOrang.jsx';
import Acara from './pages/Acara.jsx';
import DetailAcara from './pages/DetailAcara.jsx';
import CatatSumbangan from './pages/CatatSumbangan.jsx';
import Pengaturan from './pages/Pengaturan.jsx';
import Landing from './pages/Landing.jsx';

import { GoogleDriveProvider } from './context/GoogleDriveContext.jsx';
import { ManagedCloudProvider } from './context/ManagedCloudProvider.jsx';
import { useCloud } from './context/CloudContext.jsx';
import { useApp } from './context/AppContext.jsx';
import { useEffect, useRef } from 'react';
import { mergeData } from './utils/merge.js';
import Modal from './components/UI/Modal.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <CloudProvider>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app/*" element={<AppLayout />} />
            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </CloudProvider>
    </BrowserRouter>
  );
}

function AppLayout() {
  return (
    <>
      <SyncMediator />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div className="page-body">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tamu" element={<BukuTamu />} />
              <Route path="/tamu/:id" element={<DetailOrang />} />
              <Route path="/acara" element={<Acara />} />
              <Route path="/acara/:id" element={<DetailAcara />} />
              <Route path="/catat" element={<CatatSumbangan />} />
              <Route path="/pengaturan" element={<Pengaturan />} />
            </Routes>
          </div>
          <AppFooter />
        </main>
        <MobileNav />
      </div>
    </>
  );
}

function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-links">
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Kebijakan Privasi</a>
        <span>&middot;</span>
        <a href="/terms.html" target="_blank" rel="noopener noreferrer">Syarat &amp; Ketentuan</a>
        <span>&middot;</span>
        <span>v1.2.0 &copy; 2026 Buwuhan Tracker</span>
      </div>
    </footer>
  );
}

/**
 * CloudProvider: Wrapper dinamis untuk memilih layanan cloud.
 */
function CloudProvider({ children }) {
  const [useManaged] = useState(false); 

  if (useManaged) {
    return <ManagedCloudProvider>{children}</ManagedCloudProvider>;
  }
  return <GoogleDriveProvider>{children}</GoogleDriveProvider>;
}

/**
 * SyncMediator: Menghubungkan CloudContext dan AppContext.
 * Juga menangani konflik jika data lokal dan cloud berbeda.
 */
function SyncMediator() {
  const { scheduleSync, onDataLoaded } = useCloud();
  const { data, loadFromExternal } = useApp();
  const lastCloudDataRef = useRef(null);

  // State untuk menangani konflik
  const [conflict, setConflict] = useState(null); // { local, cloud }

  // Sync lokal -> cloud secara berkala saat tidak ada konflik aktif
  useEffect(() => {
    if (data && scheduleSync && !conflict) {
      scheduleSync(data);
    }
  }, [data, scheduleSync, conflict]);

  useEffect(() => {
    if (onDataLoaded) {
      return onDataLoaded((cloudData) => {
        // Abaikan jika data dari cloud persis sama dengan snapshot terakhir kita
        if (JSON.stringify(cloudData) === JSON.stringify(lastCloudDataRef.current)) {
          return; 
        }

        const l_len = (data.orang?.length || 0) + (data.acara?.length || 0) + (data.transaksi?.length || 0);
        const c_len = (cloudData.orang?.length || 0) + (cloudData.acara?.length || 0) + (cloudData.transaksi?.length || 0);

        if (l_len === 0 || c_len === 0) {
          // Kasus paling aman: Salah satu kosong. Ambil cloud atau biarkan lokal ter-push otomatis
          if (c_len > 0) {
            lastCloudDataRef.current = cloudData;
            loadFromExternal(cloudData);
          }
          // Jika c_len === 0, useEffect scheduleSync otomatis mendorong lokal ke cloud
        } else {
          // Keduanya punya data. Periksa perbedaannya.
          const l_str = JSON.stringify({ orang: data.orang, acara: data.acara, transaksi: data.transaksi });
          const c_str = JSON.stringify({ orang: cloudData.orang, acara: cloudData.acara, transaksi: cloudData.transaksi });
          
          if (l_str !== c_str) {
            // Berbeda! Munculkan dialog konflik.
            setConflict({ local: data, cloud: cloudData });
          } else {
            // Sama isinya, anggap tersinkronisasi.
            lastCloudDataRef.current = cloudData;
            loadFromExternal(cloudData);
          }
        }
      });
    }
  }, [onDataLoaded, data, loadFromExternal]);

  // Handler Resolusi Konflik
  const handleUseLocal = () => {
    lastCloudDataRef.current = conflict.local; // Anggap sinkron
    scheduleSync(conflict.local); // Paksa upload
    setConflict(null);
  };

  const handleUseCloud = () => {
    lastCloudDataRef.current = conflict.cloud;
    loadFromExternal(conflict.cloud); // Timpa lokal
    setConflict(null);
  };

  const handleMerge = () => {
    const merged = mergeData(conflict.local, conflict.cloud);
    lastCloudDataRef.current = merged;
    loadFromExternal(merged);
    scheduleSync(merged);
    setConflict(null);
  };

  if (!conflict) return null;

  return (
    <Modal isOpen={true} onClose={() => {}} title="Konflik Sinkronisasi">
      <div style={{ marginBottom: '1.5rem' }}>
        <p>Aplikasi mendeteksi bahwa terdapat data yang pernah Anda simpan secara lokal (tanpa login), dan ada juga data sebelumnya di Google Drive Anda.</p>
        <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>Apa yang ingin Anda lakukan terkait kedua data ini?</p>
      </div>
      <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={handleMerge} style={{ width: '100%', justifyContent: 'center' }}>
          Gabungkan Data (Merge Lokal + Cloud)
        </button>
        <button className="btn btn-secondary" onClick={handleUseLocal} style={{ width: '100%', justifyContent: 'center' }}>
          Gunakan Lokal (Timpa & Hapus Data Drive)
        </button>
        <button className="btn btn-secondary" onClick={handleUseCloud} style={{ width: '100%', justifyContent: 'center' }}>
          Gunakan Drive (Timpa & Hapus Data Lokal)
        </button>
      </div>
    </Modal>
  );
}

import { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Sidebar, { MobileNav } from './components/Layout/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BukuTamu from './pages/BukuTamu.jsx';
import DetailOrang from './pages/DetailOrang.jsx';
import Acara from './pages/Acara.jsx';
import DetailAcara from './pages/DetailAcara.jsx';
import CatatSumbangan from './pages/CatatSumbangan.jsx';
import Pengaturan from './pages/Pengaturan.jsx';

import { GoogleDriveProvider } from './context/GoogleDriveContext.jsx';
import { ManagedCloudProvider } from './context/ManagedCloudProvider.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <CloudProvider>
        <AppProvider>
          <InnerApp />
        </AppProvider>
      </CloudProvider>
    </BrowserRouter>
  );
}

/**
 * CloudProvider: Wrapper dinamis untuk memilih layanan cloud.
 * Saat ini default ke Google Drive, namun sudah siap ditukar ke Managed Cloud.
 */
function CloudProvider({ children }) {
  // Nantinya setting ini bisa diambil dari AppContext atau localStorage
  const [useManaged] = useState(false); 

  if (useManaged) {
    return <ManagedCloudProvider>{children}</ManagedCloudProvider>;
  }
  return <GoogleDriveProvider>{children}</GoogleDriveProvider>;
}

function InnerApp() {
  return (
    <>
      <SyncMediator />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tamu" element={<BukuTamu />} />
            <Route path="/tamu/:id" element={<DetailOrang />} />
            <Route path="/acara" element={<Acara />} />
            <Route path="/acara/:id" element={<DetailAcara />} />
            <Route path="/catat" element={<CatatSumbangan />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </>
  );
}

/**
 * SyncMediator: Menghubungkan CloudContext dan AppContext secara langsung.
 * Komponen ini tidak me-render apa-apa, hanya bertugas menangani side-effects
 * seperti sinkronisasi data antar context.
 */
import { useCloud } from './context/CloudContext.jsx';
import { useApp } from './context/AppContext.jsx';
import { useEffect, useRef } from 'react';

function SyncMediator() {
  const { scheduleSync, onDataLoaded } = useCloud();
  const { data, loadFromExternal } = useApp();
  
  // Gunakan ref untuk menghindari loop tak terbatas jika data berubah cepat
  const lastCloudDataRef = useRef(null);

  // 1. AppContext -> Cloud (Auto Sync)
  useEffect(() => {
    if (data && scheduleSync) {
      scheduleSync(data);
    }
  }, [data, scheduleSync]);

  // 2. Cloud -> AppContext (Load on Login)
  useEffect(() => {
    if (onDataLoaded) {
      // Set handler untuk data yang datang dari Cloud
      return onDataLoaded((cloudData) => {
        // Hindari load ulang jika data sama dengan yang terakhir di-load
        if (JSON.stringify(cloudData) !== JSON.stringify(lastCloudDataRef.current)) {
          lastCloudDataRef.current = cloudData;
          loadFromExternal(cloudData);
        }
      });
    }
  }, [onDataLoaded, loadFromExternal]);

  return null;
}

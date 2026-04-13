import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import CloudContext from './CloudContext';

const DRIVE_FILE_NAME = 'buwuhan-data.json';
// Scope: akses folder khusus app + info profil user
const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function GoogleDriveProvider({ children }) {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [accessToken, setAccessToken] = useState(null);
  const [driveFileId, setDriveFileId] = useState(null);
  const [gapiReady, setGapiReady] = useState(false);

  const debounceRef = useRef(null);
  const pendingDataRef = useRef(null);
  const tokenClientRef = useRef(null);
  const accessTokenRef = useRef(null);
  const driveFileIdRef = useRef(null);
  const listenersRef = useRef([]);

  const onDataLoaded = useCallback((cb) => {
    listenersRef.current.push(cb);
    return () => {
      listenersRef.current = listenersRef.current.filter(l => l !== cb);
    };
  }, []);

  // ─── Load Scripts & Restore Session ──────────────────────
  useEffect(() => {
    if (!CLIENT_ID) return;

    let gapiLoaded = false;
    let gisLoaded = false;

    const tryInitTokenClient = () => {
      if (!gapiLoaded || !gisLoaded) return;
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
      });

      // Restore session jika ada token valid di localStorage
      restoreSession();
    };

    const restoreSession = () => {
      const savedToken = localStorage.getItem('gd_access_token');
      const expiresAt = localStorage.getItem('gd_expires_at');

      if (savedToken && expiresAt && Date.now() < parseInt(expiresAt)) {
        console.log('[GoogleDrive] Merestorasi sesi yang ada...');
        handleTokenResponse({ access_token: savedToken, restored: true });
      }
    };

    const initGapi = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        gapiLoaded = true;
        setGapiReady(true);
        tryInitTokenClient();
      });
    };

    const initGIS = () => {
      gisLoaded = true;
      tryInitTokenClient();
    };

    // Load gapi
    if (window.gapi) {
      gapiLoaded = false;
      initGapi();
    } else {
      const s = document.createElement('script');
      s.src = 'https://apis.google.com/js/api.js';
      s.onload = initGapi;
      document.body.appendChild(s);
    }

    // Load GIS (Google Identity Services)
    if (window.google?.accounts) {
      initGIS();
    } else {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.onload = initGIS;
      document.body.appendChild(s);
    }
  }, []);

  // ─── Token Response Handler ───────────────────────────────
  const handleTokenResponse = useCallback(async (response) => {
    if (response.error) {
      console.error('[GoogleDrive] Token error:', response);
      setSyncStatus('error');
      return;
    }

    const token = response.access_token;
    accessTokenRef.current = token;
    setAccessToken(token);
    window.gapi.client.setToken({ access_token: token });

    // Simpan token ke localStorage untuk persistensi (1 jam standar)
    if (!response.restored) {
      localStorage.setItem('gd_access_token', token);
      localStorage.setItem('gd_expires_at', (Date.now() + 3500 * 1000).toString());
    }

    // Ambil info profil user
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const info = await res.json();
      setUser({ name: info.name, email: info.email, picture: info.picture });
    } catch (e) {
      console.warn('[GoogleDrive] Gagal ambil profil:', e);
    }

    // Muat data dari Drive
    await doLoadFromDrive(token);
  }, []);

  // ─── Login ───────────────────────────────────────────────
  const login = useCallback(() => {
    if (!tokenClientRef.current) {
      alert('Google Identity belum siap. Tunggu beberapa detik lalu coba lagi.');
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
  }, []);

  // ─── Logout ──────────────────────────────────────────────
  const logout = useCallback(() => {
    if (accessTokenRef.current) {
      window.google?.accounts.oauth2.revoke(accessTokenRef.current, () => {});
    }
    accessTokenRef.current = null;
    setUser(null);
    setAccessToken(null);
    setDriveFileId(null);
    driveFileIdRef.current = null;
    localStorage.removeItem('gd_access_token');
    localStorage.removeItem('gd_expires_at');
    setSyncStatus('idle');
  }, []);

  // ─── Cari file di Drive appDataFolder ────────────────────
  const findDriveFile = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) return null;
    try {
      const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
      const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)&pageSize=1`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      
      const result = await res.json();
      const id = result.files?.length > 0 ? result.files[0].id : null;
      return id;
    } catch (err) {
      console.error('[GoogleDrive] findDriveFile error:', err);
      return null;
    }
  }, []);

  // ─── Load data dari Drive ─────────────────────────────────
  const doLoadFromDrive = useCallback(async (token) => {
    setSyncStatus('syncing');
    try {
      const fileId = await findDriveFile();
      if (!fileId) {
        console.log('[GoogleDrive] Belum ada file di Drive (pertama kali).');
        setSyncStatus('synced');
        return;
      }
      driveFileIdRef.current = fileId;
      setDriveFileId(fileId);

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&t=${Date.now()}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }
      );

      if (!res.ok) throw new Error('Download failed');

      const parsed = await res.json();
      listenersRef.current.forEach(cb => cb(parsed));
      setSyncStatus('synced');
    } catch (err) {
      console.error('[GoogleDrive] Load error:', err);
      setSyncStatus('error');
    }
  }, [findDriveFile]);

  const load = useCallback(() => {
    if (!accessTokenRef.current) return;
    return doLoadFromDrive(accessTokenRef.current);
  }, [doLoadFromDrive]);

  // ─── Simpan data ke Drive ─────────────────────────────────
  const save = useCallback(async (dataToSave) => {
    const token = accessTokenRef.current;
    if (!token) return;
    setSyncStatus('syncing');
    try {
      const json = JSON.stringify(dataToSave);
      let fid = driveFileIdRef.current;
      if (!fid) {
        fid = await findDriveFile();
        if (fid) {
          driveFileIdRef.current = fid;
          setDriveFileId(fid);
        }
      }

      if (fid) {
        const res = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fid}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: json,
          }
        );
        if (!res.ok) throw new Error('Patch failed');
      } else {
        const metadata = JSON.stringify({
          name: DRIVE_FILE_NAME,
          parents: ['appDataFolder'],
        });
        const form = new FormData();
        form.append('metadata', new Blob([metadata], { type: 'application/json' }));
        form.append('file', new Blob([json], { type: 'application/json' }));

        const res = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          }
        );
        if (!res.ok) throw new Error('Post failed');
        const newFile = await res.json();
        driveFileIdRef.current = newFile.id;
        setDriveFileId(newFile.id);
      }

      setSyncStatus('synced');
    } catch (err) {
      console.error('[GoogleDrive] Save error:', err);
      setSyncStatus('error');
    }
  }, [findDriveFile]);

  // ─── Hapus file dari Drive (Wipe Total) ──────────────────
  const deleteCloudFile = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) {
      console.warn('[GoogleDrive] deleteDriveFile: No token available');
      return;
    }
    
    setSyncStatus('syncing');
    try {
      // Cari SEMUA file dengan nama tersebut (antisipasi duplikat)
      const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}'`);
      const listUrl = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`;
      
      const resList = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!resList.ok) throw new Error(`List for delete failed: ${resList.status}`);
      
      const result = await resList.json();
      const files = result.files || [];
      
      for (const file of files) {
        const resDel = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!resDel.ok) {
          const errorText = await resDel.text().catch(() => 'No error body');
          throw new Error(`Cloud Delete Error: ${resDel.status}`);
        }
      }
      
      driveFileIdRef.current = null;
      setDriveFileId(null);
      setSyncStatus('synced');
    } catch (err) {
      console.error('[GoogleDrive] deleteDriveFile error:', err);
      setSyncStatus('error');
      throw err;
    }
  }, []);

  // ─── Auto-save dengan debounce 2 detik ───────────────────
  const scheduleSync = useCallback((data) => {
    if (!accessTokenRef.current) return;
    pendingDataRef.current = data;
    setSyncStatus('syncing');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save(pendingDataRef.current);
    }, 2000);
  }, [save]);

  return (
    <CloudContext.Provider value={{
      user,
      syncStatus,
      login,
      logout,
      save,
      load,
      deleteCloudFile,
      onDataLoaded,
      scheduleSync,
      providerType: 'google_drive',
      clientIdMissing: !CLIENT_ID,
    }}>
      {children}
    </CloudContext.Provider>
  );
}

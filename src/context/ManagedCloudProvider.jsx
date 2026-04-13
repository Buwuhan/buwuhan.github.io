import { useState, useCallback } from 'react';
import CloudContext from './CloudContext';

export function ManagedCloudProvider({ children }) {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');

  const login = useCallback(() => {
    alert('Layanan Managed Cloud (Berbayar) akan segera hadir! Nantikan pembaruan berikutnya.');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setSyncStatus('idle');
  }, []);

  const save = useCallback(async () => {
    // Placeholder
  }, []);

  const load = useCallback(async () => {
    // Placeholder
  }, []);

  const deleteCloudFile = useCallback(async () => {
    // Placeholder
  }, []);

  const onDataLoaded = useCallback(() => {
    return () => {}; // No-op for now
  }, []);

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
      providerType: 'managed_cloud',
      isComingSoon: true,
    }}>
      {children}
    </CloudContext.Provider>
  );
}

import { createContext, useContext } from 'react';

/**
 * CloudContext Interface:
 * - user: { name, email, picture } | null
 * - syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'unauthorized'
 * - login: () => void
 * - logout: () => void
 * - save: (data) => Promise<void>
 * - load: () => Promise<void>
 * - deleteCloudFile: () => Promise<void>
 * - onDataLoaded: (callback) => unsubscribeFunction
 */
const CloudContext = createContext(null);

export function useCloud() {
  const context = useContext(CloudContext);
  if (!context) {
    throw new Error('useCloud must be used within a CloudProvider');
  }
  return context;
}

export default CloudContext;

const LABELS = {
  idle: 'Offline',
  syncing: 'Menyinkronkan...',
  synced: 'Tersinkronkan ✓',
  error: 'Gagal tersinkron',
  offline: 'Tersimpan Lokal',
};

export default function SyncStatus({ status = 'idle' }) {
  return (
    <div className={`sync-badge ${status}`}>
      <span className="sync-dot"></span>
      <span style={{ fontSize: '0.72rem' }}>{LABELS[status] || 'Offline'}</span>
    </div>
  );
}

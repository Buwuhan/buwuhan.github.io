import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatRupiah, formatSaldo, capitalizeWords } from '../utils/format.js';
import Modal from '../components/UI/Modal.jsx';

export default function BukuTamu() {
  const { data, tambahOrang, editOrang, hapusOrang, hitungSaldoOrang } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nama: '', desa: '', telepon: '', catatan: '' });
  const [sortBy, setSortBy] = useState('nama'); // nama | saldo

  const set = (k, v) => {
    const caps = ['nama', 'desa'];
    setForm(f => ({ ...f, [k]: caps.includes(k) ? capitalizeWords(v) : v }));
  };

  const orangFinal = data.orang
    .map(o => ({ ...o, saldo: hitungSaldoOrang(o.id) }))
    .filter(o =>
      o.nama.toLowerCase().includes(search.toLowerCase()) ||
      (o.desa || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'saldo') return b.saldo - a.saldo;
      return a.nama.localeCompare(b.nama, 'id');
    });

  const openTambah = () => {
    setEditing(null);
    setForm({ nama: '', desa: '', telepon: '', catatan: '' });
    setShowModal(true);
  };

  const openEdit = (o) => {
    setEditing(o.id);
    setForm({ nama: o.nama, desa: o.desa || '', telepon: o.telepon || '', catatan: o.catatan || '' });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama.trim()) { alert('Nama tidak boleh kosong'); return; }
    if (editing) {
      editOrang(editing, form);
    } else {
      tambahOrang(form);
    }
    setShowModal(false);
  };

  const handleHapus = (id, nama) => {
    if (confirm(`Hapus "${nama}"? Semua riwayat transaksinya juga akan dihapus.`)) {
      hapusOrang(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buku Tamu 👥</h1>
          <p className="page-subtitle">{data.orang.length} orang tercatat</p>
        </div>
        <button className="btn btn-primary" onClick={openTambah}>+ Tambah Orang</button>
      </div>

      {/* Filter & Sort */}
      <div className="flex-between" style={{ marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Cari nama atau desa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tab-bar" style={{ marginBottom: 0 }}>
          <button className={`tab-btn${sortBy === 'nama' ? ' active' : ''}`} onClick={() => setSortBy('nama')}>A-Z</button>
          <button className={`tab-btn${sortBy === 'saldo' ? ' active' : ''}`} onClick={() => setSortBy('saldo')}>Saldo ↓</button>
        </div>
      </div>

      {/* Daftar Orang */}
      {orangFinal.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">👤</div>
          <h3>Belum ada tamu</h3>
          <p>Tambahkan orang yang pernah memberi atau menerima sumbangan.</p>
          <button className="btn btn-primary mt-16" onClick={openTambah}>+ Tambah Pertama</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orangFinal.map(o => {
            const { label, type } = formatSaldo(o.saldo);
            const totalTrx = data.transaksi.filter(t => t.orangId === o.id).length;
            return (
              <Link to={`/app/tamu/${o.id}`} key={o.id} style={{ textDecoration: 'none' }}>
                <div className="card card-clickable">
                  <div className="flex-between">
                    <div className="flex-center gap-12">
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'var(--accent-glow)',
                        border: '2px solid rgba(217,119,6,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', flexShrink: 0,
                      }}>
                        {o.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{o.nama}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {o.desa || 'Alamat belum diisi'} · {totalTrx} transaksi
                        </div>
                      </div>
                    </div>
                    <div className="flex-center gap-8">
                      <div style={{ textAlign: 'right' }}>
                        <div className={`saldo-${type}`} style={{ fontSize: '0.9rem' }}>{label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {type === 'piutang' ? 'Perlu dibalas' : type === 'hutang' ? 'Kita lebih' : 'Seimbang'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.preventDefault()}>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(o)}>✏️</button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleHapus(o.id, o.nama)}>🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Data Orang' : 'Tambah Orang'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input placeholder="Contoh: Budi Santoso" value={form.nama} onChange={e => set('nama', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Desa / Kampung</label>
              <input placeholder="Contoh: Karangrejo" value={form.desa} onChange={e => set('desa', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">No. Telepon</label>
              <input placeholder="Opsional" value={form.telepon} onChange={e => set('telepon', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea placeholder="Keterangan tambahan..." rows={2} value={form.catatan} onChange={e => set('catatan', e.target.value)} style={{ resize: 'none' }} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Simpan Perubahan' : 'Tambah'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

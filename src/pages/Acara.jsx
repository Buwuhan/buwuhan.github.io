import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatTanggalSingkat, formatRupiah, toInputDate } from '../utils/format.js';
import Modal from '../components/UI/Modal.jsx';

const JENIS_ACARA = ['Pernikahan','Khitanan','Syukuran','Kelahiran','Aqiqah','Sunatan','Pindahan','Selametan','Lainnya'];
const BADGE_JENIS = {
  Pernikahan: 'badge-gold', Khitanan: 'badge-blue', Syukuran: 'badge-green',
  Kelahiran: 'badge-green', Aqiqah: 'badge-gold', Sunatan: 'badge-blue',
  Pindahan: 'badge-gray', Selametan: 'badge-gray', Lainnya: 'badge-gray',
};

export default function Acara() {
  const { data, tambahAcara, editAcara, hapusAcara } = useApp();
  const [search, setSearch] = useState('');
  const [filterMilik, setFilterMilik] = useState('semua');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nama: '', tanggal: toInputDate(), jenis: 'Pernikahan', milik: 'sendiri', tempat: '', catatan: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const acaraFinal = data.acara
    .filter(a =>
      (filterMilik === 'semua' || a.milik === filterMilik) &&
      (a.nama.toLowerCase().includes(search.toLowerCase()) ||
       (a.tempat || '').toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  const openTambah = () => {
    setEditing(null);
    setForm({ nama: '', tanggal: toInputDate(), jenis: 'Pernikahan', milik: 'sendiri', tempat: '', catatan: '' });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditing(a.id);
    setForm({ nama: a.nama, tanggal: a.tanggal, jenis: a.jenis, milik: a.milik || 'sendiri', tempat: a.tempat || '', catatan: a.catatan || '' });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama.trim()) { alert('Nama acara tidak boleh kosong'); return; }
    editing ? editAcara(editing, form) : tambahAcara(form);
    setShowModal(false);
  };

  const handleHapus = (a) => {
    const trxCount = data.transaksi.filter(t => t.acaraId === a.id).length;
    if (confirm(`Hapus acara "${a.nama}"? ${trxCount > 0 ? `${trxCount} transaksi terkait juga akan dihapus.` : ''}`)) {
      hapusAcara(a.id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Acara Hajatan 🎊</h1>
          <p className="page-subtitle">{data.acara.length} acara tercatat</p>
        </div>
        <button className="btn btn-primary" onClick={openTambah}>+ Tambah Acara</button>
      </div>

      <div className="flex-between" style={{ marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input placeholder="Cari nama acara atau tempat..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tab-bar" style={{ marginBottom: 0 }}>
          {[['semua','Semua'],['sendiri','Acara Kita'],['orang','Acara Orang']].map(([v,l]) => (
            <button key={v} className={`tab-btn${filterMilik === v ? ' active' : ''}`} onClick={() => setFilterMilik(v)}>{l}</button>
          ))}
        </div>
      </div>

      {acaraFinal.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">🎊</div>
          <h3>Belum ada acara</h3>
          <p>Tambahkan acara hajatan untuk mulai mencatat sumbangan.</p>
          <button className="btn btn-primary mt-16" onClick={openTambah}>+ Tambah Acara</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {acaraFinal.map(a => {
            const trxCount = data.transaksi.filter(t => t.acaraId === a.id).length;
            const totalMasuk = data.transaksi
              .filter(t => t.acaraId === a.id && t.arah === 'masuk' && t.jenis === 'uang')
              .reduce((s, t) => s + (t.nominal || 0), 0);
            return (
              <Link to={`/acara/${a.id}`} key={a.id} style={{ textDecoration: 'none' }}>
                <div className="card card-clickable">
                  <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card-2)', fontSize: '1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {a.jenis === 'Pernikahan' ? '💍' : a.jenis === 'Khitanan' || a.jenis === 'Sunatan' ? '🌙' : a.jenis === 'Kelahiran' || a.jenis === 'Aqiqah' ? '👶' : '🎉'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.nama}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span>📅 {formatTanggalSingkat(a.tanggal)}</span>
                          {a.tempat && <span>📍 {a.tempat}</span>}
                          <span>📋 {trxCount} sumbangan</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.preventDefault()}>
                      <span className={`badge ${BADGE_JENIS[a.jenis] || 'badge-gray'}`}>{a.jenis}</span>
                      <span className={`badge ${a.milik === 'sendiri' ? 'badge-gold' : 'badge-blue'}`}>
                        {a.milik === 'sendiri' ? 'Acara Kita' : 'Acara Orang'}
                      </span>
                      {totalMasuk > 0 && (
                        <span style={{ fontWeight: 700, color: 'var(--sage-400)', fontSize: '0.88rem' }}>
                          {formatRupiah(totalMasuk)}
                        </span>
                      )}
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(a)}>✏️</button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleHapus(a)}>🗑️</button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Acara' : 'Tambah Acara'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Acara *</label>
            <input placeholder="Contoh: Walimahan Andi & Sari" value={form.nama} onChange={e => set('nama', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Jenis Acara</label>
              <select value={form.jenis} onChange={e => set('jenis', e.target.value)}>
                {JENIS_ACARA.map(j => <option key={j}>{j}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Milik</label>
              <select value={form.milik} onChange={e => set('milik', e.target.value)}>
                <option value="sendiri">Acara Kita</option>
                <option value="orang">Acara Orang Lain</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tempat</label>
              <input placeholder="Contoh: Balai Desa..." value={form.tempat} onChange={e => set('tempat', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea rows={2} value={form.catatan} onChange={e => set('catatan', e.target.value)} style={{ resize: 'none' }} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Simpan' : 'Tambah'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

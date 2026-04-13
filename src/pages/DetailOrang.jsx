import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatRupiah, formatTanggal, formatSaldo, toInputDate } from '../utils/format.js';
import Modal from '../components/UI/Modal.jsx';

export default function DetailOrang() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, editOrang, hapusOrang, tambahTransaksi, editTransaksi, hapusTransaksi } = useApp();

  const orang = data.orang.find(o => o.id === id);
  if (!orang) return (
    <div className="empty-state">
      <div className="empty-emoji">🤷</div>
      <h3>Orang tidak ditemukan</h3>
      <button className="btn btn-primary mt-16" onClick={() => navigate('/tamu')}>Kembali</button>
    </div>
  );

  const transaksi = data.transaksi
    .filter(t => t.orangId === id)
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  const totalMasuk = transaksi.filter(t => t.arah === 'masuk' && t.jenis === 'uang').reduce((s, t) => s + (t.nominal || 0), 0);
  const totalKeluar = transaksi.filter(t => t.arah === 'keluar' && t.jenis === 'uang').reduce((s, t) => s + (t.nominal || 0), 0);
  const saldo = totalMasuk - totalKeluar;
  const { label: saldoLabel, type: saldoType } = formatSaldo(saldo);

  const [showTambahTrx, setShowTambahTrx] = useState(false);
  const [editTrx, setEditTrx] = useState(null);
  const [filterArah, setFilterArah] = useState('semua');

  const namaAcara = (acaraId) => data.acara.find(a => a.id === acaraId)?.nama || '—';

  const trxFiltered = filterArah === 'semua' ? transaksi : transaksi.filter(t => t.arah === filterArah);

  const handleHapusTrx = (t) => {
    if (confirm('Hapus transaksi ini?')) hapusTransaksi(t.id);
  };

  const handleHapusOrang = () => {
    if (confirm(`Hapus "${orang.nama}"? Semua transaksinya akan ikut terhapus.`)) {
      hapusOrang(id);
      navigate('/tamu');
    }
  };

  return (
    <div>
      {/* Back */}
      <Link to="/tamu" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        ← Kembali ke Buku Tamu
      </Link>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div className="flex-center gap-12">
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'var(--accent-glow)', border: '2px solid rgba(217,119,6,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', fontWeight: 800, flexShrink: 0,
              color: 'var(--gold-400)',
            }}>
              {orang.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{orang.nama}</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {orang.desa && <span>📍 {orang.desa}</span>}
                {orang.telepon && <span>📞 {orang.telepon}</span>}
                {orang.catatan && <span>📝 {orang.catatan}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-danger btn-sm" onClick={handleHapusOrang}>🗑️ Hapus</button>
          </div>
        </div>

        {/* Ringkasan Saldo */}
        <div className="grid-3" style={{ marginTop: 20 }}>
          <SaldoMini label="Dari Mereka" value={formatRupiah(totalMasuk)} color="var(--sage-400)" />
          <SaldoMini label="Dari Kita" value={formatRupiah(totalKeluar)} color="var(--rose-400)" />
          <SaldoMini
            label={saldoType === 'piutang' ? 'Perlu Kita Balas' : saldoType === 'hutang' ? 'Kita Lebih Banyak' : 'Status'}
            value={saldoLabel}
            color={saldoType === 'piutang' ? 'var(--gold-400)' : saldoType === 'hutang' ? 'var(--rose-400)' : 'var(--text-muted)'}
          />
        </div>
      </div>

      {/* Transaksi */}
      <div className="flex-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontWeight: 700 }}>Riwayat Transaksi ({transaksi.length})</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="tab-bar" style={{ marginBottom: 0 }}>
            {['semua','masuk','keluar'].map(f => (
              <button key={f} className={`tab-btn${filterArah === f ? ' active' : ''}`} onClick={() => setFilterArah(f)}>
                {f === 'semua' ? 'Semua' : f === 'masuk' ? '⬇️ Masuk' : '⬆️ Keluar'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowTambahTrx(true)}>+ Tambah</button>
        </div>
      </div>

      <div className="card">
        {trxFiltered.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <div className="empty-emoji">📋</div>
            <p>Belum ada transaksi.</p>
          </div>
        ) : (
          trxFiltered.map(t => (
            <div key={t.id} className="trx-item">
              <div className={`trx-arrow ${t.arah}`}>{t.arah === 'masuk' ? '⬇️' : '⬆️'}</div>
              <div className="trx-info">
                <div className="trx-nama">
                  {t.jenis === 'uang' ? formatRupiah(t.nominal) : `${t.jumlahBarang} ${t.satuanBarang} ${t.namaBarang}`}
                </div>
                <div className="trx-meta">
                  {namaAcara(t.acaraId)} · {formatTanggal(t.tanggal)}
                  {t.catatan && <> · <em>{t.catatan}</em></>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleHapusTrx(t)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah Transaksi */}
      <TambahTrxModal
        isOpen={showTambahTrx}
        onClose={() => setShowTambahTrx(false)}
        orangId={id}
      />
    </div>
  );
}

function SaldoMini({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit,sans-serif', color }}>{value}</div>
    </div>
  );
}

function TambahTrxModal({ isOpen, onClose, orangId }) {
  const { data, tambahTransaksi } = useApp();
  const [form, setForm] = useState({
    acaraId: '', namaBaruAcara: '', jenisAcara: 'Pernikahan', tanggalAcara: toInputDate(),
    arah: 'masuk', jenis: 'uang', nominal: '',
    namaBarang: data.jenisBarang[0] || 'Beras', jumlahBarang: '', satuanBarang: 'kg',
    catatan: '', tanggal: toInputDate(),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const { tambahAcara } = useApp();

  const handleSubmit = (e) => {
    e.preventDefault();
    let acaraId = form.acaraId;
    if (!acaraId) {
      if (!form.namaBaruAcara.trim()) { alert('Pilih atau isi nama acara.'); return; }
      const a = tambahAcara({ nama: form.namaBaruAcara.trim(), tanggal: form.tanggalAcara, jenis: form.jenisAcara, milik: form.arah === 'masuk' ? 'sendiri' : 'orang' });
      acaraId = a.id;
    }
    tambahTransaksi({
      orangId, acaraId, arah: form.arah, jenis: form.jenis,
      nominal: form.jenis === 'uang' ? Number(form.nominal) : null,
      namaBarang: form.jenis === 'barang' ? form.namaBarang : null,
      jumlahBarang: form.jenis === 'barang' ? Number(form.jumlahBarang) : null,
      satuanBarang: form.jenis === 'barang' ? form.satuanBarang : null,
      catatan: form.catatan, tanggal: form.tanggal,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Transaksi">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Jenis</label>
          <div className="tab-bar" style={{ marginBottom: 0, width: '100%' }}>
            <button type="button" className={`tab-btn${form.arah === 'masuk' ? ' active' : ''}`} onClick={() => set('arah', 'masuk')} style={{ flex: 1 }}>⬇️ Masuk</button>
            <button type="button" className={`tab-btn${form.arah === 'keluar' ? ' active' : ''}`} onClick={() => set('arah', 'keluar')} style={{ flex: 1 }}>⬆️ Keluar</button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Acara</label>
          <select value={form.acaraId} onChange={e => set('acaraId', e.target.value)}>
            <option value="">-- Tambah baru --</option>
            {data.acara.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
          </select>
          {!form.acaraId && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="form-row">
                <input placeholder="Nama acara *" value={form.namaBaruAcara} onChange={e => set('namaBaruAcara', e.target.value)} />
                <select value={form.jenisAcara} onChange={e => set('jenisAcara', e.target.value)}>
                  {['Pernikahan','Khitanan','Syukuran','Kelahiran','Aqiqah','Sunatan','Pindahan','Selametan','Lainnya'].map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <input type="date" value={form.tanggalAcara} onChange={e => set('tanggalAcara', e.target.value)} />
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Bentuk</label>
          <div className="tab-bar" style={{ marginBottom: 0, width: '100%' }}>
            <button type="button" className={`tab-btn${form.jenis === 'uang' ? ' active' : ''}`} onClick={() => set('jenis', 'uang')} style={{ flex: 1 }}>💰 Uang</button>
            <button type="button" className={`tab-btn${form.jenis === 'barang' ? ' active' : ''}`} onClick={() => set('jenis', 'barang')} style={{ flex: 1 }}>📦 Barang</button>
          </div>
        </div>
        {form.jenis === 'uang' ? (
          <div className="form-group">
            <label className="form-label">Nominal (Rp)</label>
            <input type="number" placeholder="100000" value={form.nominal} onChange={e => set('nominal', e.target.value)} min="0" required />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Barang</label>
            <div className="form-row">
              <select value={form.namaBarang} onChange={e => set('namaBarang', e.target.value)}>
                {data.jenisBarang.map(j => <option key={j}>{j}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" placeholder="Jumlah" value={form.jumlahBarang} onChange={e => set('jumlahBarang', e.target.value)} min="0" required />
                <input placeholder="Satuan" value={form.satuanBarang} onChange={e => set('satuanBarang', e.target.value)} style={{ width: 70 }} />
              </div>
            </div>
          </div>
        )}
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tanggal</label>
            <input type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Catatan</label>
            <input placeholder="Opsional" value={form.catatan} onChange={e => set('catatan', e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}

import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatRupiah, formatTanggalSingkat, formatSaldo, toInputDate } from '../utils/format.js';
import Modal from '../components/UI/Modal.jsx';

export default function Dashboard() {
  const { data, tambahOrang, tambahAcara, tambahTransaksi, hitungSaldoOrang,
    getTotalMasuk, getTotalKeluar } = useApp();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const totalMasuk = getTotalMasuk();
  const totalKeluar = getTotalKeluar();

  // Transaksi terbaru (10 terakhir)
  const recentTrx = [...data.transaksi]
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .slice(0, 8);

  // Orang dengan saldo terbesar (belum dibalas)
  const orangDenganSaldo = data.orang
    .map(o => ({ ...o, saldo: hitungSaldoOrang(o.id) }))
    .filter(o => o.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, 5);

  const namaOrang = (id) => data.orang.find(o => o.id === id)?.nama || '—';
  const namaAcara = (id) => data.acara.find(a => a.id === id)?.nama || '—';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {data.profile.namaKeluarga ? `Keluarga ${data.profile.namaKeluarga}` : 'Buwuhan 🎋'}
          </h1>
          <p className="page-subtitle">Catatan sumbangan hajatan Anda</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowQuickAdd(true)}>
          ✍️ Catat Sumbangan
        </button>
      </div>

      {/* Statistik */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="🎊" label="Total Acara" value={data.acara.length} color="#d97706" />
        <StatCard icon="👥" label="Total Orang" value={data.orang.length} color="#3b82f6" />
        <StatCard icon="⬇️" label="Sumbangan Masuk" value={formatRupiah(totalMasuk)} color="#22c55e" />
        <StatCard icon="⬆️" label="Sumbangan Keluar" value={formatRupiah(totalKeluar)} color="#f43f5e" />
      </div>

      <div className="grid-2">
        {/* Transaksi Terkini */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Transaksi Terkini</h3>
            <span className="badge badge-gray">{data.transaksi.length} total</span>
          </div>
          {recentTrx.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-emoji">📋</div>
              <p>Belum ada transaksi. Mulai mencatat!</p>
            </div>
          ) : (
            recentTrx.map(t => (
              <div key={t.id} className="trx-item">
                <div className={`trx-arrow ${t.arah}`}>
                  {t.arah === 'masuk' ? '⬇️' : '⬆️'}
                </div>
                <div className="trx-info">
                  <div className="trx-nama">{namaOrang(t.orangId)}</div>
                  <div className="trx-meta">
                    {namaAcara(t.acaraId)} · {formatTanggalSingkat(t.tanggal)}
                  </div>
                </div>
                <div className={`trx-nominal ${t.arah}`}>
                  {t.jenis === 'uang'
                    ? formatRupiah(t.nominal)
                    : `${t.jumlahBarang} ${t.satuanBarang} ${t.namaBarang}`}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Top Saldo Belum Dibalas */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Perlu Dibalas</h3>
            <span className="badge badge-gold">{orangDenganSaldo.length} orang</span>
          </div>
          {orangDenganSaldo.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-emoji">🤝</div>
              <p>Semua sumbangan sudah seimbang!</p>
            </div>
          ) : (
            orangDenganSaldo.map(o => {
              const { label, type } = formatSaldo(o.saldo);
              return (
                <div key={o.id} className="trx-item">
                  <div className="trx-arrow masuk">👤</div>
                  <div className="trx-info">
                    <div className="trx-nama">{o.nama}</div>
                    <div className="trx-meta">{o.desa || '—'}</div>
                  </div>
                  <span className={`saldo-${type}`}>{label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}1a` }}>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function QuickAddModal({ isOpen, onClose }) {
  const { data, tambahOrang, tambahAcara, tambahTransaksi } = useApp();
  const [form, setForm] = useState({
    orangId: '', namaBaruOrang: '', desaBaruOrang: '',
    acaraId: '', namaBaruAcara: '', tanggalAcara: toInputDate(), jenisAcara: 'Pernikahan',
    arah: 'masuk',
    jenis: 'uang',
    nominal: '',
    namaBarang: data.jenisBarang[0] || 'Beras',
    jumlahBarang: '',
    satuanBarang: 'kg',
    catatan: '',
    tanggal: toInputDate(),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Orang
    let orangId = form.orangId;
    if (!orangId) {
      if (!form.namaBaruOrang.trim()) { alert('Masukkan nama atau pilih orang.'); return; }
      const baru = tambahOrang({ nama: form.namaBaruOrang.trim(), desa: form.desaBaruOrang.trim() });
      orangId = baru.id;
    }
    // Acara
    let acaraId = form.acaraId;
    if (!acaraId) {
      if (!form.namaBaruAcara.trim()) { alert('Masukkan nama atau pilih acara.'); return; }
      const baru = tambahAcara({ nama: form.namaBaruAcara.trim(), tanggal: form.tanggalAcara, jenis: form.jenisAcara, milik: form.arah === 'masuk' ? 'sendiri' : 'orang' });
      acaraId = baru.id;
    }
    // Transaksi
    tambahTransaksi({
      orangId, acaraId,
      arah: form.arah,
      jenis: form.jenis,
      nominal: form.jenis === 'uang' ? Number(form.nominal) : null,
      namaBarang: form.jenis === 'barang' ? form.namaBarang : null,
      jumlahBarang: form.jenis === 'barang' ? Number(form.jumlahBarang) : null,
      satuanBarang: form.jenis === 'barang' ? form.satuanBarang : null,
      catatan: form.catatan,
      tanggal: form.tanggal,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Sumbangan Cepat">
      <form onSubmit={handleSubmit}>
        {/* Arah */}
        <div className="form-group">
          <label className="form-label">Jenis</label>
          <div className="tab-bar" style={{ marginBottom: 0, width: '100%' }}>
            <button type="button" className={`tab-btn${form.arah === 'masuk' ? ' active' : ''}`} onClick={() => set('arah', 'masuk')} style={{ flex: 1 }}>⬇️ Diterima</button>
            <button type="button" className={`tab-btn${form.arah === 'keluar' ? ' active' : ''}`} onClick={() => set('arah', 'keluar')} style={{ flex: 1 }}>⬆️ Diserahkan</button>
          </div>
        </div>

        {/* Orang */}
        <div className="form-group">
          <label className="form-label">Nama Orang</label>
          <select value={form.orangId} onChange={e => set('orangId', e.target.value)}>
            <option value="">-- Tambah baru --</option>
            {data.orang.map(o => <option key={o.id} value={o.id}>{o.nama} {o.desa ? `(${o.desa})` : ''}</option>)}
          </select>
          {!form.orangId && (
            <div className="form-row" style={{ marginTop: 8 }}>
              <input placeholder="Nama lengkap *" value={form.namaBaruOrang} onChange={e => set('namaBaruOrang', e.target.value)} />
              <input placeholder="Desa/Kampung" value={form.desaBaruOrang} onChange={e => set('desaBaruOrang', e.target.value)} />
            </div>
          )}
        </div>

        {/* Acara */}
        <div className="form-group">
          <label className="form-label">Acara / Hajatan</label>
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

        {/* Jenis Sumbangan */}
        <div className="form-group">
          <label className="form-label">Bentuk Sumbangan</label>
          <div className="tab-bar" style={{ marginBottom: 0, width: '100%' }}>
            <button type="button" className={`tab-btn${form.jenis === 'uang' ? ' active' : ''}`} onClick={() => set('jenis', 'uang')} style={{ flex: 1 }}>💰 Uang</button>
            <button type="button" className={`tab-btn${form.jenis === 'barang' ? ' active' : ''}`} onClick={() => set('jenis', 'barang')} style={{ flex: 1 }}>📦 Barang</button>
          </div>
        </div>

        {form.jenis === 'uang' ? (
          <div className="form-group">
            <label className="form-label">Jumlah (Rp)</label>
            <input type="number" placeholder="Contoh: 100000" value={form.nominal} onChange={e => set('nominal', e.target.value)} min="0" required />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Barang</label>
            <div className="form-row">
              <select value={form.namaBarang} onChange={e => set('namaBarang', e.target.value)}>
                {data.jenisBarang.map(j => <option key={j}>{j}</option>)}
              </select>
              <div className="form-row">
                <input type="number" placeholder="Jumlah" value={form.jumlahBarang} onChange={e => set('jumlahBarang', e.target.value)} min="0" required />
                <input placeholder="Satuan" value={form.satuanBarang} onChange={e => set('satuanBarang', e.target.value)} style={{ width: '80px' }} />
              </div>
            </div>
          </div>
        )}

        {/* Tanggal & Catatan */}
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tanggal</label>
            <input type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Catatan</label>
            <input placeholder="Opsional..." value={form.catatan} onChange={e => set('catatan', e.target.value)} />
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { toInputDate } from '../utils/format.js';

const JENIS_ACARA = ['Pernikahan','Khitanan','Syukuran','Kelahiran','Aqiqah','Sunatan','Pindahan','Selametan','Lainnya'];

export default function CatatSumbangan() {
  const { data, tambahOrang, tambahAcara, tambahTransaksi } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Orang, 2: Acara, 3: Sumbangan, 4: Selesai
  const [result, setResult] = useState(null);

  // ─── Step 1: Data Orang ───────────────────────────────────
  const [orangId, setOrangId] = useState('');
  const [formOrang, setFormOrang] = useState({ nama: '', desa: '', telepon: '' });
  const setO = (k, v) => setFormOrang(f => ({ ...f, [k]: v }));

  // ─── Step 2: Data Acara ───────────────────────────────────
  const [acaraId, setAcaraId] = useState('');
  const [formAcara, setFormAcara] = useState({ nama: '', tanggal: toInputDate(), jenis: 'Pernikahan', milik: 'sendiri', tempat: '' });
  const setA = (k, v) => setFormAcara(f => ({ ...f, [k]: v }));

  // ─── Step 3: Sumbangan ───────────────────────────────────
  const [formTrx, setFormTrx] = useState({
    arah: 'masuk', jenis: 'uang', nominal: '',
    namaBarang: data.jenisBarang[0] || 'Beras', jumlahBarang: '', satuanBarang: 'kg',
    catatan: '', tanggal: toInputDate(),
  });
  const setT = (k, v) => setFormTrx(f => ({ ...f, [k]: v }));

  // ─── Navigasi Step ───────────────────────────────────────
  const goStep2 = (e) => {
    e.preventDefault();
    if (!orangId && !formOrang.nama.trim()) { alert('Pilih atau isi nama orang.'); return; }
    setStep(2);
  };

  const goStep3 = (e) => {
    e.preventDefault();
    if (!acaraId && !formAcara.nama.trim()) { alert('Pilih atau isi nama acara.'); return; }
    setStep(3);
  };

  const handleSimpan = (e) => {
    e.preventDefault();

    // Resolve orang
    let oid = orangId;
    if (!oid) {
      const baru = tambahOrang(formOrang);
      oid = baru.id;
    }

    // Resolve acara
    let aid = acaraId;
    if (!aid) {
      const baru = tambahAcara(formAcara);
      aid = baru.id;
    }

    // Simpan transaksi
    const trx = tambahTransaksi({
      orangId: oid, acaraId: aid,
      arah: formTrx.arah, jenis: formTrx.jenis,
      nominal: formTrx.jenis === 'uang' ? Number(formTrx.nominal) : null,
      namaBarang: formTrx.jenis === 'barang' ? formTrx.namaBarang : null,
      jumlahBarang: formTrx.jenis === 'barang' ? Number(formTrx.jumlahBarang) : null,
      satuanBarang: formTrx.jenis === 'barang' ? formTrx.satuanBarang : null,
      catatan: formTrx.catatan, tanggal: formTrx.tanggal,
    });

    setResult({ orangId: oid, acaraId: aid });
    setStep(4);
  };

  const reset = () => {
    setStep(1);
    setOrangId(''); setFormOrang({ nama: '', desa: '', telepon: '' });
    setAcaraId(''); setFormAcara({ nama: '', tanggal: toInputDate(), jenis: 'Pernikahan', milik: 'sendiri', tempat: '' });
    setFormTrx({ arah: 'masuk', jenis: 'uang', nominal: '', namaBarang: data.jenisBarang[0] || 'Beras', jumlahBarang: '', satuanBarang: 'kg', catatan: '', tanggal: toInputDate() });
    setResult(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Catat Sumbangan ✍️</h1>
          <p className="page-subtitle">Langkah {step} dari {step < 4 ? 3 : 3}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {step < 4 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: s <= step ? 'var(--accent)' : 'var(--bg-card-2)', transition: 'background 0.3s' }} />
          ))}
        </div>
      )}

      {/* ─── Step 1: Orang ─── */}
      {step === 1 && (
        <form onSubmit={goStep2}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>👤 Siapa orangnya?</h3>
            <div className="form-group">
              <label className="form-label">Pilih dari daftar</label>
              <select value={orangId} onChange={e => setOrangId(e.target.value)}>
                <option value="">-- Tambah orang baru --</option>
                {data.orang.map(o => <option key={o.id} value={o.id}>{o.nama} {o.desa ? `(${o.desa})` : ''}</option>)}
              </select>
            </div>
            {!orangId && (
              <>
                <div className="divider" />
                <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Atau tambah baru:</h4>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input placeholder="Contoh: Budi Hartono" value={formOrang.nama} onChange={e => setO('nama', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Desa / Kampung</label>
                    <input placeholder="Contoh: Karangrejo" value={formOrang.desa} onChange={e => setO('desa', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">No. Telepon</label>
                    <input placeholder="Opsional" value={formOrang.telepon} onChange={e => setO('telepon', e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary">Lanjut →</button>
          </div>
        </form>
      )}

      {/* ─── Step 2: Acara ─── */}
      {step === 2 && (
        <form onSubmit={goStep3}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>🎊 Acara apa?</h3>
            <div className="form-group">
              <label className="form-label">Pilih dari daftar</label>
              <select value={acaraId} onChange={e => setAcaraId(e.target.value)}>
                <option value="">-- Tambah acara baru --</option>
                {data.acara.map(a => <option key={a.id} value={a.id}>{a.nama} ({a.jenis})</option>)}
              </select>
            </div>
            {!acaraId && (
              <>
                <div className="divider" />
                <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Atau tambah baru:</h4>
                <div className="form-group">
                  <label className="form-label">Nama Acara *</label>
                  <input placeholder="Contoh: Walimahan Andi & Sari" value={formAcara.nama} onChange={e => setA('nama', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Jenis Acara</label>
                    <select value={formAcara.jenis} onChange={e => setA('jenis', e.target.value)}>
                      {JENIS_ACARA.map(j => <option key={j}>{j}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Milik</label>
                    <select value={formAcara.milik} onChange={e => setA('milik', e.target.value)}>
                      <option value="sendiri">Acara Kita</option>
                      <option value="orang">Acara Orang Lain</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tanggal</label>
                    <input type="date" value={formAcara.tanggal} onChange={e => setA('tanggal', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tempat</label>
                    <input placeholder="Opsional" value={formAcara.tempat} onChange={e => setA('tempat', e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Kembali</button>
            <button type="submit" className="btn btn-primary">Lanjut →</button>
          </div>
        </form>
      )}

      {/* ─── Step 3: Sumbangan ─── */}
      {step === 3 && (
        <form onSubmit={handleSimpan}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>💰 Detail Sumbangan</h3>

            <div className="form-group">
              <label className="form-label">Arah Sumbangan</label>
              <div className="tab-bar" style={{ marginBottom: 0, width: '100%' }}>
                <button type="button" className={`tab-btn${formTrx.arah === 'masuk' ? ' active' : ''}`} onClick={() => setT('arah', 'masuk')} style={{ flex: 1 }}>⬇️ Masuk ke Kita</button>
                <button type="button" className={`tab-btn${formTrx.arah === 'keluar' ? ' active' : ''}`} onClick={() => setT('arah', 'keluar')} style={{ flex: 1 }}>⬆️ Dari Kita</button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bentuk Sumbangan</label>
              <div className="tab-bar" style={{ marginBottom: 0, width: '100%' }}>
                <button type="button" className={`tab-btn${formTrx.jenis === 'uang' ? ' active' : ''}`} onClick={() => setT('jenis', 'uang')} style={{ flex: 1 }}>💰 Uang</button>
                <button type="button" className={`tab-btn${formTrx.jenis === 'barang' ? ' active' : ''}`} onClick={() => setT('jenis', 'barang')} style={{ flex: 1 }}>📦 Barang</button>
              </div>
            </div>

            {formTrx.jenis === 'uang' ? (
              <div className="form-group">
                <label className="form-label">Jumlah (Rp) *</label>
                <input type="number" placeholder="Contoh: 100000" value={formTrx.nominal} onChange={e => setT('nominal', e.target.value)} min="1" required />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Barang *</label>
                <div className="form-row">
                  <select value={formTrx.namaBarang} onChange={e => setT('namaBarang', e.target.value)}>
                    {data.jenisBarang.map(j => <option key={j}>{j}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" placeholder="Jumlah" value={formTrx.jumlahBarang} onChange={e => setT('jumlahBarang', e.target.value)} min="1" required />
                    <input placeholder="Satuan" value={formTrx.satuanBarang} onChange={e => setT('satuanBarang', e.target.value)} style={{ width: 75 }} />
                  </div>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tanggal *</label>
                <input type="date" value={formTrx.tanggal} onChange={e => setT('tanggal', e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Catatan</label>
                <input placeholder="Opsional..." value={formTrx.catatan} onChange={e => setT('catatan', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>← Kembali</button>
            <button type="submit" className="btn btn-primary">✅ Simpan</button>
          </div>
        </form>
      )}

      {/* ─── Step 4: Berhasil ─── */}
      {step === 4 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Berhasil Disimpan!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Data sumbangan telah tercatat dengan baik.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={reset}>+ Catat Lagi</button>
            <button className="btn btn-primary" onClick={() => navigate(`/tamu/${result?.orangId}`)}>Lihat Profil Orang</button>
            <button className="btn btn-secondary" onClick={() => navigate(`/acara/${result?.acaraId}`)}>Lihat Acara</button>
          </div>
        </div>
      )}
    </div>
  );
}

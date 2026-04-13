import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatRupiah, formatTanggal, formatTanggalSingkat } from '../utils/format.js';

export default function DetailAcara() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, hapusAcara, hapusTransaksi } = useApp();

  const acara = data.acara.find(a => a.id === id);
  if (!acara) return (
    <div className="empty-state">
      <div className="empty-emoji">🤷</div>
      <h3>Acara tidak ditemukan</h3>
      <button className="btn btn-primary mt-16" onClick={() => navigate('/acara')}>Kembali</button>
    </div>
  );

  const transaksi = data.transaksi
    .filter(t => t.acaraId === id)
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

  const totalMasuk = transaksi.filter(t => t.arah === 'masuk' && t.jenis === 'uang').reduce((s, t) => s + (t.nominal || 0), 0);
  const totalKeluar = transaksi.filter(t => t.arah === 'keluar' && t.jenis === 'uang').reduce((s, t) => s + (t.nominal || 0), 0);

  const namaOrang = (orangId) => data.orang.find(o => o.id === orangId)?.nama || '—';
  const desaOrang = (orangId) => data.orang.find(o => o.id === orangId)?.desa || '';

  const handleHapusAcara = () => {
    if (confirm(`Hapus acara "${acara.nama}"? Semua transaksi terkait akan dihapus.`)) {
      hapusAcara(id);
      navigate('/acara');
    }
  };

  return (
    <div>
      <Link to="/acara" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        ← Kembali ke Daftar Acara
      </Link>

      {/* Header Acara */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-gold">{acara.jenis}</span>
              <span className="badge badge-blue">{acara.milik === 'sendiri' ? 'Acara Kita' : 'Acara Orang Lain'}</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{acara.nama}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>📅 {formatTanggal(acara.tanggal)}</span>
              {acara.tempat && <span>📍 {acara.tempat}</span>}
              {acara.catatan && <span>📝 {acara.catatan}</span>}
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleHapusAcara}>🗑️ Hapus Acara</button>
        </div>

        {/* Ringkasan */}
        <div className="grid-3" style={{ marginTop: 20 }}>
          {[
            { label: 'Total Tamu', value: transaksi.length, color: 'var(--blue-400)' },
            { label: 'Sumbangan Masuk', value: formatRupiah(totalMasuk), color: 'var(--sage-400)' },
            { label: 'Sumbangan Keluar', value: formatRupiah(totalKeluar), color: 'var(--rose-400)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card-2)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'Outfit,sans-serif', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daftar Sumbangan */}
      <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Daftar Sumbangan ({transaksi.length})</h3>

      {transaksi.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">📋</div>
          <p>Belum ada sumbangan tercatat untuk acara ini.</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['No','Nama','Desa','Jenis','Sumbangan','Tanggal',''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transaksi.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      <Link to={`/tamu/${t.orangId}`} style={{ color: 'var(--gold-400)', textDecoration: 'none' }}>
                        {namaOrang(t.orangId)}
                      </Link>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{desaOrang(t.orangId) || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${t.arah === 'masuk' ? 'badge-green' : 'badge-red'}`}>
                        {t.arah === 'masuk' ? '⬇️ Masuk' : '⬆️ Keluar'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                      {t.jenis === 'uang'
                        ? <span style={{ color: t.arah === 'masuk' ? 'var(--sage-400)' : 'var(--rose-400)' }}>{formatRupiah(t.nominal)}</span>
                        : <span>{t.jumlahBarang} {t.satuanBarang} {t.namaBarang}</span>
                      }
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatTanggalSingkat(t.tanggal)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => { if(confirm('Hapus transaksi ini?')) hapusTransaksi(t.id); }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-light)' }}>
                  <td colSpan={4} style={{ padding: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Uang Masuk</td>
                  <td colSpan={3} style={{ padding: '12px', fontWeight: 800, color: 'var(--sage-400)', fontFamily: 'Outfit,sans-serif', fontSize: '1rem' }}>{formatRupiah(totalMasuk)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

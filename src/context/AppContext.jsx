import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { readStorage, writeStorage } from '../utils/storage.js';
import { generateId } from '../utils/format.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(() => readStorage());

  // Helper untuk memastikan data selalu memiliki struktur yang benar
  const ensureStructure = useCallback((d) => ({
    profile: d?.profile || { namaKeluarga: '' },
    jenisBarang: Array.isArray(d?.jenisBarang) ? d.jenisBarang : ['Beras'],
    orang: Array.isArray(d?.orang) ? d.orang : [],
    acara: Array.isArray(d?.acara) ? d.acara : [],
    transaksi: Array.isArray(d?.transaksi) ? d.transaksi : [],
  }), []);

  const updateData = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const safeNext = ensureStructure(next);
      writeStorage(safeNext);
      return safeNext;
    });
  }, [ensureStructure]);

  // SyncMediator di App.jsx sekarang menangani deteksi perubahan data, 
  // jadi kita tidak butuh useEffect di sini lagi.

  const loadFromExternal = useCallback((externalData) => {
    const safeData = ensureStructure(externalData);
    setData(safeData);
    writeStorage(safeData);
  }, [ensureStructure]);

  // ─── PROFILE ─────────────────────────────────────────────
  const simpanProfile = useCallback((profile) => {
    updateData(prev => ({ ...prev, profile }));
  }, [updateData]);

  // ─── JENIS BARANG ─────────────────────────────────────────
  const tambahJenisBarang = useCallback((nama) => {
    const cleanNama = (nama || '').trim();
    if (!cleanNama) return;
    updateData(prev => {
      const list = prev.jenisBarang || [];
      if (list.includes(cleanNama)) return prev;
      return { ...prev, jenisBarang: [...list, cleanNama] };
    });
  }, [updateData]);

  const hapusJenisBarang = useCallback((nama) => {
    updateData(prev => ({ ...prev, jenisBarang: (prev.jenisBarang || []).filter(j => j !== nama) }));
  }, [updateData]);

  // ─── ORANG ────────────────────────────────────────────────
  const tambahOrang = useCallback((orang) => {
    const baru = { id: generateId(), ...orang, createdAt: new Date().toISOString() };
    const searchNama = (orang?.nama || '').toLowerCase().trim();
    const searchDesa = (orang?.desa || '').toLowerCase().trim();

    updateData(prev => {
      const duplikat = (prev.orang || []).find(
        o => (o?.nama || '').toLowerCase().trim() === searchNama &&
             (o?.desa || '').toLowerCase().trim() === searchDesa
      );
      if (duplikat) return prev;
      return { ...prev, orang: [...(prev.orang || []), baru] };
    });
    return baru;
  }, [updateData]);

  const editOrang = useCallback((id, perubahan) => {
    updateData(prev => ({
      ...prev,
      orang: (prev.orang || []).map(o => o.id === id ? { ...o, ...perubahan } : o),
    }));
  }, [updateData]);

  const hapusOrang = useCallback((id) => {
    updateData(prev => ({
      ...prev,
      orang: (prev.orang || []).filter(o => o.id !== id),
      transaksi: (prev.transaksi || []).filter(t => t.orangId !== id),
    }));
  }, [updateData]);

  // ─── ACARA ────────────────────────────────────────────────
  const tambahAcara = useCallback((acara) => {
    const baru = { id: generateId(), ...acara, createdAt: new Date().toISOString() };
    updateData(prev => ({ ...prev, acara: [...(prev.acara || []), baru] }));
    return baru;
  }, [updateData]);

  const editAcara = useCallback((id, perubahan) => {
    updateData(prev => ({
      ...prev,
      acara: (prev.acara || []).map(a => a.id === id ? { ...a, ...perubahan } : a),
    }));
  }, [updateData]);

  const hapusAcara = useCallback((id) => {
    updateData(prev => ({
      ...prev,
      acara: (prev.acara || []).filter(a => a.id !== id),
      transaksi: (prev.transaksi || []).filter(t => t.acaraId !== id),
    }));
  }, [updateData]);

  // ─── TRANSAKSI ────────────────────────────────────────────
  const tambahTransaksi = useCallback((transaksi) => {
    const baru = { id: generateId(), ...transaksi, createdAt: new Date().toISOString() };
    updateData(prev => ({ ...prev, transaksi: [...(prev.transaksi || []), baru] }));
    return baru;
  }, [updateData]);

  const editTransaksi = useCallback((id, perubahan) => {
    updateData(prev => ({
      ...prev,
      transaksi: (prev.transaksi || []).map(t => t.id === id ? { ...t, ...perubahan } : t),
    }));
  }, [updateData]);

  const hapusTransaksi = useCallback((id) => {
    updateData(prev => ({ ...prev, transaksi: (prev.transaksi || []).filter(t => t.id !== id) }));
  }, [updateData]);

  const resetData = useCallback(() => {
    updateData({ 
      profile: { namaKeluarga: '' }, 
      orang: [], 
      acara: [], 
      transaksi: [], 
      jenisBarang: ['Beras'] 
    });
  }, [updateData]);

  const simpanSumbangan = useCallback((payload) => {
    const idOrang = payload.orangId || generateId();
    const idAcara = payload.acaraId || generateId();
    const idTrx = generateId();
    const now = new Date().toISOString();

    const searchNama = (payload.namaOrang || '').toLowerCase().trim();
    const searchDesa = (payload.desaOrang || '').toLowerCase().trim();

    updateData(prev => {
      let next = { ...prev };

      // Tambah orang jika belum ada
      if (!payload.orangId) {
        const duplikat = (prev.orang || []).find(
          o => (o?.nama || '').toLowerCase().trim() === searchNama &&
               (o?.desa || '').toLowerCase().trim() === searchDesa
        );
        const idFinal = duplikat ? duplikat.id : idOrang;
        if (!duplikat) {
          next = {
            ...next,
            orang: [...(next.orang || []), {
              id: idFinal,
              nama: (payload.namaOrang || '').trim(),
              desa: (payload.desaOrang || '').trim(),
              telepon: (payload.teleponOrang || '').trim(),
              createdAt: now,
            }],
          };
        }
        payload = { ...payload, orangId: idFinal };
      }

      // Tambah acara jika belum ada
      if (!payload.acaraId) {
        next = {
          ...next,
          acara: [...(next.acara || []), {
            id: idAcara,
            nama: (payload.namaAcara || '').trim(),
            jenis: payload.jenisAcara || 'Pernikahan',
            milik: payload.milikAcara || 'sendiri',
            tanggal: payload.tanggalAcara,
            tempat: (payload.tempatAcara || '').trim(),
            createdAt: now,
          }],
        };
        payload = { ...payload, acaraId: idAcara };
      }

      // Tambah transaksi
      next = {
        ...next,
        transaksi: [...(next.transaksi || []), {
          id: idTrx,
          orangId: payload.orangId,
          acaraId: payload.acaraId,
          arah: payload.arah,
          jenis: payload.jenis,
          nominal: payload.jenis === 'uang' ? payload.nominal : null,
          namaBarang: payload.jenis === 'barang' ? payload.namaBarang : null,
          jumlahBarang: payload.jenis === 'barang' ? payload.jumlahBarang : null,
          satuanBarang: payload.jenis === 'barang' ? payload.satuanBarang : null,
          catatan: payload.catatan || '',
          tanggal: payload.tanggal,
          createdAt: now,
        }],
      };

      return next;
    });

    return {
      orangId: payload.orangId || idOrang,
      acaraId: payload.acaraId || idAcara,
      transaksiId: idTrx,
    };
  }, [updateData]);

  // ─── KALKULASI ────────────────────────────────────────────
  const hitungSaldoOrang = useCallback((orangId) => {
    const trx = (data.transaksi || []).filter(t => t.orangId === orangId);
    const masuk = trx.filter(t => t.arah === 'masuk' && t.jenis === 'uang')
      .reduce((sum, t) => sum + (Number(t.nominal) || 0), 0);
    const keluar = trx.filter(t => t.arah === 'keluar' && t.jenis === 'uang')
      .reduce((sum, t) => sum + (Number(t.nominal) || 0), 0);
    return masuk - keluar;
  }, [data.transaksi]);

  const getTransaksiOrang = useCallback((orangId) => {
    return (data.transaksi || [])
      .filter(t => t.orangId === orangId)
      .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
  }, [data.transaksi]);

  const getTransaksiAcara = useCallback((acaraId) => {
    return (data.transaksi || [])
      .filter(t => t.acaraId === acaraId)
      .sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));
  }, [data.transaksi]);

  const getTotalMasuk = useCallback(() => {
    return (data.transaksi || [])
      .filter(t => t.arah === 'masuk' && t.jenis === 'uang')
      .reduce((sum, t) => sum + (Number(t.nominal) || 0), 0);
  }, [data.transaksi]);

  const getTotalKeluar = useCallback(() => {
    return (data.transaksi || [])
      .filter(t => t.arah === 'keluar' && t.jenis === 'uang')
      .reduce((sum, t) => sum + (Number(t.nominal) || 0), 0);
  }, [data.transaksi]);

  return (
    <AppContext.Provider value={{
      data,
      loadFromExternal,
      simpanProfile,
      tambahJenisBarang, hapusJenisBarang,
      tambahOrang, editOrang, hapusOrang,
      tambahAcara, editAcara, hapusAcara,
      tambahTransaksi, editTransaksi, hapusTransaksi,
      simpanSumbangan,  // ← fungsi utama: buat semua data sekaligus
      resetData,        // ← fungsi reset data
      hitungSaldoOrang, getTransaksiOrang, getTransaksiAcara,
      getTotalMasuk, getTotalKeluar,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

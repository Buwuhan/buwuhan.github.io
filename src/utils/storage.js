import { generateId } from './format.js';

const STORAGE_KEY = 'buwuhan_data';

export const DEFAULT_JENIS_BARANG = [
  'Beras', 'Gula', 'Minyak Goreng', 'Mie Instan', 'Kopi/Teh',
  'Snack/Kudapan', 'Kain/Sarung', 'Peralatan Rumah', 'Sembako',
];

export const JENIS_ACARA = [
  'Pernikahan', 'Khitanan', 'Syukuran', 'Kelahiran', 'Aqiqah',
  'Sunatan', 'Pindahan', 'Selametan', 'Lainnya',
];

/**
 * Struktur data default
 */
function defaultData() {
  return {
    profile: { namaKeluarga: '' },
    jenisBarang: [...DEFAULT_JENIS_BARANG],
    acara: [],
    orang: [],
    transaksi: [],
  };
}

/**
 * Membaca data dari localStorage
 * @returns {object}
 */
export function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    // Pastikan semua field ada
    return {
      profile: parsed.profile || { namaKeluarga: '' },
      jenisBarang: parsed.jenisBarang || [...DEFAULT_JENIS_BARANG],
      acara: parsed.acara || [],
      orang: parsed.orang || [],
      transaksi: parsed.transaksi || [],
    };
  } catch {
    return defaultData();
  }
}

/**
 * Menulis data ke localStorage
 * @param {object} data
 */
export function writeStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Export data ke file JSON (download)
 * @param {object} data
 */
export function eksporJSON(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `buwuhan-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import data dari file JSON
 * @param {File} file
 * @returns {Promise<object>}
 */
export function imporJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch {
        reject(new Error('File tidak valid. Pastikan file adalah ekspor Buwuhan yang benar.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsText(file);
  });
}

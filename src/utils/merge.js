/**
 * Merge Data utility for Jogglo Sync.
 */
export function mergeData(local, cloud) {
  // Pastikan struktur aman
  const l_profile = local?.profile || { namaKeluarga: '' };
  const c_profile = cloud?.profile || { namaKeluarga: '' };
  
  // Ambil profil lokal jika tidak kosong, atau gunakan cloud
  const mergedProfile = l_profile.namaKeluarga.trim() ? l_profile : c_profile;

  // Gabungkan string sederhana
  const l_jenis = Array.isArray(local?.jenisBarang) ? local.jenisBarang : ['Beras'];
  const c_jenis = Array.isArray(cloud?.jenisBarang) ? cloud.jenisBarang : ['Beras'];
  const mergedJenisBarang = Array.from(new Set([...l_jenis, ...c_jenis]));

  // Helper merge array object by ID
  const mergeById = (arrLocal = [], arrCloud = []) => {
    const map = new Map();
    // 1. Masukkan semua dari cloud ke referensi (Map)
    for (const item of arrCloud) {
      if (item && item.id) map.set(item.id, item);
    }
    // 2. Tumpuk/merge dengan data lokal
    for (const item of arrLocal) {
      if (item && item.id) {
        // Jika ada konflik (ID sama), kita gunakan lokal (overrides)
        // karena asumsinya lokal adalah update terbaru yang user buat secara offline
        map.set(item.id, { ...map.get(item.id), ...item });
      }
    }
    return Array.from(map.values());
  };

  const mergedOrang = mergeById(local?.orang, cloud?.orang);
  const mergedAcara = mergeById(local?.acara, cloud?.acara);
  const mergedTransaksi = mergeById(local?.transaksi, cloud?.transaksi);

  return {
    profile: mergedProfile,
    jenisBarang: mergedJenisBarang,
    orang: mergedOrang,
    acara: mergedAcara,
    transaksi: mergedTransaksi,
  };
}

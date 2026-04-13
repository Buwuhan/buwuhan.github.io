/**
 * Format angka ke format Rupiah Indonesia
 * @param {number} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke format lokal Indonesia
 * @param {string} dateStr - ISO date string
 * @returns {string}
 */
export function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * Format tanggal singkat
 * @param {string} dateStr
 * @returns {string}
 */
export function formatTanggalSingkat(dateStr) {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * Format tanggal ke YYYY-MM-DD untuk input[type=date]
 * @param {Date} date
 * @returns {string}
 */
export function toInputDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate UUID sederhana
 * @returns {string}
 */
export function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Format jumlah saldo: positif = kita dapat, negatif = kita hutang
 * @param {number} saldo
 * @returns {{ label: string, type: 'piutang'|'lunas'|'hutang' }}
 */
export function formatSaldo(saldo) {
  if (saldo > 0) return { label: `+${formatRupiah(saldo)}`, type: 'piutang' };
  if (saldo < 0) return { label: formatRupiah(Math.abs(saldo)), type: 'hutang' };
  return { label: 'Lunas', type: 'lunas' };
}

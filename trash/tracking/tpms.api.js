// src/services/api/tpms.api.js

import { TPMS_CONFIG } from './config.js'; // Import konfigurasi TPMS

/**
 * TPMS (Tire Pressure Monitoring System) API
 * Handles tire pressure data from external TPMS service
 */

/**
 * Build TPMS URL with authentication parameters
 * @param {string} baseUrl - Base URL
 * @param {object} extraParams - Additional query parameters
 * @returns {string} Complete URL with auth params
 */
const buildTpmsUrl = (baseUrl, extraParams = {}) => {
  if (!baseUrl) return ''; // Jika tidak ada baseUrl, kembalikan string kosong
  try {
    let urlObj; // Deklarasi objek URL
    if (/^https?:\/\//i.test(baseUrl) || /^wss?:\/\//i.test(baseUrl)) {
      // Cek apakah URL sudah lengkap (http/https/ws/wss)
      urlObj = new URL(baseUrl); // Buat objek URL dari baseUrl
    } else {
      const origin = // Tentukan origin default
        (typeof window !== 'undefined' && window.location && window.location.origin) || // Gunakan origin dari browser jika ada
        'http://localhost'; // Fallback ke localhost
      urlObj = new URL(baseUrl, origin); // Buat URL dengan origin sebagai base
    }
    const params = new URLSearchParams(urlObj.search); // Ambil query parameters yang sudah ada
    if (TPMS_CONFIG.API_KEY) params.set('apiKey', TPMS_CONFIG.API_KEY); // Tambahkan API key jika ada
    if (TPMS_CONFIG.SN) params.set('sn', TPMS_CONFIG.SN); // Tambahkan serial number jika ada
    Object.entries(extraParams || {}).forEach(([k, v]) => {
      // Loop melalui parameter tambahan
      if (v != null && v !== '') params.set(k, v); // Tambahkan parameter jika nilainya valid
    });
    urlObj.search = params.toString(); // Set query string dari parameter
    return urlObj.toString(); // Kembalikan URL lengkap sebagai string
  } catch {
    return baseUrl; // Jika error, kembalikan baseUrl asli
  }
};

/**
 * Fetch data from TPMS service
 * @param {string} fullUrl - Complete URL
 * @returns {Promise<object>} TPMS data
 */
const fetchTpms = async (fullUrl) => {
  const controller = new AbortController(); // Buat controller untuk membatalkan request
  const t = setTimeout(() => controller.abort(), TPMS_CONFIG.TIMEOUT); // Set timeout untuk membatalkan request otomatis

  try {
    // Build headers dengan API key
    const headers = {
      'Content-Type': 'application/json',
    };

    // Kirim API key di beberapa format header untuk kompatibilitas
    // if (TPMS_CONFIG.API_KEY) {
    //   headers['x-api-key'] = TPMS_CONFIG.API_KEY;
    // }

    // Debug log untuk melihat request details
    console.log('🔍 TPMS Request:', {
      url: fullUrl,
      apiKey: TPMS_CONFIG.API_KEY ? `${TPMS_CONFIG.API_KEY.substring(0, 10)}...` : 'MISSING',
      sn: TPMS_CONFIG.SN,
      headers: Object.keys(headers),
    });

    const res = await fetch(fullUrl, {
      // Lakukan fetch request
      method: 'GET', // Gunakan metode GET
      mode: 'cors', // Mode CORS untuk bisa baca response
      credentials: 'omit', // Jangan kirim credentials
      headers,
      signal: controller.signal, // Pasang signal untuk abort
    });
    clearTimeout(t); // Hapus timeout jika request berhasil

    console.log('✅ TPMS Response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
    });

    if (!res.ok) {
      // Jika response tidak OK
      const text = await res.text().catch(() => ''); // Ambil error text
      console.error('❌ TPMS Error Response:', text);
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`); // Lempar error dengan detail
    }
    const data = await res.json().catch(() => ({})); // Parse response sebagai JSON

    console.log('📦 TPMS Data:', data);

    if (data && data.error) {
      // Jika ada error dari server
      return { success: false, data: null, error: String(data.error) }; // Kembalikan object error
    }
    return { success: true, data: data.data || data }; // Kembalikan data sukses
  } catch (e) {
    clearTimeout(t); // Hapus timeout jika error
    return { success: false, data: null, error: e.message || 'Request failed' }; // Kembalikan object error
  }
};

export const tpmsAPI = {
  /**
   * Get WebSocket URL for real-time TPMS data
   * @returns {string} WebSocket URL
   */
  getRealtimeWSUrl: () => {
    // Fungsi untuk mendapatkan URL WebSocket realtime
    if (!TPMS_CONFIG.WS_URL) return ''; // Jika tidak ada WS_URL, kembalikan string kosong
    return buildTpmsUrl(TPMS_CONFIG.WS_URL); // Bangun URL WebSocket dengan parameter auth
  },

  /**
   * Get real-time TPMS snapshot
   * @returns {Promise<object>} Real-time TPMS data
   */
  getRealtimeSnapshot: async () => {
    // Fungsi untuk mendapatkan snapshot data TPMS realtime
    const url = buildTpmsUrl(TPMS_CONFIG.REALTIME_ENDPOINT); // Bangun URL endpoint realtime
    if (!url) return { success: false, data: null, error: 'Missing realtime endpoint' }; // Jika URL kosong, kembalikan error
    return await fetchTpms(url); // Fetch data dari endpoint realtime
  },

  /**
   * Get TPMS location history
   * @param {object} options - { sn, startTime, endTime }
   * @returns {Promise<object>} Location history data
   */
  getLocationHistory: async ({ sn, startTime, endTime } = {}) => {
    // Fungsi untuk mendapatkan riwayat lokasi TPMS
    const extra = {}; // Objek untuk parameter tambahan
    if (sn) extra.sn = sn; // Tambahkan serial number jika ada
    if (startTime) extra.startTime = startTime; // Tambahkan waktu mulai jika ada
    if (endTime) extra.endTime = endTime; // Tambahkan waktu akhir jika ada
    const url = buildTpmsUrl(TPMS_CONFIG.LOCATION_ENDPOINT, extra); // Bangun URL endpoint history dengan parameter
    if (!url) return { success: false, data: null, error: 'Missing history endpoint' }; // Jika URL kosong, kembalikan error
    return await fetchTpms(url); // Fetch data riwayat lokasi
  },
};

export default tpmsAPI; // Export default tpmsAPI

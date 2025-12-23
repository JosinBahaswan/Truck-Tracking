# Shift-Based Live Tracking

## Overview
Fitur ini memastikan bahwa Live Tracking hanya menampilkan rute kendaraan untuk shift dan hari yang sedang berjalan. Rute dari shift atau hari sebelumnya akan otomatis dibersihkan dan tidak ditampilkan karena sudah masuk ke History Tracking.

## Shift Definition
Sistem menggunakan **2 shift kerja** berdasarkan waktu (sesuai dengan History Tracking):

- **Shift Siang**: 06:00 - 16:00 (6 AM - 4 PM)
- **Shift Malam**: 16:00 - 06:00 (4 PM - 6 AM next day)

### Special Case: Shift Malam
Untuk Shift Malam (16:00-06:00), jam 00:00 - 05:59 masih dianggap bagian dari hari sebelumnya untuk keperluan tracking kontinuitas kerja malam.

## Features

### 1. Automatic Route Clearing
- Rute otomatis dibersihkan ketika shift atau hari berganti
- Pengecekan dilakukan setiap 1 menit
- Saat pergantian terdeteksi, semua rute di-reset dan data dimuat ulang

### 2. Shift Indicator
- **Toolbar**: Menampilkan shift dan tanggal saat ini di toolbar atas
  ```
  Shift Siang | 23 Des
  ```
  atau
  ```
  Shift Malam | 23 Des
  ```

- **Vehicle Card**: Menampilkan informasi shift pada detail kendaraan
  ```
  Shift Siang • Rute hari ini
  ```
  atau
  ```
  Shift Malam • Rute hari ini
  ```

### 3. Route Management
- Hanya menyimpan maksimal 200 titik rute terakhir per kendaraan
- Rute baru mulai dari posisi saat ini ketika shift berganti
- Rute lama tidak ditampilkan di peta Live Tracking

## Implementation Details

### Functions

#### `getCurrentShift()`
Menentukan shift berdasarkan jam saat ini.

```javascript
const getCurrentShift = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Shift Siang: 06:00 - 16:00
  // Shift Malam: 16:00 - 06:00
  
  if (hour >= 6 && hour < 16) {
    return 'day'; // Shift Siang
  } else {
    return 'night'; // Shift Malam
  }
};
```

#### `getCurrentShiftDate()`
Membuat identifier unik untuk kombinasi tanggal dan shift.

```javascript
const getCurrentShiftDate = () => {
  const now = new Date();
  const shift = getCurrentShift();
  
  // Shift malam: jam 00:00-05:59 gunakan tanggal hari sebelumnya
  let effectiveDate = new Date(now);
  if (shift === 'night' && now.getHours() < 6) {
    effectiveDate.setDate(effectiveDate.getDate() - 1);
  }
  
  const dateStr = effectiveDate.toISOString().split('T')[0];
  return `${dateStr}-${shift}`; // Format: "2025-12-23-day" atau "2025-12-23-night"
};
```

#### `checkShiftDateChange()`
Memeriksa apakah shift atau hari sudah berganti sejak pengecekan terakhir.

```javascript
const checkShiftDateChange = () => {
  const currentShiftDate = getCurrentShiftDate();
  
  if (currentShiftDateRef.current === null) {
    currentShiftDateRef.current = currentShiftDate;
    return false; // Inisialisasi pertama
  }
  
  if (currentShiftDateRef.current !== currentShiftDate) {
    currentShiftDateRef.current = currentShiftDate;
    return true; // Shift/hari berubah
  }
  
  return false; // Tidak ada perubahan
};
```

### Automatic Checks

1. **On Component Mount**
   - Inisialisasi shift tracking
   - Membersihkan rute lama dari session sebelumnya

2. **Every 30 Seconds**
   - Refresh data kendaraan dari API
   - Update posisi dan rute

3. **Every 1 Minute**
   - Cek perubahan shift/hari
   - Reset rute jika berubah
   - Reload data

### Route Update Logic

```javascript
// Saat load data dari API
const shiftChanged = checkShiftDateChange();

if (shiftChanged) {
  // Reset semua rute - mulai baru
  const newRoutes = {};
  items.forEach((vehicle) => {
    newRoutes[vehicle.id] = [vehicle.position]; // Hanya posisi saat ini
  });
  return newRoutes;
} else {
  // Update rute yang ada
  const newRoutes = { ...prevRoutes };
  items.forEach((vehicle) => {
    // Tambahkan posisi baru jika berbeda
    if (!isSamePosition) {
      newRoutes[vehicle.id] = [...existingRoute, vehicle.position].slice(-200);
    }
  });
  return newRoutes;
}
```

## Benefits

1. **Cleaner UI**: Hanya menampilkan rute yang relevan untuk shift saat ini
2. **Better Performance**: Mengurangi data rute yang perlu dirender di peta
3. **Clear Separation**: Live tracking fokus pada "sekarang", history untuk "kemarin"
4. **Automatic**: Tidak perlu refresh manual saat shift berganti
5. **Accurate**: Konsisten dengan definisi shift operasional

## User Experience

### Normal Operation
- User melihat rute kendaraan terakumulasi sepanjang shift
- Rute terus bertambah seiring kendaraan bergerak
- Maksimal 200 titik terakhir yang ditampilkan

### Shift Change
- Saat shift berganti (otomatis terdeteksi):
  - Console log: `⏰ Shift/Date changed detected - clearing routes and reloading data`
  - Semua rute di peta dibersihkan
  - Data dimuat ulang dari API
  - Rute mulai baru dari posisi saat ini

### Visual Indicators
- User dapat melihat shift saat ini di toolbar
- Setiap kendaraan menunjukkan "Shift X • Rute hari ini"
- Tidak ada indikasi rute lama untuk mencegah kebingungan

## Console Logs

Untuk debugging dan monitoring:

```javascript
📅 Initialized shift tracking: 2025-12-23-day
🔄 Shift/Date changed from 2025-12-23-day to 2025-12-23-night
📍 Reset route for TRUCK-001: new shift/date
⏰ Shift/Date changed detected - clearing routes and reloading data
```

## Future Enhancements

1. **Shift History**: Tampilkan shift-shift sebelumnya di History Tracking
2. **Shift Report**: Summary per shift (jarak, waktu, fuel, dll)
3. **Custom Shift**: Admin bisa customize jam shift
4. **Shift Overlap**: Handle transisi shift dengan lebih smooth
5. **Shift Alert**: Notifikasi saat shift akan berakhir

## Related Files

- `src/pages/tracking/LiveTrackingMapNew.jsx` - Main implementation
- `src/pages/HistoryTracking.jsx` - Where old routes should be queried
- `.env` - API configuration

## Testing

### Manual Test Scenarios

1. **Normal Tracking**
   - Buka Live Tracking
   - Verify shift indicator shows correctly (Siang/Malam)
   - Watch routes accumulate

2. **Shift Change Simulation**
   - Change system time to cross shift boundary (06:00 atau 16:00)
   - Wait 1 minute for check
   - Verify routes cleared and reloaded

3. **Midnight Transition (Shift Malam)**
   - Test at 16:00 → 23:59 (should be Shift Malam)
   - Test at 00:00 → 05:59 (should still be Shift Malam with previous date)
   - Test at 06:00 (should change to Shift Siang)

4. **Route Accumulation**
   - Verify max 200 points per vehicle
   - Older points should be dropped

5. **Cross-Check with History Tracking**
   - Verify shift times match between Live and History
   - Shift Siang: 06:00-16:00 in both
   - Shift Malam: 16:00-06:00 in both

## Configuration

No configuration needed - shift times are hardcoded based on operational requirements.

If shift times need to change in the future, modify the `getCurrentShift()` function.

---

**Last Updated**: December 23, 2025  
**Version**: 1.0

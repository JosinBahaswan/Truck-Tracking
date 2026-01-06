# Data Testing untuk Import Master Data

File-file CSV ini dibuat untuk testing fitur import data di halaman Master Data.

## 📋 Daftar File

1. **import-test-vendors.csv** - 3 vendor
2. **import-test-drivers.csv** - 5 driver
3. **import-test-trucks.csv** - 3 truk
4. **import-test-devices.csv** - 3 device TPMS
5. **import-test-sensors.csv** - 30 sensor (10 sensor per truk)

## 🔗 Struktur Relasi Data

### Vendors

- ID 1: PT Mitra Transportasi Nusantara
- ID 2: PT Borneo Logistik Jaya
- ID 3: CV Angkutan Sejahtera

### Drivers (terhubung ke Vendors)

- Ahmad Supriadi & Budi Santoso → Vendor 1
- Dwi Cahyono & Eko Prasetyo → Vendor 2
- Fajar Ramadhan → Vendor 3

### Trucks (terhubung ke Vendors)

- TRUCK-HD001 → Vendor 1
- TRUCK-HD002 → Vendor 2
- TRUCK-CAT001 → Vendor 3

### Devices (terhubung ke Trucks)

- TPMS-DEV-001 → Truck 1
- TPMS-DEV-002 → Truck 2
- TPMS-DEV-003 → Truck 3

### Sensors (terhubung ke Devices)

- Sensor 1-10 → Device 1 (Truck 1)
- Sensor 11-20 → Device 2 (Truck 2)
- Sensor 21-30 → Device 3 (Truck 3)

## � Cara Menggunakan

### Import Pertama Kali (Data Baru)

1. Buka halaman Master Data
2. Pilih tab yang sesuai (Vendors, Drivers, Trucks, Devices, atau Sensors)
3. Klik tombol "Import"
4. Upload file CSV
5. Semua data akan dibuat baru
6. Alert hijau akan muncul dengan summary: "✅ Successfully Created: X"

### Import dengan Data yang Sudah Ada (Duplicate)

Saat import data yang sudah ada, sistem akan menampilkan modal untuk setiap duplicate:

**Modal akan menampilkan:**

- Nama data yang duplicate
- Pesan error dari backend
- 3 pilihan tombol:
  1. **Overwrite (Replace with new data)** - Timpa data lama dengan data baru
  2. **Skip (Keep existing data)** - Lewati, tetap gunakan data lama
  3. **Cancel Import** - Batalkan seluruh proses import

**Checkbox "Apply to all":**

- Jika dicentang, pilihan Anda akan diterapkan ke semua duplicate berikutnya
- Jika tidak dicentang, sistem akan menanyakan setiap duplicate

**Contoh Skenario:**

```
File CSV memiliki 5 drivers, 3 sudah ada di database:

1. Ahmad Supriadi (duplicate) → Modal muncul
   - Anda pilih: Skip
   - Centang "Apply to all"

2. Budi Santoso (duplicate) → Otomatis di-skip (karena apply to all)

3. Dwi Cahyono (duplicate) → Otomatis di-skip (karena apply to all)

4. Eko Prasetyo (baru) → Dibuat langsung

5. Fajar Ramadhan (baru) → Dibuat langsung

Result:
✅ Successfully Created: 2
⏭️ Skipped (already exists): 3
📊 Total Rows Processed: 5 of 5
```

### Langkah Import Berurutan

1. Buka halaman Master Data
2. Pilih tab "Vendors"
3. Klik tombol "Import"
4. Upload file `import-test-vendors.csv`
5. Tunggu proses import selesai

### Langkah 2: Import Drivers

1. Pilih tab "Drivers"
2. Klik tombol "Import"
3. Upload file `import-test-drivers.csv`
4. **Pastikan vendor sudah di-import terlebih dahulu!**

### Langkah 3: Import Trucks

1. Pilih tab "Trucks"
2. Klik tombol "Import"
3. Upload file `import-test-trucks.csv`
4. **Pastikan vendor sudah di-import terlebih dahulu!**

### Langkah 4: Import Devices

1. Pilih tab "Devices"
2. Klik tombol "Import"
3. Upload file `import-test-devices.csv`
4. **Pastikan trucks sudah di-import terlebih dahulu!**

### Langkah 5: Import Sensors

1. Pilih tab "Sensors"
2. Klik tombol "Import"
3. Upload file `import-test-sensors.csv`
4. **Pastikan devices sudah di-import terlebih dahulu!**

## ⚠️ Penting!

### Urutan Import yang Benar

Import harus dilakukan dengan urutan berikut untuk menghindari error relasi:

```
1. Vendors (tidak ada dependency)
   ↓
2. Drivers & Trucks (depends on Vendors)
   ↓
3. Devices (depends on Trucks)
   ↓
4. Sensors (depends on Devices)
```

### Validasi Data

**Vendors:**

- `name_vendor`: Required, 2-255 karakter
- `email`: Format email valid
- `telephone`: Max 50 karakter

**Drivers:**

- `name`: Required
- `license_number`: Required
- `phone`: Optional
- `vendor_id`: Harus valid (1, 2, atau 3)
- `status`: 'aktif' atau 'nonaktif' (bahasa Indonesia!)

**Trucks:**

- `name`: Required (truck number)
- `vin`: Required, unique, **exactly 5 characters**
- `plate`: Required
- `vendor_id`: Harus valid (1, 2, atau 3)
- `status`: 'active' atau 'inactive'

**Devices:**

- `sn`: Required, unique (serial number)
- `truck_id`: Harus valid (1, 2, atau 3)
- `sim_number`: Required
- `status`: 'active' atau 'inactive'

**Sensors:**

- `sn`: Required, unique (serial number)
- `device_id`: Harus valid (1, 2, atau 3)
- `tireNo`: 1-20 (posisi ban)
- `simNumber`: Required
- `sensorNo`: Required
- `status`: 'active' atau 'inactive'

## 🧪 Testing Scenarios

### Scenario 1: Import Berhasil (Happy Path)

Import semua file sesuai urutan yang benar.

### Scenario 2: Import dengan Duplicate

Coba import file yang sama dua kali untuk test handling duplikasi.

### Scenario 3: Import dengan Relasi Salah

Coba import Drivers sebelum Vendors untuk test error handling.

### Scenario 4: Import dengan Data Invalid

Edit file CSV dan masukkan data yang tidak valid (email salah, vendor_id tidak ada, dll).

## 📊 Detail Data

### Vendors

- 3 perusahaan vendor berbeda
- Lokasi di Kalimantan (Balikpapan, Samarinda, Banjarmasin)
- Lengkap dengan alamat, telepon, email, dan contact person

### Drivers

- 5 driver dengan SIM B2 (untuk truk besar)
- Masa berlaku SIM masih valid (2026-2027)
- Terdistribusi ke 3 vendor

### Trucks

- 3 truk mining (haul truck)
- Model: HD785-7 dan CAT 777D
- Tahun: 2022-2024
- VIN number unique dan realistis

### Devices

- 3 device TPMS
- Serial number format: TPMS-DEV-XXX
- Masing-masing terhubung ke 1 truk

### Sensors

- 30 sensor TPMS (10 per truk)
- Posisi ban: FL, FR, RL1-4, RR1-4
- Serial number format: SENS-TX-Position
- SIM number unique untuk setiap sensor

## 🔍 Troubleshooting

**Error: "vendor_id not found"**

- Pastikan vendors sudah di-import terlebih dahulu
- Check apakah vendor_id di file CSV sesuai dengan ID yang ada

**Error: "truck_id not found"**

- Pastikan trucks sudah di-import terlebih dahulu
- Check apakah truck_id di file CSV sesuai dengan ID yang ada

**Error: "device_id not found"**

- Pastikan devices sudah di-import terlebih dahulu
- Check apakah device_id di file CSV sesuai dengan ID yang ada

**Error: "Duplicate entry"**

- Data dengan serial number atau VIN yang sama sudah ada
- Gunakan mode "overwrite" jika ingin replace data yang ada

## 💡 Tips

1. **Backup Database**: Sebelum testing import, backup database terlebih dahulu
2. **Check Log**: Perhatikan log di console untuk detail error
3. **Import Bertahap**: Import satu file dulu, check hasilnya, baru lanjut ke file berikutnya
4. **Validasi Relasi**: Setelah import, check di UI apakah relasi antar data sudah benar

---

Generated: January 2, 2026

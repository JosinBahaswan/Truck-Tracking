# 🚀 Quick Start Guide - Testing Tracking Pages

## Prerequisites

1. **Backend Server Running**
   ```
   URL: http://192.168.21.18:3001
   Status: Must be online and accessible
   ```

2. **Environment Variables Configured**
   ```env
   VITE_TRACKING_API_BASE_URL=http://192.168.21.18:3001
   ```
   ✅ Already configured in `.env`

---

## 🧪 Testing Steps

### 1. Start Development Server

```bash
npm run dev
```

Server should start at: `http://localhost:5173`

---

### 2. Test Live Tracking

1. **Navigate to:** `http://localhost:5173/live-tracking`

2. **Expected Results:**
   - Map loads with mining area
   - Trucks appear as markers on map
   - Truck list shows on the side
   - Console shows API calls:
     ```
     🔄 Loading live vehicles from Tracking API...
     📡 Tracking API response: {...}
     📍 Truck 1 (B 9001 SIM) position: [-3.579108, 115.619921]
     ✅ Loaded 5 trucks from Tracking API
     ```

3. **Features to Test:**
   - ✅ Click on truck marker → Shows truck info
   - ✅ View tire pressure data
   - ✅ Check sensor status (normal/warning/critical)
   - ✅ Wait 30 seconds → Auto-refresh happens
   - ✅ Check battery status
   - ✅ View driver information

---

### 3. Test History Tracking

1. **Navigate to:** `http://localhost:5173/history-tracking`

2. **Expected Results:**
   - Map loads with mining area
   - Truck list appears on left
   - Select a truck → Route path shows on map
   - Console shows:
     ```
     🔄 Loading live vehicles from Tracking API...
     ✅ Loaded 5 trucks from Tracking API
     📍 Loading route history for truck 1...
     ✅ Loaded X route points for truck 1
     ```

3. **Features to Test:**
   - ✅ Select different trucks
   - ✅ Change date/time range
   - ✅ Toggle route visibility
   - ✅ Play route animation
   - ✅ View route statistics
   - ✅ Check sensor data at different points

---

## 🔍 Verification Checklist

### Backend Connection
- [ ] Backend is running at `http://192.168.21.18:3001`
- [ ] Test endpoint manually:
  ```bash
  curl http://192.168.21.18:3001/api/trucks/live-tracking
  ```
- [ ] Response has `success: true`
- [ ] Response has `trucks` array

### Live Tracking Page
- [ ] Page loads without errors
- [ ] Map displays correctly
- [ ] Trucks appear as markers
- [ ] Clicking marker shows truck info
- [ ] Tire pressure display works
- [ ] Sensor data shows correctly
- [ ] Auto-refresh works (check console every 30s)
- [ ] Loading state shows when refreshing
- [ ] No console errors

### History Tracking Page
- [ ] Page loads without errors
- [ ] Map displays correctly
- [ ] Truck list loads
- [ ] Selecting truck loads history
- [ ] Route path draws on map
- [ ] Playback controls work
- [ ] Date picker works
- [ ] Route statistics display
- [ ] No console errors

---

## 📊 Console Output Examples

### Successful Load
```
🔄 Loading live vehicles from Tracking API...
📡 Tracking API response: {success: true, data: {...}}
📍 Truck 1 (B 9001 SIM) position: [-3.579108, 115.619921]
🔧 Truck 1 sensor data: {total_sensors: 10, normal_count: 8, ...}
📍 Truck 2 (B 9002 SIM) position: [-3.580123, 115.620456]
🔧 Truck 2 sensor data: {total_sensors: 10, normal_count: 9, ...}
✅ Loaded 5 trucks from Tracking API
```

### Auto-Refresh
```
🔄 Auto-refreshing live tracking data...
🔄 Loading live vehicles from Tracking API...
📡 Tracking API response: {success: true, data: {...}}
✅ Loaded 5 trucks from Tracking API
```

### History Load
```
📍 Loading route history for truck 1 (24h)
🔄 Fetching tracking data for truck 1 from: http://192.168.21.18:3001/api/trucks/1/tracking?limit=100
✅ Truck 1 tracking loaded: 87 history points
✅ Loaded 87 route points for truck 1
```

---

## 🐛 Troubleshooting

### Issue: No trucks appear

**Check:**
1. Open browser console (F12)
2. Look for API call logs
3. Check for errors

**Common Causes:**
- Backend not running
- Wrong API URL
- CORS errors
- Network issues

**Solution:**
```bash
# Test backend
curl http://192.168.21.18:3001/api/trucks/live-tracking

# Check .env
cat .env | grep VITE_TRACKING_API_BASE_URL

# Restart dev server
npm run dev
```

### Issue: API errors in console

**Error:** `Failed to fetch`
**Solution:** Backend is not accessible
```bash
# Check backend is running
curl http://192.168.21.18:3001/api/trucks/live-tracking

# Check firewall
# Windows: Allow port 3001
```

**Error:** `CORS policy`
**Solution:** Backend CORS not configured
- Backend must have `NODE_ENV=development`
- Or configure CORS headers

### Issue: Auto-refresh not working

**Check console for:**
```
🔄 Auto-refreshing live tracking data...
```

**If missing:**
- Check useEffect is running
- No errors in previous loads
- Component is mounted

---

## 📱 Testing Scenarios

### Scenario 1: Normal Operation
1. Open live tracking page
2. See all trucks
3. Wait 30 seconds
4. See auto-refresh in console
5. Trucks update positions (if backend has new data)

### Scenario 2: Truck Details
1. Click on a truck marker
2. Side panel shows:
   - Truck name
   - Plate number
   - Driver name
   - Battery status
   - Sensor status
   - Tire pressure data

### Scenario 3: History Playback
1. Open history tracking page
2. Select a truck from list
3. Route path appears on map
4. Click play button
5. Animation shows truck movement
6. Can pause/resume
7. Can adjust speed

### Scenario 4: Date Range
1. In history tracking
2. Change date picker
3. Select different date
4. Route updates for that date
5. Can switch between shifts (day/night)

---

## ✅ Expected Data

### Truck List (5 trucks)
1. **B 9001 SIM** - Simulator Truck SIM01
2. **B 9002 SIM** - Simulator Truck SIM02
3. **B 9003 SIM** - Simulator Truck SIM03
4. **B 9004 SIM** - Simulator Truck SIM04
5. **B 9005 SIM** - Simulator Truck SIM05

### Location
- Area: Kalimantan Mining Site
- Coordinates: Around (-3.5, 115.6)
- Geofence: Mining area polygon

### Sensor Data
- 10 sensors per truck (tire pressure monitors)
- Temperature values
- Pressure values
- Battery levels
- Status: normal/warning/critical

---

## 🎯 Success Criteria

### ✅ Live Tracking
- [ ] All 5 trucks visible on map
- [ ] Correct positions (-3.5, 115.6 area)
- [ ] Truck details accessible
- [ ] Auto-refresh every 30 seconds
- [ ] No console errors
- [ ] Performance is smooth

### ✅ History Tracking
- [ ] Truck selection works
- [ ] Route path displays
- [ ] Playback animation works
- [ ] Date filtering works
- [ ] Statistics are accurate
- [ ] No console errors

---

## 📞 Support

### Check Documentation
- `LIVE_TRACKING_FRONTEND_INTEGRATION.md` - API documentation
- `TRACKING_IMPLEMENTATION_SUMMARY.md` - Implementation details

### Check Console
- Always open browser console (F12)
- Look for emoji indicators: 🔄 ✅ ❌ ⚠️
- Check Network tab for API calls

### Common Commands
```bash
# Restart dev server
npm run dev

# Clear cache and restart
rm -rf node_modules/.vite
npm run dev

# Test backend
curl http://192.168.21.18:3001/api/trucks/live-tracking

# Check env vars
cat .env
```

---

## 🎉 Ready to Test!

1. Make sure backend is running
2. Start dev server: `npm run dev`
3. Open: `http://localhost:5173/live-tracking`
4. Check console for API calls
5. Verify trucks appear on map

**Happy Testing! 🚀**

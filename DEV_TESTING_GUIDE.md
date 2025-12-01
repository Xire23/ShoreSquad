# ShoreSquad - API Integration & Error Handling Test Guide
**Date**: December 1, 2025

## 🚀 Quick Start for Testing

### Prerequisites
- Google Chrome/Edge (supports DevTools)
- Internet connection (for NEA API and Google Maps)
- This app running locally (or accessible via URL)

### Launch Instructions
```bash
# Install dependencies
npm install

# Start on localhost:5000
npm start

# OR manually via Python
python -m http.server 8000
# Then visit: http://localhost:8000
```

---

## 🌐 NEA Realtime Weather API Integration

### API Details
- **Endpoint**: `https://api.data.gov.sg/v1/environment/24-hour-weather-forecast`
- **Method**: `GET`
- **Response Format**: JSON
- **Rate Limit**: ~1000 requests/day (free tier)
- **Data Updated**: Every 30 minutes

### API Response Structure
```json
{
  "items": [
    {
      "timestamp": "2025-12-01T12:00:00+08:00",
      "valid_period": {
        "start": "2025-12-01T00:00:00+08:00",
        "end": "2025-12-02T00:00:00+08:00"
      },
      "forecasts": [
        {
          "area": "Central",
          "forecast": "Partly Cloudy",
          "relative_humidity": 75
        }
      ]
    }
  ]
}
```

### Implementation
Located in `js/app.js` - `WeatherService` class:

```javascript
const WeatherService = {
    async fetchWeather() {
        // Makes fetch request to NEA API
        // Handles errors with try/catch
        // Falls back to mock data if API fails
    },
    
    displayWeather(data) {
        // Parses API response
        // Renders 8 forecast cards (24-hour period)
        // Maps weather conditions to emojis
    },
    
    displayMockWeather() {
        // Fallback mock data for demo/testing
        // Prevents app crash if API unavailable
    },
    
    getWeatherEmoji(condition) {
        // Converts weather text to emoji icons
        // Example: "Thunderstorm" → "⛈️"
    }
}
```

---

## 🗺️ Google Maps Iframe Integration

### Multiple Cleanup Spots
Four preset locations with embedded iframes:

| Location | Coordinates | Difficulty | Crew Size |
|----------|-------------|------------|-----------|
| East Coast Park | 1.3024°N, 103.9620°E | Easy | 12 members |
| Pasir Ris Beach | 1.3815°N, 103.9556°E | Medium | 8 members |
| Sentosa Beach | 1.2494°N, 103.8303°E | Easy | 15 members |
| Changi Beach | 1.4050°N, 103.9765°E | Hard | 5 members |

### Map Switching (JavaScript)
```javascript
// In setupEventListeners():
document.querySelectorAll('.map-spot-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        // Hide all maps
        // Show selected map
        // Update active button styling
        // Log to console for debugging
    });
});
```

### HTML Structure
- Primary map: `<div id="mapContainer">` (always visible)
- Secondary maps: Hidden `<div id="pasir-ris-map">`, etc.
- Button selector: `.map-spot-btn` with `data-map` attribute

---

## 🧪 Testing in Chrome DevTools

### Opening DevTools
1. **Press**: `F12` (or `Ctrl+Shift+I` / `Cmd+Option+I` on Mac)
2. **Tabs to Use**:
   - **Console**: View logs and errors
   - **Network**: Monitor API requests
   - **Application**: Check localStorage
   - **Sources**: Set breakpoints for debugging

### Test Scenario 1: NEA API Success Path
**Steps**:
1. Open DevTools → **Console** tab
2. Click **"📍 Enable My Location & Load Real Weather"** button
3. **Allow** location permission when prompted
4. **Observe Console Output**:
   ```
   📡 Fetching NEA 24-hour weather forecast...
   ✅ NEA API Response: {items: Array(1), api_info: {…}}
   📊 Displaying 8 forecast items
   ✅ Weather cards rendered
   🌤️ Real NEA weather loaded!
   ```
5. **Check Network Tab**:
   - Look for request to `api.data.gov.sg/v1/environment/24-hour-weather-forecast`
   - Status should be: **200 OK**
   - Response should show weather forecast data

### Test Scenario 2: NEA API Failure (Mock Data Fallback)
**Steps**:
1. Open DevTools → **Network** tab
2. Click **Throttling** dropdown → Select **"Offline"**
3. Click **"📍 Enable My Location & Load Real Weather"** button
4. **Observe Console Output**:
   ```
   ❌ Weather API Error: Failed to fetch
   Falling back to mock weather data...
   🎭 Loading mock weather data as fallback...
   ✅ Mock weather displayed
   ⚠️ Using mock data: Failed to fetch
   ```
5. **Result**: Mock data displays instead of real data ✅

### Test Scenario 3: Error Handling - Geolocation Permission Denied
**Steps**:
1. Open DevTools → **Console** tab
2. **Simulate Permission Denied**:
   - Click **"📍 Enable My Location..."** button
   - Select **"Block"** on browser's location permission popup
3. **Observe Console Output**:
   ```
   📍 Requesting user geolocation...
   ❌ Geolocation error (1): Location permission denied...
   🚫 PERMISSION_DENIED
   ❌ Location permission denied...
   ```
4. **Toast Notification**: Red error toast appears at bottom-right

### Test Scenario 4: Error Handling - Geolocation Timeout
**Steps**:
1. Open DevTools → **Network** tab
2. Set throttling to **"GPRS"** (very slow connection)
3. Click **"📍 Enable My Location..."** button
4. Wait for 10 second timeout
5. **Observe Console Output**:
   ```
   ❌ Geolocation error (3): Location request timeout.
   🚫 TIMEOUT
   ```

### Test Scenario 5: Map Switching with Error Logging
**Steps**:
1. Open DevTools → **Console** tab
2. Click different cleanup spot buttons:
   - Click **"🏖️ Pasir Ris Beach"** button
   - Check console: `🗺️ Map button clicked: pasir-ris`
   - Verify: `✅ Map displayed: pasir-ris-map`
   - Observe: Map iframe switches instantly
3. Switch to another spot to confirm logging

### Test Scenario 6: Tawk.to Chat Widget
**Steps**:
1. Open DevTools → **Console** tab
2. **Check for Tawk initialization**:
   - Look for any Tawk-related console messages
   - Search for `Tawk_API` variable: Type `Tawk_API` in console
3. **Visual Check**:
   - Look for chat bubble in **bottom-right corner**
   - Hover over widget to see menu options
4. **Expected Console Output**:
   - No errors related to Tawk script loading
   - Widget should be interactive

### Test Scenario 7: Try/Catch Error Handling - LocationService
**Steps**:
1. In DevTools **Console**, type:
   ```javascript
   // Test LocationService error handling
   LocationService.requestLocation().catch(err => {
       console.error('Caught error:', err);
   });
   ```
2. Verify error is caught and logged
3. Check that app doesn't crash

### Test Scenario 8: Try/Catch Error Handling - CrewService
**Steps**:
1. Click **"Create Crew"** button
2. Enter: **"Test Crew"**
3. **Observe Console**:
   ```
   ✅ Crew "Test Crew" created!
   ```
4. Click again and cancel the prompt:
   - **Observe Console**: `⚠️ Please enter a crew name`
5. **Result**: Graceful handling of cancelled input

---

## 📊 Console Log Reference Guide

### Info Logs (ℹ️)
- `✅ Event listeners attached` - App initialized
- `✅ DOM elements initialized` - DOM ready
- `✅ Weather displayed successfully` - Data rendered
- `✅ Map displayed: [id]` - Map iframe switched

### Warning Logs (⚠️)
- `⚠️ Using mock data: [reason]` - API failed, using fallback
- `⚠️ No user location available` - Geolocation not enabled
- `⚠️ Map not found: [id]` - Map element missing

### Error Logs (❌)
- `❌ LocationService error: [error]` - Location fetch failed
- `❌ Weather API Error: [error]` - NEA API request failed
- `❌ Geolocation error (code): [message]` - Location permission issues
- `❌ Error switching map: [error]` - Map switch failed
- `❌ Could not load weather data` - Weather display failed

### Data Logs (📡🗺️📊)
- `📡 Fetching NEA 24-hour weather forecast...` - API call initiated
- `📊 Displaying 8 forecast items` - Forecast count
- `📍 Requesting user geolocation...` - Location request started
- `🗺️ Map button clicked: [spot]` - User interaction
- `📍 Nearest spot: [name]` - Calculated nearest location

---

## 🔍 Browser DevTools Inspection Checklist

### Console Tab ✓
- [ ] No uncaught errors when app loads
- [ ] Successful NEA API fetch shows in logs
- [ ] Mock data fallback works when offline
- [ ] Location permission flows show proper error messages
- [ ] Map switching logs show correct map IDs
- [ ] Tawk API accessible via `window.Tawk_API`

### Network Tab ✓
- [ ] `api.data.gov.sg` request shows **Status 200**
- [ ] Request headers include `Accept: application/json`
- [ ] Response payload contains `items` array with forecast data
- [ ] Google Maps iframes load without errors
- [ ] Tawk.to embed loads (may show 204 or similar for widget)

### Application Tab ✓
- [ ] **LocalStorage**:
  - `shoreSquadCrews` key exists with JSON array
  - `shoreSquadEvents` key exists with JSON array
  - Data persists across page reloads
- [ ] **Cookies**: Check for Tawk.to cookies

### Sources Tab (Debugging)
- [ ] Set breakpoint in `WeatherService.fetchWeather()`:
  ```javascript
  // Click on line number to add breakpoint
  const response = await fetch(url, {
  ```
- [ ] Step through execution with **F10** (Step Over)
- [ ] Inspect variables with **F11** (Step Into)
- [ ] Continue with **F8**

---

## 📱 Testing on Different Network Conditions

### Simulate Offline
1. DevTools → **Network** tab
2. Click **Throttling** dropdown
3. Select **"Offline"**
4. Try clicking location button
5. **Expected**: Mock data loads, error handled gracefully

### Simulate Slow Network
1. Select **"Slow 4G"** or **"2G"** throttling
2. Click location button
3. Observe loading spinner
4. Watch timeout behavior

### Simulate Network Error
1. Select **"Offline"**
2. Click location button
3. Check console for specific error handling
4. Verify fallback to mock data

---

## 🎯 Key Code Sections to Review

### NEA API Fetch (js/app.js, lines ~150-200)
```javascript
const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
});

if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
```

### Error Handling Pattern (js/app.js)
```javascript
try {
    // Main logic
    const data = await response.json();
    this.displayWeather(data);
} catch (err) {
    console.error('❌ Error:', err.message);
    UI.showAlert('⚠️ Error: ' + err.message, 'error');
    this.displayMockWeather(); // Fallback
}
```

### Map Switching Logic (js/app.js, lines ~320-360)
```javascript
document.querySelectorAll('.map-spot-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        try {
            // Log action
            console.log('🗺️ Map button clicked:', e.currentTarget.dataset.map);
            
            // Update UI
            // Switch maps
            // Handle errors
        } catch (err) {
            console.error('❌ Map button error:', err);
        }
    });
});
```

---

## ✅ Validation Checklist

### API Integration
- [ ] NEA 24-hour weather API returns data successfully
- [ ] Response contains forecast array with 8+ items
- [ ] Weather emoji mapping works for all conditions
- [ ] Mock data displays when API fails
- [ ] Error messages are user-friendly

### Error Handling
- [ ] All async functions wrapped in try/catch
- [ ] Geolocation errors (1, 2, 3) handled specifically
- [ ] Network errors trigger fallback UI
- [ ] Console logs describe each operation
- [ ] No uncaught promise rejections

### UI/UX
- [ ] Loading spinner appears during API fetch
- [ ] Toast notifications for success/error
- [ ] Map switching works without page reload
- [ ] Buttons have visual feedback (hover/active)
- [ ] Responsive layout on mobile

### Google Maps
- [ ] 4 iframes embed successfully
- [ ] Maps show correct locations
- [ ] Switching between maps is instant
- [ ] Active button state is clear

### Tawk.to Chat
- [ ] Widget initializes without console errors
- [ ] Chat bubble visible in bottom-right
- [ ] Widget is interactive and clickable
- [ ] No CORS issues in Network tab

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" Error
**Cause**: CORS policy or offline
**Solution**: 
- Check Network tab for CORS headers
- Ensure internet connection
- Verify API endpoint is correct

### Issue: Map Not Switching
**Cause**: JavaScript error in map click handler
**Solution**:
- Check Console for errors
- Verify map IDs match button data attributes
- Ensure try/catch wraps the logic

### Issue: Tawk.to Not Loading
**Cause**: Ad blocker or script error
**Solution**:
- Disable ad blocker
- Check Console for Tawk errors
- Verify Tawk embed ID is correct

### Issue: Geolocation Always Times Out
**Cause**: Location services disabled or slow connection
**Solution**:
- Check browser location settings
- Use DevTools throttling to simulate conditions
- Increase timeout value in code

---

## 📋 Performance Monitoring

In DevTools **Console**, run:

```javascript
// Measure API fetch time
console.time('weather-api');
WeatherService.fetchWeather();
console.timeEnd('weather-api');

// Check localStorage size
console.log(
    'LocalStorage size:',
    new Blob(Object.values(localStorage)).size,
    'bytes'
);

// Monitor event listeners
console.log(
    'Active listeners:',
    getEventListeners(document).click
);
```

---

## 🚀 Deployment Checklist

Before going live:
- [ ] NEA API endpoint is production-ready (not test)
- [ ] Google Maps embedded with production API key
- [ ] Tawk.to property ID is production
- [ ] All console.log statements kept for debugging
- [ ] Error handling covers all edge cases
- [ ] Mobile-responsive on all breakpoints
- [ ] Network requests optimized (lazy loading, caching)
- [ ] Accessibility verified (ARIA labels, semantic HTML)

---

**Document Version**: 1.0  
**Last Updated**: December 1, 2025  
**Status**: ✅ Ready for Testing

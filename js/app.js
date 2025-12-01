/**
 * ShoreSquad - Beach Cleanup Application
 * ES6+ JavaScript with modular architecture
 * Vanilla JS, no external dependencies
 */

'use strict';

// ============================================
// Application State Management
// ============================================

const AppState = {
    userLocation: null,
    weatherData: null,
    selectedCleanupSpot: 'east-coast',
    crews: JSON.parse(localStorage.getItem('shoreSquadCrews')) || [],
    events: JSON.parse(localStorage.getItem('shoreSquadEvents')) || [],

    /**
     * Save crews to localStorage
     */
    saveCrews() {
        try {
            localStorage.setItem('shoreSquadCrews', JSON.stringify(this.crews));
        } catch (err) {
            console.error('Error saving crews:', err);
        }
    },

    /**
     * Save events to localStorage
     */
    saveEvents() {
        try {
            localStorage.setItem('shoreSquadEvents', JSON.stringify(this.events));
        } catch (err) {
            console.error('Error saving events:', err);
        }
    },
};

// ============================================
// DOM Elements Cache
// ============================================

const DOM = {
    mapContainer: null,
    mapButton: null,
    weatherDashboard: null,
    crewList: null,
    createCrewBtn: null,
    getStartedBtn: null,
    nextCleanupInfo: null,
    joinCleanupBtn: null,
    cleanupTitle: null,
    cleanupLocation: null,
    cleanupDate: null,
    cleanupDifficulty: null,

    /**
     * Initialize DOM element references
     */
    init() {
        try {
            this.mapContainer = document.getElementById('mapContainer');
            this.mapButton = document.getElementById('enableLocationBtn');
            this.weatherDashboard = document.getElementById('weatherDashboard');
            this.crewList = document.getElementById('crewList');
            this.createCrewBtn = document.getElementById('createCrewBtn');
            this.getStartedBtn = document.getElementById('getStartedBtn');
            this.nextCleanupInfo = document.getElementById('nextCleanupInfo');
            this.joinCleanupBtn = document.getElementById('joinCleanupBtn');
            this.cleanupTitle = document.getElementById('cleanupTitle');
            this.cleanupLocation = document.getElementById('cleanupLocation');
            this.cleanupDate = document.getElementById('cleanupDate');
            this.cleanupDifficulty = document.getElementById('cleanupDifficulty');
            console.log('✅ DOM elements initialized');
        } catch (err) {
            console.error('Error initializing DOM:', err);
        }
    },
};

// ============================================
// Location Service
// ============================================

const LocationService = {
    /**
     * Multiple beach cleanup spots in Singapore
     */
    cleanupSpots: [
        {
            name: 'East Coast Park',
            lat: 1.3024,
            lng: 103.9620,
            mapId: 'east-coast',
            description: '10 km of pristine coastline',
            difficulty: 'Easy'
        },
        {
            name: 'Pasir Ris Beach',
            lat: 1.3815,
            lng: 103.9556,
            mapId: 'pasir-ris',
            description: 'Scenic beach with mangroves',
            difficulty: 'Medium'
        },
        {
            name: 'Sentosa Beach',
            lat: 1.2494,
            lng: 103.8303,
            mapId: 'sentosa',
            description: 'Popular tourist beach',
            difficulty: 'Easy'
        },
        {
            name: 'Changi Beach',
            lat: 1.4050,
            lng: 103.9765,
            mapId: 'changi',
            description: 'Historic beach with naval history',
            difficulty: 'Hard'
        }
    ],

    /**
     * Request user's geolocation
     */
    async requestLocation() {
        try {
            console.log('📍 Requesting user geolocation...');
            
            if (!navigator.geolocation) {
                throw new Error('Geolocation API not supported in this browser');
            }

            UI.showLoading(true, 'Getting your location...');

            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        try {
                            const { latitude, longitude, accuracy } = position.coords;
                            AppState.userLocation = { latitude, longitude, accuracy };
                            console.log(`✅ Location obtained: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (±${accuracy}m)`);
                            UI.showLoading(false);
                            UI.showAlert('📍 Location enabled!', 'success');
                            resolve(true);
                        } catch (err) {
                            console.error('❌ Error processing location:', err);
                            UI.showAlert('❌ Error processing location', 'error');
                            UI.showLoading(false);
                            resolve(false);
                        }
                    },
                    (error) => {
                        UI.showLoading(false);
                        let message = 'Unable to get location';
                        
                        // Handle specific geolocation errors
                        if (error.code === 1) {
                            message = 'Location permission denied. Enable location in browser settings.';
                            console.warn('🚫 PERMISSION_DENIED');
                        } else if (error.code === 2) {
                            message = 'Location unavailable. Check your GPS.';
                            console.warn('🚫 POSITION_UNAVAILABLE');
                        } else if (error.code === 3) {
                            message = 'Location request timeout.';
                            console.warn('🚫 TIMEOUT');
                        }
                        
                        console.error(`❌ Geolocation error (${error.code}):`, message);
                        UI.showAlert(`❌ ${message}`, 'error');
                        resolve(false);
                    },
                    { 
                        timeout: 10000, 
                        enableHighAccuracy: true,
                        maximumAge: 0
                    }
                );
            });
        } catch (err) {
            console.error('❌ LocationService error:', err);
            UI.showAlert('❌ Unexpected error: ' + err.message, 'error');
            UI.showLoading(false);
            return false;
        }
    },

    /**
     * Get nearest cleanup spot to user
     */
    getNearestSpot() {
        try {
            if (!AppState.userLocation) {
                console.warn('⚠️ No user location available');
                return this.cleanupSpots[0];
            }

            const { latitude, longitude } = AppState.userLocation;
            let nearest = this.cleanupSpots[0];
            let minDistance = Infinity;

            this.cleanupSpots.forEach(spot => {
                const distance = Math.sqrt(
                    Math.pow(spot.lat - latitude, 2) + 
                    Math.pow(spot.lng - longitude, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = spot;
                }
            });

            console.log(`📍 Nearest spot: ${nearest.name} (${(minDistance * 111).toFixed(1)}km away)`);
            return nearest;
        } catch (err) {
            console.error('❌ Error finding nearest spot:', err);
            return this.cleanupSpots[0];
        }
    }
};

// ============================================
// Weather Service - NEA Realtime Weather API
// ============================================

const WeatherService = {
    /**
     * Fetch 24-hour weather forecast from NEA API (JSONP)
     */
    async fetchWeather() {
        try {
            UI.showLoading(true, 'Loading real weather from NEA...');
            console.log('📡 Fetching NEA 24-hour weather forecast...');

            const url = 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast';
            
            // Use CORS proxy to handle JSONP/CORS issues
            const corsUrl = `https://cors-anywhere.herokuapp.com/${url}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ NEA API Response:', data);

            if (!data.items || data.items.length === 0) {
                throw new Error('No weather data in response');
            }

            UI.showLoading(false);
            AppState.weatherData = data;
            this.displayWeather(data);
            UI.showAlert('🌤️ Real NEA weather loaded!', 'success');
            console.log('✅ Weather displayed successfully');

        } catch (err) {
            UI.showLoading(false);
            console.error('❌ Weather API Error:', err.message);
            console.warn('Falling back to mock weather data...');
            UI.showAlert(`⚠️ Using mock data: ${err.message}`, 'info');
            // Only display mock if weather dashboard is empty
            if (!DOM.weatherDashboard.innerHTML || DOM.weatherDashboard.innerHTML.trim() === '') {
                this.displayMockWeather();
            }
        }
    },

    /**
     * Display weather from NEA API
     */
    displayWeather(data) {
        try {
            if (!data.items || data.items.length === 0) {
                throw new Error('No weather items available');
            }

            const item = data.items[0];
            const forecasts = item.forecasts || [];
            const validDate = item.valid_period?.start || new Date().toISOString();

            console.log(`📊 Displaying ${forecasts.length} forecast items`);

            let html = `
                <div class="weather-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div class="weather-date">🌍 REAL WEATHER - Updated: ${new Date(validDate).toLocaleTimeString()}</div>
                    <div class="weather-condition">🌏 Singapore 24-Hour Forecast (Live)</div>
                </div>
            `;

            forecasts.slice(0, 8).forEach((forecast, idx) => {
                const emoji = this.getWeatherEmoji(forecast.forecast);
                const timeStr = new Date(forecast.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                html += `
                    <div class="weather-card">
                        <div class="weather-date">${timeStr}</div>
                        <div class="weather-emoji">${emoji}</div>
                        <div class="weather-condition">${forecast.forecast}</div>
                        <div class="weather-detail">💧 ${forecast.relative_humidity}% humidity</div>
                    </div>
                `;
            });

            DOM.weatherDashboard.innerHTML = html;
            console.log('✅ Real weather cards rendered');

        } catch (err) {
            console.error('❌ Error displaying weather:', err);
            console.log('⚠️ Keeping existing weather, will try API again later');
        }
    },

    /**
     * Display mock weather data (fallback)
     */
    displayMockWeather() {
        try {
            console.log('🎭 Loading mock weather data as fallback...');
            const mockData = [
                { time: '12:00', emoji: '☀️', condition: 'Sunny', humidity: 65 },
                { time: '15:00', emoji: '⛅', condition: 'Partly Cloudy', humidity: 72 },
                { time: '18:00', emoji: '🌧️', condition: 'Light Rain', humidity: 85 },
                { time: '21:00', emoji: '⛈️', condition: 'Thunderstorm', humidity: 90 },
                { time: '00:00', emoji: '🌙', condition: 'Clear Night', humidity: 60 },
                { time: '03:00', emoji: '🌫️', condition: 'Haze', humidity: 70 },
                { time: '06:00', emoji: '🌞', condition: 'Sunny', humidity: 55 },
                { time: '09:00', emoji: '⛅', condition: 'Mostly Sunny', humidity: 68 }
            ];

            let html = `
                <div class="weather-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div class="weather-date">Mock 24-Hour Forecast</div>
                    <div class="weather-condition">🌏 Singapore (Demo Data)</div>
                </div>
            `;

            mockData.forEach(data => {
                html += `
                    <div class="weather-card">
                        <div class="weather-date">${data.time}</div>
                        <div class="weather-emoji">${data.emoji}</div>
                        <div class="weather-condition">${data.condition}</div>
                        <div class="weather-detail">💧 ${data.humidity}% humidity</div>
                    </div>
                `;
            });

            DOM.weatherDashboard.innerHTML = html;
            console.log('✅ Mock weather displayed');

        } catch (err) {
            console.error('❌ Error displaying mock weather:', err);
            DOM.weatherDashboard.innerHTML = '<p>❌ Could not load weather data</p>';
        }
    },

    /**
     * Map weather condition to emoji
     */
    getWeatherEmoji(condition) {
        const conditionLower = condition.toLowerCase();
        if (conditionLower.includes('rain') || conditionLower.includes('shower')) return '🌧️';
        if (conditionLower.includes('thunder') || conditionLower.includes('lightning')) return '⛈️';
        if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) return '☁️';
        if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return '☀️';
        if (conditionLower.includes('partly')) return '⛅';
        if (conditionLower.includes('haze') || conditionLower.includes('mist')) return '🌫️';
        if (conditionLower.includes('fog')) return '🌁';
        return '🌤️';
    }
};

// ============================================
// Crew Service
// ============================================

const CrewService = {
    /**
     * Create a new crew
     */
    createCrew() {
        try {
            const crewName = prompt('Crew name?');
            if (!crewName || crewName.trim() === '') {
                UI.showAlert('⚠️ Please enter a crew name', 'info');
                return;
            }

            const newCrew = {
                id: Date.now(),
                name: crewName.trim(),
                members: ['You'],
                cleanups: 0,
                trashCollected: 0,
                createdAt: new Date().toISOString(),
            };

            AppState.crews.push(newCrew);
            AppState.saveCrews();
            UI.showAlert(`🎉 Crew "${crewName}" created!`, 'success');
            this.displayCrews();
        } catch (err) {
            console.error('Error creating crew:', err);
            UI.showAlert('❌ Error creating crew', 'error');
        }
    },

    /**
     * Display crews
     */
    displayCrews() {
        try {
            if (AppState.crews.length === 0) {
                DOM.crewList.innerHTML = '<p>No crews yet</p>';
                return;
            }

            let html = '';
            AppState.crews.forEach((crew) => {
                html += `
                    <div class="crew-placeholder">
                        <h3>${crew.name}</h3>
                        <p>👥 ${crew.members.length} members</p>
                        <p>🗑️ ${crew.trashCollected} kg collected</p>
                    </div>
                `;
            });

            DOM.crewList.innerHTML = html;
        } catch (err) {
            console.error('Error displaying crews:', err);
        }
    },
};

// ============================================
// Cleanup Service - Next Cleanup Management
// ============================================

const CleanupService = {
    /**
     * Cleanup spot details
     */
    cleanupSpots: [
        {
            id: 'east-coast',
            name: 'East Coast Park',
            location: '1.3024°N, 103.9620°E',
            date: 'Saturday, Dec 7',
            time: '9:00 AM',
            difficulty: 'Easy',
            members: 12,
            emoji: '📍'
        },
        {
            id: 'pasir-ris',
            name: 'Pasir Ris Beach',
            location: '1.3815°N, 103.9556°E',
            date: 'Sunday, Dec 8',
            time: '8:30 AM',
            difficulty: 'Medium',
            members: 15,
            emoji: '🏖️'
        },
        {
            id: 'sentosa',
            name: 'Sentosa Beach',
            location: '1.2494°N, 103.8303°E',
            date: 'Saturday, Dec 14',
            time: '10:00 AM',
            difficulty: 'Easy',
            members: 10,
            emoji: '🌴'
        },
        {
            id: 'changi',
            name: 'Changi Beach',
            location: '1.4050°N, 103.9765°E',
            date: 'Sunday, Dec 15',
            time: '7:00 AM',
            difficulty: 'Hard',
            members: 8,
            emoji: '🌊'
        }
    ],

    /**
     * Get cleanup spot by ID
     */
    getSpotById(spotId) {
        return this.cleanupSpots.find(spot => spot.id === spotId) || this.cleanupSpots[0];
    },

    /**
     * Update cleanup info display
     */
    updateCleanupInfo(spotId) {
        try {
            const spot = this.getSpotById(spotId);
            console.log('🌊 Updating cleanup info to:', spot.name);
            
            DOM.cleanupTitle.textContent = `${spot.emoji} Next Cleanup: ${spot.name}`;
            DOM.cleanupLocation.textContent = `📍 Location: ${spot.location}`;
            DOM.cleanupDate.textContent = `📅 ${spot.date} @ ${spot.time}`;
            DOM.cleanupDifficulty.textContent = `⭐ Difficulty: ${spot.difficulty} | 👥 ${spot.members} crew members`;
            
            // Store current selected spot
            AppState.selectedCleanupSpot = spotId;
            
            console.log('✅ Cleanup info updated');
        } catch (err) {
            console.error('❌ Error updating cleanup info:', err);
        }
    },

    /**
     * Join the cleanup event
     */
    joinCleanup() {
        try {
            console.log('🌊 User joining cleanup...');
            
            const spotId = AppState.selectedCleanupSpot || 'east-coast';
            const spot = this.getSpotById(spotId);
            
            // Create cleanup event object
            const cleanupEvent = {
                id: Date.now(),
                spotId: spotId,
                location: spot.name,
                date: spot.date,
                time: spot.time,
                difficulty: spot.difficulty,
                participants: spot.members,
                joinedAt: new Date().toISOString()
            };
            
            // Add to events
            AppState.events.push(cleanupEvent);
            AppState.saveEvents();
            
            console.log('✅ Joined cleanup:', cleanupEvent);
            
            // Show confirmation popup
            this.showJoinConfirmation(spot.name);
            
        } catch (err) {
            console.error('❌ Error joining cleanup:', err);
            UI.showAlert('❌ Error joining cleanup', 'error');
        }
    },

    /**
     * Show confirmation popup when user joins
     */
    showJoinConfirmation(spotName) {
        try {
            // Create popup element
            const popup = document.createElement('div');
            popup.className = 'join-confirmation-popup';
            popup.innerHTML = `
                <div class="popup-content">
                    <div class="popup-emoji">🎉</div>
                    <h3>You have joined the cleanup!</h3>
                    <p>${spotName}</p>
                </div>
            `;
            
            document.body.appendChild(popup);
            console.log('✅ Confirmation popup shown');
            
            // Auto-remove after 4 seconds
            setTimeout(() => {
                popup.classList.add('fade-out');
                setTimeout(() => popup.remove(), 300);
            }, 4000);
            
        } catch (err) {
            console.error('❌ Error showing confirmation:', err);
        }
    }
};

// ============================================
// UI Helper Functions
// ============================================

const UI = {
    /**
     * Show notification toast
     */
    showAlert(message, type = 'info') {
        try {
            console.log(`[${type.toUpperCase()}] ${message}`);

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            toast.setAttribute('role', 'alert');
            document.body.appendChild(toast);

            setTimeout(() => toast.remove(), 4000);
        } catch (err) {
            console.error('Error showing alert:', err);
        }
    },

    /**
     * Show/hide loading spinner
     */
    showLoading(show, message = 'Loading...') {
        try {
            let loader = document.getElementById('appLoader');

            if (show) {
                if (!loader) {
                    loader = document.createElement('div');
                    loader.id = 'appLoader';
                    loader.style.cssText = `
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        padding: 2rem;
                        border-radius: 12px;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                        z-index: 3000;
                        text-align: center;
                    `;
                    document.body.appendChild(loader);
                }
                loader.innerHTML = `
                    <div class="spinner"></div>
                    <p>${message}</p>
                `;
                loader.style.display = 'block';
            } else if (loader) {
                loader.style.display = 'none';
            }
        } catch (err) {
            console.error('Error toggling loader:', err);
        }
    },

    /**
     * Smooth scroll to element
     */
    smoothScroll(target) {
        try {
            const element = document.querySelector(target);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Error scrolling:', err);
        }
    },
};

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    try {
        if (!DOM.mapButton || !DOM.createCrewBtn || !DOM.getStartedBtn) {
            console.warn('Some DOM elements missing');
            return;
        }

        // Location button - trigger geolocation + weather API
        DOM.mapButton.addEventListener('click', async () => {
            try {
                console.log('🔘 Location button clicked');
                const success = await LocationService.requestLocation();
                if (success) {
                    console.log('🌐 Fetching weather from NEA API...');
                    await WeatherService.fetchWeather();
                    const nearestSpot = LocationService.getNearestSpot();
                    UI.smoothScroll('#weather');
                }
            } catch (err) {
                console.error('❌ Location button handler error:', err);
                UI.showAlert('❌ Error: ' + err.message, 'error');
            }
        });

        // Create crew button
        DOM.createCrewBtn.addEventListener('click', () => {
            try {
                CrewService.createCrew();
            } catch (err) {
                console.error('Create crew error:', err);
            }
        });

        // Join cleanup button
        if (DOM.joinCleanupBtn) {
            DOM.joinCleanupBtn.addEventListener('click', () => {
                try {
                    console.log('🎯 Join cleanup button clicked');
                    CleanupService.joinCleanup();
                } catch (err) {
                    console.error('❌ Join button error:', err);
                }
            });
        }

        // Get started button
        DOM.getStartedBtn.addEventListener('click', () => {
            try {
                UI.smoothScroll('#map');
            } catch (err) {
                console.error('Get started error:', err);
            }
        });

        // Navigation smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', (e) => {
                try {
                    const href = e.currentTarget.getAttribute('href');
                    if (href !== '#') {
                        e.preventDefault();
                        UI.smoothScroll(href);
                    }
                } catch (err) {
                    console.error('❌ Nav link error:', err);
                }
            });
        });

        // Map spot button switching - Update cleanup info on click
        document.querySelectorAll('.map-spot-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                try {
                    const spotId = e.currentTarget.dataset.map;
                    console.log('🗺️ Cleanup spot clicked:', spotId);
                    
                    // Remove active class from all buttons
                    document.querySelectorAll('.map-spot-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    
                    // Add active class to clicked button
                    e.currentTarget.classList.add('active');
                    
                    // Update cleanup info display
                    CleanupService.updateCleanupInfo(spotId);
                    
                    // Hide all maps
                    document.querySelectorAll('#mapContainer > div').forEach(map => {
                        map.style.display = 'none';
                    });
                    
                    // Show selected map
                    const mapId = spotId + '-map';
                    const selectedMap = document.getElementById(mapId);
                    if (selectedMap) {
                        selectedMap.style.display = 'block';
                        console.log('✅ Map displayed:', mapId);
                    } else {
                        console.warn('⚠️ Map not found:', mapId);
                    }
                } catch (err) {
                    console.error('❌ Map button error:', err);
                    UI.showAlert('❌ Error selecting cleanup spot: ' + err.message, 'error');
                }
            });
        });

        console.log('✅ Event listeners attached');
    } catch (err) {
        console.error('Error setting up listeners:', err);
    }
}

// ============================================
// Application Initialization
// ============================================

function initApp() {
    try {
        console.log('🏄 ShoreSquad initializing...');

        // Initialize DOM cache
        DOM.init();

        // Setup event listeners
        setupEventListeners();

        // Display existing crews
        CrewService.displayCrews();

        // Show welcome message
        console.log('✅ ShoreSquad ready to rally the crew!');
    } catch (err) {
        console.error('Initialization error:', err);
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

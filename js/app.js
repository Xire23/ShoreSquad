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
     * Request user's geolocation
     */
    async requestLocation() {
        try {
            if (!navigator.geolocation) {
                UI.showAlert('❌ Geolocation not supported', 'error');
                return false;
            }

            UI.showLoading(true, 'Getting your location...');

            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        try {
                            const { latitude, longitude } = position.coords;
                            AppState.userLocation = { latitude, longitude };
                            UI.showLoading(false);
                            UI.showAlert('📍 Location enabled!', 'success');
                            resolve(true);
                        } catch (err) {
                            console.error('Error processing location:', err);
                            UI.showAlert('❌ Error processing location', 'error');
                            UI.showLoading(false);
                            resolve(false);
                        }
                    },
                    (error) => {
                        UI.showLoading(false);
                        console.warn('Geolocation error:', error);
                        UI.showAlert('❌ Unable to get location', 'error');
                        resolve(false);
                    },
                    { timeout: 10000, enableHighAccuracy: true }
                );
            });
        } catch (err) {
            console.error('LocationService error:', err);
            UI.showAlert('❌ Unexpected error', 'error');
            return false;
        }
    },
};

// ============================================
// Weather Service
// ============================================

const WeatherService = {
    /**
     * Fetch weather forecast from NEA API
     */
    async fetchWeather() {
        try {
            UI.showLoading(true, 'Loading weather...');

            const url = 'https://api.data.gov.sg/v1/environment/4-day-weather-forecast';
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            UI.showLoading(false);

            AppState.weatherData = data;
            this.displayWeather(data);
            UI.showAlert('🌤️ Weather loaded!', 'success');
        } catch (err) {
            UI.showLoading(false);
            console.error('Weather API error:', err);
            UI.showAlert('❌ Could not load weather', 'error');
        }
    },

    /**
     * Display weather data
     */
    displayWeather(data) {
        try {
            if (!data.items || data.items.length === 0) {
                DOM.weatherDashboard.innerHTML = '<p>No weather data available</p>';
                return;
            }

            const forecasts = data.items[0].forecasts;
            let html = '<h3>4-Day Forecast</h3>';

            forecasts.forEach((day) => {
                html += `
                    <div class="weather-card">
                        <h4>${new Date(day.date).toLocaleDateString()}</h4>
                        <p>${day.forecast}</p>
                        <p><strong>${day.temperature.low}°C / ${day.temperature.high}°C</strong></p>
                    </div>
                `;
            });

            DOM.weatherDashboard.innerHTML = html;
        } catch (err) {
            console.error('Error displaying weather:', err);
            DOM.weatherDashboard.innerHTML = '<p>❌ Error loading weather</p>';
        }
    },
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

        // Location button
        DOM.mapButton.addEventListener('click', async () => {
            try {
                const success = await LocationService.requestLocation();
                if (success) {
                    await WeatherService.fetchWeather();
                }
            } catch (err) {
                console.error('Location button error:', err);
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
                    console.error('Nav link error:', err);
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

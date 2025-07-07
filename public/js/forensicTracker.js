// Balanced forensic tracker - focused on threat detection
(function() {
    'use strict';

    // Configuration
    const config = {
        enableBehaviorTracking: true,
        enableFingerprinting: true,
        enableNetworkDetection: true,
        maxDataSize: 10000, // Limit data collection
        debugMode: false
    };

    // Data collection object
    const forensicData = {
        timestamp: Date.now(),
        sessionId: generateSessionId(),
        pageLoadTime: Date.now(),
        formStartTime: null,
        formCompletionTime: null,
        device: {},
        network: {},
        behavior: {},
        security: {}
    };

    // Generate session ID
    function generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Basic device fingerprinting (less invasive)
    function collectDeviceInfo() {
        try {
            forensicData.device = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                languages: navigator.languages,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                screen: {
                    width: screen.width,
                    height: screen.height,
                    colorDepth: screen.colorDepth,
                    pixelDepth: screen.pixelDepth
                },
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),
                // Basic hardware info (less detailed than before)
                hardwareConcurrency: navigator.hardwareConcurrency || 0,
                memory: navigator.deviceMemory || 0,
                // Remove canvas fingerprinting - too invasive
                // Keep simple WebGL detection
                webgl: !!window.WebGLRenderingContext,
                webgl2: !!window.WebGL2RenderingContext
            };
        } catch (e) {
            console.warn('Device info collection failed:', e);
        }
    }

    // Network detection (simplified)
    function detectNetworkInfo() {
        try {
            // Basic connection info
            if (navigator.connection) {
                forensicData.network.connection = {
                    effectiveType: navigator.connection.effectiveType,
                    type: navigator.connection.type,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt,
                    saveData: navigator.connection.saveData
                };
            }

            // Simplified WebRTC detection (just check for VPN/proxy indicators)
            if (config.enableNetworkDetection && window.RTCPeerConnection) {
                detectWebRTCInfo();
            }
        } catch (e) {
            console.warn('Network detection failed:', e);
        }
    }

    // Simplified WebRTC detection
    function detectWebRTCInfo() {
        try {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            pc.createDataChannel('test');
            pc.createOffer().then(offer => pc.setLocalDescription(offer));

            const timeout = setTimeout(() => {
                pc.close();
                forensicData.network.webrtc = { status: 'timeout' };
            }, 3000);

            pc.onicecandidate = function(event) {
                if (event.candidate) {
                    const candidate = event.candidate.candidate;
                    if (candidate.includes('192.168.') || candidate.includes('10.') || candidate.includes('172.')) {
                        forensicData.network.webrtc = { 
                            hasLocalIP: true,
                            candidate: candidate.substring(0, 50) // Limit data
                        };
                    }
                    clearTimeout(timeout);
                    pc.close();
                }
            };
        } catch (e) {
            forensicData.network.webrtc = { error: 'WebRTC unavailable' };
        }
    }

    // Behavior tracking (focused on form interaction)
    function trackBehavior() {
        let focusCount = 0;
        let keystrokes = 0;
        let mouseClicks = 0;
        let formInteractions = [];

        const form = document.getElementById('contactForm');
        if (!form) return;

        // Track form focus events
        form.addEventListener('focusin', function(e) {
            focusCount++;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                formInteractions.push({
                    type: 'focus',
                    field: e.target.name || e.target.id,
                    timestamp: Date.now() - forensicData.pageLoadTime
                });
            }
        });

        // Track form submission timing
        form.addEventListener('submit', function() {
            forensicData.formCompletionTime = Date.now();
            forensicData.behavior.formTime = forensicData.formCompletionTime - (forensicData.formStartTime || forensicData.pageLoadTime);
        });

        // Track first form interaction
        form.addEventListener('input', function() {
            if (!forensicData.formStartTime) {
                forensicData.formStartTime = Date.now();
            }
            keystrokes++;
        });

        // Track clicks (limited)
        document.addEventListener('click', function() {
            mouseClicks++;
        });

        // Store behavior data
        forensicData.behavior = {
            focusCount: focusCount,
            keystrokes: keystrokes,
            mouseClicks: mouseClicks,
            formInteractions: formInteractions.slice(-10), // Limit to last 10
            pageTime: 0 // Will be calculated on submit
        };
    }

    // Security checks
    function performSecurityChecks() {
        forensicData.security = {
            // Check for automation indicators
            webdriver: !!navigator.webdriver,
            selenium: !!window.selenium,
            phantom: !!window.phantom,
            nightmare: !!window.nightmare,
            
            // Check for debugging
            devtools: false, // Will be set by devtools detection
            
            // Check for common bot indicators
            plugins: navigator.plugins.length,
            mimeTypes: navigator.mimeTypes.length,
            
            // Check for headless indicators
            headless: isHeadless()
        };

        // Simple devtools detection
        detectDevTools();
    }

    // Detect headless browsers
    function isHeadless() {
        return (
            navigator.webdriver ||
            !navigator.languages ||
            navigator.languages.length === 0 ||
            /HeadlessChrome/.test(navigator.userAgent) ||
            (!navigator.permissions && !navigator.serviceWorker && !navigator.clipboard)
        );
    }

    // Simple devtools detection
    function detectDevTools() {
        let devtools = false;
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtools = true;
                return 'devtools-detected';
            }
        });
        
        setTimeout(() => {
            console.log(element);
            forensicData.security.devtools = devtools;
        }, 100);
    }

    // Main collection function
    function collectForensicData() {
        collectDeviceInfo();
        detectNetworkInfo();
        
        if (config.enableBehaviorTracking) {
            trackBehavior();
        }
        
        performSecurityChecks();
    }

    // Inject data into form submission
    function injectForensicData() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            // Calculate final timing
            forensicData.behavior.pageTime = Date.now() - forensicData.pageLoadTime;
            
            // Limit data size
            const dataString = JSON.stringify(forensicData);
            if (dataString.length > config.maxDataSize) {
                console.warn('Forensic data too large, truncating');
                // Keep only essential data
                const essentialData = {
                    timestamp: forensicData.timestamp,
                    sessionId: forensicData.sessionId,
                    device: {
                        userAgent: forensicData.device.userAgent,
                        platform: forensicData.device.platform,
                        language: forensicData.device.language
                    },
                    behavior: {
                        formTime: forensicData.behavior.formTime,
                        pageTime: forensicData.behavior.pageTime
                    },
                    security: forensicData.security
                };
                
                // Create or update hidden field
                let hiddenField = document.getElementById('forensicData');
                if (!hiddenField) {
                    hiddenField = document.createElement('input');
                    hiddenField.type = 'hidden';
                    hiddenField.name = 'clientData';
                    hiddenField.id = 'forensicData';
                    form.appendChild(hiddenField);
                }
                hiddenField.value = JSON.stringify(essentialData);
            } else {
                // Create or update hidden field
                let hiddenField = document.getElementById('forensicData');
                if (!hiddenField) {
                    hiddenField = document.createElement('input');
                    hiddenField.type = 'hidden';
                    hiddenField.name = 'clientData';
                    hiddenField.id = 'forensicData';
                    form.appendChild(hiddenField);
                }
                hiddenField.value = dataString;
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            collectForensicData();
            injectForensicData();
        });
    } else {
        collectForensicData();
        injectForensicData();
    }

    // Debug mode
    if (config.debugMode) {
        window.forensicData = forensicData;
        console.log('Forensic tracker initialized', forensicData);
    }

})();
// Character counter
document.addEventListener('DOMContentLoaded', function() {
  const messageField = document.getElementById('message');
  const charCount = document.getElementById('char-count');
  const submitBtn = document.getElementById('submitBtn');
  
  messageField.addEventListener('input', function() {
    const count = this.value.length;
    charCount.textContent = count;
    
    // Visual feedback for character limit
    if (count > 1800) {
      charCount.style.color = '#e74c3c';
    } else if (count > 1500) {
      charCount.style.color = '#f39c12';
    } else {
      charCount.style.color = '#27ae60';
    }
  });
  
  // Form submission feedback
  document.getElementById('contactForm').addEventListener('submit', function() {
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
  });
});

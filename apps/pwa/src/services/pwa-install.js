/**
 * PWA Installation Service - Handles app installation flow
 * Manages beforeinstallprompt events and installation state
 */

class PWAInstallService {
  constructor() {
    this.deferredPrompt = null;
    this.isInstallable = false;
    this.isInstalled = false;
    this.installListeners = new Set();
    this.hasShownPrompt = false;
    this.dismissCount = 0;
    this.maxDismissals = 3;
    
    this.init();
  }

  init() {
    // Check if app is already installed
    this.checkInstallationStatus();
    
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWAInstall] beforeinstallprompt event fired');
      
      // Prevent the default install prompt
      e.preventDefault();
      
      // Store the event for later use
      this.deferredPrompt = e;
      this.isInstallable = true;
      
      // Check if we should show install prompt automatically
      this.evaluateAutoPrompt();
      
      // Notify listeners
      this.notifyListeners('installable', { canInstall: true });
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', (e) => {
      console.log('[PWAInstall] App was installed');
      this.isInstalled = true;
      this.isInstallable = false;
      this.deferredPrompt = null;
      
      // Track installation
      this.trackInstallation();
      
      // Notify listeners
      this.notifyListeners('installed', { installed: true });
    });

    // Listen for install prompt outcome
    if (this.deferredPrompt) {
      this.deferredPrompt.userChoice.then((choiceResult) => {
        console.log('[PWAInstall] User choice:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'dismissed') {
          this.dismissCount++;
          this.setDismissalTime();
        }
        
        this.notifyListeners('promptResult', { 
          outcome: choiceResult.outcome,
          dismissCount: this.dismissCount
        });
      });
    }
  }

  checkInstallationStatus() {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWAInstall] App is running in standalone mode');
      return;
    }

    // Check if running in app context on iOS
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('[PWAInstall] App is running as iOS web app');
      return;
    }

    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
          console.log('[PWAInstall] Service worker is registered');
        }
      });
    }
  }

  evaluateAutoPrompt() {
    // Don't show if already dismissed too many times
    if (this.dismissCount >= this.maxDismissals) {
      console.log('[PWAInstall] Max dismissals reached, not showing auto prompt');
      return;
    }

    // Don't show if recently dismissed (within 24 hours)
    const lastDismissal = localStorage.getItem('pwa-install-last-dismissal');
    if (lastDismissal) {
      const hoursSinceDismissal = (Date.now() - parseInt(lastDismissal)) / (1000 * 60 * 60);
      if (hoursSinceDismissal < 24) {
        console.log('[PWAInstall] Recently dismissed, waiting before next prompt');
        return;
      }
    }

    // Check if user has been active long enough to show prompt
    const sessionStart = sessionStorage.getItem('pwa-session-start') || Date.now();
    const sessionMinutes = (Date.now() - sessionStart) / (1000 * 60);
    
    if (sessionMinutes < 2) {
      console.log('[PWAInstall] Session too short, delaying auto prompt');
      setTimeout(() => this.evaluateAutoPrompt(), 30000); // Check again in 30 seconds
      return;
    }

    // Show prompt after user engagement
    this.showInstallPrompt({ trigger: 'auto', delay: 3000 });
  }

  async showInstallPrompt(options = {}) {
    if (!this.deferredPrompt || !this.isInstallable) {
      console.warn('[PWAInstall] No install prompt available');
      return { outcome: 'not-available' };
    }

    const { trigger = 'manual', delay = 0 } = options;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      console.log(`[PWAInstall] Showing install prompt (trigger: ${trigger})`);
      
      // Track prompt display
      this.trackPromptShown(trigger);
      
      // Show the prompt
      this.deferredPrompt.prompt();
      
      // Wait for user choice
      const choiceResult = await this.deferredPrompt.userChoice;
      
      console.log('[PWAInstall] User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWAInstall] User accepted the install prompt');
        this.trackInstallAccepted(trigger);
      } else {
        console.log('[PWAInstall] User dismissed the install prompt');
        this.dismissCount++;
        this.setDismissalTime();
        this.trackInstallDismissed(trigger);
      }

      // Reset the deferred prompt
      this.deferredPrompt = null;
      this.isInstallable = false;
      
      return { outcome: choiceResult.outcome, trigger };
      
    } catch (error) {
      console.error('[PWAInstall] Error showing install prompt:', error);
      return { outcome: 'error', error: error.message };
    }
  }

  canInstall() {
    return this.isInstallable && this.deferredPrompt !== null;
  }

  isAppInstalled() {
    return this.isInstalled;
  }

  shouldShowInstallHint() {
    return !this.isInstalled && !this.hasShownPrompt && this.dismissCount < this.maxDismissals;
  }

  getDismissalCount() {
    return this.dismissCount;
  }

  setDismissalTime() {
    localStorage.setItem('pwa-install-last-dismissal', Date.now().toString());
    localStorage.setItem('pwa-install-dismiss-count', this.dismissCount.toString());
  }

  // Event listener management
  addListener(callback) {
    this.installListeners.add(callback);
    return () => this.installListeners.delete(callback);
  }

  removeListener(callback) {
    this.installListeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.installListeners.forEach(callback => {
      try {
        callback({ type: event, ...data });
      } catch (error) {
        console.error('[PWAInstall] Error in listener callback:', error);
      }
    });
  }

  // Analytics and tracking
  trackPromptShown(trigger) {
    this.hasShownPrompt = true;
    console.log(`[PWAInstall] Install prompt shown (trigger: ${trigger})`);
    
    // Emit analytics event
    window.dispatchEvent(new CustomEvent('pwa-install-prompt-shown', {
      detail: { trigger, timestamp: Date.now() }
    }));
  }

  trackInstallAccepted(trigger) {
    console.log(`[PWAInstall] Install accepted (trigger: ${trigger})`);
    
    // Emit analytics event
    window.dispatchEvent(new CustomEvent('pwa-install-accepted', {
      detail: { trigger, timestamp: Date.now() }
    }));
  }

  trackInstallDismissed(trigger) {
    console.log(`[PWAInstall] Install dismissed (trigger: ${trigger}, count: ${this.dismissCount})`);
    
    // Emit analytics event
    window.dispatchEvent(new CustomEvent('pwa-install-dismissed', {
      detail: { 
        trigger, 
        dismissCount: this.dismissCount,
        timestamp: Date.now() 
      }
    }));
  }

  trackInstallation() {
    console.log('[PWAInstall] App installation completed');
    
    // Clear dismissal tracking
    localStorage.removeItem('pwa-install-last-dismissal');
    localStorage.removeItem('pwa-install-dismiss-count');
    
    // Emit analytics event
    window.dispatchEvent(new CustomEvent('pwa-installed', {
      detail: { timestamp: Date.now() }
    }));
  }

  // iOS-specific installation instructions
  isIOSSafari() {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    return isIOS && isSafari;
  }

  getIOSInstallInstructions() {
    return {
      steps: [
        'Tap the Share button (box with arrow)',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to install the app'
      ],
      note: 'The app will appear on your home screen like a native app'
    };
  }

  // Installation status for UI
  getInstallationStatus() {
    return {
      isInstalled: this.isInstalled,
      canInstall: this.canInstall(),
      shouldShowHint: this.shouldShowInstallHint(),
      dismissCount: this.dismissCount,
      isIOSSafari: this.isIOSSafari(),
      platform: this.detectPlatform()
    };
  }

  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    if (/windows/.test(userAgent)) return 'windows';
    if (/mac/.test(userAgent)) return 'mac';
    if (/linux/.test(userAgent)) return 'linux';
    
    return 'unknown';
  }
}

// Create singleton instance
const pwaInstallService = new PWAInstallService();

export { pwaInstallService, PWAInstallService };
export default pwaInstallService;
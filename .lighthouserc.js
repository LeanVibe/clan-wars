module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5173',
        'http://localhost:5173/game',
        'http://localhost:5173/tournament'
      ],
      startServerCommand: 'bun run preview',
      startServerReadyPattern: 'Local:.*:5173',
      startServerTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        auditMode: false,
        gatherMode: false,
        disableStorageReset: false,
        emulatedFormFactor: 'desktop',
        internalDisableDeviceScreenEmulation: true
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.7 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-meaningful-paint': ['warn', { maxNumericValue: 2000 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 20000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }],
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'uses-text-compression': 'error',
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'uses-responsive-images': 'warn',
        
        // Game-specific performance
        'dom-size': ['warn', { maxNumericValue: 1500 }],
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],
        'bootup-time': ['warn', { maxNumericValue: 3500 }],
        
        // Security & Best Practices
        'is-on-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
        
        // Accessibility (important for gaming)
        'color-contrast': 'error',
        'heading-order': 'warn',
        'link-name': 'error',
        'button-name': 'error',
        'image-alt': 'error',
        'label': 'error',
        
        // PWA requirements
        'service-worker': 'warn',
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        'viewport': 'error',
        'without-javascript': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: 'lighthouse-%%DATETIME%%-%%PATHNAME%%.%%EXTENSION%%'
    },
    server: {
      port: 9009
    }
  }
};
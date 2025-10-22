// Cache busting utility for ensuring users get the latest version
(function() {
  'use strict';
  
  const CACHE_VERSION = '1.0.0';
  const CACHE_KEY = 'app_cache_version';
  const FORCE_REFRESH_KEY = 'force_refresh';
  
  // Check if we need to force refresh
  function checkForUpdates() {
    const storedVersion = localStorage.getItem(CACHE_KEY);
    const forceRefresh = localStorage.getItem(FORCE_REFRESH_KEY);
    
    if (forceRefresh === 'true') {
      console.log('Force refresh requested, clearing cache...');
      clearAllCaches();
      localStorage.removeItem(FORCE_REFRESH_KEY);
      return;
    }
    
    if (storedVersion !== CACHE_VERSION) {
      console.log('App version changed, updating cache...');
      clearAllCaches();
      localStorage.setItem(CACHE_KEY, CACHE_VERSION);
    }
  }
  
  // Clear all caches
  function clearAllCaches() {
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(function() {
        console.log('All caches cleared');
        // Reload the page to get fresh content
        window.location.reload(true);
      });
    } else {
      // Fallback: force reload
      window.location.reload(true);
    }
  }
  
  // Add cache busting to API requests
  function addCacheBustingToRequests() {
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options = {}) {
      // Add cache busting parameter to API requests
      if (typeof url === 'string' && url.startsWith('/api/')) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}_t=${Date.now()}`;
      }
      
      // Add cache control headers
      options.headers = {
        ...options.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };
      
      return originalFetch(url, options);
    };
  }
  
  // Add version check to page load
  function addVersionCheck() {
    // Check for updates every 5 minutes
    setInterval(checkForUpdates, 5 * 60 * 1000);
    
    // Check on page visibility change
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        checkForUpdates();
      }
    });
  }
  
  // Floating refresh button removed - using header button instead
  function addRefreshButton() {
    // No floating buttons - header refresh button handles this
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      checkForUpdates();
      addCacheBustingToRequests();
      addVersionCheck();
      addRefreshButton();
    });
  } else {
    checkForUpdates();
    addCacheBustingToRequests();
    addVersionCheck();
    addRefreshButton();
  }
  
  // Expose functions globally for debugging
  window.cacheBuster = {
    clearAllCaches: clearAllCaches,
    checkForUpdates: checkForUpdates,
    forceRefresh: function() {
      localStorage.setItem(FORCE_REFRESH_KEY, 'true');
      clearAllCaches();
    }
  };
})();

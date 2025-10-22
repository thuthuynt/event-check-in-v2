import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Events" },
];

export function Header({ currentPath }: { currentPath: string }) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <nav className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <a 
              href="/" 
              className="flex items-center space-x-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-white touch-target"
            >
              <img 
                src="/ducklytics-logo.png" 
                alt="Ducklytics" 
                className="h-8 w-8 sm:h-10 sm:w-10"
              />
              <span>Event Check-in</span>
            </a>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden sm:flex items-center space-x-4 lg:space-x-6">
            {links.map((link) => (
              <a
                key={link.href}
                className={cn(
                  "text-sm font-medium leading-none touch-target px-3 py-2 rounded-md transition-colors",
                  currentPath === link.href
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
                href={link.href}
                aria-current={currentPath === link.href ? "page" : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
          
          {/* Mobile/Tablet Actions */}
          <div className="flex items-center space-x-2">
            {/* Refresh Button for Mobile/Tablet */}
            <button
              onClick={() => {
                // Clear all caches and force refresh
                if (typeof window !== 'undefined') {
                  // Clear localStorage cache version
                  localStorage.removeItem('app_cache_version');
                  localStorage.setItem('force_refresh', 'true');
                  
                  // Clear service worker caches
                  if ('caches' in window) {
                    caches.keys().then(function(cacheNames) {
                      return Promise.all(
                        cacheNames.map(function(cacheName) {
                          return caches.delete(cacheName);
                        })
                      );
                    }).then(function() {
                      // Reload the page after clearing caches
                      window.location.reload(true);
                    });
                  } else {
                    // Fallback: just reload
                    window.location.reload(true);
                  }
                }
              }}
              className="touch-target p-2 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              aria-label="Refresh App"
              title="Refresh App"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Mobile Menu Button */}
            <button
              className="touch-target p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="py-2 space-y-1">
            {links.map((link) => (
              <a
                key={link.href}
                className={cn(
                  "block px-3 py-2 text-base font-medium rounded-md touch-target",
                  currentPath === link.href
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
                href={link.href}
                aria-current={currentPath === link.href ? "page" : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

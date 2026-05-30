import { useState, useEffect } from 'react';

export function useRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.endsWith('/lab')) {
      return '/lab';
    }
    return '/';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.endsWith('/lab')) {
        setCurrentPath('/lab');
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigate = (path: string, queryParams?: Record<string, string>) => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Clear and set query parameters
    if (queryParams) {
      // Clear unrelated params when updating
      const allowedKeys = Object.keys(queryParams);
      const allKeys: string[] = [];
      searchParams.forEach((_, key) => allKeys.push(key));
      allKeys.forEach((key) => {
        if (!allowedKeys.includes(key)) {
          searchParams.delete(key);
        }
      });
      
      Object.entries(queryParams).forEach(([key, val]) => {
        searchParams.set(key, val);
      });
    } else {
      // Reset params completely when switching views with no query
      const allKeys: string[] = [];
      searchParams.forEach((_, key) => allKeys.push(key));
      allKeys.forEach((key) => searchParams.delete(key));
    }
    
    // Determine the base path directory for deployment mirror safety (e.g., GitHub Pages)
    const pathname = window.location.pathname;
    let baseDir = '/';
    if (pathname.includes('/the-culinary-universe')) {
      baseDir = '/the-culinary-universe';
    }
    
    const targetPath = path === '/' ? baseDir : `${baseDir.replace(/\/$/, '')}${path}`;
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const finalUrl = `${targetPath}${queryStr}`;

    window.history.pushState(null, '', finalUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return { currentPath, navigate };
}

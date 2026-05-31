// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useRouter } from '../hooks/useRouter';

describe('useRouter client-side routing hook', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // Reset location pathname & search to standard values
    window.history.pushState(null, '', '/');
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize currentPath based on location pathname', () => {
    window.history.pushState(null, '', '/lab');

    let currentPath = '';
    const TestComponent = () => {
      const router = useRouter();
      currentPath = router.currentPath;
      return null;
    };

    const root = createRoot(container);
    act(() => {
      root.render(<TestComponent />);
    });

    expect(currentPath).toBe('/lab');
  });

  it('should navigate to standard path and reset query params', () => {
    // Start with a query parameter in URL
    window.history.pushState(null, '', '/?selected=42&axes=false');

    let capturedRouter: any = null;
    const TestComponent = () => {
      capturedRouter = useRouter();
      return null;
    };

    const root = createRoot(container);
    act(() => {
      root.render(<TestComponent />);
    });

    // Navigate to lab with no query
    act(() => {
      capturedRouter.navigate('/lab');
    });

    expect(window.location.pathname).toBe('/lab');
    expect(window.location.search).toBe('');
    expect(capturedRouter.currentPath).toBe('/lab');
  });

  it('should keep specified search params and clear others during navigate', () => {
    window.history.pushState(null, '', '/?selected=42&axes=false&extra=hello');

    let capturedRouter: any = null;
    const TestComponent = () => {
      capturedRouter = useRouter();
      return null;
    };

    const root = createRoot(container);
    act(() => {
      root.render(<TestComponent />);
    });

    // Navigate with a query parameter replacement
    act(() => {
      capturedRouter.navigate('/lab', { selected: '99', zoom: '5.5' });
    });

    expect(window.location.pathname).toBe('/lab');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('selected')).toBe('99');
    expect(params.get('zoom')).toBe('5.5');
    // Ensure 'extra' and 'axes' parameters were purged
    expect(params.get('extra')).toBeNull();
    expect(params.get('axes')).toBeNull();
  });

  it('should handle deployment baseDir safety mirror (e.g. GitHub Pages)', () => {
    // Mock page deployment path
    window.history.pushState(null, '', '/the-culinary-universe/lab');

    let capturedRouter: any = null;
    const TestComponent = () => {
      capturedRouter = useRouter();
      return null;
    };

    const root = createRoot(container);
    act(() => {
      root.render(<TestComponent />);
    });

    // Navigate to home '/' should go to /the-culinary-universe
    act(() => {
      capturedRouter.navigate('/');
    });

    expect(window.location.pathname).toBe('/the-culinary-universe');
  });

  it('should update currentPath when window triggers popstate event', () => {
    let capturedRouter: any = null;
    const TestComponent = () => {
      capturedRouter = useRouter();
      return null;
    };

    const root = createRoot(container);
    act(() => {
      root.render(<TestComponent />);
    });

    expect(capturedRouter.currentPath).toBe('/');

    // Simulate clicking browser back/forward buttons
    act(() => {
      window.history.pushState(null, '', '/lab');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(capturedRouter.currentPath).toBe('/lab');
  });
});

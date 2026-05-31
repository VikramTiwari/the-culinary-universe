// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useMapSearchParams } from '../hooks/useMapSearchParams';

describe('useMapSearchParams search-params state sync hook', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    window.history.pushState(null, '', '/');
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should initialize states with pre-loaded values in URL query params', () => {
    window.history.pushState(
      null,
      '',
      '/?selected=154&axes=false&tethers=true&rotate=false&zoom=9.50&x=0&y=1&z=2'
    );

    let capturedParams: any = null;
    const TestComponent = () => {
      capturedParams = useMapSearchParams(false);
      return null;
    };

    const root = createRoot(container);
    act(() => {
      root.render(<TestComponent />);
    });

    expect(capturedParams.selectedIdx).toBe(154);
    expect(capturedParams.showAxes).toBe(false);
    expect(capturedParams.showTethers).toBe(true);
    expect(capturedParams.userWantsAutoRotate).toBe(false);
    expect(capturedParams.zoom).toBe(9.50);
    expect(capturedParams.axisTasteX).toBe(0);
    expect(capturedParams.axisTasteY).toBe(1);
    expect(capturedParams.axisTasteZ).toBe(2);
  });

  it('should synchronize state updates back to URL search queries in standard mode', () => {
    let capturedParams: any = null;
    const TestComponent = () => {
      capturedParams = useMapSearchParams(false);
      return null;
    };

    const root = createRoot(container);
    act(() => {
      root.render(<TestComponent />);
    });

    // Update zoom and selection state
    act(() => {
      capturedParams.setZoom(8.25);
      capturedParams.setSelectedIdx(42);
      capturedParams.setShowAxes(false);
    });

    const params = new URLSearchParams(window.location.search);
    expect(params.get('selected')).toBe('42');
    expect(params.get('zoom')).toBe('8.25');
    expect(params.get('axes')).toBe('false');
  });

  it('should instantly clear out query search strings when alchemyActive is enabled', () => {
    window.history.pushState(null, '', '/lab?selected=42&zoom=9.50&x=1');

    const TestComponent = () => {
      useMapSearchParams(true); // alchemist mode is active!
      return null;
    };

    const root = createRoot(container);
    act(() => {
      root.render(<TestComponent />);
    });

    // The search parameters should be completely purged from history path to keep lab URL neat!
    expect(window.location.search).toBe('');
  });
});

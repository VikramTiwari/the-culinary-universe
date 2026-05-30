import { useState, useEffect } from 'react';

export function useMapSearchParams(alchemyActive: boolean = false) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('selected');
    return s ? parseInt(s, 10) : null;
  });

  const [showAxes, setShowAxes] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get('axes');
    return a ? a === 'true' : true;
  });

  const [showTethers, setShowTethers] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tethers');
    return t ? t === 'true' : true;
  });

  const [userWantsAutoRotate, setUserWantsAutoRotate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('rotate');
    return r ? r === 'true' : true;
  });

  const [zoom, setZoom] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const z = params.get('zoom');
    return z ? parseFloat(z) : 7.0;
  });

  const [axisTasteX, setAxisTasteX] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const x = params.get('x');
    return x ? parseInt(x, 10) : -1;
  });

  const [axisTasteY, setAxisTasteY] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const y = params.get('y');
    return y ? parseInt(y, 10) : -1;
  });

  const [axisTasteZ, setAxisTasteZ] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const z = params.get('z');
    return z ? parseInt(z, 10) : -1;
  });

  useEffect(() => {
    if (alchemyActive) {
      // Instantly clear URL query parameters in alchemist lab mode for a neat /lab link
      if (window.location.search !== '') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set('x', axisTasteX.toString());
    params.set('y', axisTasteY.toString());
    params.set('z', axisTasteZ.toString());
    params.set('zoom', zoom.toFixed(2));
    params.set('axes', showAxes.toString());
    params.set('tethers', showTethers.toString());
    params.set('rotate', userWantsAutoRotate.toString());
    if (selectedIdx !== null) {
      params.set('selected', selectedIdx.toString());
    } else {
      params.delete('selected');
    }
    const newRelativePathQuery = window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [axisTasteX, axisTasteY, axisTasteZ, zoom, selectedIdx, showAxes, showTethers, userWantsAutoRotate, alchemyActive]);

  return {
    selectedIdx,
    setSelectedIdx,
    showAxes,
    setShowAxes,
    showTethers,
    setShowTethers,
    userWantsAutoRotate,
    setUserWantsAutoRotate,
    zoom,
    setZoom,
    axisTasteX,
    setAxisTasteX,
    axisTasteY,
    setAxisTasteY,
    axisTasteZ,
    setAxisTasteZ
  };
}

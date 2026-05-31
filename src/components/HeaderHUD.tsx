import React from 'react';
import { useRouter } from '../hooks/useRouter';

export const HeaderHUD: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <header className="hud-header">
      <div className="hud-header-subtitle">
        <span>The Flavor Explorer</span>
      </div>
      <h1 className="hud-header-title">The Culinary Universe</h1>
      <p className="hud-header-desc">
        Explore how 1,790 ingredients connect across hundreds of flavor facets.
        Ingredients clustered close together share similar taste profiles and pair
        beautifully together in recipes. Learn more in the{' '}
        <a
          href="https://github.com/VikramTiwari/the-culinary-universe"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--color-herbal)',
            textDecoration: 'underline',
            fontWeight: 600,
            transition: 'opacity 0.15s ease',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          code repo
        </a>
        {' '}or visit the{' '}
        <span
          onClick={() => navigate('/lab')}
          style={{
            color: 'var(--color-sweet)',
            textDecoration: 'underline',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          flavor lab
        </span>.
      </p>
    </header>
  );
};


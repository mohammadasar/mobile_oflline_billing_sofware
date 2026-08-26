/**
 * components/Layout/PageLayout.jsx
 * Wraps every page with header + scrollable content area.
 */
import { Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function PageLayout({ title, subtitle, headerRight, children }) {
  return (
    <>
      <header className="page-header">
        <div style={{ flex: 1 }}>
          <div className="page-header-title">{title}</div>
          {subtitle && <div className="page-header-subtitle">{subtitle}</div>}
        </div>
        <div className="page-header-actions">
          <NavLink
            to="/settings"
            className={({ isActive }) => `page-header-settings${isActive ? ' active' : ''}`}
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={19} />
          </NavLink>
          {headerRight && <div>{headerRight}</div>}
        </div>
      </header>

      <main className="page-content" role="main">
        <div className="page-container animate-fadeIn">
          {children}
        </div>
      </main>
    </>
  );
}

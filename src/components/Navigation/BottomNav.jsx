/**
 * components/Navigation/BottomNav.jsx
 * Premium bottom navigation bar for the app.
 */
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Home,
  Receipt,
  Package,
  Users,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/bills',    icon: Receipt,  label: 'Bills'    },
  { to: '/billing',  icon: LayoutGrid, label: 'Billing', isFab: true },
  { to: '/products', icon: Package,  label: 'Products' },
  { to: '/customers',icon: Users,    label: 'Customers'},
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label, isFab }) =>
        isFab ? (
          <NavLink
            key={to}
            to={to}
            id={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `bottom-nav-fab${isActive ? ' active' : ''}`
            }
            aria-label={label}
          >
            <div className="bottom-nav-fab-inner">
              <Icon size={24} color="white" strokeWidth={2.2} />
            </div>
            <span className="bottom-nav-fab-label">{label}</span>
          </NavLink>
        ) : (
          <NavLink
            key={to}
            to={to}
            id={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? ' active' : ''}`
            }
            aria-label={label}
          >
            <Icon className="bottom-nav-icon" strokeWidth={1.8} />
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        )
      )}
    </nav>
  );
}

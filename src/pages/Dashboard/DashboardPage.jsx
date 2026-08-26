import { useEffect, useState } from 'react';
import { ClipboardList, Package, Receipt } from 'lucide-react';
import PageLayout from '../../components/Layout/PageLayout';
import { useSettings } from '../../context/SettingsContext';
import { BillsDB } from '../../db/queries/bills';
import { ProductsDB } from '../../db/queries/products';

function money(value, currency) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

export default function DashboardPage() {
  const { settings } = useSettings();
  const currency = settings.currency_symbol || '₹';
  const [stats, setStats] = useState({ sales: 0, bills: 0, products: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [sales, bills, products] = await Promise.all([
          BillsDB.getTodayTotal(),
          BillsDB.getTodayCount(),
          ProductsDB.getCount(),
        ]);
        setStats({ sales, bills, products });
      } catch (err) {
        setError(err.message ?? 'Could not load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <PageLayout title="Dashboard" subtitle="Your store at a glance">
      <section className="dashboard-page" aria-label="Store summary">
        {error && <div className="form-error" role="alert">{error}</div>}
        {isLoading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : (
          <div className="dashboard-stats">
            <div className="stat-card">
              <ClipboardList className="dashboard-stat-icon dashboard-stat-icon-sales" size={22} aria-hidden="true" />
              <div className="stat-card-label">Today's Sales</div>
              <div className="stat-card-value">{money(stats.sales, currency)}</div>
              <div className="stat-card-sub">Total collected today</div>
            </div>
            <div className="stat-card">
              <Receipt className="dashboard-stat-icon dashboard-stat-icon-bills" size={22} aria-hidden="true" />
              <div className="stat-card-label">Number of Bills</div>
              <div className="stat-card-value">{stats.bills}</div>
              <div className="stat-card-sub">Bills created today</div>
            </div>
            <div className="stat-card">
              <Package className="dashboard-stat-icon dashboard-stat-icon-products" size={22} aria-hidden="true" />
              <div className="stat-card-label">Total Products</div>
              <div className="stat-card-value">{stats.products}</div>
              <div className="stat-card-sub">Active products in catalog</div>
            </div>
          </div>
        )}
      </section>
    </PageLayout>
  );
}

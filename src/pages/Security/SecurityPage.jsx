/**
 * pages/Security/SecurityPage.jsx
 * PIN lock and security settings — to be implemented via SettingsPage navigation.
 */
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';
import PageLayout from '../../components/Layout/PageLayout';

export default function SecurityPage() {
  return (
    <PageLayout title="Security" subtitle="Protect your billing data">
      <div className="page-stub">
        <div className="page-stub-icon">
          <ShieldCheck size={40} />
        </div>
        <span className="coming-soon-badge">Coming Soon</span>
        <h2 className="page-stub-title">PIN Lock</h2>
        <p className="page-stub-desc">
          Set a 4-digit PIN to prevent unauthorized access to your billing data.
        </p>
        <div className="grid-2" style={{ width: '100%', marginTop: '1rem' }}>
          <button className="btn btn-primary btn-block" disabled>
            <KeyRound size={16} /> Set PIN
          </button>
          <button className="btn btn-secondary btn-block" disabled>
            <Lock size={16} /> Disable
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

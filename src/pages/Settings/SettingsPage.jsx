import { useEffect, useRef, useState } from 'react';
import { Download, KeyRound, Lock, Printer, Save, ShieldCheck, Store, Upload } from 'lucide-react';
import PageLayout from '../../components/Layout/PageLayout';
import { useSettings } from '../../context/SettingsContext';
import { SecurityDB } from '../../db/queries/settings';
import { exportDb, importDb } from '../../db';

async function hashPin(pin) {
  const data = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function SettingsPage() {
  const { settings, updateSettings, refreshSettings } = useSettings();
  const [form, setForm] = useState(settings);
  const [pin, setPin] = useState('');
  const [pinConfirmation, setPinConfirmation] = useState('');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedView, setShowSavedView] = useState(false);
  const restoreInput = useRef(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    SecurityDB.get().then((security) => setPinEnabled(Boolean(security?.is_enabled))).catch(() => {});
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function saveSettings(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsSaving(true);
    try {
      await updateSettings({
        shop_name: form.shop_name || 'My Shop',
        shop_phone: form.shop_phone || '',
        shop_address: form.shop_address || '',
        printer_paper_size: form.printer_paper_size || '80mm',
        printer_auto_print: form.printer_auto_print ? '1' : '0',
        license_key: form.license_key || '',
      });
      setStatus('Settings saved locally.');
      setShowSavedView(true);
    } catch (err) {
      setError(err.message ?? 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  }

  async function savePin(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    if (!/^\d{4}$/.test(pin) || pin !== pinConfirmation) {
      setError('Enter a matching 4-digit PIN.');
      return;
    }
    try {
      await SecurityDB.setPinHash(await hashPin(pin));
      setPin('');
      setPinConfirmation('');
      setPinEnabled(true);
      setStatus('PIN enabled locally.');
    } catch (err) {
      setError(err.message ?? 'Could not save PIN.');
    }
  }

  async function disablePin() {
    try {
      await SecurityDB.disablePin();
      setPinEnabled(false);
      setStatus('PIN disabled.');
      setError('');
    } catch (err) {
      setError(err.message ?? 'Could not disable PIN.');
    }
  }

  async function backupDatabase() {
    try {
      const backup = await exportDb();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `offline-billing-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Backup created.');
      setError('');
    } catch (err) {
      setError(err.message ?? 'Could not create backup.');
    }
  }

  async function restoreDatabase(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      await importDb(backup);
      await refreshSettings();
      setStatus('Backup restored.');
      setError('');
    } catch (err) {
      setError(err.message ?? 'Could not restore backup.');
    }
  }

  if (showSavedView) {
    return (
      <PageLayout title="Settings" subtitle={settings.shop_name || 'Configure your app'}>
        <div className="settings-page">
          <section className="settings-section card settings-summary">
            <div className="settings-summary-icon"><Store size={28} /></div>
            <h2>{settings.shop_name || 'My Shop'}</h2>
            <p className="settings-summary-status">Settings saved locally.</p>
            <div className="settings-summary-list">
              <div><span>Phone</span><strong>{settings.shop_phone || 'Not added'}</strong></div>
              <div><span>Address</span><strong>{settings.shop_address || 'Not added'}</strong></div>
              <div><span>Printer</span><strong>{settings.printer_paper_size || '80mm'}{settings.printer_auto_print === '1' ? ' · Auto-print' : ''}</strong></div>
              <div><span>PIN</span><strong>{pinEnabled ? 'Enabled' : 'Disabled'}</strong></div>
              <div><span>License</span><strong>{settings.license_key ? 'Added' : 'Not added'}</strong></div>
            </div>
          </section>
          <button className="btn btn-primary btn-block" type="button" onClick={() => setShowSavedView(false)}><Save size={16} /> Edit Settings</button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Settings" subtitle={settings.shop_name || 'Configure your app'}>
      <form className="settings-page" onSubmit={saveSettings}>
        <section className="settings-section card">
          <div className="settings-section-heading"><Store size={20} /><div><h2>Shop details</h2><p>Shown on receipts and in the app.</p></div></div>
          <label className="form-group"><span className="form-label">Shop Name</span><input className="form-input" name="shop_name" value={form.shop_name || ''} onChange={updateField} required /></label>
          <label className="form-group"><span className="form-label">Phone</span><input className="form-input" name="shop_phone" type="tel" value={form.shop_phone || ''} onChange={updateField} /></label>
          <label className="form-group"><span className="form-label">Address</span><textarea className="form-input settings-textarea" name="shop_address" value={form.shop_address || ''} onChange={updateField} rows="3" /></label>
        </section>

        <section className="settings-section card">
          <div className="settings-section-heading"><Printer size={20} /><div><h2>Printer settings</h2><p>Choose the receipt paper format.</p></div></div>
          <label className="form-group"><span className="form-label">Paper Size</span><select className="form-input" name="printer_paper_size" value={form.printer_paper_size || '80mm'} onChange={updateField}><option value="58mm">58mm</option><option value="80mm">80mm</option><option value="A4">A4</option></select></label>
          <label className="settings-toggle"><input type="checkbox" name="printer_auto_print" checked={form.printer_auto_print === '1' || form.printer_auto_print === true} onChange={updateField} /><span>Print receipt after payment</span></label>
        </section>

        <section className="settings-section card">
          <div className="settings-section-heading"><ShieldCheck size={20} /><div><h2>Backup / Restore</h2><p>Move your local database as a JSON file.</p></div></div>
          <div className="settings-actions"><button type="button" className="btn btn-secondary btn-block" onClick={backupDatabase}><Download size={16} /> Backup</button><button type="button" className="btn btn-secondary btn-block" onClick={() => restoreInput.current?.click()}><Upload size={16} /> Restore</button></div>
          <input ref={restoreInput} className="settings-file-input" type="file" accept="application/json,.json" onChange={restoreDatabase} />
        </section>

        <section className="settings-section card">
          <div className="settings-section-heading"><Lock size={20} /><div><h2>PIN</h2><p>{pinEnabled ? 'PIN lock is enabled.' : 'Protect access with a 4-digit PIN.'}</p></div></div>
          <div className="settings-pin-fields"><input className="form-input" inputMode="numeric" maxLength="4" pattern="[0-9]{4}" type="password" placeholder="New PIN" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} /><input className="form-input" inputMode="numeric" maxLength="4" pattern="[0-9]{4}" type="password" placeholder="Confirm PIN" value={pinConfirmation} onChange={(event) => setPinConfirmation(event.target.value.replace(/\D/g, ''))} /></div>
          <div className="settings-actions"><button type="button" className="btn btn-secondary btn-block" onClick={savePin}><KeyRound size={16} /> {pinEnabled ? 'Change PIN' : 'Enable PIN'}</button>{pinEnabled && <button type="button" className="btn btn-danger btn-block" onClick={disablePin}>Disable</button>}</div>
        </section>

        <section className="settings-section card">
          <div className="settings-section-heading"><KeyRound size={20} /><div><h2>License</h2><p>Store your license key on this device.</p></div></div>
          <label className="form-group"><span className="form-label">License Key</span><input className="form-input" name="license_key" value={form.license_key || ''} onChange={updateField} placeholder="Enter license key" /></label>
        </section>

        {error && <div className="form-error" role="alert">{error}</div>}
        {status && <div className="settings-status" role="status">{status}</div>}
        <button className="btn btn-primary btn-block" type="submit" disabled={isSaving}><Save size={16} /> {isSaving ? 'Saving...' : 'Save Settings'}</button>
      </form>
    </PageLayout>
  );
}

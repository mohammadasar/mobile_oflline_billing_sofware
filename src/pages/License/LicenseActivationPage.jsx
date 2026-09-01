import { useEffect, useState } from 'react';
import { Copy, KeyRound, ShieldCheck } from 'lucide-react';
import PageLayout from '../../components/Layout/PageLayout';
import { activateLicense } from '../../license/activation';
import { LICENSE_STATUS } from '../../db/queries/settings';
import { getDeviceIdentity } from '../../native/license';

export default function LicenseActivationPage({ status, onActivated }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [deviceIdentity, setDeviceIdentity] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const [error, setError] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    getDeviceIdentity()
      .then(setDeviceIdentity)
      .catch(() => setDeviceIdentity({ available: false }));
  }, []);

  async function copyValue(field, value) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? '' : current));
      }, 1500);
    } catch {
      setCopiedField('');
    }
  }

  async function handleActivate(event) {
    event.preventDefault();
    setError('');
    setIsActivating(true);
    try {
      const result = await activateLicense(licenseKey);
      if (!result.ok) {
        throw new Error(result.error || LICENSE_STATUS.INVALID);
      }
      await onActivated();
    } catch (err) {
      setError(err.message ?? LICENSE_STATUS.INVALID);
    } finally {
      setIsActivating(false);
    }
  }

  return (
    <PageLayout title="License" subtitle="Activate this device to use the POS" hideSettings>
      <form className="settings-page" onSubmit={handleActivate}>
        <section className="settings-section card">
          <div className="settings-section-heading">
            <ShieldCheck size={20} />
            <div>
              <h2>Device license</h2>
              <p>{status || LICENSE_STATUS.NOT_ACTIVATED}</p>
            </div>
          </div>
          <label className="form-group">
            <span className="form-label">License Key</span>
            <input
              className="form-input"
              name="license_key"
              value={licenseKey}
              onChange={(event) => setLicenseKey(event.target.value)}
              placeholder="Enter license key"
              autoComplete="off"
            />
          </label>
          <div className="license-device-info">
            {deviceIdentity?.available ? (
              <>
                <div className="license-device-row">
                  <span>Device Binding ID</span>
                  <div className="license-device-value">
                    <strong>{deviceIdentity.deviceId || 'Unavailable'}</strong>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => copyValue('deviceId', deviceIdentity.deviceId)}
                      disabled={!deviceIdentity.deviceId}
                    >
                      <Copy size={14} /> {copiedField === 'deviceId' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="license-device-row">
                  <span>Device Public Key</span>
                  <div className="license-device-value">
                    <strong className="license-public-key">{deviceIdentity.publicKey || 'Unavailable'}</strong>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => copyValue('publicKey', deviceIdentity.publicKey)}
                      disabled={!deviceIdentity.publicKey}
                    >
                      <Copy size={14} /> {copiedField === 'publicKey' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="license-device-row">
                <span>Device identity</span>
                <strong>Available in Android app</strong>
              </div>
            )}
          </div>
        </section>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-primary btn-block" type="submit" disabled={isActivating}>
          <KeyRound size={16} /> {isActivating ? 'Activating...' : 'Activate License'}
        </button>
      </form>
    </PageLayout>
  );
}

/**
 * pages/Bills/BillsPage.jsx
 * Bill history and detail view.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Printer, Receipt, Search, X } from 'lucide-react';
import PageLayout from '../../components/Layout/PageLayout';
import { BillsDB } from '../../db/queries/bills';
import { useSettings } from '../../context/SettingsContext';

function money(value, currency) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function BillsPage() {
  const { settings } = useSettings();
  const currency = settings.currency_symbol || '₹';
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBills() {
      try { setBills(await BillsDB.getAll()); }
      catch (err) { setError(err.message ?? 'Could not load bills.'); }
      finally { setIsLoading(false); }
    }
    loadBills();
  }, []);

  async function openBill(bill) {
    setSelectedBill(bill);
    setSelectedItems([]);
    setIsDetailLoading(true);
    setError('');
    try { setSelectedItems(await BillsDB.getItemsForBill(bill.id)); }
    catch (err) { setError(err.message ?? 'Could not load bill items.'); }
    finally { setIsDetailLoading(false); }
  }

  function closeBill() {
    setSelectedBill(null);
    setSelectedItems([]);
  }

  const visibleBills = bills.filter((bill) => {
    const term = searchTerm.trim().toLowerCase();
    return !term || `${bill.bill_number} ${bill.customer_name || ''} ${bill.payment_mode}`.toLowerCase().includes(term);
  });

  return (
    <PageLayout title="Bills" subtitle="Previous bills and receipts">
      <div className="bills-page">
        <div className="product-search bills-search">
          <Search size={18} aria-hidden="true" />
          <input className="form-input" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search bill number or payment" aria-label="Search bills" />
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        {isLoading ? <div className="empty-state"><div className="spinner" /></div> : visibleBills.length === 0 ? (
          <div className="empty-state"><Receipt size={42} className="empty-state-icon" /><div className="empty-state-title">{searchTerm ? 'No matching bills' : 'No bills yet'}</div><div className="empty-state-desc">Completed bills will appear here.</div></div>
        ) : (
          <div className="bills-list">
            {visibleBills.map((bill) => <button className="bill-row" key={bill.id} onClick={() => openBill(bill)}>
              <span className="bill-row-icon"><Receipt size={19} /></span>
              <span className="bill-row-main"><strong>{bill.bill_number}</strong><small>{formatDate(bill.created_at)}{bill.customer_name ? ` · ${bill.customer_name}` : ''}</small></span>
              <span className="bill-row-side"><strong>{money(bill.grand_total, currency)}</strong><small>{bill.payment_mode === 'upi' ? 'UPI' : 'Cash'}</small></span>
              <Eye size={17} className="bill-row-view" aria-hidden="true" />
            </button>)}
          </div>
        )}
      </div>
      {selectedBill && createPortal(<div className="modal-backdrop bill-detail-backdrop" role="presentation" onMouseDown={closeBill}>
        <section className="modal-sheet bill-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="bill-detail-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="modal-header"><div><h2 id="bill-detail-title">{selectedBill.bill_number}</h2><div className="bill-detail-date">{formatDate(selectedBill.created_at)}</div></div><button className="btn btn-ghost btn-icon" onClick={closeBill} aria-label="Close bill details"><X size={18} /></button></div>
          <div className="modal-body bill-detail-body">
            {isDetailLoading ? <div className="empty-state"><div className="spinner" /></div> : <>
              <div className="bill-detail-items">{selectedItems.map((item) => <div className="bill-detail-item" key={item.id}><div><strong>{item.product_name}</strong><small>{item.qty} × {money(item.unit_price, currency)}{item.tax_rate ? ` · ${item.tax_rate}% tax` : ''}</small></div><strong>{money(item.line_total, currency)}</strong></div>)}</div>
              <div className="bill-detail-summary"><div><span>Subtotal</span><strong>{money(selectedBill.subtotal, currency)}</strong></div><div><span>Discount</span><strong>{money(selectedBill.discount, currency)}</strong></div><div className="bill-detail-total"><span>Total</span><strong>{money(selectedBill.grand_total, currency)}</strong></div></div>
              <div className="bill-payment-detail"><span>Payment method</span><strong>{selectedBill.payment_mode === 'upi' ? 'UPI' : 'Cash'}</strong></div>
            </>}
          </div>
          <div className="modal-footer bill-detail-footer"><button className="btn btn-secondary btn-block" onClick={() => window.print()} disabled={isDetailLoading}><Printer size={16} /> Reprint</button><button className="btn btn-primary btn-block" onClick={closeBill}>Done</button></div>
        </section>
      </div>, document.body)}
    </PageLayout>
  );
}

/**
 * pages/Billing/BillingPage.jsx
 * Quick billing screen for creating paid bills offline.
 */
import { useEffect, useState } from 'react';
import { Minus, Plus, Search, ShoppingCart, Trash2, Wallet, X } from 'lucide-react';
import PageLayout from '../../components/Layout/PageLayout';
import { ProductsDB } from '../../db/queries/products';
import { BillsDB } from '../../db/queries/bills';
import { useSettings } from '../../context/SettingsContext';

const EMPTY_CART = [];

function money(value, currency) {
  return `${currency}${Number(value).toFixed(2)}`;
}

export default function BillingPage() {
  const { settings } = useSettings();
  const currency = settings.currency_symbol || '₹';
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(EMPTY_CART);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function loadProducts(term = '') {
    setIsLoading(true);
    try {
      setProducts(term.trim() ? await ProductsDB.search(term.trim()) : await ProductsDB.getAll());
    } catch (err) {
      setMessage({ type: 'error', text: err.message ?? 'Could not load products.' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(searchTerm), 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  function addToCart(product) {
    setMessage({ type: '', text: '' });
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        return current.map((item) => item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...current, {
        product_id: product.id,
        product_name: product.name,
        qty: 1,
        unit_price: Number(product.price) || 0,
        tax_rate: Number(product.tax_rate) || 0,
        unit: product.unit || 'pcs',
      }];
    });
  }

  function changeQuantity(productId, amount) {
    setCart((current) => current
      .map((item) => item.product_id === productId ? { ...item, qty: item.qty + amount } : item)
      .filter((item) => item.qty > 0));
  }

  function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item.product_id !== productId));
  }

  const subtotal = cart.reduce((total, item) => total + item.qty * item.unit_price, 0);
  const taxTotal = cart.reduce((total, item) => total + item.qty * item.unit_price * item.tax_rate / 100, 0);
  const discountAmount = Math.min(Math.max(Number(discount) || 0, 0), subtotal + taxTotal);
  const grandTotal = Math.max(0, subtotal + taxTotal - discountAmount);

  async function saveBill() {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one product before saving.' });
      return;
    }
    const enteredDiscount = Number(discount || 0);
    if (!Number.isFinite(enteredDiscount) || enteredDiscount < 0) {
      setMessage({ type: 'error', text: 'Discount must be a valid non-negative amount.' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const billNumber = await BillsDB.getNextBillNumber();
      const items = cart.map((item) => {
        const lineSubtotal = item.qty * item.unit_price;
        const taxAmount = lineSubtotal * item.tax_rate / 100;
        return { ...item, tax_amount: taxAmount, line_total: lineSubtotal + taxAmount };
      });
      await BillsDB.create({
        bill_number: billNumber,
        customer_id: null,
        customer_name: null,
        subtotal,
        tax_total: taxTotal,
        discount: discountAmount,
        grand_total: grandTotal,
        payment_mode: paymentMode,
      }, items);
      setCart([]);
      setDiscount('');
      setMessage({ type: 'success', text: `${billNumber} saved successfully.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message ?? 'Could not save the bill.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageLayout title="New Bill" subtitle="Fast checkout, fully offline">
      <div className="billing-layout">
        <section className="billing-products" aria-labelledby="billing-products-title">
          <div className="billing-section-heading">
            <div><h2 id="billing-products-title">Products</h2><span>{products.length} available</span></div>
            <ShoppingCart size={20} aria-hidden="true" />
          </div>
          <div className="product-search billing-search">
            <Search size={18} aria-hidden="true" />
            <input className="form-input" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name or barcode" aria-label="Search products" autoFocus />
          </div>
          {message.text && <div className={`form-message form-message-${message.type}`} role="status">{message.text}<button className="btn btn-ghost btn-icon" onClick={() => setMessage({ type: '', text: '' })} aria-label="Dismiss message"><X size={15} /></button></div>}
          {isLoading ? <div className="empty-state"><div className="spinner" /></div> : products.length === 0 ? <div className="empty-state"><ShoppingCart size={34} className="empty-state-icon" /><div className="empty-state-title">No products found</div><div className="empty-state-desc">Add products in the catalog to start billing.</div></div> : (
            <div className="billing-product-list">
              {products.map((product) => <button className="billing-product" key={product.id} onClick={() => addToCart(product)}>
                <span className="billing-product-copy"><strong>{product.name}</strong><small>{product.unit} · {product.tax_rate}% tax</small></span>
                <span className="billing-product-price">{money(product.price, currency)}<Plus size={17} aria-hidden="true" /></span>
              </button>)}
            </div>
          )}
        </section>

        <section className="billing-checkout" aria-labelledby="cart-title">
          <div className="billing-section-heading"><div><h2 id="cart-title">Current bill</h2><span>{cart.reduce((sum, item) => sum + item.qty, 0)} items</span></div><Wallet size={20} aria-hidden="true" /></div>
          {cart.length === 0 ? <div className="billing-cart-empty"><ShoppingCart size={28} /><span>Your bill is empty</span><small>Tap a product to add it</small></div> : <div className="billing-cart-list">
            {cart.map((item) => <div className="billing-cart-item" key={item.product_id}>
              <div className="billing-cart-copy"><strong>{item.product_name}</strong><small>{money(item.unit_price, currency)} / {item.unit}</small></div>
              <div className="billing-quantity"><button className="btn btn-ghost btn-icon" onClick={() => changeQuantity(item.product_id, -1)} aria-label={`Decrease ${item.product_name}`}><Minus size={15} /></button><b>{item.qty}</b><button className="btn btn-ghost btn-icon" onClick={() => changeQuantity(item.product_id, 1)} aria-label={`Increase ${item.product_name}`}><Plus size={15} /></button></div>
              <strong className="billing-line-total">{money(item.qty * item.unit_price * (1 + item.tax_rate / 100), currency)}</strong>
              <button className="btn btn-ghost btn-icon billing-remove" onClick={() => removeFromCart(item.product_id)} aria-label={`Remove ${item.product_name}`} title="Remove item"><Trash2 size={16} /></button>
            </div>)}
          </div>}
            <div className="billing-summary">
              <div><span>Subtotal</span><strong>{money(subtotal, currency)}</strong></div>
              <div><label htmlFor="billing-discount">Discount</label><input id="billing-discount" className="form-input billing-discount" type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="0.00" /><strong>{money(discountAmount, currency)}</strong></div>
              <div className="billing-tax"><span>Tax</span><strong>{money(taxTotal, currency)}</strong></div>
              <div className="billing-total"><span>Total</span><strong>{money(grandTotal, currency)}</strong></div>
          </div>
          <div className="billing-payment"><span>Payment mode</span><div className="billing-payment-options"><button className={`billing-payment-option ${paymentMode === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMode('cash')}>Cash</button><button className={`billing-payment-option ${paymentMode === 'upi' ? 'selected' : ''}`} onClick={() => setPaymentMode('upi')}>UPI</button></div></div>
          <button className="btn btn-primary btn-lg btn-block billing-save" onClick={saveBill} disabled={isSaving || cart.length === 0}>{isSaving ? 'Saving...' : `Save bill · ${money(grandTotal, currency)}`}</button>
        </section>
      </div>
    </PageLayout>
  );
}

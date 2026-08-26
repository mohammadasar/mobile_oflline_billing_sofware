import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, MapPin, Pencil, Phone, Plus, Trash2, Users, X } from 'lucide-react';
import PageLayout from '../../components/Layout/PageLayout';
import { CustomersDB } from '../../db/queries/customers';

const EMPTY_CUSTOMER = { name: '', phone: '', address: '', email: '' };

function toFormCustomer(customer) {
  return { name: customer.name ?? '', phone: customer.phone ?? '', address: customer.address ?? '', email: customer.email ?? '' };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [editingId, setEditingId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadCustomers(term = searchTerm) {
    setIsLoading(true);
    setError('');
    try { setCustomers(term.trim() ? await CustomersDB.search(term.trim()) : await CustomersDB.getAll()); }
    catch (err) { setError(err.message ?? 'Could not load customers.'); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { loadCustomers(''); }, []);
  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(searchTerm), 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  function openNewForm() { setEditingId(null); setForm(EMPTY_CUSTOMER); setError(''); setIsFormOpen(true); }
  function openEditForm(customer) { setEditingId(customer.id); setForm(toFormCustomer(customer)); setSelectedCustomer(null); setError(''); setIsFormOpen(true); }
  function closeForm() { if (!isSaving) setIsFormOpen(false); }
  function updateField(event) { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value })); }

  async function saveCustomer(event) {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (!name) { setError('Customer name is required.'); return; }
    if (!phone) { setError('Phone number is required.'); return; }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email address.'); return; }
    setIsSaving(true); setError('');
    try {
      const customer = { name, phone, address: form.address.trim(), email };
      if (editingId === null) await CustomersDB.create(customer);
      else await CustomersDB.update(editingId, customer);
      setIsFormOpen(false); await loadCustomers();
    } catch (err) { setError(err.message ?? 'Could not save customer.'); }
    finally { setIsSaving(false); }
  }

  async function deleteCustomer(customer) {
    if (!window.confirm(`Delete ${customer.name}?`)) return;
    try { await CustomersDB.delete(customer.id); setSelectedCustomer(null); await loadCustomers(); }
    catch (err) { setError(err.message ?? 'Could not delete customer.'); }
  }

  return (
    <PageLayout title="Customers" subtitle="Manage your customer records" headerRight={<button className="btn btn-primary btn-sm" onClick={openNewForm}><Plus size={14} /> Add</button>}>
      <div className="customers-page">
        <div className="product-search customers-search"><Users size={18} aria-hidden="true" /><input className="form-input" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search name or phone" aria-label="Search customers by name or phone" /></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        {isLoading ? <div className="empty-state"><div className="spinner" /></div> : customers.length === 0 ? (
          <div className="empty-state"><Users size={42} className="empty-state-icon" /><div className="empty-state-title">{searchTerm ? 'No matching customers' : 'No customers yet'}</div><div className="empty-state-desc">Add a customer to keep their details available.</div>{!searchTerm && <button className="btn btn-primary" onClick={openNewForm}><Plus size={16} /> Add customer</button>}</div>
        ) : <div className="customer-list">{customers.map((customer) => <article className="customer-row" key={customer.id} onClick={() => setSelectedCustomer(customer)}><button className="customer-row-main" onClick={() => setSelectedCustomer(customer)} aria-label={`View ${customer.name}`}><span className="customer-avatar"><Users size={18} /></span><span className="customer-copy"><strong>{customer.name}</strong><small>{customer.phone}{customer.address ? ` · ${customer.address}` : ''}</small></span></button><div className="customer-row-actions"><button className="btn btn-ghost btn-icon" onClick={(event) => { event.stopPropagation(); openEditForm(customer); }} aria-label={`Edit ${customer.name}`} title="Edit customer"><Pencil size={16} /></button><button className="btn btn-danger btn-icon" onClick={(event) => { event.stopPropagation(); deleteCustomer(customer); }} aria-label={`Delete ${customer.name}`} title="Delete customer"><Trash2 size={16} /></button></div></article>)}</div>}
      </div>

      {selectedCustomer && createPortal(<div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedCustomer(null)}><section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><h2 id="customer-detail-title">Customer details</h2><button className="btn btn-ghost btn-icon" onClick={() => setSelectedCustomer(null)} aria-label="Close"><X size={18} /></button></div><div className="customer-detail"><h3>{selectedCustomer.name}</h3><p><Phone size={16} /> {selectedCustomer.phone}</p>{selectedCustomer.address && <p><MapPin size={16} /> {selectedCustomer.address}</p>}{selectedCustomer.email && <p><Mail size={16} /> {selectedCustomer.email}</p>}</div><div className="modal-footer"><button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>Close</button><button className="btn btn-primary" onClick={() => openEditForm(selectedCustomer)}><Pencil size={16} /> Edit</button></div></section></div>, document.body)}

      {isFormOpen && createPortal(<div className="modal-backdrop" role="presentation" onMouseDown={closeForm}><section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="customer-form-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><h2 id="customer-form-title">{editingId === null ? 'Add customer' : 'Edit customer'}</h2><button className="btn btn-ghost btn-icon" onClick={closeForm} aria-label="Close"><X size={18} /></button></div><form className="customer-form" onSubmit={saveCustomer}><div className="modal-body"><div className="form-group"><label className="form-label" htmlFor="customer-name">Customer Name</label><input id="customer-name" className="form-input" name="name" value={form.name} onChange={updateField} required autoFocus /></div><div className="form-group"><label className="form-label" htmlFor="customer-phone">Phone Number</label><input id="customer-phone" className="form-input" name="phone" type="tel" value={form.phone} onChange={updateField} required /></div><div className="form-group"><label className="form-label" htmlFor="customer-address">Address</label><textarea id="customer-address" className="form-input" name="address" value={form.address} onChange={updateField} rows="3" /></div><div className="form-group"><label className="form-label" htmlFor="customer-email">Email</label><input id="customer-email" className="form-input" name="email" type="email" value={form.email} onChange={updateField} /></div></div><div className="modal-footer"><button className="btn btn-secondary" type="button" onClick={closeForm} disabled={isSaving}>Cancel</button><button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingId === null ? 'Add customer' : 'Save changes'}</button></div></form></section></div>, document.body)}
    </PageLayout>
  );
}

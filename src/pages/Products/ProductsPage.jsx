/**
 * pages/Products/ProductsPage.jsx
 * Product catalog management.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Package, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import PageLayout from '../../components/Layout/PageLayout';
import { ProductsDB } from '../../db/queries/products';

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  price: '',
  tax_rate: '',
  unit: 'pcs',
  barcode: '',
  stock: '',
};

function toFormProduct(product) {
  return {
    name: product.name ?? '',
    description: product.description ?? '',
    price: product.price ?? '',
    tax_rate: product.tax_rate ?? '',
    unit: product.unit ?? 'pcs',
    barcode: product.barcode ?? '',
    stock: product.stock ?? '',
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadProducts(term = searchTerm) {
    setIsLoading(true);
    setError('');
    try {
      const rows = term.trim() ? await ProductsDB.search(term.trim()) : await ProductsDB.getAll();
      setProducts(rows);
    } catch (err) {
      setError(err.message ?? 'Could not load products.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts('');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(searchTerm), 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  function openNewForm() {
    setEditingId(null);
    setForm(EMPTY_PRODUCT);
    setError('');
    setIsFormOpen(true);
  }

  function openEditForm(product) {
    setEditingId(product.id);
    setForm(toFormProduct(product));
    setError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (!isSaving) setIsFormOpen(false);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const taxRate = Number(form.tax_rate || 0);
    const stock = Number(form.stock || 0);

    if (!name) {
      setError('Product name is required.');
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(taxRate) || taxRate < 0 || !Number.isFinite(stock) || stock < 0) {
      setError('Price, tax rate, and stock must be valid non-negative numbers.');
      return;
    }

    const product = {
      ...form,
      name,
      price,
      tax_rate: taxRate,
      stock,
      unit: form.unit.trim() || 'pcs',
      barcode: form.barcode.trim(),
    };

    setIsSaving(true);
    setError('');
    try {
      if (editingId === null) {
        await ProductsDB.create(product);
      } else {
        await ProductsDB.update(editingId, product);
      }
      setIsFormOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err.message ?? 'Could not save product.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setError('');
    try {
      await ProductsDB.delete(product.id);
      await loadProducts();
    } catch (err) {
      setError(err.message ?? 'Could not delete product.');
    }
  }

  return (
    <PageLayout
      title="Products"
      subtitle="Manage your product catalog"
      headerRight={
        <button className="btn btn-primary btn-sm" onClick={openNewForm}>
          <Plus size={14} /> Add
        </button>
      }
    >
      <div className="product-search">
        <Search size={18} aria-hidden="true" />
        <input
          className="form-input"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search name or barcode"
          aria-label="Search products by name or barcode"
        />
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      {isLoading ? (
        <div className="empty-state"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <Package size={42} className="empty-state-icon" />
          <div className="empty-state-title">{searchTerm ? 'No matching products' : 'No products yet'}</div>
          <div className="empty-state-desc">Add your first product to start building the catalog.</div>
          {!searchTerm && <button className="btn btn-primary" onClick={openNewForm}><Plus size={16} /> Add product</button>}
        </div>
      ) : (
        <div className="product-list">
          {products.map((product) => (
            <article className="product-row" key={product.id}>
              <div className="product-row-main">
                <div className="product-row-title">{product.name}</div>
                <div className="product-row-meta">
                  {product.barcode || 'No barcode'} · {product.unit} · {product.tax_rate}% tax
                </div>
              </div>
              <div className="product-row-stock">{product.stock} in stock</div>
              <div className="product-row-price">{Number(product.price).toFixed(2)}</div>
              <div className="product-row-actions">
                <button className="btn btn-ghost btn-icon" onClick={() => openEditForm(product)} aria-label={`Edit ${product.name}`} title="Edit product">
                  <Pencil size={16} />
                </button>
                <button className="btn btn-danger btn-icon" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`} title="Delete product">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isFormOpen && createPortal(
        <div className="modal-backdrop" role="presentation" onMouseDown={closeForm}>
          <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="product-form-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 id="product-form-title">{editingId === null ? 'Add product' : 'Edit product'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeForm} aria-label="Close"><X size={18} /></button>
            </div>
            <form className="product-form" onSubmit={saveProduct}>
              <div className="modal-body">
                <div className="form-group">
                <label className="form-label" htmlFor="product-name">Name</label>
                <input id="product-name" className="form-input" name="name" value={form.name} onChange={updateField} required autoFocus />
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label" htmlFor="product-price">Price</label><input id="product-price" className="form-input" name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} required /></div>
                <div className="form-group"><label className="form-label" htmlFor="product-stock">Stock</label><input id="product-stock" className="form-input" name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateField} required /></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label" htmlFor="product-tax">Tax rate (%)</label><input id="product-tax" className="form-input" name="tax_rate" type="number" min="0" step="0.01" value={form.tax_rate} onChange={updateField} /></div>
                <div className="form-group"><label className="form-label" htmlFor="product-unit">Unit</label><input id="product-unit" className="form-input" name="unit" value={form.unit} onChange={updateField} required /></div>
              </div>
              <div className="form-group"><label className="form-label" htmlFor="product-barcode">Barcode</label><input id="product-barcode" className="form-input" name="barcode" value={form.barcode} onChange={updateField} /></div>
              <div className="form-group"><label className="form-label" htmlFor="product-description">Description</label><textarea id="product-description" className="form-input" name="description" value={form.description} onChange={updateField} rows="2" /></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={closeForm} disabled={isSaving}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingId === null ? 'Add product' : 'Save changes'}</button>
              </div>
            </form>
          </section>
        </div>,
        document.body
      )}
    </PageLayout>
  );
}

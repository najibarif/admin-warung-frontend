import { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { API_URL } from '../api';
import { Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Products() {
  const { token } = useStore();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter') || 'all';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>(filterParam);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category_id: '',
    price: '',
    stock: '',
    description: '',
    is_promo: false,
    promo_price: '',
    expired_at: '',
    expiration_discount: 20
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFilterType(filterParam);
  }, [filterParam]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          per_page: 100, // Load all for local search/filter
          category_id: selectedCategory === 'all' ? undefined : selectedCategory,
          filter: filterType === 'all' ? undefined : filterType
        }
      });
      const data = response.data?.data || response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      // TODO: show toast notification
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data?.data || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      // TODO: show toast notification
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchCategories();
    }
  }, [token, selectedCategory, filterType]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      barcode: '',
      category_id: categories[0]?.id || '',
      price: '',
      stock: '',
      description: '',
      is_promo: false,
      promo_price: '',
      expired_at: '',
      expiration_discount: 20
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      barcode: product.barcode || '',
      category_id: product.category_id || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      description: product.description || '',
      is_promo: !!product.is_promo,
      promo_price: product.promo_price?.toString() || '',
      expired_at: product.expired_at ? product.expired_at.slice(0, 10) : '',
      expiration_discount: product.expiration_discount || 20
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      alert('Gagal menghapus produk.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload: any = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      expiration_discount: formData.expiration_discount
    };

    if (formData.is_promo && formData.promo_price) {
      payload.promo_price = parseFloat(formData.promo_price);
    } else {
      payload.promo_price = null;
    }

    if (!formData.expired_at) {
      payload.expired_at = null;
    }

    try {
      if (modalMode === 'add') {
        await axios.post(`${API_URL}/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.put(`${API_URL}/products/${selectedProduct.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan produk. Periksa kembali form Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  // Local client side search filter
  const filteredProducts = products.filter(p => {
    const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    return searchMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Produk</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola daftar produk, kategori, harga, dan stok barang.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Produk
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card p-4 space-y-4 border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Semua Produk' },
              { id: 'low_stock', label: 'Stok Menipis' },
              { id: 'out_of_stock', label: 'Stok Habis' },
              { id: 'almost_expired', label: 'Hampir Expired' },
              { id: 'expired', label: 'Sudah Expired' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterType === tab.id 
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama produk atau barcode..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-11 bg-slate-50 border-slate-200 focus:bg-white text-sm"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="card p-0 overflow-hidden border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Produk</th>
                <th className="px-6 py-4 font-bold tracking-wider">Kategori</th>
                <th className="px-6 py-4 font-bold tracking-wider">Harga</th>
                <th className="px-6 py-4 font-bold tracking-wider">Stok</th>
                <th className="px-6 py-4 font-bold tracking-wider">Masa Kadaluwarsa</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium">Memuat data produk...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium">Tidak ada produk ditemukan.</td></tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLow = product.stock <= 10 && product.stock > 0;
                  const isOut = product.stock <= 0;
                  
                  // Calculate expired state
                  let expiredLabel = '-';
                  let expiredBadgeClass = 'text-slate-500';
                  if (product.expired_at) {
                    const expiryDate = new Date(product.expired_at);
                    expiredLabel = expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    
                    const timeDiff = expiryDate.getTime() - new Date().getTime();
                    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    
                    if (daysLeft < 0) {
                      expiredBadgeClass = 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg';
                      expiredLabel += ' (Kadaluwarsa)';
                    } else if (daysLeft <= 30) {
                      expiredBadgeClass = 'text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-lg';
                      expiredLabel += ` (${daysLeft} hari lagi)`;
                    }
                  }

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center shrink-0 text-xl">
                            📦
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{product.name}</div>
                            <div className="text-xs text-slate-400 font-semibold mt-0.5">{product.barcode || 'Barkode Kosong'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">
                        {product.category?.name || 'Lainnya'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {product.is_promo && product.promo_price ? (
                          <div className="flex flex-col">
                            <span className="text-emerald-600 font-extrabold">Rp {product.promo_price.toLocaleString('id-ID')}</span>
                            <span className="text-xs text-slate-400 line-through font-semibold">Rp {product.price.toLocaleString('id-ID')}</span>
                          </div>
                        ) : (
                          <span>Rp {product.price.toLocaleString('id-ID')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          isOut 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : isLow 
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {product.stock} unit {isOut ? 'Habis' : isLow ? 'Menipis' : 'Tersedia'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className={expiredBadgeClass}>{expiredLabel}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleOpenEditModal(product)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100/50 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-950">
                {modalMode === 'add' ? 'Tambah Produk Baru' : 'Edit Detail Produk'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-3.5 rounded-xl text-xs font-semibold border border-rose-100 flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Nama Produk</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field text-sm"
                    placeholder="Contoh: Beras Pandan Wangi 5 Kg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Barkode (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="input-field text-sm"
                    placeholder="BC001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Kategori</label>
                  <select 
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                  >
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Harga Jual (Rp)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="input-field text-sm"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Stok Barang</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="input-field text-sm"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Masa Kadaluwarsa (Optional)</label>
                <input 
                  type="date" 
                  value={formData.expired_at}
                  onChange={(e) => setFormData({...formData, expired_at: e.target.value})}
                  className="input-field text-sm"
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="is_promo"
                    checked={formData.is_promo}
                    onChange={(e) => setFormData({...formData, is_promo: e.target.checked})}
                    className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_promo" className="text-xs font-bold text-slate-700 select-none cursor-pointer">Pasang Harga Promo?</label>
                </div>

                {formData.is_promo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pl-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Harga Promo (Rp)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.promo_price}
                        onChange={(e) => setFormData({...formData, promo_price: e.target.value})}
                        className="input-field text-sm"
                        placeholder="13000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Diskon Kadaluwarsa (%)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={formData.expiration_discount}
                        onChange={(e) => setFormData({...formData, expiration_discount: parseInt(e.target.value) || 20})}
                        className="input-field text-sm"
                        placeholder="20"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Deskripsi Produk</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm h-24 resize-none"
                  placeholder="Keterangan lengkap produk..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn-primary flex items-center justify-center min-w-[120px]"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { API_URL } from '../api';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, QrCode, CheckCircle, X, Printer } from 'lucide-react';

interface CartItem {
  product: any;
  quantity: number;
}

const getProductPrice = (product: any) => {
  return product.is_promo && product.promo_price ? product.promo_price : product.price;
};

export default function POS() {
  const { token } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'transfer' | 'qris'>('tunai');
  const [amountPaid, setAmountPaid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Success Receipt Modal
  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data?.data || response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      // TODO: show toast notification
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
  }, [token]);

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      alert('Stok produk habis!');
      return;
    }

    setCart(prev => {
      const exists = prev.find(item => item.product.id === product.id);
      if (exists) {
        if (exists.quantity >= product.stock) {
          alert('Batas stok tercapai!');
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const nextQty = item.quantity + delta;
        if (nextQty > item.product.stock) {
          alert('Batas stok tercapai!');
          return item;
        }
        return { ...item, quantity: nextQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + getProductPrice(item.product) * item.quantity, 0);

  const handleCheckoutOpen = () => {
    setAmountPaid(total.toString());
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setSubmitting(true);

    const paidNum = parseFloat(amountPaid);
    if (isNaN(paidNum) || paidNum < total) {
      setCheckoutError('Uang yang dibayar kurang dari total belanja!');
      setSubmitting(false);
      return;
    }

    const payload = {
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      })),
      amount_paid: paidNum,
    };

    try {
      const response = await axios.post(`${API_URL}/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const order = response.data?.data || response.data;
      
      setReceiptData(order);
      setCart([]);
      setIsCheckoutOpen(false);
      fetchProducts(); // Refresh stock counts
    } catch (err: any) {
      setCheckoutError(err.response?.data?.message || 'Gagal memproses transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const categoryMatch = selectedCategory === 'all' || p.category_id === Number(selectedCategory);
    return searchMatch && categoryMatch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] overflow-hidden">
      {/* Left side: Product catalog selection */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-hidden h-full">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama produk atau ketik barcode..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-11 bg-slate-50 border-slate-200 focus:bg-white text-sm"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium">Tidak ada produk ditemukan.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const price = getProductPrice(product);
                const isOutOfStock = product.stock <= 0;
                return (
                  <div 
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md cursor-pointer transition-all duration-200 select-none ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'bg-slate-50/30'
                    }`}
                  >
                    <div>
                      <div className="w-full aspect-square rounded-xl bg-slate-100/70 border border-slate-200/50 flex items-center justify-center text-3xl mb-3">
                        📦
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2">{product.name}</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Stok: {product.stock}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">Rp {price.toLocaleString('id-ID')}</span>
                      {product.is_promo && (
                        <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 font-bold px-1.5 py-0.5 rounded">PROMO</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: POS Cart Drawer */}
      <div className="w-full lg:w-96 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary-600" />
          <h3 className="font-bold text-slate-950">Keranjang Kasir</h3>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <ShoppingCart className="w-12 h-12 text-slate-200 mb-2" />
              <p className="font-medium text-sm">Keranjang kasir masih kosong.</p>
              <p className="text-xs mt-1">Pilih produk dari katalog di sebelah kiri untuk memulai.</p>
            </div>
          ) : (
            cart.map(item => {
              const price = getProductPrice(item.product);
              return (
                <div key={item.product.id} className="flex gap-3 border-b border-slate-50 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-lg">
                    📦
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-950 text-sm truncate">{item.product.name}</h5>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Rp {price.toLocaleString('id-ID')}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg px-1 py-0.5 bg-slate-50">
                        <button 
                          onClick={() => updateQty(item.product.id, -1)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold px-3 text-slate-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateQty(item.product.id, 1)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-extrabold text-sm text-slate-900 shrink-0 self-center">
                    Rp {(price * item.quantity).toLocaleString('id-ID')}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Cart Total Panel */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-semibold text-sm">Total Tagihan:</span>
            <span className="text-2xl font-black text-slate-950">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <button
            onClick={handleCheckoutOpen}
            disabled={cart.length === 0}
            className="w-full btn-primary h-12 flex items-center justify-center gap-2"
          >
            Proses Transaksi
          </button>
        </div>
      </div>

      {/* Checkout Dialog */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100/50">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-950">Konfirmasi Pembayaran</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="pt-4 space-y-4">
              {checkoutError && (
                <div className="bg-rose-50 text-rose-700 p-3.5 rounded-xl text-xs font-semibold border border-rose-100">
                  {checkoutError}
                </div>
              )}

              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase mb-2">Pilih Metode Pembayaran</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'tunai', label: 'Cash / Tunai', icon: DollarSign },
                    { id: 'transfer', label: 'Transfer', icon: CreditCard },
                    { id: 'qris', label: 'QRIS Scan', icon: QrCode }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all gap-1.5 select-none ${
                        paymentMethod === method.id 
                          ? 'border-primary-600 bg-primary-50/20 text-primary-700'
                          : 'border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <method.icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Uang Diterima (Rp)</label>
                <input 
                  type="number"
                  required
                  min={total}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="input-field text-xl font-bold py-3 text-slate-900"
                />
              </div>

              {parseFloat(amountPaid) >= total && (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-emerald-700">Uang Kembalian:</span>
                  <span className="text-lg font-black">
                    Rp {(parseFloat(amountPaid) - total).toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 btn-primary h-10 flex items-center justify-center"
                >
                  {submitting ? 'Memproses...' : 'Proses Bayar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100/50 flex flex-col">
            <div className="text-center pb-4 mb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-3 border border-emerald-100">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Transaksi Sukses!</h3>
              <p className="text-xs text-slate-400 mt-1">Invoice #{receiptData.order_number}</p>
            </div>

            {/* Simulated Printed Receipt */}
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 font-mono text-xs text-slate-700 space-y-3">
              <div className="text-center font-bold uppercase tracking-wider text-slate-900">WARUNG BERKAH</div>
              <div className="text-center text-[10px] text-slate-400">Jl. Berkah Raya No. 7, Jakarta</div>
              <div className="border-b border-dashed border-slate-300 pb-2">
                <div>No: #{receiptData.order_number}</div>
                <div>Tgl: {new Date(receiptData.created_at).toLocaleString('id-ID')}</div>
              </div>
              
              <div className="space-y-1.5">
                {(receiptData.items || receiptData.order_items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.product?.name || 'Produk'}</span>
                    <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total:</span>
                  <span>Rp {receiptData.total_amount?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar:</span>
                  <span>Rp {receiptData.amount_paid?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Kembali:</span>
                  <span>Rp {receiptData.change_amount?.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-3 uppercase border-t border-dashed border-slate-300">
                Terima Kasih Atas Kunjungan Anda!
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button 
                onClick={() => window.print()}
                className="flex-1 border border-slate-200 py-2.5 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button 
                onClick={() => setReceiptData(null)}
                className="flex-1 btn-primary py-2.5 text-sm font-bold rounded-xl flex items-center justify-center"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

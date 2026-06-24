import { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { API_URL } from '../api';
import { Search, Receipt, X, FileText } from 'lucide-react';

export default function Transactions() {
  const { token } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data?.data || response.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      // TODO: show toast notification
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Search filter
  const filteredOrders = orders.filter(order => {
    const orderNo = order.order_number || '';
    const nameMatch = order.cashier?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      order.cashier?.toLowerCase().includes(searchQuery.toLowerCase());
    return orderNo.toLowerCase().includes(searchQuery.toLowerCase()) || nameMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Riwayat Transaksi</h2>
        <p className="text-sm text-slate-500 mt-1">Lihat dan lacak semua transaksi penjualan yang telah diproses.</p>
      </div>

      {/* Search Input */}
      <div className="card p-4 border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nomor pesanan atau nama kasir..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-11 bg-slate-50 border-slate-200 focus:bg-white text-sm"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card p-0 overflow-hidden border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">No. Pesanan</th>
                <th className="px-6 py-4 font-bold tracking-wider">Tanggal & Waktu</th>
                <th className="px-6 py-4 font-bold tracking-wider">Kasir</th>
                <th className="px-6 py-4 font-bold tracking-wider">Metode Bayar</th>
                <th className="px-6 py-4 font-bold tracking-wider">Total Belanja</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium">Memuat riwayat transaksi...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium">Tidak ada transaksi tercatat.</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      #{order.order_number || order.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">
                      {order.cashier?.name || order.cashier || 'Admin'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold uppercase text-slate-500">
                        {order.payment_method || 'Tunai'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="btn-primary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto bg-slate-100 text-slate-700 hover:bg-slate-200 border-none shadow-none"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100/50 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-slate-950">Detail Transaksi</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Meta information */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>No. Pesanan:</span>
                  <span className="font-bold text-slate-900">#{selectedOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Transaksi:</span>
                  <span className="font-bold text-slate-900">{formatDate(selectedOrder.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Petugas Kasir:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.cashier?.name || selectedOrder.cashier || 'Admin'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode Pembayaran:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedOrder.payment_method || 'Tunai'}</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Daftar Item Belanja</h4>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 divide-y divide-slate-100">
                  {(selectedOrder.items || selectedOrder.order_items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 first:pt-0 last:pb-0">
                      <div className="flex gap-2">
                        <span className="font-bold text-slate-400 shrink-0">{item.quantity}x</span>
                        <span className="font-bold text-slate-800 text-sm">{item.product?.name || item.name || 'Produk Dihapus'}</span>
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2 text-sm">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Subtotal:</span>
                  <span>Rp {selectedOrder.total_amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Jumlah Dibayar:</span>
                  <span>Rp {selectedOrder.amount_paid?.toLocaleString('id-ID') || selectedOrder.total_amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Kembalian:</span>
                  <span>Rp {selectedOrder.change_amount?.toLocaleString('id-ID') || '0'}</span>
                </div>
                <div className="border-t border-slate-200/50 pt-2 flex justify-between font-black text-slate-900 text-lg">
                  <span>Total Akhir:</span>
                  <span className="text-primary-600">Rp {selectedOrder.total_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="w-full btn-primary h-11 flex items-center justify-center"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

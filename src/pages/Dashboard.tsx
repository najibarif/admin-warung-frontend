import { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { API_URL } from '../api';
import { Package, AlertTriangle, XOctagon, ShoppingBag, Hourglass, CalendarX, TrendingUp, DollarSign } from 'lucide-react';

const formatPrice = (value: number) => {
  return 'Rp ' + (value || 0).toLocaleString('id-ID');
};

export default function Dashboard() {
  const { token, user } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data?.data || response.data);
      } catch (err) {
        // TODO: show toast notification
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  const cards = [
    { name: 'Total Produk', value: stats?.total_products || 0, icon: Package, color: 'text-sky-600', bg: 'bg-sky-50' },
    { name: 'Transaksi Hari Ini', value: stats?.transactions_today || 0, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Stok Menipis', value: stats?.low_stock_products || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Stok Habis', value: stats?.out_of_stock_products || 0, icon: XOctagon, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'Hampir Kadaluwarsa', value: stats?.almost_expired_products || 0, icon: Hourglass, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Sudah Kadaluwarsa', value: stats?.expired_products || 0, icon: CalendarX, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  // Calculate max sales value for chart scaling
  const salesData = stats?.weekly_sales || [];
  const maxSale = Math.max(...salesData.map((d: { total: number }) => d.total), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Admin</h2>
          <p className="text-sm text-slate-500 mt-1">Halo {user?.name}, berikut adalah ringkasan performa toko hari ini.</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-800 px-4 py-2.5 rounded-xl border border-emerald-100 shadow-sm">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Omzet Hari Ini</p>
            <p className="text-lg font-bold">{formatPrice(stats?.sales_today)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-28 bg-slate-100/50"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.name} className="card flex items-center p-6 gap-4 hover:shadow-md transition-shadow duration-200 border-slate-100">
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color}`}>
                <card.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900">{card.value}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{card.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Sales Chart */}
        <div className="card lg:col-span-2 border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Grafik Penjualan (7 Hari Terakhir)</h3>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span>Tren</span>
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading chart...</div>
          ) : salesData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Belum ada data penjualan</div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-64 pt-6 px-4">
              {salesData.map((day: { total: number; date: string }, i: number) => {
                const heightPercent = (day.total / maxSale) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-xs py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                      {formatPrice(day.total)}
                    </div>
                    {/* Bar */}
                    <div 
                      style={{ height: `${Math.max(heightPercent, 4)}%` }} 
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${
                        heightPercent > 50 
                          ? 'bg-gradient-to-t from-primary-600 to-primary-400' 
                          : 'bg-gradient-to-t from-slate-400 to-slate-300'
                      }`}
                    ></div>
                    {/* Date label */}
                    <span className="text-xs font-semibold text-slate-500 mt-3">{day.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Guide */}
        <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold pb-4 mb-4 border-b border-white/20">Panduan Operasional</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-start gap-3">
                <span className="text-base mt-0.5">🛒</span>
                <span><strong>Kasir POS:</strong> Gunakan menu kasir untuk melayani pembayaran langsung pembeli.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-base mt-0.5">📦</span>
                <span><strong>Manajemen Produk:</strong> Tambah produk baru atau edit stok/harga promo.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-base mt-0.5">📉</span>
                <span><strong>Expired Alert:</strong> Pantau produk kadaluwarsa demi menjaga kualitas dagangan.</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 text-xs opacity-75">
            Toko Nabil System v1.1 • Premium Dashboard
          </div>
        </div>
      </div>
    </div>
  );
}

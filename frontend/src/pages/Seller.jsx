import React, { useState, useEffect, useMemo } from 'react';
import { 
  PackagePlus, Box, Boxes, Coins, AlertOctagon, 
  Search, Edit, Trash2, X, Info 
} from 'lucide-react';

const MOCK_PRODUCTS = [
  { id: 1, name: "Игровая клавиатура CyberKey", description: "Механическая клавиатура с RGB-подсветкой и переключателями Red Switch.", price: 4990.00, quantity: 15 },
  { id: 2, name: "Беспроводная мышь AirGlide", description: "Легкая игровая мышь с сенсором 16000 DPI и временем автономной работы до 80 часов.", price: 3450.00, quantity: 4 },
  { id: 3, name: "Игровые наушники VoidSound Pro", description: "Гарнитура с объемным звуком 7.1 и микрофоном с шумоподавлением.", price: 6200.00, quantity: 0 },
  { id: 4, name: "Коврик для мыши NeonMap XL", description: "Огромный игровой коврик с влагозащитным покрытием и неоновым принтом.", price: 1200.00, quantity: 45 }
];

const Seller = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [isMocked, setIsMocked] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    seller_id: '1'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/products');
      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();
      setProducts(data);
      setIsMocked(false);
    } catch (err) {
      setProducts(MOCK_PRODUCTS);
      setIsMocked(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const stats = useMemo(() => {
    const totalItems = products.length;
    const totalQty = products.reduce((sum, p) => sum + (p.quantity || p.Quantity || 0), 0);
    const totalSum = products.reduce((sum, p) => sum + (p.price || p.Price || 0), 0);
    const avgPrice = totalItems > 0 ? (totalSum / totalItems).toFixed(0) : 0;
    const lowStockCount = products.filter(p => {
      const qty = p.quantity !== undefined ? p.quantity : p.Quantity;
      return qty > 0 && qty < 5;
    }).length;
    return { totalItems, totalQty, avgPrice, lowStockCount };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const name = (product.name || product.Name || '').toLowerCase();
      const desc = (product.description || product.Description || '').toLowerCase();
      const qty = product.quantity !== undefined ? product.quantity : product.Quantity;
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'in') matchesStatus = qty >= 5;
      else if (statusFilter === 'low') matchesStatus = qty > 0 && qty < 5;
      else if (statusFilter === 'out') matchesStatus = qty === 0;
      
      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setNotification(null);
    
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      seller_id: parseInt(formData.seller_id)
    };

    try {
      const response = await fetch('http://localhost:8080/api/seller-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setNotification({ type: 'success', text: 'Товар успешно добавлен!' });
        setFormData({ name: '', description: '', price: '', quantity: '', seller_id: '1' });
        await fetchProducts();
        setTimeout(() => { setIsModalOpen(false); setNotification(null); }, 1500);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      setNotification({ type: 'error', text: 'Ошибка: Не удалось связаться с сервером.' });
    } finally {
      setFormLoading(false);
    }
  };

  const getStockBadge = (qty) => {
    if (qty === 0) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (qty < 5) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 antialiased p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-6 border-b border-gray-800/80">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
                Панель Продавца
              </h1>
              {isMocked && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    Plus
                </span>
              )}
            </div>
            <p className="text-slate-400 mt-1 font-light">Управление складом и мониторинг позиций.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
          >
            <PackagePlus className="w-5 h-5" />
            Добавить товар
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Товаров', val: stats.totalItems, icon: Box, color: 'emerald' },
            { label: 'Всего шт.', val: stats.totalQty, icon: Boxes, color: 'teal' },
            { label: 'Ср. цена', val: `${stats.avgPrice} ₸`, icon: Coins, color: 'indigo' },
            { label: 'Мало', val: stats.lowStockCount, icon: AlertOctagon, color: 'amber' }
          ].map((s, i) => (
            <div key={i} className="bg-gray-900/40 backdrop-blur-md border border-gray-800 p-5 rounded-3xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{s.label}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{loading ? '...' : s.val}</h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-${s.color}-500/10 border border-${s.color}-500/20 flex items-center justify-center text-${s.color}-400`}>
                <s.icon className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-3xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Поиск по названию..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-slate-950/60 border border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-gray-800">
            {['all', 'in', 'low', 'out'].map(f => (
              <button 
                key={f} 
                onClick={() => setStatusFilter(f)} 
                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-200'}`}
              >
                {f === 'all' ? 'Все' : f === 'in' ? 'Есть' : f === 'low' ? 'Мало' : 'Нет'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/40">
                  <th className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Артикул</th>
                  <th className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Товар</th>
                  <th className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Цена</th>
                  <th className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-center">Склад</th>
                  <th className="py-5 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  <tr><td colSpan="5" className="p-20 text-center text-slate-500 animate-pulse font-light italic">Синхронизация данных...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan="5" className="p-20 text-center text-slate-500 font-light">Товары не найдены</td></tr>
                ) : filteredProducts.map(p => (
                  <tr key={p.id || p.ID} className="hover:bg-emerald-500/[0.02] group transition-colors">
                    <td className="py-6 px-6 text-slate-500 font-mono text-xs">#SKU-{p.id || p.ID}</td>
                    <td className="py-6 px-6">
                      <div className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{p.name || p.Name}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-light italic">{p.description || p.Description}</div>
                    </td>
                    <td className="py-6 px-6 font-black text-emerald-400">{(p.price || p.Price).toLocaleString()} ₸</td>
                    <td className="py-6 px-6 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStockBadge(p.quantity ?? p.Quantity)}`}>
                        {p.quantity ?? p.Quantity} шт
                      </span>
                    </td>
                    <td className="py-6 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                        <button className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
            <div className="bg-[#111827] border border-gray-800 p-8 rounded-[2.5rem] w-full max-w-xl relative shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <PackagePlus className="w-5 h-5" />
                   </div>
                   <h2 className="text-2xl font-bold text-white">Новый товар</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white bg-slate-800/50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
              </div>
              
              {notification && (
                <div className={`p-4 rounded-2xl mb-6 text-sm flex items-center gap-3 border ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                  <Info className="w-5 h-5 shrink-0" />
                  {notification.text}
                </div>
              )}

              <form onSubmit={handleAddProduct} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Название позиции</label>
                  <input type="text" placeholder="Напр: Игровая мышь..." required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950/60 border border-gray-800 rounded-2xl px-5 py-4 text-slate-200 focus:border-emerald-500 outline-none transition-all" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Описание</label>
                  <textarea placeholder="Краткие характеристики..." rows="3" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950/60 border border-gray-800 rounded-2xl px-5 py-4 text-slate-200 focus:border-emerald-500 outline-none resize-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Цена (₸)</label>
                    <input type="number" placeholder="0" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-950/60 border border-gray-800 rounded-2xl px-5 py-4 text-slate-200 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Кол-во шт.</label>
                    <input type="number" placeholder="0" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-slate-950/60 border border-gray-800 rounded-2xl px-5 py-4 text-slate-200 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                </div>

                <button 
                  disabled={formLoading} 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 active:scale-[0.98] mt-4"
                >
                  {formLoading ? 'Синхронизация...' : 'Опубликовать в магазине'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Seller;
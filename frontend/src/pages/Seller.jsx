import React, { useState, useEffect, useMemo } from 'react';
import {
  PackagePlus, Box, Boxes, Coins, AlertOctagon,
  Search, Edit, Trash2, X, Image as ImageIcon, Plus, LogOut
} from 'lucide-react';

const MOCK_PRODUCTS = [
  { id: 1, name: "Демо-товар", description: "Сервер недоступен", price: 0, quantity: 0, image_url: "" },
];

const Seller = () => {
  // ИНИЦИАЛИЗАЦИЯ: берем ID из хранилища. Больше никаких восьмерок по умолчанию!
  const [currentUserId, setCurrentUserId] = useState(() => {
    const saved = localStorage.getItem('userId');
    return (saved && saved !== "undefined" && saved !== "null") ? saved : null;
  });
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // Добавлено: стейт категорий
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    seller_id: '',
    category_id: '' // Добавлено: поле для категории
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/auth';
  };

  // Добавлено: Загрузка категорий из БД
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/categories');
        const data = await response.json();
        setCategories(data || []);
      } catch (err) {
        console.error("Ошибка загрузки категорий:", err);
      }
    };
    fetchCategories();
  }, []);

  // СИНХРОНИЗАЦИЯ: Следим за localStorage
  useEffect(() => {
    const syncId = () => {
      const id = localStorage.getItem('userId');
      if (id && id !== "undefined") setCurrentUserId(id);
    };
    
    window.addEventListener('storage', syncId);
    return () => window.removeEventListener('storage', syncId);
  }, []);

  // ПОЛУЧЕНИЕ ТОВАРОВ (только если есть ID)
  const fetchProducts = async () => {
    if (!currentUserId) {
        console.warn(" fetchProducts отменен: userId отсутствует");
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/products?seller_id=${currentUserId}`);
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      setProducts(data || []);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
    
  };

  useEffect(() => {
    fetchProducts();
  }, [currentUserId]);

  // ВЫЧИСЛЯЕМАЯ СТАТИСТИКА
  const stats = useMemo(() => {
    const totalItems = products.length;
    const totalQty = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const totalSum = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const avgPrice = totalItems > 0 ? (totalSum / totalItems).toFixed(0) : 0;
    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity < 5).length;
    return { totalItems, totalQty, avgPrice, lowStockCount };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const name = (product.name || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      let matchesStatus = true;
      if (statusFilter === 'in') matchesStatus = product.quantity >= 5;
      else if (statusFilter === 'low') matchesStatus = product.quantity > 0 && product.quantity < 5;
      else if (statusFilter === 'out') matchesStatus = product.quantity === 0;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);

  // ЛОГИКА МОДАЛЬНОГО ОКНА
  const openAddModal = () => {
    if (!currentUserId) return alert("Ошибка: ID пользователя не найден. Перезайдите в систему.");
    setFormMode('add');
    setEditingProduct(null);
    setFormData({ 
      name: '', description: '', price: '', quantity: '', 
      seller_id: currentUserId, category_id: '' 
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setNotification(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setFormMode('edit');
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price || ''),
      quantity: String(product.quantity || ''),
      seller_id: String(product.seller_id),
      category_id: String(product.category_id || '')
    });
    setPreviewUrl(product.image_url ? `http://localhost:8080${product.image_url}` : null);
    setSelectedFile(null);
    setNotification(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNotification(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 6. ОТПРАВКА ДАННЫХ
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const fData = new FormData();
    fData.append('name', formData.name);
    fData.append('description', formData.description);
    fData.append('price', formData.price);
    fData.append('quantity', formData.quantity);
    fData.append('seller_id', formData.seller_id); 
    fData.append('category_id', formData.category_id); // Отправка категории
    
    if (selectedFile) {
      fData.append('image', selectedFile);
    } else if (formMode === 'edit') {
      fData.append('old_image_url', editingProduct.image_url || '');
    }

    try {
      const isEdit = formMode === 'edit';
      const url = isEdit 
        ? `http://localhost:8080/api/products/${editingProduct.id}` 
        : 'http://localhost:8080/api/products';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: fData
      });

      if (!response.ok) throw new Error('Ошибка сервера');

      setNotification({ type: 'success', text: isEdit ? 'Обновлено!' : 'Выставлено!' });
      
      setTimeout(() => {
        fetchProducts();
        closeModal();
      }, 1000);
    } catch (err) {
      setNotification({ type: 'error', text: 'Ошибка при сохранении.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Удалить этот товар?')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) fetchProducts();
    } catch (err) {
      alert("Не удалось удалить");
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              Панель Продавца
            </h1>
            <p className="text-slate-400 mt-1 italic text-sm">
              Сеанс: <span className="text-emerald-400 font-mono font-bold px-2 py-0.5 bg-emerald-500/10 rounded">
                {currentUserId ? `ID ${currentUserId}` : "НЕ АВТОРИЗОВАН"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
              <button onClick={handleLogout} className="p-3 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 hover:text-rose-400 transition-all">
                <LogOut size={20} />
              </button>
              <button onClick={openAddModal} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 rounded-xl font-bold shadow-lg">
                <PackagePlus size={20} /> Добавить товар
              </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Мои товары', val: stats.totalItems, icon: Box, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Всего шт.', val: stats.totalQty, icon: Boxes, color: 'text-teal-400', bg: 'bg-teal-500/10' },
            { label: 'Средняя цена', val: `${stats.avgPrice} ₸`, icon: Coins, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Мало на складе', val: stats.lowStockCount, icon: AlertOctagon, color: 'text-amber-400', bg: 'bg-amber-500/10' }
          ].map((s, i) => (
            <div key={i} className="bg-gray-900/40 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{s.label}</p>
                <h3 className="text-2xl font-bold">{loading ? '...' : s.val}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon size={22} />
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              className="w-full bg-slate-950/60 border border-gray-800 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-emerald-500 transition-colors"
              placeholder="Поиск по названию..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-gray-800">
            {['all', 'in', 'low', 'out'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${statusFilter === f ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {f === 'all' ? 'Все' : f === 'in' ? 'В наличии' : f === 'low' ? 'Мало' : 'Нет'}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-950/50 border-b border-gray-800">
              <tr>
                <th className="w-20 p-4 text-[10px] font-bold text-slate-500 uppercase">Фото</th>
        <th className="w-auto p-4 text-[10px] font-bold text-slate-500 uppercase">Наименование</th>
        <th className="w-32 p-4 text-[10px] font-bold text-slate-500 uppercase">Цена</th>
        <th className="w-24 p-4 text-[10px] font-bold text-slate-500 uppercase text-center">Склад</th>
        <th className="w-32 p-4 text-[10px] font-bold text-slate-500 uppercase text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-slate-500 animate-pulse font-medium">Синхронизация...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-slate-500 italic">Товары не найдены</td></tr>
              ) : filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                      {p.image_url ? 
                        <img src={`http://localhost:8080${p.image_url}`} className="w-full h-full object-cover" alt="" /> 
                        : <ImageIcon className="text-gray-600" size={20}/>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-200">{p.name}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{p.description}</div>
                  </td>
                  <td className="p-4 text-emerald-400 font-bold">{Number(p.price).toLocaleString()} ₸</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.quantity === 0 ? 'bg-rose-500/20 text-rose-400' : p.quantity < 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {p.quantity} шт
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(p)} className="p-2 bg-gray-800 rounded-lg hover:text-emerald-400"><Edit size={16}/></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-gray-800 rounded-lg hover:text-rose-400"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-gray-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{formMode === 'edit' ? 'Редактировать' : 'Добавить товар'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-800 rounded-full"><X size={20}/></button>
              </div>

              {notification && (
                <div className={`mb-6 p-4 rounded-xl text-xs font-bold border ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                  {notification.text}
                </div>
              )}

              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                  <label className="w-20 h-20 shrink-0 cursor-pointer bg-gray-900 border-2 border-dashed border-gray-700 hover:border-emerald-500 rounded-2xl flex items-center justify-center overflow-hidden transition-colors">
                    {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="" /> : <Plus className="text-gray-600" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Изображение</p>
                    <p className="text-[10px] text-gray-500 mt-1">ID продавца: <span className="text-emerald-500 font-bold">{formData.seller_id}</span></p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Название</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500"/>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Описание</label>
                  <textarea rows="2" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 resize-none"/>
                </div>

                {/* Поле выбора категории */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Категория</label>
                  <select 
                    required
                    value={formData.category_id} 
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Цена (₸)</label>
                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Количество</label>
                    <input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500"/>
                  </div>
                </div>

                <button disabled={formLoading} className="w-full bg-emerald-500 hover:bg-emerald-600 py-4 rounded-xl font-bold mt-4 shadow-lg text-white uppercase tracking-widest text-xs">
                  {formLoading ? 'Загрузка...' : formMode === 'edit' ? 'Сохранить изменения' : 'Выставить на продажу'}
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
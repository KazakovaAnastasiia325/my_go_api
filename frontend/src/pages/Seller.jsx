import React, { useState, useEffect, useMemo } from 'react';
import {
  PackagePlus, Box, Boxes, Coins, AlertOctagon,
  Search, Edit, Trash2, X, Image as ImageIcon, Plus, LogOut, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hook/useAuth';

const MOCK_PRODUCTS = [];

const Seller = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', quantity: '', seller_id: '', category_id: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const { logout } = useAuth();
  // Новое состояние для красивого уведомления об ошибке доступа
  const [accessError, setAccessError] = useState(null); 

  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsChecking(true); // Начинаем проверку
        const response = await fetch('http://localhost:8080/api/check-role', { credentials: 'include' });
        
        if (response.status === 401) {
          navigate('/auth', { replace: true });
          return;
        }

        if (response.status !== 200) {
          setAccessError("Ошибка доступа к серверу.");
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        
        if (data.role !== 'seller' && data.role !== 'admin') {
          setAccessError("У вас нет прав для доступа к панели продавца.");
          setIsChecking(false);
          return;
        }
        
        setCurrentUserId(data.user_id);
        setIsChecking(false); // Успешно, открываем контент
      } catch (err) {
        setAccessError("Не удалось соединиться с сервером.");
        setIsChecking(false);
      }
    };
    
    checkAccess();
  }, [navigate]);
  

   const handleLogout = async () => {
    try {
        await logout();
    } catch (err) {
        console.error("Ошибка при выходе:", err);
        window.location.href = '/auth';
    }
};

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/categories', { credentials: 'include' });
        const data = await response.json();
        setCategories(data || []);
      } catch (err) { console.error("Ошибка категорий:", err); }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/products?seller_id=${currentUserId}`, { credentials: 'include' });
      const data = await response.json();
      setProducts(data || []);
    } catch (err) { setProducts(MOCK_PRODUCTS); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [currentUserId]);

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

  const openAddModal = () => {
    setFormMode('add');
    setFormData({ name: '', description: '', price: '', quantity: '', seller_id: currentUserId, category_id: '' });
    setPreviewUrl(null); setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setFormMode('edit');
    setEditingProduct(product);
    setFormData({
      name: product.name, description: product.description, price: String(product.price),
      quantity: String(product.quantity), seller_id: String(product.seller_id), category_id: String(product.category_id || '')
    });
    setPreviewUrl(product.image_url ? `http://localhost:8080${product.image_url}` : null);
    setIsModalOpen(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const fData = new FormData();
    Object.entries(formData).forEach(([k, v]) => fData.append(k, v));
    if (selectedFile) fData.append('image', selectedFile);
    
    try {
      const url = formMode === 'edit' ? `http://localhost:8080/api/products/${editingProduct.id}` : 'http://localhost:8080/api/products';
      await fetch(url, { method: formMode === 'edit' ? 'PUT' : 'POST', body: fData, credentials: 'include' });
      setNotification({ type: 'success', text: 'Успешно!' });
      setTimeout(() => { fetchProducts(); setIsModalOpen(false); }, 1000);
    } catch { setNotification({ type: 'error', text: 'Ошибка!' }); }
    finally { setFormLoading(false); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот товар?")) return;
    try {
      await fetch(`http://localhost:8080/api/products/${id}`, { method: 'DELETE', credentials: 'include' });
      setNotification({ type: 'success', text: 'Товар удален' });
      fetchProducts();
    } catch (err) {
      setNotification({ type: 'error', text: 'Ошибка при удалении' });
    }
  };
  if (isChecking) {
    return <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-500">Загрузка...</div>;
  }

  

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-10 font-sans">
      <article className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 pb-6 border-b border-gray-800">
          <hgroup>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">Панель Продавца</h1>
            <p className="text-slate-400 mt-1 italic text-sm">Сеанс: <mark className="text-emerald-400 bg-emerald-500/10 font-mono font-bold px-2 py-0.5 rounded not-italic">{currentUserId ? `ID ${currentUserId}` : "НЕ АВТОРИЗОВАН"}</mark></p>
          </hgroup>
          <nav className="flex items-center gap-3">
            <button onClick={handleLogout} className="p-3 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 hover:text-rose-400"><LogOut size={20} /></button>
            <button onClick={openAddModal} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 rounded-xl font-bold shadow-lg"><PackagePlus size={20} /> Добавить товар</button>
          </nav>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Мои товары', val: stats.totalItems, icon: Box, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Всего шт.', val: stats.totalQty, icon: Boxes, color: 'text-teal-400', bg: 'bg-teal-500/10' },
            { label: 'Средняя цена', val: `${stats.avgPrice} ₸`, icon: Coins, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Мало на складе', val: stats.lowStockCount, icon: AlertOctagon, color: 'text-amber-400', bg: 'bg-amber-500/10' }
          ].map((s, i) => (
            <section key={i} className="bg-gray-900/40 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
              <hgroup>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{s.label}</p>
                <h3 className="text-2xl font-bold">{loading ? '...' : s.val}</h3>
              </hgroup>
              <figure className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}><s.icon size={22} /></figure>
            </section>
          ))}
        </section>

        <section className="flex flex-col md:flex-row gap-4 mb-6">
          <form className="relative flex-1" onSubmit={(e) => e.preventDefault()}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input className="w-full bg-slate-950/60 border border-gray-800 rounded-xl pl-12 pr-4 py-3 outline-none" placeholder="Поиск по названию..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </form>
          <nav className="flex bg-slate-950 p-1 rounded-xl border border-gray-800">
            {['all', 'in', 'low', 'out'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase ${statusFilter === f ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>
                {f === 'all' ? 'Все' : f === 'in' ? 'В наличии' : f === 'low' ? 'Мало' : 'Нет'}
              </button>
            ))}
          </nav>
        </section>

        <section className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
  <table className="w-full text-left table-fixed">
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
      {filteredProducts.map(p => (
        <tr key={p.id}>
          <td className="p-4">
            <figure className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
              {p.image_url ? <img src={`http://localhost:8080${p.image_url}`} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={20} className="text-gray-600"/>}
            </figure>
          </td>
          <td className="p-4 truncate">
            <p className="font-bold truncate">{p.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{p.description}</p>
          </td>
          <td className="p-4 text-emerald-400 font-bold whitespace-nowrap">{Number(p.price).toLocaleString()} ₸</td>
          <td className="p-4 text-center">
            <span className="px-3 py-1 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">
              {p.quantity} шт
            </span>
          </td>
          <td className="p-4 text-right space-x-2">
            <button onClick={() => openEditModal(p)} className="p-2 bg-gray-800 rounded-lg hover:text-emerald-400 transition-colors">
              <Edit size={16}/>
            </button>
            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-gray-800 rounded-lg hover:text-rose-400 transition-colors">
              <Trash2 size={16}/>
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</section>

        {isModalOpen && (
          <dialog open className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm w-full h-full bg-transparent">
            <article className="bg-[#0f172a] border border-gray-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95">
              <header className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{formMode === 'edit' ? 'Редактировать' : 'Добавить товар'}</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
              </header>
              {notification && <output className="block mb-6 p-4 rounded-xl text-xs font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">{notification.text}</output>}
              <form onSubmit={handleSubmitProduct} className="space-y-4">
  <section className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
    <label className="w-20 h-20 shrink-0 cursor-pointer bg-gray-900 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
      {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="" /> : <Plus className="text-gray-600" />}
      <input type="file" className="hidden" accept="image/*" onChange={(e) => { setSelectedFile(e.target.files[0]); setPreviewUrl(URL.createObjectURL(e.target.files[0])); }} />
    </label>
    <p className="text-[10px] text-gray-500">ID продавца: <span className="text-emerald-500">{formData.seller_id}</span></p>
  </section>

  <fieldset className="space-y-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase">Название</label>
    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none text-white focus:border-emerald-500 transition-colors" />
  </fieldset>

  <fieldset className="space-y-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase">Описание</label>
    <textarea rows="2" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none text-white focus:border-emerald-500 transition-colors" />
  </fieldset>

  <fieldset className="space-y-1">
    <label className="text-[10px] font-bold text-gray-500 uppercase">Категория</label>
    <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none text-white focus:border-emerald-500 transition-colors [&>option]:bg-gray-900">
      <option value="">Выберите категорию</option>
      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
    </select>
  </fieldset>

  <section className="grid grid-cols-2 gap-4">
    <fieldset className="space-y-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase">Цена (₸)</label>
      <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none text-white focus:border-emerald-500 transition-colors" />
    </fieldset>
    <fieldset className="space-y-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase">Количество</label>
      <input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 outline-none text-white focus:border-emerald-500 transition-colors" />
    </fieldset>
  </section>

  <button type="submit" disabled={formLoading} className="w-full bg-emerald-500 hover:bg-emerald-600 py-4 rounded-xl font-bold mt-4 transition-colors">
    {formLoading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}
  </button>
</form>
            </article>
          </dialog>
        )}
      </article>
    </main>
  );
};

export default Seller;
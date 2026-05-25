import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, ShieldAlert, Store, ShoppingBag, 
  Search, UserPlus, Edit, Trash2, AlertCircle, X 
} from 'lucide-react';

const MOCK_USERS = [
  { id: 1, username: "alex_director", email: "alex@admin.corp", role: "admin" },
  { id: 2, username: "maria_sales", email: "m.seller@shop.ru", role: "seller" },
  { id: 3, username: "dmitry_green", email: "dima@customer.io", role: "customer" },
];

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isMocked, setIsMocked] = useState(false);

  // Состояния для модалки и редактирования
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'customer' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Ошибка сервера при получении пользователей');
      const data = await response.json();
      setUsers(data || []);
      setIsMocked(false);
    } catch (err) {
      console.error("Backend fetch failed, using mocks", err);
      setUsers(MOCK_USERS);
      setIsMocked(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- ЛОГИКА УДАЛЕНИЯ ---
  const deleteUser = async (id) => {
    if (!window.confirm('Вы действительно хотите удалить этого пользователя?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || 'Ошибка при удалении');
      }
      
      await fetchUsers();
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  // --- ЛОГИКА СОХРАНЕНИЯ (Создание или Обновление) ---
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const roleMapping = { 'admin': 1, 'customer': 2, 'seller': 4 };
    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password || undefined,
      role_id: roleMapping[formData.role] || 2
    };

    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `http://localhost:8080/api/admin/users/${editingUser.id || editingUser.ID}` 
        : 'http://localhost:8080/api/admin/create-user';

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Не удалось выполнить действие');
      }

      await fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ 
        username: user.username || user.Username, 
        email: user.email || user.Email, 
        password: '', 
        role: (user.role || user.Role || 'customer').toLowerCase() 
      });
    } else {
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', role: 'customer' });
    }
    setIsModalOpen(true);
  };

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => (u.role || u.Role || '').toLowerCase() === 'admin').length,
    sellers: users.filter(u => (u.role || u.Role || '').toLowerCase() === 'seller').length,
    customers: users.filter(u => (u.role || u.Role || '').toLowerCase() === 'customer').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const uName = (user.username || user.Username || '').toLowerCase();
      const uRole = (user.role || user.Role || '').toLowerCase();
      return uName.includes(searchTerm.toLowerCase()) && (roleFilter === 'all' || uRole === roleFilter);
    });
  }, [users, searchTerm, roleFilter]);

  const getRoleBadgeClass = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (r === 'seller') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Панель Администратора
          </h1>
        </div>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
        >
          <UserPlus className="w-5 h-5" /> Новый пользователь
        </button>
      </header>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Всего" value={stats.total} Icon={Users} color="text-white" />
        <StatCard title="Админы" value={stats.admins} Icon={ShieldAlert} color="text-rose-400" />
        <StatCard title="Продавцы" value={stats.sellers} Icon={Store} color="text-emerald-400" />
        <StatCard title="Клиенты" value={stats.customers} Icon={ShoppingBag} color="text-blue-400" />
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Поиск по имени или email..." 
            className="w-full bg-slate-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-slate-200 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-gray-800">
            {['all', 'admin', 'seller', 'customer'].map(role => (
                <button 
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-all ${roleFilter === role ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    {role === 'all' ? 'Все' : role}
                </button>
            ))}
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-950/40 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Имя</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 text-center font-semibold">Роль</th>
                    <th className="p-4 text-right font-semibold">Действия</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
                {filteredUsers.map(user => (
                <tr key={user.id || user.ID} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="p-4 text-slate-500 font-mono text-sm">#{user.id || user.ID}</td>
                    <td className="p-4 font-medium text-slate-200">{user.username || user.Username}</td>
                    <td className="p-4 text-slate-400">{user.email || user.Email}</td>
                    <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getRoleBadgeClass(user.role || user.Role)}`}>
                            {user.role || user.Role}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            
                            <button onClick={() => deleteUser(user.id || user.ID)} title="Удалить" className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* МОДАЛКА */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-gray-800 w-full max-w-md rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-950/40">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> 
                {editingUser ? 'Редактировать' : 'Создать'} пользователя
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">{formError}</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Имя</label>
                <input type="text" required className="w-full bg-slate-950 border border-gray-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Email</label>
                <input type="email" required className="w-full bg-slate-950 border border-gray-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Пароль</label>
                <input type="password" placeholder={editingUser ? "Оставьте пустым, чтобы не менять" : "••••••••"} className="w-full bg-slate-950 border border-gray-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Роль</label>
                <select className="w-full bg-slate-950 border border-gray-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="customer">Customer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-gray-800 rounded-xl">Отмена</button>
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm rounded-xl">{isSubmitting ? 'Сохранение...' : 'Сохранить'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, Icon, color }) => (
  <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-2xl flex items-center justify-between group hover:border-gray-700 transition-all">
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className={`text-2xl font-bold mt-1 ${color}`}>{value}</h3>
    </div>
    <div className="p-3 bg-slate-800/50 rounded-xl group-hover:scale-110 transition-transform">
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

export default Admin;
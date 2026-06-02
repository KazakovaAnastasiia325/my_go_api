import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, ShieldAlert, Store, ShoppingBag, 
  Search, UserPlus, Trash2, LogOut 
} from 'lucide-react';

const Admin = () => {
  // --- СОСТОЯНИЯ ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'customer' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const USERS_PER_PAGE = 10;

  // --- ЛОГИКА ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка сервера');
      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth';
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Вы действительно хотите удалить этого пользователя?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка при удалении');
      await fetchUsers();
    } catch (err) { alert('Ошибка при удалении: ' + err.message); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    const roleMapping = { 'admin': 1, 'customer': 2, 'seller': 4 };
    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role_id: roleMapping[formData.role] || 2
    };
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(await response.text() || 'Ошибка');
      await fetchUsers();
      setIsModalOpen(false);
      setFormData({ username: '', email: '', password: '', role: 'customer' });
    } catch (err) { setFormError(err.message); } finally { setIsSubmitting(false); }
  };

  // --- ВЫЧИСЛЕНИЯ ---
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

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const getRoleBadgeClass = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (r === 'seller') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Панель Администратора
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-gray-800">
            <LogOut className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10"
          >
            <UserPlus className="w-5 h-5" /> Новый пользователь
          </button>
        </div>
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
            className="w-full bg-slate-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-slate-200 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-gray-800">
            {['all', 'admin', 'seller', 'customer'].map(role => (
                <button 
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-all ${roleFilter === role ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}
                >
                    {role === 'all' ? 'Все' : role}
                </button>
            ))}
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <table className="w-full text-left">
            <thead className="bg-gray-950/40 text-slate-400 text-xs uppercase">
                <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Имя</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-center">Роль</th>
                    <th className="p-4 text-right">Действия</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
                {paginatedUsers.map(user => (
                <tr key={user.id || user.ID} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="p-4 text-slate-500 font-mono text-sm">#{user.id || user.ID}</td>
                    <td className="p-4 font-medium text-slate-200">{user.username || user.Username}</td>
                    <td className="p-4 text-slate-400">{user.email || user.Email}</td>
                    <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getRoleBadgeClass(user.role || user.Role)}`}>
                            {user.role || user.Role}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        <button onClick={() => deleteUser(user.id || user.ID)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
      </div>
{/* Пагинация */}

      <div className="mt-6 flex justify-center gap-4">

        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-gray-800 text-white rounded">Назад</button>

        <span className="text-white py-2">Стр. {currentPage} из {totalPages}</span>

        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-gray-800 text-white rounded">Вперед</button>

      </div>
      {/* Модалка */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-gray-800 w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Создать пользователя</h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              {formError && <p className="text-rose-400 text-sm">{formError}</p>}
              <input required placeholder="Имя" className="w-full bg-slate-950 border p-3 rounded-xl text-white" onChange={(e) => setFormData({...formData, username: e.target.value})} />
              <input required type="email" placeholder="Email" className="w-full bg-slate-950 border p-3 rounded-xl text-white" onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <input required type="password" placeholder="Пароль" className="w-full bg-slate-950 border p-3 rounded-xl text-white" onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <select className="w-full bg-slate-950 border p-3 rounded-xl text-white" onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <option value="customer">Customer</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 text-slate-400">Отмена</button>
                <button disabled={isSubmitting} className="flex-1 p-3 bg-indigo-600 rounded-xl text-white">{isSubmitting ? '...' : 'Создать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, Icon, color }) => (
  <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className={`text-2xl font-bold mt-1 ${color}`}>{value}</h3>
    </div>
    <Icon className={`w-6 h-6 ${color}`} />
  </div>
);

export default Admin;
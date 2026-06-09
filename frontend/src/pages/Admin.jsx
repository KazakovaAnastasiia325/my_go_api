import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, ShieldAlert, Store, ShoppingBag,
  Search, UserPlus, Trash2, LogOut
} from 'lucide-react';
import { useAuth } from '../hook/useAuth';

// Компонент вынесен за пределы основного компонента
const StatCard = ({ title, value, Icon, color }) => (
  <article className="bg-gray-900/40 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className={`text-2xl font-bold mt-1 ${color}`}>{value}</h3>
    </div>
    <Icon className={`w-6 h-6 ${color}`} />
  </article>
);

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'customer' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastId, setLastId] = useState(0);
  const { logout } = useAuth();
  const [statsData, setStatsData] = useState({ admin: 0, seller: 0, customer: 0 });

  const USERS_PER_PAGE = 10;

  // --- ЛОГИКА ---
  const fetchUsers = async (page = 1, search = '', role = 'all') => {
    const roleParam = role === 'all' ? '' : role;
    
    try {
      const url = `http://localhost:8080/api/admin/users?page=${page}&limit=${USERS_PER_PAGE}&search=${search}&role=${roleParam}`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include' // ОБЯЗАТЕЛЬНО для работы с куками
      });

      if (res.status === 401) {
        window.location.href = '/auth'; // Перенаправление при неавторизованном доступе
        return;
      }

      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setLastId(data.total || 0);
      }
    } catch (err) { console.error("Ошибка сети:", err); }
  };
const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/admin/stats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) { console.error("Ошибка загрузки статистики:", err); }
  };
  useEffect(() => {
    fetchUsers(currentPage, searchTerm, roleFilter);
    fetchStats();
  }, [currentPage, searchTerm, roleFilter]);

  const handleLogout = async () => {
    try {
        await logout();
    } catch (err) {
        console.error("Ошибка при выходе:", err);
        window.location.href = '/auth';
    }
};

  const deleteUser = async (id) => {
    if (!window.confirm('Вы действительно хотите удалить этого пользователя?')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Ошибка при удалении');
      await fetchUsers(currentPage, searchTerm, roleFilter);
      await fetchStats(); // Обновляем статистику после удаления
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
      const response = await fetch('http://localhost:8080/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (!response.ok) throw new Error(await response.text() || 'Ошибка');
      await fetchUsers(1, '', 'all');
      setIsModalOpen(false);
      setFormData({ username: '', email: '', password: '', role: 'customer' });
    } catch (err) { setFormError(err.message); } finally { setIsSubmitting(false); }
  };

  // --- ВЫЧИСЛЕНИЯ ---
  const stats = useMemo(() => ({
    total: lastId,
    admins: statsData.admin || 0,
    sellers: statsData.seller || 0,
    customers: statsData.customer || 0
  }), [statsData, lastId]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(lastId / USERS_PER_PAGE)), [lastId]);

  const getRoleBadgeClass = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (r === 'seller') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }
    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };
const handleRoleChange = (role) => {
    setRoleFilter(role);
    setCurrentPage(1); // Сбрасываем страницу при смене фильтра
  };
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Панель Администратора
        </h1>
        <nav className="flex items-center gap-3">
          <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-rose-400 border border-gray-800 rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition-all shadow-lg">
            <UserPlus className="w-5 h-5" /> Новый пользователь
          </button>
        </nav>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Всего" value={stats.total} Icon={Users} color="text-white" />
        <StatCard title="Админы" value={stats.admins} Icon={ShieldAlert} color="text-rose-400" />
        <StatCard title="Продавцы" value={stats.sellers} Icon={Store} color="text-emerald-400" />
        <StatCard title="Клиенты" value={stats.customers} Icon={ShoppingBag} color="text-blue-400" />
      </section>

      <section className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input type="text" placeholder="Поиск по имени или email..." className="w-full bg-slate-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-slate-200 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <nav className="flex bg-slate-950 p-1 rounded-xl border border-gray-800">
           {['all', 'admin', 'seller', 'customer'].map(role => (
            <button key={role} onClick={() => handleRoleChange(role)} className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-all ${roleFilter === role ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>{role === 'all' ? 'Все' : role}</button>
          ))}
        </nav>
      </section>

      <section className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-950/40 text-slate-400 text-xs uppercase">
            <tr><th className="p-4">№</th><th className="p-4">Имя</th><th className="p-4">Email</th><th className="p-4 text-center">Роль</th><th className="p-4 text-right">Действия</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {users.map((user, index) => (
              <tr key={user.id || user.ID} className="hover:bg-indigo-500/5 transition-colors">
                <td className="p-4 text-slate-500 font-mono text-sm">{(currentPage - 1) * 10 + index + 1}</td>
                <td className="p-4 font-medium text-slate-200">{user.username || user.Username}</td>
                <td className="p-4 text-slate-400">{user.email || user.Email}</td>
                <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getRoleBadgeClass(user.role || user.Role)}`}>{user.role || user.Role}</span></td>
                <td className="p-4 text-right"><button onClick={() => deleteUser(user.id || user.ID)} className="p-2 text-slate-400 hover:text-rose-400 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav className="mt-6 flex justify-center items-center gap-2">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 bg-gray-800 text-slate-300 rounded hover:bg-gray-700 disabled:opacity-30">Назад</button>
        {getPageNumbers().map((page, index) => (
          <button key={index} onClick={() => typeof page === 'number' && setCurrentPage(page)} className={`px-3 py-1 rounded ${page === currentPage ? 'bg-indigo-600 text-white' : page === '...' ? 'cursor-default text-slate-500' : 'bg-gray-800 text-slate-300 hover:bg-gray-700'}`}>{page}</button>
        ))}
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-gray-800 text-slate-300 rounded hover:bg-gray-700 disabled:opacity-30">Вперед</button>
      </nav>

      {isModalOpen && (
        <aside className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSaveUser} className="bg-slate-900 border border-gray-800 w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Создать пользователя</h2>
            {formError && <p className="text-rose-400 text-sm mb-4">{formError}</p>}
            <input required placeholder="Имя" className="w-full bg-slate-950 border p-3 rounded-xl text-white mb-3" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
            <input required type="email" placeholder="Email" className="w-full bg-slate-950 border p-3 rounded-xl text-white mb-3" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <input required type="password" placeholder="Пароль" className="w-full bg-slate-950 border p-3 rounded-xl text-white mb-3" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            <select className="w-full bg-slate-950 border p-3 rounded-xl text-white" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="customer">Customer</option><option value="seller">Seller</option><option value="admin">Admin</option>
            </select>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-3 text-slate-400">Отмена</button>
              <button disabled={isSubmitting} className="flex-1 p-3 bg-indigo-600 rounded-xl text-white">{isSubmitting ? '...' : 'Создать'}</button>
            </div>
          </form>
        </aside>
      )}
    </main>
  );
};

export default Admin;
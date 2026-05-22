import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; // Добавляем Link
import { 
  Users, ShieldAlert, Store, ShoppingBag, 
  Search, UserPlus, Edit, Trash2, AlertCircle 
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

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        // Добавляем полный путь к API и токен из localStorage
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}` // Если твой Go-сервер ждет токен
            }
        });

        if (!response.ok) throw new Error('Ошибка сервера');
        const data = await response.json();
        setUsers(data);
        setIsMocked(false);
      } catch (err) {
        console.error("Backend fetch failed, using mocks", err);
        setUsers(MOCK_USERS);
        setIsMocked(true);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Остальная логика (stats, filteredUsers, getRoleBadgeClass) остается без изменений...
  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => (u.role || u.Role || '').toLowerCase() === 'admin').length,
    sellers: users.filter(u => (u.role || u.Role || '').toLowerCase() === 'seller').length,
    customers: users.filter(u => (u.role || u.Role || '').toLowerCase() === 'customer').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const uName = (user.username || user.Username || '').toLowerCase();
      const uEmail = (user.email || user.Email || '').toLowerCase();
      const uRole = (user.role || user.Role || '').toLowerCase();
      const matchesSearch = uName.includes(searchTerm.toLowerCase()) || uEmail.includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || uRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const getRoleBadgeClass = (role) => {
    const normRole = (role || '').toLowerCase();
    if (normRole === 'admin') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (normRole === 'seller') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Панель Администратора
            </h1>
            {isMocked && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                Plus
              </span>
            )}
          </div>
          <p className="text-slate-400 mt-1">Управление учетными записями системы.</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* ИСПОЛЬЗУЕМ Link ВМЕСТО <a> */}
            <Link to="/create-seller" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition-all">
                <UserPlus className="w-5 h-5" />
                Новый пользователь
            </Link>
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
            className="w-full bg-slate-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-slate-200 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-gray-800 self-start">
            {['all', 'admin', 'seller', 'customer'].map(role => (
                <button 
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-4 py-1.5 rounded-lg text-sm transition-all capitalize ${roleFilter === role ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    {role === 'all' ? 'Все' : role}
                </button>
            ))}
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
            <div className="p-20 text-center text-slate-500">Загрузка данных...</div>
        ) : (
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
                        <button title="Редактировать" className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button title="Удалить" className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
        {!loading && filteredUsers.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-3">
                <AlertCircle className="w-10 h-10 text-slate-600" />
                <p className="text-slate-500">Пользователи не найдены</p>
            </div>
        )}
      </div>
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
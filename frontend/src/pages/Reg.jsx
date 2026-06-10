import React, { useState } from 'react';
import { User, Lock, Mail, UserPlus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Reg = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert('Ура! Пользователь создан');
        navigate(`/auth`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Ошибка при регистрации');
      }
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Не удалось связаться с сервером.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      <aside className="absolute inset-0 z-0 animate-pulse-slow">
        <span className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/30 blur-[120px]" />
        <span className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-900/20 blur-[120px]" />
      </aside>

      <article className="w-full max-w-md bg-gray-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative">
        <header className="flex justify-center mb-6">
          <figure className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20">
            C
          </figure>
        </header>

        <h2 className="text-2xl font-bold text-center tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
          Регистрация
        </h2>
        <p className="text-sm text-slate-500 text-center mb-8 font-light">Создайте аккаунт в CyberMart</p>

        {error && (
          <section className="p-4 rounded-xl mb-6 flex items-start gap-3 border bg-rose-500/10 border-rose-500/20 text-rose-400 text-xs animate-in fade-in zoom-in-95">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </section>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-2 ml-1">Имя пользователя</span>
            <span className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-slate-600" />
              <input id="username" type="text" placeholder="Ваше имя" required value={formData.username} onChange={handleChange} disabled={loading} className="w-full bg-slate-950/40 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50 text-sm" />
            </span>
          </label>

          <label className="block">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-2 ml-1">Электронная почта</span>
            <span className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-600" />
              <input id="email" type="email" placeholder="example@mail.com" required value={formData.email} onChange={handleChange} disabled={loading} className="w-full bg-slate-950/40 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50 text-sm" />
            </span>
          </label>

          <label className="block">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-2 ml-1">Пароль</span>
            <span className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-600" />
              <input id="password" type="password" placeholder="••••••••" required value={formData.password} onChange={handleChange} disabled={loading} className="w-full bg-slate-950/40 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50 text-sm" />
            </span>
          </label>

          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 text-sm">
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> Создать аккаунт</>}
          </button>
        </form>

        <footer className="mt-8 pt-6 border-t border-white/5 text-center">
          <span className="text-xs text-slate-500 font-light">Уже есть аккаунт? </span>
          <button onClick={() => navigate('/auth')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors ml-1 font-medium">Войти в систему</button>
        </footer>
      </article>
    </main>
  );
};

export default Reg;
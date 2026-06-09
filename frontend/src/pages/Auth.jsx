import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Добавляем для правильной навигации

const Auth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Хук для перехода между страницами без перезагрузки

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include' // Важно для работы с Cookies
      });

      if (!response.ok) {
        throw new Error('Неверное имя пользователя или пароль');
      }

      const result = await response.json(); 
      
      // Очищаем старые данные и записываем новые
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.setItem('role', result.role);
      localStorage.setItem('userId', result.user_id);
      // Если сервер отдает JWT, его тоже нужно сохранить
      if (result.token) localStorage.setItem('token', result.token);
      
      console.log("Успешный вход. Роль:", result.role);
      
      // Определяем куда идти
      const routes = {
        'admin': '/admin',
        'seller': '/seller-dashboard',
        'customer': '/customer-dashboard'
      };
      
      const targetPath = routes[result.role] || '/';
      
      // Используем replace: true, чтобы пользователь не вернулся на форму входа кнопкой "Назад"
      navigate(targetPath, { replace: true });
      
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || 'Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 z-0 animate-pulse-slow">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/30 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-900/20 blur-[120px]"></div>
      </div>
      <div className="w-full max-w-md bg-gray-900/40 backdrop-blur-xl border border-gray-800/80 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20">
            C
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
          Авторизация
        </h2>
        <p className="text-sm text-slate-400 text-center mb-8 font-light">
          Войдите, чтобы продолжить работу в CyberMart
        </p>

        {error && (
          <div className="p-4 rounded-xl mb-6 flex items-start gap-3 border bg-rose-500/10 border-rose-500/25 text-rose-400 text-sm animate-in fade-in slide-in-from-top-1">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Имя пользователя</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-5 h-5" />
              </span>
              <input 
                type="text" 
                placeholder="Введите имя" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/60 border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Пароль</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/60 border border-gray-800 rounded-xl pl-11 pr-11 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Войти в систему</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800/60 text-center">
          <span className="text-sm text-slate-400 font-light">Нет аккаунта? </span>
          <button onClick={() => navigate('/reg')} className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline font-semibold">
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
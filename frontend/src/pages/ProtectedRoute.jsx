import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react'; // Импортируйте иконку

const ProtectedRoute = ({ children, allowedRoles }) => {
    const userRole = localStorage.getItem('role');
    
    // 1. Если нет роли — отправляем на логин
    if (!userRole) {
        return <Navigate to="/auth" replace />;
    }

    // 2. Если роль есть, но она не в списке разрешенных — показываем ошибку
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
                <div className="bg-gray-900 border border-rose-500/30 p-10 rounded-3xl text-center max-w-md shadow-2xl">
                    <ShieldAlert className="w-20 h-20 text-rose-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Доступ ограничен</h2>
                    <p className="text-slate-400 mb-8">У вас недостаточно прав для просмотра этой страницы.</p>
                    <button 
                        onClick={() => window.history.back()} // Возврат назад
                        className="w-full bg-rose-600 hover:bg-rose-700 py-4 rounded-xl font-bold transition-all"
                    >
                        Вернуться назад
                    </button>
                </div>
            </div>
        );
    }

    // 3. Если всё ок — показываем контент
    return children;
};

export default ProtectedRoute;
export const useAuth = () => {
    const logout = async () => {
        try {
            // Отправляем запрос на сервер, чтобы он ответил заголовком Set-Cookie с MaxAge: -1
            await fetch('http://localhost:8080/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error("Ошибка при выходе:", err);
        } finally {
            // Удаляем всё из локального хранилища
            localStorage.clear();
            
            // Перенаправляем на страницу входа
            window.location.href = '/auth';
        }
    };

    return { logout };
};
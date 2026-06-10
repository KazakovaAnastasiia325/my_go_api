import React, { useState, useEffect, useMemo } from 'react';
import { 
    ChevronDown, ShoppingCart, Search, Plus, X, 
    ShoppingBasket, Image as ImageIcon, LogOut, Bell 
} from 'lucide-react';
import { useAuth } from '../hook/useAuth';

const MOCK_PRODUCTS = [
    { ID: 1, Name: "Игровая клавиатура CyberKey", Description: "Демо-данные: Механика с RGB.", Price: 24900, Quantity: 15, image_url: "" },
    { ID: 2, Name: "Беспроводная мышь AirGlide", Description: "Демо-данные: Легкая мышь 16000 DPI.", Price: 18500, Quantity: 4, image_url: "" },
];

const normalizeProduct = (p) => ({
    id: p.ID ?? p.id,
    name: p.Name ?? p.name,
    description: p.Description ?? p.description,
    price: Number(p.Price ?? p.price ?? 0),
    quantity: Number(p.Quantity ?? p.quantity ?? 0),
    image_url: p.image_url ?? p.ImageURL ?? ""
});

const Customer = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [maxPrice, setMaxPrice] = useState(1000000);
    const [onlyInStock, setOnlyInStock] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [sellerModalProduct, setSellerModalProduct] = useState(null);
    const [category, setCategory] = useState('Все');
    const [sortOrder, setSortOrder] = useState('none');
    const [cart, setCart] = useState(() => {
        try { const saved = localStorage.getItem('cart'); return saved ? JSON.parse(saved) : []; } 
        catch { return []; }
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [shownNotifications, setShownNotifications] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [addToCartResult, setAddToCartResult] = useState(null);
    
    const { logout } = useAuth();
    
    useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

    const handleLogout = async () => {
        try { await logout(); } 
        catch (err) { console.error("Ошибка при выходе:", err); window.location.href = '/auth'; }
    };

    const showToast = (message) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    const groupProducts = (data) => {
        const map = new Map();
        (data || []).forEach(p => {
            const key = (p.name || "").toLowerCase().trim();
            if (!map.has(key)) {
                map.set(key, { ...p, sellers: [{ price: p.price, quantity: p.quantity, sellerId: Math.random().toString(36).slice(2, 8) }] });
            } else {
                const existing = map.get(key);
                map.set(key, { ...existing, sellers: [...existing.sellers, { price: p.price, quantity: p.quantity, sellerId: Math.random().toString(36).slice(2, 8) }] });
            }
        });
        return Array.from(map.values());
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:8080/api/catalog');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setProducts(groupProducts(Array.isArray(data) ? data.map(normalizeProduct) : []));
        } catch { setProducts(groupProducts(MOCK_PRODUCTS.map(normalizeProduct))); } 
        finally { setLoading(false); }
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/notifications', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                data.forEach(n => {
                    if (!n.is_read && !shownNotifications.includes(n.id)) {
                        showToast(n.message);
                        setShownNotifications(prev => [...prev, n.id]);
                    }
                });
                setNotifications(data);
            }
        } catch (err) { console.error("Ошибка загрузки уведомлений:", err); }
    };

    useEffect(() => {
        fetchProducts();
        fetchNotifications();
        const t = setInterval(fetchNotifications, 30000);
        return () => clearInterval(t);
    }, []);

    const markAllAsRead = async () => {
        try {
            await fetch('http://localhost:8080/api/notifications/read', { 
                method: 'POST', 
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' } 
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setShownNotifications([]);
        } catch (err) { console.error("Ошибка при пометке прочитанными:", err); }
    };

    const filteredProducts = useMemo(() => {
        let result = products.filter(p => 
            (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase())) 
            && p.price <= maxPrice 
            && (!onlyInStock || p.sellers.some(s => s.quantity > 0))
            && (category === 'Все' || (p.category || 'Без категории') === category)
        );

        if (sortOrder !== 'none') {
            result.sort((a, b) => {
                const priceA = Math.min(...a.sellers.map(s => s.price));
                const priceB = Math.min(...b.sellers.map(s => s.price));
                return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
            });
        }
        return result;
    }, [products, searchTerm, maxPrice, onlyInStock, category, sortOrder]);

    const addToCart = (product, seller) => {
        const key = `${product.id}_${seller.sellerId}`;
        setCart(prev => {
            const existing = prev.find(i => i.key === key);
            if ((existing?.count || 0) >= seller.quantity) {
                showToast("Товар закончился у этого продавца");
                return prev;
            }
            setAddToCartResult('success');
            return existing 
                ? prev.map(i => i.key === key ? { ...i, count: i.count + 1 } : i) 
                : [...prev, { key, id: product.id, name: product.name, price: seller.price, sellerId: seller.sellerId, count: 1 }];
        });
    };

    useEffect(() => {
        if (addToCartResult === 'success') showToast("Товар добавлен в корзину");
        setAddToCartResult(null);
    }, [addToCartResult]);

    const removeFromCart = (key) => setCart(prev => prev.map(i => i.key === key ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0));

    const cartCount = cart.reduce((s, i) => s + i.count, 0);
    const cartTotal = cart.reduce((s, i) => s + i.price * i.count, 0);

    const handleCheckout = async () => {
        const orderPayload = cart.map(item => ({
            id: item.id,
            sellerId: item.sellerId,
            count: item.count
        }));

        try {
            const res = await fetch('http://localhost:8080/api/checkout', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(orderPayload)
            });

            if (res.ok) {
                showToast("Заказ успешно оформлен");
                setCart([]);
                setIsCartOpen(false);
            } else {
                showToast("Ошибка при оформлении заказа");
            }
        } catch (err) {
            showToast("Ошибка связи с сервером");
        }
    };

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'Без категории'));
        return ['Все', ...Array.from(cats)];
    }, [products]);

    return (
       <main className="min-h-screen bg-[#090d16] text-slate-100 font-sans p-4 md:p-8 selection:bg-indigo-500/30">
        <aside className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map(t => (
                <article key={t.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto animate-in slide-in-from-right">
                    <Bell className="text-indigo-400" size={18} />
                    <p className="text-sm font-medium">{t.message}</p>
                    <button onClick={() => removeToast(t.id)} className="ml-2 hover:text-white text-gray-500"><X size={14}/></button>
                </article>
            ))}
        </aside>
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#090d16]/80 backdrop-blur-xl border-b border-gray-800/60 p-6 rounded-3xl mb-8 flex justify-between items-center shadow-2xl">
                <hgroup>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">CyberMart</h1>
                </hgroup>

                <nav className="flex items-center gap-3">
                    <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-3 bg-gray-900 rounded-2xl relative hover:bg-gray-800">
                        <Bell size={20} className={notifications.some(n => !n.is_read) ? "text-rose-400" : "text-indigo-400"} />
                    </button>
                    <button onClick={handleLogout} className="p-3 bg-gray-900 rounded-2xl hover:text-rose-400">
                        <LogOut size={20} />
                    </button>
                    <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all">
                        <ShoppingCart size={20} />
                        {cartCount}
                    </button>
                </nav>
            </header>

            {/* Notifications Panel */}
            {isNotifOpen && (
                <section className="absolute right-8 top-24 w-80 bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-2xl z-50">
                    <header className="flex justify-between mb-4"><h3 className="font-bold">Уведомления</h3><button onClick={markAllAsRead} className="text-xs text-indigo-400">Прочитать всё</button></header>
                    <ul className="space-y-2">{notifications.map(n => <li key={n.id} className={`text-sm p-2 rounded-lg ${n.is_read ? 'opacity-50' : 'bg-gray-800'}`}>{n.message}</li>)}</ul>
                </section>
            )}

            {/* Search & Filters */}
            <section className="bg-gray-900/30 p-6 rounded-3xl border border-gray-800 mb-8 space-y-4">
    {/* Верхний ряд: Поиск */}
    <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
        <input 
            type="search" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Поиск товаров..." 
            className="w-full bg-black/20 pl-12 pr-4 py-3 rounded-2xl outline-none border border-gray-700 focus:border-indigo-500 transition-all" 
        />
    </div>

    {/* Нижний ряд: Фильтры */}
    <div className="flex flex-wrap gap-4 items-center">
        <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="bg-black/20 px-4 py-2 rounded-xl border border-gray-700 outline-none hover:border-gray-500"
        >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-black/20 px-4 py-2 rounded-xl border border-gray-700 outline-none hover:border-gray-500"
        >
            <option value="none">Без сортировки</option>
            <option value="asc">Сначала дешевле</option>
            <option value="desc">Сначала дороже</option>
        </select>

        <label className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-gray-700 cursor-pointer hover:border-gray-500">
            <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} className="accent-indigo-500" /> 
            <span className="text-sm">В наличии</span>
        </label>

        <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-gray-700">
            <span className="text-xs text-gray-400">до</span>
            <input 
                type="number" 
                placeholder="Цена..." 
                onChange={(e) => setMaxPrice(Number(e.target.value) || 1000000)} 
                className="bg-transparent w-20 outline-none text-sm" 
            />
            <span className="text-xs text-gray-400">₸</span>
        </div>
    </div>
</section>

            {/* Products Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map(p => (
                    <article key={p.id} className="bg-gray-900/20 border border-gray-800 rounded-3xl p-5 hover:border-indigo-500 transition-all">
                        <figure className="aspect-square bg-black/40 rounded-2xl mb-4 flex items-center justify-center">
                            {p.image_url ? <img src={`http://localhost:8080${p.image_url}`} className="object-cover w-full h-full rounded-2xl" /> : <ImageIcon size={48} className="text-gray-700"/>}
                        </figure>
                        <h2 className="font-bold">{p.name}</h2>
                        <p className="text-[13px] text-slate-500 truncate">{p.description}</p>
                        <footer className="mt-4 pt-4 border-t border-gray-800">
                            <button onClick={() => setSellerModalProduct(p)} className="w-full bg-gray-800 hover:bg-indigo-600 p-3 rounded-xl transition-all font-bold">
                                {Math.min(...p.sellers.map(s => s.price))} ₸
                            </button>
                        </footer>
                    </article>
                ))}
            </section>

            {/* Modals: Seller & Cart (Dialogs) */}
            {sellerModalProduct && (
            <section className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button className="absolute inset-0 bg-black/70 backdrop-blur-sm w-full h-full cursor-default" onClick={() => setSellerModalProduct(null)} aria-label="Закрыть" />
                <article className="relative bg-[#090d16] border border-gray-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                    <header className="flex justify-between items-center mb-6">
                        <h2 className="font-bold">Выбор продавца</h2>
                        <button onClick={() => setSellerModalProduct(null)}><X size={20}/></button>
                    </header>
                    <ul className="space-y-3">
                        {sellerModalProduct.sellers.map(s => (
                            <li key={s.sellerId}>
                                <button onClick={() => {addToCart(sellerModalProduct, s); setSellerModalProduct(null)}} className="w-full flex justify-between items-center p-4 bg-gray-900 rounded-2xl hover:border-indigo-500 border border-transparent transition-all">
                                    <span className="font-bold">{s.price.toLocaleString()} ₸</span>
                                    <span className="text-xs text-gray-400">Остаток: {s.quantity}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </article>
            </section>
        )}

            {isCartOpen && (
            <section className="fixed inset-0 z-50 flex justify-end">
                <button className="absolute inset-0 bg-black/60 backdrop-blur-sm w-full h-full cursor-default" onClick={() => setIsCartOpen(false)} aria-label="Закрыть" />
                <article className="relative w-full max-w-md bg-[#090d16] border-l border-gray-800 p-8 flex flex-col shadow-2xl">
                    <header className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold flex items-center gap-2"><ShoppingBasket className="text-indigo-400"/> Корзина</h2>
                        <button onClick={() => setIsCartOpen(false)} className="hover:bg-gray-800 p-2 rounded-xl"><X size={20} /></button>
                    </header>
                    
                    <ul className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {cart.length === 0 && <li className="text-gray-500 text-center py-10">Корзина пуста</li>}
                        {cart.map(item => (
                            <li key={item.key} className="bg-gray-900 p-4 rounded-2xl flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold">{item.name}</p>
                                    <p className="text-indigo-400 text-xs font-bold">{item.price.toLocaleString()} ₸</p>
                                </div>
                                <nav className="flex items-center gap-3 bg-black/30 p-1 rounded-xl">
                                    <button onClick={() => removeFromCart(item.key)} className="p-1 hover:text-red-400 transition-colors"><X size={14}/></button>
                                    <span className="font-bold px-2 w-8 text-center">{item.count}</span>
                                    <button onClick={() => {
                                        const p = products.find(prod => prod.id === item.id);
                                        const s = p?.sellers.find(sel => sel.sellerId === item.sellerId);
                                        if (p && s) addToCart(p, s);
                                    }} className="p-1 hover:text-green-400 transition-colors"><Plus size={14}/></button>
                                </nav>
                            </li>
                        ))}
                    </ul>

                    <footer className="mt-6 pt-6 border-t border-gray-800">
                        <button onClick={handleCheckout} className="w-full bg-indigo-600 py-4 rounded-2xl font-bold hover:bg-indigo-500 transition-all">
                            Оплатить {cartTotal.toLocaleString()} ₸
                        </button>
                    </footer>
                </article>
            </section>
        )}
    </main>
    );
};

export default Customer;
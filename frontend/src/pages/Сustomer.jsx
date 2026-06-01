import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShoppingCart, Search, SlidersHorizontal, Plus, X, 
    ShoppingBasket, Image as ImageIcon, LogOut, Bell 
} from 'lucide-react';

const MOCK_PRODUCTS = [
    { ID: 1, Name: "Игровая клавиатура CyberKey", Description: "Демо-данные: Механика с RGB.", Price: 24900, Quantity: 15, image_url: "" },
    { ID: 2, Name: "Беспроводная мышь AirGlide", Description: "Демо-данные: Легкая мышь 16000 DPI.", Price: 18500, Quantity: 4, image_url: "" },
];

// =====================
// НОРМАЛИЗАЦИЯ
// =====================
const normalizeProduct = (p) => ({
    id: p.ID ?? p.id,
    name: p.Name ?? p.name,
    description: p.Description ?? p.description,
    price: p.Price ?? p.price ?? 0,
    quantity: p.Quantity ?? p.quantity ?? 0,
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
const [selectedSeller, setSelectedSeller] = useState({});
const [openSellers, setOpenSellers] = useState({});
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [shownNotifications, setShownNotifications] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('cart');
        window.location.href = '/auth';
    };

   const showToast = (message) => {
    const id = crypto.randomUUID(); // 🔥 вместо Date.now()

    setToasts(prev => [...prev, { id, message }]);

    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
};

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:8080/api/catalog');
            if (!res.ok) throw new Error();

            const data = await res.json();
const normalized = Array.isArray(data) ? data.map(normalizeProduct) : [];

const grouped = groupProducts(normalized);

setProducts(grouped);
        } catch {
            setProducts(MOCK_PRODUCTS.map(normalizeProduct));
        } finally {
            setLoading(false);
        }
    };
const groupProducts = (data) => {
        const map = new Map();

        data.forEach(p => {
            const key = (p.name ?? p.Name).toLowerCase().trim();

            if (!map.has(key)) {
                map.set(key, {
                    ...p,
                    sellers: [{
                        price: p.price,
                        quantity: p.quantity,
                        sellerId: Math.random().toString(36).slice(2, 8)
                    }]
                });
            } else {
                const existing = map.get(key);
                existing.sellers.push({
                    price: p.price,
                    quantity: p.quantity,
                    sellerId: Math.random().toString(36).slice(2, 8)
                });
            }
        });

        return Array.from(map.values());
    };
    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('http://localhost:8080/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();

                const unread = data.filter(n => !n.is_read);

                unread.forEach(n => {
                    if (!shownNotifications.includes(n.id)) {
                        showToast(n.message);
                        setShownNotifications(prev => [...prev, n.id]);
                    }
                });

                setNotifications(data);
            }
        } catch {}
    };

    useEffect(() => {
        fetchProducts();
        fetchNotifications();
        const t = setInterval(fetchNotifications, 30000);
        return () => clearInterval(t);
    }, []);

    const markAllAsRead = async () => {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:8080/api/notifications/read', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setShownNotifications([]);
    };

    const highestProductPrice = useMemo(() => {
        if (!products.length) return 1000000;
        return Math.max(...products.map(p => p.price));
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const q = searchTerm.toLowerCase();

            return (
                (p.name || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            ) && p.price <= maxPrice &&
              (!onlyInStock || p.quantity > 0);
        });
    }, [products, searchTerm, maxPrice, onlyInStock]);
const handleAddClick = (product) => {
    const seller = selectedSeller[product.id];

    if (!seller) {
        setSellerModalProduct(product);
        return;
    }

    addToCart(product, seller);
};
    const addToCart = (product, seller) => {
    if (!product || !seller) return;

    const key = `${product.id}_${seller.sellerId}`;

    setCart(prev => {
        const existing = prev.find(i => i.key === key);

        if (existing) {
            return prev.map(i =>
                i.key === key
                    ? { ...i, count: i.count + 1 }
                    : i
            );
        }

        return [
            ...prev,
            {
                key,
                id: product.id,
                name: product.name,
                price: seller.price,     
                sellerId: seller.sellerId,
                count: 1
            }
        ];
    });

    showToast("Товар добавлен в корзину");
};

   const removeFromCart = (key) => {
    setCart(prev =>
        prev
            .map(i => i.key === key ? { ...i, count: i.count - 1 } : i)
            .filter(i => i.count > 0)
    );
};

    const cartCount = cart.reduce((s, i) => s + i.count, 0);
    const cartTotal = cart.reduce((s, i) => s + i.price * i.count, 0);

    const handleCheckout = async () => {
        const token = localStorage.getItem('token');
        if (!token) return showToast("Вы не авторизованы");

        const res = await fetch('http://localhost:8080/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(cart)
        });

        if (res.ok) {
    showToast("Заказ оформлен");

    setCart([]);
    localStorage.removeItem('cart'); 

    setIsCartOpen(false);
    fetchNotifications();
} else {
            showToast("Ошибка оформления");
        }
    };


    return (
        <div className="max-h-screen bg-[#090d16] text-slate-100 font-['Plus_Jakarta_Sans']">
            <nav className="sticky top-0 z-50 bg-[#090d16]/80 backdrop-blur-md border-b border-gray-800 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white">C</div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent">CyberMart</span>
                        
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-all">
                            <Bell className="w-5 h-5 text-indigo-400" />
                            {notifications.filter(n => !n.is_read).length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />}
                        </button>
                        <button onClick={handleLogout} className="p-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 hover:text-rose-400 transition-all">
                            <LogOut className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl hover:scale-105 transition-all">
                            <ShoppingCart className="w-5 h-5 text-indigo-400" />
                            <span>Корзина</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-pink-500 w-5 h-5 rounded-full text-[10px] flex items-center justify-center animate-bounce font-bold text-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
              
                {isNotifOpen && (
    <div className="fixed right-50 top-20 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 p-4">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Уведомления</h3>
            {notifications.some(n => !n.is_read) && (
                <button 
                    onClick={markAllAsRead}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 uppercase font-bold"
                >
                    Прочитать все
                </button>
            )}
        </div>
        <div className="space-y-3 max-h-60 overflow-y-auto">
            {notifications.length === 0 ? <p className="text-sm text-slate-500">Уведомлений нет</p> : 
            notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-lg border text-sm ${n.is_read ? 'bg-gray-950 border-gray-800' : 'bg-indigo-950/20 border-indigo-500/30'}`}>
                    <p className={n.is_read ? 'text-slate-400' : 'text-white'}>{n.message}</p>
                    <span className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleTimeString()}</span>
                </div>
            ))}
        </div>
    </div>
    
)}
  {/* Горизонтальная панель фильтров */}                   
                <div className="sticky top-19 z-40 bg-[#090d16]/95 backdrop-blur-md border border-gray-800 p-6 rounded-2xl mb-8 flex flex-wrap items-center gap-8 shadow-xl">
    <div className="flex-1 min-w-[250px]">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-2">Поиск</label>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-indigo-500 outline-none"
                placeholder="Название или описание..."
            />
        </div>
    </div>

    <div className="w-64">
        <div className="flex justify-between text-[10px] uppercase font-bold mb-2">
            <span className="text-slate-500">Цена до:</span>
            <span className="text-indigo-400">{maxPrice.toLocaleString()} ₸</span>
        </div>
        <input 
            type="range" min="0" max={highestProductPrice} value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="w-full accent-indigo-500"
        />
    </div>
    <label className="flex items-center gap-3 cursor-pointer mt-4">
        <input type="checkbox" checked={onlyInStock} onChange={e => setOnlyInStock(e.target.checked)} className="hidden" />
        <div className={`w-10 h-5 rounded-full transition-all border ${onlyInStock ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-800 border-gray-700'}`}>
            <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-all ${onlyInStock ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
        <span className="text-sm font-medium">Только в наличии</span>
    </label>
</div>

                {/* Сетка товаров */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-gray-900/50 rounded-3xl animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map(p => {
                            const prodImg = p.image_url || p.ImageURL;
                            const quantity = p.Quantity !== undefined ? p.Quantity : p.quantity;
                            return (
                                <div key={p.ID || p.id} className="bg-gray-900/40 border border-gray-800 p-0 rounded-3xl hover:border-indigo-500/50 transition-all group overflow-hidden flex flex-col">
                                    <div className="relative h-48 bg-gray-950 flex items-center justify-center overflow-hidden">
                                        {prodImg ? (
                                            <img src={`http://localhost:8080${prodImg}`} alt={p.Name || p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-gray-700">
                                                <ImageIcon size={40} strokeWidth={1} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                                            </div>
                                        )}
                                        
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
    <h4 className="font-bold text-lg mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">{p.Name || p.name}</h4>
    <p className="text-xs text-slate-400 line-clamp-2 mb-6 font-light">{p.Description || p.description}</p>
    
    {/* Добавляем статус наличия здесь, под описанием и над ценой */}
    <div className="mb-4">
        {quantity > 0 ? (
            <span className="text-[10px] bg-emerald-500/20 backdrop-blur-md text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/30 font-bold inline-block">
                В наличии: {quantity}
            </span>
        ) : (
            <span className="text-[10px] bg-rose-500/20 backdrop-blur-md text-rose-400 px-2 py-1 rounded-lg border border-rose-500/30 font-bold inline-block">
                Раскуплено
            </span>
        )}
    </div>
    

    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
        <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Цена</p>
            <span className="text-xl font-black text-white">
    от {Math.min(...(p.sellers?.map(s => s.price) || [p.price]))} ₸
</span>
<button
    onClick={() =>
        setOpenSellers(prev => ({
            ...prev,
            [p.id]: !prev[p.id]
        }))
    }
    className="text-xs text-indigo-400 hover:text-indigo-300 mb-2"
>
    Продавцы ({p.sellers.length})
</button>
{openSellers[p.id] && (
    <div className="mb-3 space-y-2">
        
        {p.sellers.map((s, index) => {
            const isSelected = selectedSeller[p.id]?.sellerId === s.sellerId;

            return (
                <div
                    key={index}
                    className={`p-2 rounded-lg border flex justify-between items-center cursor-pointer ${
                        isSelected
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-gray-700"
                    }`}
                    onClick={() =>
                        setSelectedSeller(prev => ({
                            ...prev,
                            [p.id]: { ...s, sellerId: s.sellerId }
                        }))
                    }
                >
                    <div>
                        <p className="text-xs text-slate-300">
                            Продавец #{s.sellerId}
                        </p>
                        <p className="text-xs text-slate-500">
                            Остаток: {s.quantity}
                        </p>
                    </div>

                    <div className="font-bold text-indigo-400">
                        {s.price.toLocaleString()} ₸
                    </div>
                </div>
            );
        })}
    </div>
)}

        </div>
        <button 
    onClick={() => handleAddClick(p)}
    disabled={quantity <= 0}
    className="p-4 bg-indigo-600 rounded-2xl hover:bg-indigo-500 disabled:opacity-20 disabled:grayscale transition-all shadow-lg shadow-indigo-600/20 active:scale-90"
>
    <Plus className="w-5 h-5 text-white" />
</button>
    </div>
</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {isCartOpen && (
    <div className="fixed inset-0 z-[100] flex justify-end">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
        <div className="relative w-full max-w-md bg-[#090d16] border-l border-gray-800 p-8 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingBasket className="text-indigo-400" /> Корзина
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-4">
                        <ShoppingBasket size={48} strokeWidth={1} />
                        <p>Ваша корзина пуста</p>
                    </div>
                ) : (
                    cart.map(item => {
                        // Находим товар в общем списке, чтобы узнать лимит (Quantity)
                        const product = products.find(p => (p.ID || p.id) === item.id);
                        const maxQty = product ? (product.Quantity ?? product.quantity) : 0;

                        return (
                            <div key={item.key} className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm">{item.name}</p>
                                    <p className="text-indigo-400 font-bold">{item.price.toLocaleString()} ₸</p>
                                </div>
                                
                                <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1">
                                    <button 
                                        onClick={() => removeFromCart(item.key)}
                                        className="p-1 hover:bg-gray-800 rounded text-slate-400 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                    <span className="font-bold w-6 text-center">{item.count}</span>
                                    <button 
                                        onClick={() => {
    const product = products.find(
        p => (p.ID || p.id) === item.id
    );

    if (!product) return;

    const seller = product.sellers?.find(
        s => s.sellerId === item.sellerId
    );

    if (!seller) return;

    addToCart(product, seller);
}}
                                        disabled={item.count >= maxQty}
                                        className="p-1 hover:bg-gray-800 rounded text-slate-400 hover:text-white disabled:opacity-30"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="pt-6 border-t border-gray-800 mt-6">
                <div className="flex justify-between text-2xl font-black mb-6">
                    <span>Итого:</span>
                    <span className="text-indigo-400">{cartTotal.toLocaleString()} ₸</span>
                </div>
                <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-slate-500 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl shadow-indigo-600/20 text-white"
                >
                    Оплатить заказ
                </button>
            </div>
        </div>
    </div>
)}
{sellerModalProduct && (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
        
        {/* overlay */}
        <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSellerModalProduct(null)}
        />

        {/* modal */}
        <div className="relative w-[420px] bg-[#0f1422] border border-gray-800 rounded-2xl p-6 shadow-2xl">
            
            <h3 className="text-lg font-bold mb-4">
                Выбор продавца
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {sellerModalProduct.sellers.map((s, index) => {
                    const isSelected =
                        selectedSeller[sellerModalProduct.id]?.sellerId === s.sellerId;

                    return (
                        <div
                            key={index}
                            onClick={() =>
                                setSelectedSeller(prev => ({
                                    ...prev,
                                    [sellerModalProduct.id]: s
                                }))
                            }
                            className={`p-3 rounded-xl border cursor-pointer transition ${
                                isSelected
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-gray-700 hover:border-gray-500"
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold">
                                        Продавец #{s.sellerId}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Остаток: {s.quantity}
                                    </p>
                                </div>

                                <div className="text-indigo-400 font-bold">
                                    {s.price.toLocaleString()} ₸
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* buttons */}
            <div className="flex gap-3 mt-5">
                
                <button
                    onClick={() => setSellerModalProduct(null)}
                    className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700"
                >
                    Отмена
                </button>

                <button
    onClick={() => {
        const sel = selectedSeller[sellerModalProduct.id];

        if (!sel) return;

        addToCart(
            sellerModalProduct,
            sel
        );

        setSellerModalProduct(null);
    }}
    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500"
>
    Добавить
</button>

            </div>
        </div>
    </div>
)}
{/* Toast уведомления */}
<div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3">
    {toasts.map(toast => (
        <div
            key={toast.id}
            className="min-w-[320px] max-w-[380px] bg-gray-900/95 border border-indigo-500/30 backdrop-blur-xl rounded-2xl px-4 py-4 shadow-2xl animate-[slideIn_.3s_ease]"
        >
            <div className="flex items-start gap-3">
                
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                        Новое уведомление
                    </p>

                    <p className="text-sm text-slate-300 mt-1 break-words">
                        {toast.message}
                    </p>
                </div>

                <button
                    onClick={() => removeToast(toast.id)}
                    className="text-slate-500 hover:text-white transition"
                >
                    <X size={16} />
                </button>

            </div>
        </div>
    ))}
</div>
        </div>
    );
};

export default Customer;
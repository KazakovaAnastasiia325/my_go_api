import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShoppingCart, Search, SlidersHorizontal, Plus, X, 
    ShoppingBasket, AlertCircle, Package, SearchCode, ChevronRight 
} from 'lucide-react';

const MOCK_PRODUCTS = [
    { ID: 1, Name: "Игровая клавиатура CyberKey", Description: "Механическая клавиатура с RGB-подсветкой.", Price: 24900, Quantity: 15 },
    { ID: 2, Name: "Беспроводная мышь AirGlide", Description: "Легкая игровая мышь с сенсором 16000 DPI.", Price: 18500, Quantity: 4 },
    { ID: 3, Name: "Игровые наушники VoidSound Pro", Description: "Гарнитура с объемным звуком 7.1.", Price: 32000, Quantity: 0 },
    { ID: 4, Name: "Коврик для мыши NeonMap XL", Description: "Огромный игровой коврик с неоновым принтом.", Price: 6500, Quantity: 45 }
];

const Customer = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMocked, setIsMocked] = useState(false);
    
    const [maxPrice, setMaxPrice] = useState(100000);
    const [onlyInStock, setOnlyInStock] = useState(false);

    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Загрузка данных
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:8080/api/catalog');
                if (!response.ok) throw new Error('Бэкенд недоступен');
                const data = await response.json();
                setProducts(Array.isArray(data) ? data : []);
                setIsMocked(false);
            } catch (err) {
                console.warn("Используем демо-данные");
                setProducts(MOCK_PRODUCTS);
                setIsMocked(true);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const highestProductPrice = useMemo(() => {
        if (!products.length) return 100000;
        return Math.max(...products.map(p => p.Price || p.price || 0));
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const name = (p.Name || p.name || '').toLowerCase();
            const price = p.Price || p.price || 0;
            const qty = p.Quantity !== undefined ? p.Quantity : p.quantity;
            
            return name.includes(searchTerm.toLowerCase()) && 
                   price <= maxPrice && 
                   (!onlyInStock || qty > 0);
        });
    }, [products, searchTerm, maxPrice, onlyInStock]);

    const addToCart = (product) => {
        setCart(prev => {
            const id = product.ID || product.id;
            const existing = prev.find(item => item.id === id);
            if (existing) {
                return prev.map(item => item.id === id ? {...item, count: item.count + 1} : item);
            }
            return [...prev, { id, name: product.Name || product.name, price: product.Price || product.price, count: 1 }];
        });
    };

    const cartCount = cart.reduce((sum, item) => sum + item.count, 0);
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.count), 0);
    const handleCheckout = () => {
        if (cart.length === 0) return; // Если пусто, ничего не делаем

        alert(`Заказ на сумму ${cartTotal} ₸ успешно оформлен! Спасибо за покупку в CyberMart.`);
    
        setCart([]); // Очищаем корзину
        setIsCartOpen(false); // Закрываем шторку корзины
    };
    return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 font-['Plus_Jakarta_Sans']">
            {/* Навигация */}
            <nav className="sticky top-0 z-50 bg-[#090d16]/80 backdrop-blur-md border-b border-gray-800 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">C</div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent">CyberMart</span>
                    </div>

                    <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl hover:scale-105 transition-all">
                        <ShoppingCart className="w-5 h-5" />
                        <span>Корзина</span>
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-pink-500 w-5 h-5 rounded-full text-[10px] flex items-center justify-center animate-bounce font-bold">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Промо-баннер */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border border-indigo-500/10 rounded-3xl p-10 mb-10 shadow-2xl">
                    <div className="relative z-10">
                        <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold">Cyber Sale 2026</span>
                        <h1 className="text-4xl font-black mt-4 mb-2">Личный Кабинет</h1>
                        <p className="text-slate-400 max-w-xl">Лучшие игровые девайсы с доставкой в твой сектор.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Фильтры */}
                    <aside className="bg-gray-900/40 border border-gray-800 p-6 rounded-2xl h-fit sticky top-24">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                            <SlidersHorizontal className="w-5 h-5 text-indigo-400" /> Фильтры
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Поиск</label>
                                <div className="relative mt-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-black/40 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-indigo-500 outline-none"
                                        placeholder="Название..."
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[10px] uppercase font-bold mb-2">
                                    <span className="text-slate-500">Цена до:</span>
                                    <span className="text-indigo-400">{maxPrice} ₸</span>
                                </div>
                                <input 
                                    type="range" min="0" max={highestProductPrice} value={maxPrice}
                                    onChange={e => setMaxPrice(Number(e.target.value))}
                                    className="w-full accent-indigo-500"
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={onlyInStock} onChange={e => setOnlyInStock(e.target.checked)} className="hidden" />
                                <div className={`w-10 h-5 rounded-full transition-all border ${onlyInStock ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-800 border-gray-700'}`}>
                                    <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-all ${onlyInStock ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                                <span className="text-sm font-medium">В наличии</span>
                            </label>
                        </div>
                    </aside>

                    {/* Сетка товаров */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-900/50 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredProducts.map(p => (
                                    <div key={p.ID || p.id} className="bg-gray-900/40 border border-gray-800 p-6 rounded-2xl hover:border-indigo-500/50 transition-all group relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-[10px] font-mono text-slate-500">#SKU-{p.ID || p.id}</span>
                                            {(p.Quantity || p.quantity) > 0 ? (
                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">В наличии</span>
                                            ) : (
                                                <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">Нет мест</span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-lg mb-2 group-hover:text-indigo-400 transition-colors">{p.Name || p.name}</h4>
                                        <p className="text-sm text-slate-400 line-clamp-2 mb-6">{p.Description || p.description}</p>
                                        
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xl font-black text-white">{p.Price || p.price} ₸</span>
                                            <button 
                                                onClick={() => addToCart(p)}
                                                disabled={!(p.Quantity || p.quantity)}
                                                className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Корзина Drawer */}
            {isCartOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
                    <div className="relative w-full max-w-md bg-[#090d16] border-l border-gray-800 p-8 shadow-2xl flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><ShoppingBasket className="text-indigo-400" /> Корзина</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 text-slate-600">Пусто...</div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{item.name}</p>
                                            <p className="text-indigo-400">{item.price} ₸ x {item.count}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-6 border-t border-gray-800 mt-6">
                            <div className="flex justify-between text-2xl font-black mb-6">
                                <span>Итого:</span>
                                <span className="text-indigo-400">{cartTotal} ₸</span>
                            </div>
                            <button 
                                onClick={handleCheckout} // Добавляем событие клика
                                disabled={cart.length === 0} // Кнопка не активна, если корзина пуста
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-slate-500 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
                            >
                                Оплатить заказ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customer;
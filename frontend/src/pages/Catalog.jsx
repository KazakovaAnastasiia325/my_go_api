import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, X, Package } from 'lucide-react';

const Catalog = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8080/api/catalog-products') 
            .then(res => res.json())
            .then(data => setProducts(data || []))
            .catch(err => console.error("Ошибка загрузки:", err));
    }, []);

    const addToCart = (product) => {
        setCart(prev => [...prev, product]);
    };

    const totalPrice = cart.reduce((sum, item) => sum + (Number(item.Price) || 0), 0);

    return (
        <div className="min-h-screen bg-[#030712] text-white">
            <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
                <nav className="max-w-7xl mx-auto p-4 flex justify-between items-center" aria-label="Основная навигация">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold shadow-[0_0_15px_rgba(99,102,241,0.5)]">C</div>
                        <span className="text-xl font-bold tracking-tight">CyberMart</span>
                    </div>
                    
                    <button 
                        onClick={() => setIsCartOpen(true)} 
                        className="relative p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all group"
                        aria-label="Открыть корзину"
                    >
                        <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-pink-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </nav>
            </header>

            <main className="p-6 max-w-6xl mx-auto">
                <header className="flex items-center gap-3 mb-8">
                    <Package className="text-indigo-400" />
                    <h1 className="text-3xl font-bold">Каталог товаров</h1>
                </header>

                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" aria-label="Список товаров">
                    {products.length === 0 ? (
                        <article className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                            <p className="text-gray-500">Товаров пока нет в базе данных...</p>
                        </article>
                    ) : (
                        products.map(p => (
                            <article key={p.ID} className="group bg-gray-900/40 border border-gray-800 p-5 rounded-2xl hover:border-indigo-500/50 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                                <figure className="aspect-square bg-gray-800 rounded-xl mb-4 flex items-center justify-center">
                                    <Package className="w-12 h-12 text-gray-700" />
                                </figure>
                                <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{p.Name}</h3>
                                <p className="text-gray-400 text-sm my-3 leading-relaxed">{p.Description}</p>
                                <footer className="flex justify-between items-center mt-6">
                                    <span className="text-2xl font-black text-white">{p.Price} <span className="text-sm text-indigo-400">₸</span></span>
                                    <button 
                                        onClick={() => addToCart(p)}
                                        className="bg-indigo-600 p-3 rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                                        aria-label="Добавить в корзину"
                                    >
                                        <Plus className="w-6 h-6 text-white" />
                                    </button>
                                </footer>
                            </article>
                        ))
                    )}
                </section>
            </main>

            {isCartOpen && (
                <aside className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
                    <section className="absolute inset-y-0 right-0 w-full max-w-md bg-[#090d16] border-l border-gray-800 shadow-2xl p-6 flex flex-col">
                        <header className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <ShoppingCart className="text-indigo-400" /> Корзина
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {cart.length === 0 ? (
                                <p className="text-center text-gray-500 mt-10">Ваша корзина пуста</p>
                            ) : (
                                cart.map((item, idx) => (
                                    <article key={idx} className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{item.Name}</p>
                                            <p className="text-indigo-400 text-sm">{item.Price} ₸</p>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>

                        <footer className="mt-auto pt-6 border-t border-gray-800">
                            <div className="flex justify-between text-xl font-bold mb-6">
                                <span>Итого:</span>
                                <span className="text-indigo-400">{totalPrice} ₸</span>
                            </div>
                            <button 
                                className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
                                onClick={() => alert('Заказ оформлен!')}
                            >
                                Оформить заказ
                            </button>
                        </footer>
                    </section>
                </aside>
            )}
        </div>
    );
};

export default Catalog;
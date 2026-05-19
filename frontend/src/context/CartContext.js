import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (err) {
                console.error('Error loading cart:', err);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const getKey = (it) => {
        const pid = Number(it?.product_id || it?.id || 0);
        const oid = Number(it?.offer_id || 0);

        // ✅ product_offer
        if (pid > 0 && oid > 0) return `po-${pid}-${oid}`;

        // ✅ other offer
        if (oid > 0) return `o-${oid}`;

        // ✅ product
        return `p-${pid}`;
    };



    const addToCart = (product, quantity = 1) => {
        setCart(prevCart => {
            const key = getKey(product);

            const existingItem = prevCart.find(item => getKey(item) === key);

            if (existingItem) {
                return prevCart.map(item =>
                    getKey(item) === key
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [...prevCart, { ...product, quantity }];
        });
    };

    // ✅ key generator

    // ✅ helper: convert "idOrItem" -> key
    const toKey = (idOrItem) => {
        if (idOrItem && typeof idOrItem === "object") return getKey(idOrItem);

        const raw = String(idOrItem ?? "").trim();

        // po-3-12
        if (raw.startsWith("po-")) return raw;

        // offer-12
        if (raw.startsWith("offer-")) {
            const n = Number(raw.replace("offer-", ""));
            return Number.isFinite(n) ? `o-${n}` : raw;
        }

        // product id
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) return `p-${n}`;

        return raw;
    };


    const removeFromCart = (idOrItem) => {
        const targetKey = toKey(idOrItem);

        setCart((prev) => prev.filter((it) => getKey(it) !== targetKey));
    };

    const updateQuantity = (idOrItem, quantity) => {
        const qty = Number(quantity || 0);

        if (qty <= 0) {
            removeFromCart(idOrItem);
            return;
        }

        const targetKey = toKey(idOrItem);

        setCart((prev) =>
            prev.map((it) =>
                getKey(it) === targetKey ? { ...it, quantity: qty } : it
            )
        );
    };


    const clearCart = () => {
        setCart([]);
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        itemCount: cart.length
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

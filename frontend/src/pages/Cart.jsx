import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import '../styles/cart-page.css';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

    if (cart.length === 0) {
        return (
            <main className="container cart-page">
                <h1>Shopping Cart</h1>
                <div className="empty-cart">
                    <i className="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <Link to="/products/office" className="btn btn-primary">Continue Shopping</Link>
                </div>
            </main>
        );
    }
    const getRowKey = (it) => (it?.offer_id ? `o-${it.offer_id}` : `p-${it.id}`);

    return (
        <main className="container cart-page">
            <h1>Shopping Cart</h1>

            <div className="cart-layout">
                <div className="cart-items-section">
                    <div className="cart-items">

                        {cart.map(item => (
                            <CartItem
                                key={getRowKey(item)}
                                item={item}
                                onUpdateQuantity={updateQuantity}
                                onRemove={removeFromCart}
                            />
                        ))}
                    </div>

                    <button onClick={clearCart} className="btn btn-danger clear-cart-btn">
                        Clear Cart
                    </button>
                </div>

                <div className="cart-summary">
                    <h2>Order Summary</h2>

                    <div className="summary-item">
                        <span>Subtotal:</span>
                        <span>${getTotalPrice().toFixed(2)}</span>
                    </div>

                    <div className="summary-item">
                        <span>Shipping:</span>
                        <span>Free</span>
                    </div>

                    <div className="summary-item">
                        <span>Tax:</span>
                        <span>${(getTotalPrice() * 0.).toFixed(2)}</span>
                    </div>

                    <div className="summary-total">
                        <span>Total:</span>
                        <span>${(getTotalPrice() * 1).toFixed(2)}</span>
                    </div>

                    <Link to="/checkout" className="btn btn-success checkout-btn continue-shopping-btn">
                        Proceed to Checkout
                    </Link>


                </div>
            </div>
        </main>
    );
};

export default Cart;

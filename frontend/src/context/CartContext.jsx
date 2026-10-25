import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user, token, apiUrl } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Load cart items
  useEffect(() => {
    const fetchCart = async () => {
      if (token) {
        try {
          const res = await fetch(`${apiUrl}/cart`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setCartItems(data);
          }
        } catch (err) {
          console.error('Failed to fetch cart:', err);
        }
      } else {
        // Guest cart
        const guestCart = localStorage.getItem('exmart_guest_cart');
        if (guestCart) {
          try {
            setCartItems(JSON.parse(guestCart));
          } catch (e) {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
      setLoading(false);
    };

    fetchCart();
  }, [token, apiUrl]);

  // 2. Synchronize guest cart to server on login
  useEffect(() => {
    const syncGuestCart = async () => {
      if (token && cartItems.length > 0) {
        const guestCartStr = localStorage.getItem('exmart_guest_cart');

        if (guestCartStr) {
          try {
            const guestCart = JSON.parse(guestCartStr);            if (guestCart.length > 0) {
              console.log('Syncing guest cart to database...');
              // Add all guest items to database
              for (const item of guestCart) {
                await fetch(`${apiUrl}/cart`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    product_id: item.product_id || item.id,
                    quantity: item.quantity
                  })
                });
              }
              // Clear guest cart
              localStorage.removeItem('exmart_guest_cart');
              // Reload server cart
              const res = await fetch(`${apiUrl}/cart`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (res.ok) {
                const data = await res.json();
                setCartItems(data);
              }
            }
          } catch (err) {
            console.error('Failed to sync guest cart:', err);
          }
        }
      }
    };

    if (token) {
      syncGuestCart();
    }
  }, [token, apiUrl]);

  // 3. Add to Cart / Update Quantity
  const addToCart = async (product, quantity = 1) => {
    if (token) {
      try {
        const res = await fetch(`${apiUrl}/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            product_id: product.id,
            quantity: quantity
          })
        });
        const data = await res.json();
        if (res.ok) {
          setCartItems(data.cart);
        } else {
          throw new Error(data.error || 'Failed to update cart');
        }
      } catch (err) {
        throw err;
      }
    } else {
      // Guest local storage update
      const updated = [...cartItems];
      const existIdx = updated.findIndex(item => item.product_id === product.id || item.id === product.id);

      if (existIdx >= 0) {
        updated[existIdx].quantity = quantity;
      } else {
        updated.push({
          product_id: product.id,
          id: product.id,
          quantity: quantity,
          name: product.name,
          price: product.price,
          unit: product.unit,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          category: product.category
        });
      }
      setCartItems(updated);
      localStorage.setItem('exmart_guest_cart', JSON.stringify(updated));
    }
  };

  // 4. Remove from Cart
  const removeFromCart = async (productId) => {
    if (token) {
      try {
        const res = await fetch(`${apiUrl}/cart/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setCartItems(data.cart);
        } else {
          throw new Error(data.error || 'Failed to remove item');
        }
      } catch (err) {
        throw err;
      }
    } else {
      // Guest
      const updated = cartItems.filter(item => item.product_id !== productId && item.id !== productId);
      setCartItems(updated);
      localStorage.setItem('exmart_guest_cart', JSON.stringify(updated));
    }
  };

  // 5. Clear Cart
  const clearCart = async () => {
    if (token) {
      try {
        const res = await fetch(`${apiUrl}/cart`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          setCartItems([]);
        }
      } catch (err) {
        console.error('Failed to clear cart:', err);
      }
    } else {
      setCartItems([]);
      localStorage.removeItem('exmart_guest_cart');
    }
  };

  // Calculate cart counts & subtotal
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const value = {
    cartItems,
    loading,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

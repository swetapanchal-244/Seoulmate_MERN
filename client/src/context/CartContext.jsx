import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const { user } = useAuth()
    const [items, setItems] = useState([])

    const storageKey = user ? `cart_${user._id}` : null

    useEffect(() => {
        if (!storageKey) {
            setItems([])
            return
        }
        const stored = localStorage.getItem(storageKey)
        setItems(stored ? JSON.parse(stored) : [])
    }, [storageKey])

    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(items))
        }
    }, [items, storageKey])

    const addItem = (dish, quantity = 1) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.dishId === dish._id)
            if (existing) {
                return prev.map((i) =>
                    i.dishId === dish._id ? { ...i, quantity: i.quantity + quantity } : i
                )
            }
            return [
                ...prev,
                {
                    dishId: dish._id,
                    name: dish.name,
                    price: dish.price,
                    img: dish.img,
                    quantity,
                },
            ]
        })
    }

    const removeItem = (dishId) => {
        setItems((prev) => prev.filter((i) => i.dishId !== dishId))
    }

    const updateQuantity = (dishId, quantity) => {
        if (quantity < 1) {
            removeItem(dishId)
            return
        }
        setItems((prev) =>
            prev.map((i) => (i.dishId === dishId ? { ...i, quantity } : i))
        )
    }

    const clearCart = () => setItems([])

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

    return (
        <CartContext.Provider
            value={{ items, addItem, removeItem, updateQuantity, clearCart, totalAmount, totalItems }}
        >
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
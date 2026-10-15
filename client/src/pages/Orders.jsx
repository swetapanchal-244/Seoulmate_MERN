import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import loadRazorpay from '../utils/loadRazorpay.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { API_URL } from '../api.js'

const ORDERS_API = `${API_URL}/api/orders`
const PAYMENT_API = `${API_URL}/api/payment`

export default function Orders() {
    const { user, token } = useAuth()
    const { items, updateQuantity, removeItem, totalAmount, clearCart } = useCart()
    const navigate = useNavigate()

    const [paying, setPaying] = useState(false)
    const [payError, setPayError] = useState('')
    const [pastOrders, setPastOrders] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [justPaid, setJustPaid] = useState(false)

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: '/orders' } })
        } else if (user.role !== 'user') {
            navigate(user.role === 'admin' ? '/admin/dashboard' : '/owner/dashboard')
        }
    }, [user, navigate])

    const fetchMyOrders = async () => {
        try {
            const res = await fetch(`${ORDERS_API}/my`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (data.success) setPastOrders(data.orders)
        } catch (err) {
            // ignore silently, past orders are non-critical here
        }
        setLoadingOrders(false)
    }

    useEffect(() => {
        if (token) fetchMyOrders()
    }, [token])

    const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }

    const handlePayment = async () => {
        setPayError('')
        setJustPaid(false)
        setPaying(true)

        try {
            const loaded = await loadRazorpay()
            if (!loaded) {
                setPayError('Could not load Razorpay. Check your internet connection.')
                setPaying(false)
                return
            }

            // 1) Server pe order banao (amount server DB se calculate karta hai)
            const res = await fetch(`${PAYMENT_API}/create-order`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    items: items.map((i) => ({ dishId: i.dishId, name: i.name, quantity: i.quantity })),
                }),
            })
            const data = await res.json()

            if (!data.success) {
                setPayError(data.message || 'Could not start payment')
                setPaying(false)
                return
            }

            // 2) Razorpay checkout popup kholo
            const rzp = new window.Razorpay({
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                order_id: data.razorpayOrderId,
                name: 'Seoulmate',
                description: 'Food order',
                prefill: {
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    email: user.email,
                },
                theme: { color: '#d4af37' },
                handler: async (response) => {
                    // 3) Payment ho gayi, ab server pe signature verify karwao
                    try {
                        const verifyRes = await fetch(`${PAYMENT_API}/verify`, {
                            method: 'POST',
                            headers: authHeaders,
                            body: JSON.stringify(response),
                        })
                        const verifyData = await verifyRes.json()

                        if (verifyData.success) {
                            clearCart()
                            setJustPaid(true)
                            fetchMyOrders()
                        } else {
                            setPayError(verifyData.message || 'Payment verification failed')
                        }
                    } catch (err) {
                        setPayError('Payment done but verification failed. Please contact support.')
                    }
                    setPaying(false)
                },
                modal: {
                    ondismiss: () => {
                        fetch(`${PAYMENT_API}/failed`, {
                            method: 'POST',
                            headers: authHeaders,
                            body: JSON.stringify({ razorpay_order_id: data.razorpayOrderId }),
                        }).catch(() => { })
                        setPaying(false)
                    },
                },
            })

            rzp.on('payment.failed', (resp) => {
                setPayError(resp?.error?.description || 'Payment failed. Please try again.')
            })

            rzp.open()
        } catch (err) {
            setPayError('Server not reachable')
            setPaying(false)
        }
    }

    if (!user || user.role !== 'user') return null

    return (
        <>
            <Navbar />
            <section className="orders-page">
                <p className="section-kicker">Your cart</p>
                <h1 className="section-title">Orders</h1>

                {justPaid && (
                    <p className="auth-error" style={{ borderColor: '#8fc24a', color: '#8fc24a', background: 'rgba(143,194,74,0.08)' }}>
                        Payment successful — your order has been placed!
                    </p>
                )}

                {items.length === 0 ? (
                    <div className="cart-empty">
                        <p className="admin-empty">Your cart is empty.</p>
                        <Link to="/#menu" className="btn btn-ghost">Browse the menu</Link>
                    </div>
                ) : (
                    <div className="cart-list">
                        {items.map((item) => (
                            <div className="cart-item" key={item.dishId}>
                                <img src={item.img} alt={item.name} />
                                <div className="cart-item-info">
                                    <h4>{item.name}</h4>
                                    <span className="price">₹{item.price} each</span>
                                </div>
                                <div className="qty-stepper">
                                    <button onClick={() => updateQuantity(item.dishId, item.quantity - 1)}>−</button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.dishId, item.quantity + 1)}>+</button>
                                </div>
                                <span className="cart-item-total">₹{item.price * item.quantity}</span>
                                <button className="cart-remove" onClick={() => removeItem(item.dishId)} aria-label="Remove item">✕</button>
                            </div>
                        ))}

                        <div className="cart-summary">
                            <span>Total</span>
                            <span className="cart-total-amount">₹{totalAmount}</span>
                        </div>

                        {payError && <p className="auth-error">{payError}</p>}

                        <button className="btn btn-primary form-submit" onClick={handlePayment} disabled={paying}>
                            {paying ? 'Processing...' : 'Proceed to payment'}
                        </button>
                    </div>
                )}

                <div className="admin-section" style={{ marginTop: '4rem' }}>
                    <h3 className="admin-section-title">Order history</h3>
                    {loadingOrders ? (
                        <p className="admin-empty">Loading...</p>
                    ) : pastOrders.length === 0 ? (
                        <p className="admin-empty">No past orders yet.</p>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Order</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pastOrders.map((o) => (
                                        <tr key={o._id}>
                                            <td>{o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</td>
                                            <td>₹{o.totalAmount}</td>
                                            <td><span className={`status-pill ${o.status === 'paid' ? 'status-confirmed' : 'status-cancelled'}`}>{o.status}</span></td>
                                            <td>
                                                {o.status === 'paid' ? (
                                                    <span className={`status-pill status-${o.fulfillment || 'placed'}`}>
                                                        {o.fulfillment || 'placed'}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
            <Footer />
        </>
    )
}
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import MenuManager from '../components/MenuManager.jsx'
import { API_URL } from '../api.js'

const RESERVATIONS_API = `${API_URL}/api/reservations`
const USERS_API = `${API_URL}/api/auth/users`
const ORDERS_API = `${API_URL}/api/orders`

const NEXT_FULFILLMENT = { placed: 'preparing', preparing: 'ready', ready: 'delivered' }
const NEXT_LABEL = { placed: 'Start preparing', preparing: 'Mark ready', ready: 'Mark delivered' }
const getFulfillment = (o) => o.fulfillment || 'placed'

export default function AdminDashboard() {
    const { token, logout } = useAuth()
    const navigate = useNavigate()

    const [reservations, setReservations] = useState([])
    const [users, setUsers] = useState([])
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('reservations')

    const fetchAll = async (silent = false) => {
        if (!silent) setLoading(true)
        setError('')
        try {
            const [resReservations, resUsers, resOrders] = await Promise.all([
                fetch(RESERVATIONS_API, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(USERS_API, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(ORDERS_API, { headers: { Authorization: `Bearer ${token}` } }),
            ])
            const dataReservations = await resReservations.json()
            const dataUsers = await resUsers.json()
            const dataOrders = await resOrders.json()

            if (dataReservations.success) {
                setReservations(dataReservations.reservations || [])
            } else {
                setError(dataReservations.message || 'Could not load reservations')
            }

            if (dataUsers.success) {
                setUsers(dataUsers.users || [])
            }

            if (dataOrders.success) {
                setOrders(dataOrders.orders || [])
            }
        } catch (err) {
            setError('Server not reachable')
        }
        setLoading(false)
    }

    useEffect(() => {
        if (!token) return
        fetchAll()

        // Har 15 second me background me chupke se naya data check karo
        const interval = setInterval(() => fetchAll(true), 15000)
        return () => clearInterval(interval)
    }, [token])

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`${RESERVATIONS_API}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            })
            const data = await res.json()
            if (data.success) {
                setReservations((prev) =>
                    prev.map((r) => (r._id === id ? { ...r, status } : r))
                )
            }
        } catch (err) {
            setError('Could not update status')
        }
    }

    const updateOrderStatus = async (id, fulfillment) => {
        try {
            const res = await fetch(`${ORDERS_API}/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ fulfillment }),
            })
            const data = await res.json()
            if (data.success) {
                setOrders((prev) =>
                    prev.map((o) => (o._id === id ? { ...o, fulfillment } : o))
                )
            } else {
                setError(data.message || 'Could not update order')
            }
        } catch (err) {
            setError('Could not update order')
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const pendingCount = useMemo(
        () => reservations.filter((r) => r.status === 'pending').length,
        [reservations]
    )

    const totalRevenue = useMemo(
        () => orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        [orders]
    )

    // Admin dashboard is for staff to look up customers, not other staff.
    // Owner-promoted admins/owner accounts are managed in the Owner panel instead.
    const customerUsers = useMemo(
        () => users.filter((u) => u.role === 'user'),
        [users]
    )

    return (
        <section className="admin-shell">
            <div className="admin-header">
                <div>
                    <p className="auth-kicker">Seoulmate</p>
                    <h2 className="section-title">Admin dashboard</h2>
                </div>
                <div className="admin-header-actions">
                    <Link to="/" className="btn btn-ghost">&larr; Back to home</Link>
                    <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
                </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            {!loading && (
                <div className="admin-stats">
                    <div className="admin-stat-card">
                        <span className="admin-stat-num">{customerUsers.length}</span>
                        <span className="admin-stat-label">Registered users</span>
                    </div>
                    <div className="admin-stat-card">
                        <span className="admin-stat-num">{reservations.length}</span>
                        <span className="admin-stat-label">Total reservations</span>
                    </div>
                    <div className="admin-stat-card admin-stat-card-pending">
                        <span className="admin-stat-num">{pendingCount}</span>
                        <span className="admin-stat-label">Awaiting approval</span>
                    </div>
                    <div className="admin-stat-card">
                        <span className="admin-stat-num">{orders.length}</span>
                        <span className="admin-stat-label">Total orders</span>
                    </div>
                    <div className="admin-stat-card">
                        <span className="admin-stat-num">₹{totalRevenue}</span>
                        <span className="admin-stat-label">Revenue (paid orders)</span>
                    </div>
                </div>
            )}

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'reservations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reservations')}
                >
                    Reservations
                </button>
                <button
                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button
                    className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Orders
                </button>
                <button
                    className={`admin-tab ${activeTab === 'menu' ? 'active' : ''}`}
                    onClick={() => setActiveTab('menu')}
                >
                    Manage menu
                </button>
            </div>

            {loading && <p className="admin-empty">Loading dashboard...</p>}

            {!loading && activeTab === 'reservations' && (
                <div className="admin-panel">
                    {reservations.length === 0 ? (
                        <p className="admin-empty">No reservations yet.</p>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Table</th>
                                        <th>Account</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.map((r) => (
                                        <tr key={r._id}>
                                            <td>{r.name}</td>
                                            <td>{r.phone}</td>
                                            <td>{r.date}</td>
                                            <td>{r.time}</td>
                                            <td>Table {r.tableNumber} · {r.guests} {r.guests === 1 ? 'guest' : 'guests'}</td>
                                            <td>{r.user?.email || '—'}</td>
                                            <td>
                                                <span className={`status-pill status-${r.status}`}>{r.status}</span>
                                            </td>
                                            <td className="admin-actions">
                                                <button
                                                    className="btn-mini btn-confirm"
                                                    disabled={r.status !== 'pending'}
                                                    onClick={() => updateStatus(r._id, 'confirmed')}
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    className="btn-mini btn-cancel"
                                                    disabled={r.status === 'cancelled'}
                                                    onClick={() => updateStatus(r._id, 'cancelled')}
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!loading && activeTab === 'users' && (
                <div className="admin-panel">
                    {customerUsers.length === 0 ? (
                        <p className="admin-empty">No users registered yet.</p>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerUsers.map((u) => (
                                        <tr key={u._id}>
                                            <td>{u.firstName} {u.lastName}</td>
                                            <td>{u.email}</td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {!loading && activeTab === 'orders' && (
                <div className="admin-panel">
                    {orders.length === 0 ? (
                        <p className="admin-empty">No orders yet.</p>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Payment ID</th>
                                        <th>Payment</th>
                                        <th>Order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o) => (
                                        <tr key={o._id}>
                                            <td>{new Date(o.createdAt).toLocaleString()}</td>
                                            <td>
                                                {o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Deleted user'}
                                                <div className="menu-cell-sub">{o.user?.email || ''}</div>
                                            </td>
                                            <td>
                                                {o.items.map((i, idx) => (
                                                    <div key={idx}>{i.quantity} × {i.name}</div>
                                                ))}
                                            </td>
                                            <td>₹{o.totalAmount}</td>
                                            <td>{o.paymentId || '—'}</td>
                                            <td>
                                                <span className={`status-pill ${o.status === 'paid' ? 'status-confirmed' : 'status-cancelled'}`}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td>
                                                {o.status === 'paid' ? (
                                                    <>
                                                        <span className={`status-pill status-${getFulfillment(o)}`}>
                                                            {getFulfillment(o)}
                                                        </span>
                                                        {NEXT_FULFILLMENT[getFulfillment(o)] && (
                                                            <button
                                                                className="btn-mini btn-confirm"
                                                                style={{ marginLeft: '0.6rem' }}
                                                                onClick={() => updateOrderStatus(o._id, NEXT_FULFILLMENT[getFulfillment(o)])}
                                                            >
                                                                {NEXT_LABEL[getFulfillment(o)]}
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'menu' && <MenuManager token={token} />}
        </section>
    )
}
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import MenuManager from '../components/MenuManager.jsx'
import { API_URL } from '../api.js'

const AUTH_BASE = `${API_URL}/api/auth`
const RESERVATIONS_BASE = `${API_URL}/api/reservations`
const ORDERS_BASE = `${API_URL}/api/orders`

export default function OwnerDashboard() {
    const { token, logout } = useAuth()
    const navigate = useNavigate()

    const [tab, setTab] = useState('overview')

    const [users, setUsers] = useState([])
    const [reservations, setReservations] = useState([])
    const [orders, setOrders] = useState([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingId, setUpdatingId] = useState(null)

    const fetchAll = useCallback(async () => {
        if (!token) return
        setLoading(true)
        setError('')
        try {
            const headers = { Authorization: `Bearer ${token}` }

            const [usersRes, reservationsRes, ordersRes] = await Promise.all([
                fetch(`${AUTH_BASE}/users`, { headers }),
                fetch(RESERVATIONS_BASE, { headers }),
                fetch(ORDERS_BASE, { headers }),
            ])

            const usersData = await usersRes.json()
            const reservationsData = await reservationsRes.json()
            const ordersData = await ordersRes.json()

            if (usersData.success) setUsers(usersData.users || [])
            if (reservationsData.success) setReservations(reservationsData.reservations || [])
            if (ordersData.success) setOrders(ordersData.orders || [])

            if (!usersData.success) setError(usersData.message || 'Could not load users')
        } catch (err) {
            setError('Server not reachable')
        }
        setLoading(false)
    }, [token])

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const stats = useMemo(() => {
        const admins = users.filter((u) => u.role === 'admin').length
        const pendingReservations = reservations.filter((r) => r.status === 'pending').length
        return {
            totalUsers: users.length,
            totalAdmins: admins,
            totalReservations: reservations.length,
            pendingReservations,
            totalOrders: orders.length,
        }
    }, [users, reservations, orders])

    const changeRole = async (id, role) => {
        setUpdatingId(id)
        try {
            const res = await fetch(`${AUTH_BASE}/users/${id}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            })
            const data = await res.json()
            if (data.success) {
                setUsers((prev) =>
                    prev.map((u) => (u._id === id ? { ...u, role } : u))
                )
            } else {
                setError(data.message || 'Could not update role')
            }
        } catch (err) {
            setError('Server not reachable')
        }
        setUpdatingId(null)
    }

    const handleLogout = () => {
        logout()
        navigate('/owner')
    }

    return (
        <section className="admin-shell">
            <div className="admin-header">
                <div>
                    <p className="auth-kicker">Seoulmate</p>
                    <h2 className="section-title">Owner dashboard</h2>
                </div>
                <div className="admin-header-actions">
                    <Link to="/" className="btn btn-ghost">&larr; Back to home</Link>
                    <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
                </div>
            </div>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${tab === 'overview' ? 'active' : ''}`}
                    onClick={() => setTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`admin-tab ${tab === 'users' ? 'active' : ''}`}
                    onClick={() => setTab('users')}
                >
                    Users &amp; roles
                </button>
                <button
                    className={`admin-tab ${tab === 'menu' ? 'active' : ''}`}
                    onClick={() => setTab('menu')}
                >
                    Manage menu
                </button>
            </div>

            {loading && <p className="admin-empty">Loading...</p>}
            {error && <p className="auth-error">{error}</p>}

            {!loading && tab === 'overview' && (
                <div className="owner-stats-grid">
                    <div className="owner-stat-card">
                        <h3>{stats.totalUsers}</h3>
                        <p>Total users</p>
                    </div>
                    <div className="owner-stat-card">
                        <h3>{stats.totalAdmins}</h3>
                        <p>Admins</p>
                    </div>
                    <div className="owner-stat-card">
                        <h3>{stats.totalReservations}</h3>
                        <p>Total reservations</p>
                    </div>
                    <div className="owner-stat-card">
                        <h3>{stats.pendingReservations}</h3>
                        <p>Pending reservations</p>
                    </div>
                    <div className="owner-stat-card">
                        <h3>{stats.totalOrders}</h3>
                        <p>Total orders</p>
                    </div>
                </div>
            )}

            {!loading && tab === 'users' && (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Registered</th>
                                <th>Role</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id}>
                                    <td>{u.firstName} {u.lastName}</td>
                                    <td>{u.email}</td>
                                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-pill status-${u.role === 'admin' ? 'confirmed' : 'pending'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="admin-actions">
                                        {u.role === 'admin' ? (
                                            <button
                                                className="btn-mini btn-cancel"
                                                disabled={updatingId === u._id}
                                                onClick={() => changeRole(u._id, 'user')}
                                            >
                                                Remove admin
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-mini btn-confirm"
                                                disabled={updatingId === u._id}
                                                onClick={() => changeRole(u._id, 'admin')}
                                            >
                                                Make admin
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'menu' && <MenuManager token={token} />}
        </section>
    )
}
import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_URL } from '../api.js'

const API_BASE = `${API_URL}/api/reservations`

export default function MyBookings() {
    const { token, user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: '/my-bookings' } })
        } else if (user.role !== 'user') {
            navigate(user.role === 'admin' ? '/admin/dashboard' : '/owner/dashboard')
        }
    }, [user, navigate])

    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [cancellingId, setCancellingId] = useState(null)

    const fetchBookings = useCallback(async () => {
        if (!token) return
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API_BASE}/my`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (data.success) {
                setBookings(data.reservations || [])
            } else {
                setError(data.message || 'Could not load your bookings')
            }
        } catch (err) {
            setError('Server not reachable')
        }
        setLoading(false)
    }, [token])

    useEffect(() => {
        fetchBookings()
    }, [fetchBookings])

    useEffect(() => {
        const onFocus = () => fetchBookings()
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [fetchBookings])

    const cancelBooking = async (id) => {
        const confirmed = window.confirm('Cancel this reservation?')
        if (!confirmed) return

        setCancellingId(id)
        try {
            const res = await fetch(`${API_BASE}/my/${id}/cancel`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (data.success) {
                setBookings((prev) =>
                    prev.map((b) => (b._id === id ? { ...b, status: 'cancelled' } : b))
                )
            } else {
                setError(data.message || 'Could not cancel reservation')
            }
        } catch (err) {
            setError('Server not reachable')
        }
        setCancellingId(null)
    }

    if (!user || user.role !== 'user') return null

    return (
        <>
            <Navbar />
            <section className="admin-shell">
                <div className="admin-header">
                    <div>
                        <p className="auth-kicker">Seoulmate</p>
                        <h2 className="section-title">My bookings</h2>
                    </div>
                    <button className="btn btn-ghost" onClick={fetchBookings}>Refresh</button>
                </div>

                {loading && <p className="admin-empty">Loading your bookings...</p>}
                {error && <p className="auth-error">{error}</p>}

                {!loading && !error && bookings.length === 0 && (
                    <p className="admin-empty">
                        You haven't reserved a table yet — <Link to="/" state={{ scrollTo: 'contact' }}>book one here</Link>.
                    </p>
                )}

                {!loading && bookings.length > 0 && (
                    <div className="booking-list">
                        {bookings.map((b) => (
                            <div className="booking-card" key={b._id}>
                                <div className="booking-card-top">
                                    <h3>{b.date} · {b.time}</h3>
                                    <span className={`status-pill status-${b.status}`}>{b.status}</span>
                                </div>
                                <p className="booking-card-row"><strong>Name:</strong> {b.name}</p>
                                <p className="booking-card-row"><strong>Phone:</strong> {b.phone}</p>
                                <p className="booking-card-row"><strong>Table:</strong> {b.tableNumber ? `Table ${b.tableNumber} · ${b.guests} ${b.guests === 1 ? 'guest' : 'guests'}` : '—'}</p>
                                {b.message && (
                                    <p className="booking-card-row"><strong>Note:</strong> {b.message}</p>
                                )}
                                {b.status === 'pending' && (
                                    <button
                                        className="btn-mini btn-cancel booking-cancel-btn"
                                        disabled={cancellingId === b._id}
                                        onClick={() => cancelBooking(b._id)}
                                    >
                                        {cancellingId === b._id ? 'Cancelling...' : 'Cancel reservation'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
            <Footer />
        </>
    )
}
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function OwnerLogin() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { ownerLogin } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        const data = await ownerLogin(form.email, form.password)
        setLoading(false)
        if (data.success) {
            navigate('/owner/dashboard')
        } else {
            setError(data.message || 'Login failed')
        }
    }

    return (
        <section className="auth-shell">
            <Link to="/" className="brand auth-brand">
                <img src="logo.jpg" alt="Seoulmate logo" className="brand-logo" />
                <span>Seoulmate</span>
            </Link>

            <form className="reserve-form auth-card" onSubmit={handleSubmit}>
                <p className="auth-kicker">Restricted access</p>
                <h3 className="reserve-form-title">Owner login</h3>
                <p className="reserve-form-sub">Sign in to manage staff and see business stats.</p>

                {error && <p className="auth-error">{error}</p>}

                <div className="form-field">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="owner@seoulmate.rest" value={form.email} onChange={handleChange} required />
                </div>

                <div className="form-field">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="........" value={form.password} onChange={handleChange} required />
                </div>

                <button type="submit" className="btn btn-primary form-submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log in'}
                </button>

                <p className="auth-switch">
                    <Link to="/">&larr; Back to Seoulmate</Link>
                </p>

            </form>
        </section>
    )
}
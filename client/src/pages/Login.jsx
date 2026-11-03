import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login, loginWithGoogle } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const redirectByRole = (role) => {
        if (role === 'admin') return '/admin/dashboard'
        if (role === 'owner') return '/owner/dashboard'
        // Customer ko wapas wahi page bhejo jahan se login pe aaya tha (jaise /orders ya dish page)
        if (typeof from === 'string' && from.startsWith('/')) return from
        return '/'
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        const data = await login(form.email, form.password)
        setLoading(false)
        if (data.success) {
            navigate(redirectByRole(data.user?.role))
        } else {
            setError(data.message || 'Login failed')
        }
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('')
        const data = await loginWithGoogle(credentialResponse.credential)
        if (data.success) {
            navigate(redirectByRole(data.user?.role))
        } else {
            setError(data.message || 'Google login failed')
        }
    }

    return (
        <section className="auth-shell">
            <Link to="/" className="brand auth-brand">
                <img src="/logo.jpg" alt="Seoulmate logo" className="brand-logo" />
                <span>Seoulmate</span>
            </Link>

            <form onSubmit={handleSubmit} className="reserve-form auth-card">
                <p className="auth-kicker">Seoulmate account</p>
                <h3 className="reserve-form-title">Welcome back</h3>
                <p className="reserve-form-sub">Log in to book your table.</p>

                {error && <p className="auth-error">{error}</p>}

                <div className="form-field">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                </div>

                <div className="form-field">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                </div>

                <button type="submit" className="btn btn-primary form-submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log in'}
                </button>

                <div className="auth-divider"><span>or</span></div>

                <div className="auth-google">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google login failed')}
                        theme="filled_black"
                        shape="pill"
                        width="100%"
                    />
                </div>

                <p className="auth-switch">
                    Don't have an account? <Link to="/register">Sign up</Link>
                </p>
            </form>
        </section>
    )
}
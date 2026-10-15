import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { register, login, loginWithGoogle } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        const data = await register({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
        })

        if (!data.success) {
            setLoading(false)
            setError(data.message || 'Registration failed')
            return
        }

        const loginData = await login(form.email, form.password)
        setLoading(false)

        if (loginData.success) navigate('/')
        else navigate('/login')
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('')
        const data = await loginWithGoogle(credentialResponse.credential)
        if (data.success) {
            navigate(data.user?.role === 'admin' ? '/admin/dashboard' : '/')
        } else {
            setError(data.message || 'Google sign up failed')
        }
    }

    return (
        <section className="auth-shell">
            <Link to="/" className="brand auth-brand">
                <img src="/logo.jpg" alt="Seoulmate logo" className="brand-logo" />
                <span>Seoulmate</span>
            </Link>

            <form className="reserve-form auth-card" onSubmit={handleSubmit}>
                <p className="auth-kicker">Seoulmate account</p>
                <h3 className="reserve-form-title">Create account</h3>
                <p className="reserve-form-sub">Join to reserve your table in seconds.</p>

                {error && <p className="auth-error">{error}</p>}

                <div className="form-row">
                    <div className="form-field">
                        <label>First name</label>
                        <input type="text" name="firstName" placeholder="Jane" value={form.firstName} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                        <label>Last name</label>
                        <input type="text" name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} required />
                    </div>
                </div>

                <div className="form-field">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                </div>

                <div className="form-row">
                    <div className="form-field">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="At least 8 characters" value={form.password} onChange={handleChange} required minLength={8} />
                    </div>
                    <div className="form-field">
                        <label>Confirm password</label>
                        <input type="password" name="confirmPassword" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} required minLength={8} />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary form-submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign up'}
                </button>

                <div className="auth-divider"><span>or</span></div>

                <div className="auth-google">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google sign up failed')}
                        theme="filled_black"
                        shape="pill"
                        width="100%"
                    />
                </div>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </form>
        </section>
    )
}
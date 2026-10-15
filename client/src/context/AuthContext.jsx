import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from '../api.js'

const AuthContext = createContext(null)
const API_BASE = `${API_URL}/api/auth`

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (data.success) {
                setUser(data.user)
                setToken(data.token)
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }
            return data
        } catch (err) {
            return { success: false, message: 'Server not reachable' }
        }
    }

    const ownerLogin = async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/owner-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (data.success) {
                setUser(data.user)
                setToken(data.token)
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }
            return data
        } catch (err) {
            return { success: false, message: 'Server not reachable' }
        }
    }

    const register = async (payload) => {
        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            return await res.json()
        } catch (err) {
            return { success: false, message: 'Server not reachable' }
        }
    }

    const loginWithGoogle = async (credential) => {
        try {
            const res = await fetch(`${API_BASE}/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential }),
            })
            const data = await res.json()
            if (data.success) {
                setUser(data.user)
                setToken(data.token)
                localStorage.setItem('token', data.token)
                localStorage.setItem('user', JSON.stringify(data.user))
            }
            return data
        } catch (err) {
            return { success: false, message: 'Server not reachable' }
        }
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, ownerLogin, register, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
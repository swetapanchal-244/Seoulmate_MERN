import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from '../api.js'

const AuthContext = createContext(null)
const API_BASE = `${API_URL}/api/auth`

// JWT ke andar se expiry time (ms me) nikalta hai
const getTokenExpiry = (token) => {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64))
        return payload.exp ? payload.exp * 1000 : 0
    } catch (err) {
        return 0
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    const startSession = (data) => {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
    }

    // App khulte hi purana login restore karo, par expired ho to saaf kar do
    useEffect(() => {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
            try {
                if (getTokenExpiry(storedToken) > Date.now()) {
                    setToken(storedToken)
                    setUser(JSON.parse(storedUser))
                } else {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                }
            } catch (err) {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            }
        }
        setLoading(false)
    }, [])

    // Login ke dauraan token expire ho jaye to apne aap logout
    useEffect(() => {
        if (!token) return
        const msLeft = getTokenExpiry(token) - Date.now()
        if (msLeft <= 0) {
            logout()
            return
        }
        const timerId = setTimeout(logout, msLeft)
        return () => clearTimeout(timerId)
    }, [token])

    const postAuth = async (path, body) => {
        try {
            const res = await fetch(`${API_BASE}/${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            return await res.json()
        } catch (err) {
            return { success: false, message: 'Server not reachable' }
        }
    }

    const login = async (email, password) => {
        const data = await postAuth('login', { email, password })
        if (data.success) startSession(data)
        return data
    }

    const ownerLogin = async (email, password) => {
        const data = await postAuth('owner-login', { email, password })
        if (data.success) startSession(data)
        return data
    }

    const register = (payload) => postAuth('register', payload)

    const loginWithGoogle = async (credential) => {
        const data = await postAuth('google', { credential })
        if (data.success) startSession(data)
        return data
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, ownerLogin, register, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
import { useCallback, useEffect, useState } from 'react'
import { API_URL } from '../api.js'

const MENU_API = `${API_URL}/api/menu`

const EMPTY_FORM = {
    name: '',
    desc: '',
    longDesc: '',
    price: '',
    category: 'mains',
    img: '',
    isAvailable: true,
}

export default function MenuManager({ token }) {
    const [dishes, setDishes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [busyId, setBusyId] = useState(null)

    const authHeader = { Authorization: `Bearer ${token}` }

    const fetchDishes = useCallback(async () => {
        setError('')
        try {
            const res = await fetch(`${MENU_API}/admin-all`, { headers: authHeader })
            const data = await res.json()
            if (data.success) {
                setDishes(data.dishes || [])
            } else {
                setError(data.message || 'Could not load menu')
            }
        } catch (err) {
            setError('Server not reachable')
        }
        setLoading(false)
    }, [token])

    useEffect(() => {
        if (token) fetchDishes()
    }, [token, fetchDishes])

    const flash = (text) => {
        setMessage(text)
        setTimeout(() => setMessage(''), 3000)
    }

    const openAdd = () => {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setError('')
        setShowForm(true)
    }

    const openEdit = (dish) => {
        setEditingId(dish._id)
        setForm({
            name: dish.name || '',
            desc: dish.desc || '',
            longDesc: dish.longDesc || '',
            price: dish.price ?? '',
            category: dish.category || 'mains',
            img: dish.img || '',
            isAvailable: dish.isAvailable !== false,
        })
        setError('')
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const closeForm = () => {
        setShowForm(false)
        setEditingId(null)
        setForm(EMPTY_FORM)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        setError('')
        try {
            const body = new FormData()
            body.append('image', file)
            const res = await fetch(`${MENU_API}/upload`, {
                method: 'POST',
                headers: authHeader, // Content-Type mat lagana, browser khud set karta hai
                body,
            })
            const data = await res.json()
            if (data.success) {
                setForm((prev) => ({ ...prev, img: data.imgUrl }))
            } else {
                setError(data.message || 'Image upload failed')
            }
        } catch (err) {
            setError('Image upload failed')
        }
        setUploading(false)
        e.target.value = ''
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!form.name.trim() || !form.desc.trim() || form.price === '' || !form.img) {
            setError('Name, short description, price and image are required')
            return
        }
        if (Number(form.price) < 0 || Number.isNaN(Number(form.price))) {
            setError('Price must be a valid number')
            return
        }

        setSaving(true)
        try {
            const res = await fetch(editingId ? `${MENU_API}/${editingId}` : MENU_API, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader },
                body: JSON.stringify({
                    ...form,
                    name: form.name.trim(),
                    desc: form.desc.trim(),
                    longDesc: form.longDesc.trim(),
                    price: Number(form.price),
                }),
            })
            const data = await res.json()
            if (data.success) {
                flash(editingId ? 'Dish updated' : 'Dish added to menu')
                closeForm()
                fetchDishes()
            } else {
                setError(data.message || 'Could not save dish')
            }
        } catch (err) {
            setError('Server not reachable')
        }
        setSaving(false)
    }

    const toggleAvailability = async (dish) => {
        setBusyId(dish._id)
        try {
            const res = await fetch(`${MENU_API}/${dish._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeader },
                body: JSON.stringify({ isAvailable: !dish.isAvailable }),
            })
            const data = await res.json()
            if (data.success) {
                setDishes((prev) =>
                    prev.map((d) => (d._id === dish._id ? { ...d, isAvailable: !dish.isAvailable } : d))
                )
            } else {
                setError(data.message || 'Could not update availability')
            }
        } catch (err) {
            setError('Server not reachable')
        }
        setBusyId(null)
    }

    const handleDelete = async (dish) => {
        if (!window.confirm(`Delete "${dish.name}" from the menu? This cannot be undone.`)) return
        setBusyId(dish._id)
        try {
            const res = await fetch(`${MENU_API}/${dish._id}`, {
                method: 'DELETE',
                headers: authHeader,
            })
            const data = await res.json()
            if (data.success) {
                setDishes((prev) => prev.filter((d) => d._id !== dish._id))
                flash('Dish removed from menu')
            } else {
                setError(data.message || 'Could not delete dish')
            }
        } catch (err) {
            setError('Server not reachable')
        }
        setBusyId(null)
    }

    return (
        <div className="admin-panel">
            <div className="menu-manager-top">
                <p className="menu-manager-count">{dishes.length} dishes on the menu</p>
                {!showForm && (
                    <button className="btn btn-primary" onClick={openAdd}>+ Add dish</button>
                )}
            </div>

            {message && <p className="menu-manager-success">{message}</p>}
            {error && <p className="auth-error">{error}</p>}

            {showForm && (
                <form className="menu-form" onSubmit={handleSubmit}>
                    <h3 className="menu-form-title">{editingId ? 'Edit dish' : 'Add a new dish'}</h3>

                    <div className="menu-form-grid">
                        <div className="form-field">
                            <label htmlFor="mm-name">Name</label>
                            <input id="mm-name" name="name" value={form.name} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="mm-price">Price (₹)</label>
                            <input id="mm-price" name="price" type="number" min="0" value={form.price} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="mm-category">Category</label>
                            <input id="mm-category" name="category" value={form.category} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="mm-image">Image</label>
                            <input id="mm-image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleImageUpload} />
                            {uploading && <span className="menu-form-hint">Uploading...</span>}
                        </div>
                    </div>

                    <div className="form-field">
                        <label htmlFor="mm-desc">Short description</label>
                        <input id="mm-desc" name="desc" value={form.desc} onChange={handleChange} />
                    </div>

                    <div className="form-field">
                        <label htmlFor="mm-longDesc">Long description (shown on dish page)</label>
                        <textarea id="mm-longDesc" name="longDesc" rows="3" value={form.longDesc} onChange={handleChange} />
                    </div>

                    {form.img && (
                        <div className="menu-form-preview">
                            <img src={form.img} alt="Dish preview" />
                            <span className="menu-form-hint">{form.img}</span>
                        </div>
                    )}

                    <label className="menu-form-check">
                        <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} />
                        Available to order
                    </label>

                    <div className="menu-form-actions">
                        <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add dish'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <p className="admin-empty">Loading menu...</p>
            ) : dishes.length === 0 ? (
                <p className="admin-empty">No dishes yet. Add your first one.</p>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dishes.map((d) => (
                                <tr key={d._id}>
                                    <td><img className="menu-thumb" src={d.img} alt={d.name} /></td>
                                    <td>
                                        <strong>{d.name}</strong>
                                        <div className="menu-cell-sub">{d.desc}</div>
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{d.category}</td>
                                    <td>₹{d.price}</td>
                                    <td>
                                        <span className={`status-pill ${d.isAvailable ? 'status-confirmed' : 'status-cancelled'}`}>
                                            {d.isAvailable ? 'available' : 'hidden'}
                                        </span>
                                    </td>
                                    <td className="admin-actions">
                                        <button className="btn-mini" disabled={busyId === d._id} onClick={() => openEdit(d)}>Edit</button>
                                        <button className="btn-mini" disabled={busyId === d._id} onClick={() => toggleAvailability(d)}>
                                            {d.isAvailable ? 'Hide' : 'Show'}
                                        </button>
                                        <button className="btn-mini btn-cancel" disabled={busyId === d._id} onClick={() => handleDelete(d)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
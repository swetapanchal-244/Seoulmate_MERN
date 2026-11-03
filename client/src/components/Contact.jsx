import { useState, useEffect } from 'react'
import Reveal from './Reveal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_URL } from '../api.js'

const API_BASE = `${API_URL}/api/reservations`
const TABLES_API = `${API_URL}/api/tables`

const EMPTY_FORM = {
  name: '', phone: '', date: '', time: '', tableNumber: '', message: '',
}

export default function Contact() {
  const { token, user } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [tables, setTables] = useState([])
  const today = new Date().toLocaleDateString('en-CA')

  useEffect(() => {
    if (!form.date || !form.time) {
      setTables([])
      return
    }
    let ignore = false
    fetch(`${TABLES_API}?date=${form.date}&time=${form.time}`)
      .then((res) => res.json())
      .then((data) => {
        if (ignore || !data.success) return
        setTables(data.tables)
        setForm((prev) => {
          const chosen = data.tables.find((t) => String(t.tableNumber) === String(prev.tableNumber))
          return chosen && !chosen.available ? { ...prev, tableNumber: '' } : prev
        })
      })
      .catch(() => { })
    return () => { ignore = true }
  }, [form.date, form.time])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Please log in to reserve a table.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (data.success) {
        setForm(EMPTY_FORM)
        setTables([])
        setShowSuccess(true)
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch (err) {
      setError('Server not reachable')
    }
    setLoading(false)
  }

  return (
    <section className="contact" id="contact">
      <div className="contact-banner" style={{ backgroundImage: "url('/contact-banner.jpg')" }}>
        <h2 className="section-title">Come find us</h2>
      </div>

      <Reveal className="contact-grid">
        <div className="contact-info">
          <div className="info-block">
            <h3>Address</h3>
            <p>14 Lantern Street, Ring Road<br />Surat, Gujarat 395007</p>
          </div>
          <div className="info-block">
            <h3>Hours</h3>
            <p>Mon–Thu: 12pm – 11pm<br />Fri–Sun: 12pm – 1am</p>
          </div>
          <div className="info-block">
            <h3>Good to know</h3>
            <p>
              You can cancel a pending booking anytime from My Bookings.<br />
              Tables for 8+ guests — mention it in your message.<br />
              Track your booking status in My Bookings after you reserve.
            </p>
          </div>
          <img src="/contact-image.jpg" alt="Restaurant entrance" className="contact-photo" />
        </div>

        {user && user.role !== 'user' ? (
          <div className="reserve-form reserve-locked">
            <h3 className="reserve-form-title">Reserve a table</h3>
            <p className="reserve-form-sub">
              Staff accounts can't make reservations. Log in as a customer to book a table.
            </p>
          </div>
        ) : (
          <form className="reserve-form" onSubmit={handleSubmit}>
            <h3 className="reserve-form-title">Reserve a table</h3>
            <p className="reserve-form-sub">Fill this in and we'll confirm within the hour.</p>

            {error && <p className="auth-error">{error}</p>}

            <div className="form-row">
              <div className="form-field">
                <label>Full name</label>
                <input type="text" name="name" maxLength={60} placeholder="Your name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input type="tel" name="phone" placeholder="+91 90000 00000" pattern="\+?[0-9\s\-]{10,15}" title="Enter a valid phone number (10-15 digits)" maxLength={16} value={form.phone} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Date</label>
                <input type="date" name="date" min={today} value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Time</label>
                <input type="time" name="time" value={form.time} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-field">
              <label>Table</label>
              <select name="tableNumber" value={form.tableNumber} onChange={handleChange} disabled={!form.date || !form.time} required>
                <option value="">
                  {form.date && form.time ? 'Choose a table' : 'Select date & time first'}
                </option>
                {tables.map((t) => (
                  <option key={t.tableNumber} value={t.tableNumber} disabled={!t.available}>
                    Table {t.tableNumber} - {t.seats} seats{t.available ? '' : ' (booked)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Message (optional)</label>
              <textarea name="message" rows="3" maxLength={500} placeholder="Window seat, birthday, allergies..." value={form.message} onChange={handleChange}></textarea>
            </div>

            <button type="submit" className="btn btn-primary form-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Request reservation'}
            </button>
          </form>
        )}
      </Reveal>

      {showSuccess && (
        <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">✓</div>
            <h3 className="modal-title">Booking successful</h3>
            <p className="modal-text">Your table request has been sent. Have a Good Day</p>
            <button className="btn btn-primary modal-close" onClick={() => setShowSuccess(false)}>
              Great
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
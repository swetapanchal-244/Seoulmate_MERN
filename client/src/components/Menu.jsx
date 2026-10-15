import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Reveal from './Reveal.jsx'
import RatingStars from './RatingStars.jsx'
import { API_URL } from '../api.js'

const MENU_API = `${API_URL}/api/menu`

export default function Menu() {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const res = await fetch(MENU_API)
        const data = await res.json()
        if (data.success) {
          setDishes(data.dishes)
        } else {
          setError('Could not load the menu')
        }
      } catch (err) {
        setError('Server not reachable')
      }
      setLoading(false)
    }
    fetchDishes()
  }, [])

  return (
    <section className="menu" id="menu">
      <p className="section-kicker center">The menu</p>
      <h2 className="section-title center">Signature plates</h2>

      {loading && <p className="admin-empty">Loading menu...</p>}
      {error && <p className="auth-error">{error}</p>}

      <Reveal className="menu-grid">
        {dishes.map((dish) => (
          <Link to={`/menu/${dish._id}`} className="dish" key={dish._id}>
            <div className="dish-img" style={{ backgroundImage: `url('${dish.img}')` }}></div>
            <div className="dish-info">
              <h3>{dish.name}</h3>
              <p>{dish.desc}</p>
              <RatingStars rating={dish.rating} reviews={dish.numReviews} />
              <span className="price">₹{dish.price}</span>
            </div>
          </Link>
        ))}
      </Reveal>
    </section>
  )
}
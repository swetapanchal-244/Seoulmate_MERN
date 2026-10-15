import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import RatingStars from '../components/RatingStars.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { API_URL } from '../api.js'

const MENU_API = `${API_URL}/api/menu`

export default function DishDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addItem } = useCart()

    const [dish, setDish] = useState(null)
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [added, setAdded] = useState(false)

    useEffect(() => {
        const fetchDish = async () => {
            setLoading(true)
            try {
                const res = await fetch(`${MENU_API}/${id}`)
                const data = await res.json()
                setDish(data.success ? data.dish : null)
            } catch (err) {
                setDish(null)
            }
            setLoading(false)
        }
        fetchDish()
    }, [id])

    if (loading) {
        return (
            <>
                <Navbar />
                <section className="dish-detail">
                    <p className="admin-empty">Loading...</p>
                </section>
                <Footer />
            </>
        )
    }

    if (!dish) {
        return (
            <>
                <Navbar />
                <section className="dish-detail">
                    <p className="admin-empty">Dish not found.</p>
                    <Link to="/#menu" className="btn btn-ghost">Back to menu</Link>
                </section>
                <Footer />
            </>
        )
    }

    const handleAddToCart = () => {
        if (!user) {
            navigate('/login', { state: { from: `/menu/${dish._id}` } })
            return
        }
        addItem(dish, quantity)
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    return (
        <>
            <Navbar />
            <section className="dish-detail">
                <div className="dish-detail-grid">
                    <div className="dish-detail-media">
                        <img src={dish.img} alt={dish.name} />
                    </div>

                    <div className="dish-detail-info">
                        <p className="section-kicker">Signature plate</p>
                        <h1 className="section-title">{dish.name}</h1>
                        <RatingStars rating={dish.rating} reviews={dish.numReviews} />
                        <p className="dish-detail-desc">{dish.longDesc}</p>
                        <span className="dish-detail-price">₹{dish.price}</span>

                        {user && user.role !== 'user' ? (
                            <p className="reserve-form-sub" style={{ marginTop: '0.75rem' }}>
                                Staff accounts can't place orders.
                            </p>
                        ) : (
                            <>
                                <div className="qty-stepper">
                                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                                    <span>{quantity}</span>
                                    <button onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">+</button>
                                </div>

                                <button className="btn btn-primary form-submit" onClick={handleAddToCart}>
                                    {added ? 'Added to cart ✓' : `Add to cart — ₹${dish.price * quantity}`}
                                </button>

                                {!user && (
                                    <p className="reserve-form-sub" style={{ marginTop: '0.75rem' }}>
                                        You'll be asked to log in before adding to cart.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}
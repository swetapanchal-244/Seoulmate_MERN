export default function RatingStars({ rating = 0, reviews = 0 }) {
    // Naye dish ke abhi koi review nahi, to stars ki jagah "New" dikhao
    if (!reviews) {
        return (
            <div className="rating-stars">
                <span className="rating-count">✨ New</span>
            </div>
        )
    }

    const fullStars = Math.round(rating)

    return (
        <div className="rating-stars">
            <span className="rating-stars-icons">
                {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={n <= fullStars ? 'star filled' : 'star'}>★</span>
                ))}
            </span>
            <span className="rating-value">{rating.toFixed(1)}</span>
            <span className="rating-count">({reviews} reviews)</span>
        </div>
    )
}
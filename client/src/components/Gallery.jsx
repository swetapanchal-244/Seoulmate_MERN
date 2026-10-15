// src/components/Gallery.jsx
import Reveal from './Reveal.jsx'

const ROOMS = [
  { name: 'The Main Room', img: '/restaurant.jpg' },
  { name: 'Bar & Lounge', img: '/seoul1.jpg' },
  { name: 'Private Booths', img: '/seoul2.jpg' },
  { name: 'Skyline Terrace', img: '/seoul3.jpg' },
]

export default function Gallery() {
  return (
    <section className="gallery" id="gallery">
      <p className="section-kicker center">Seoul nights</p>
      <h2 className="section-title center">The room, after dark</h2>

      <Reveal className="gallery-grid">
        {ROOMS.map((room) => (
          <div className="gallery-item" key={room.name}>
            <img src={room.img} alt={room.name} />
            <div className="gallery-caption">{room.name}</div>
          </div>
        ))}
      </Reveal>
    </section>
  )
}
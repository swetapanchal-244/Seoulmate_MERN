import Reveal from './Reveal.jsx'

const CHEFS = [
  { name: 'Min-jun Park', role: 'Executive Chef — 18 years, ex-Busan grill houses', img: '/chef1.jpg' },
  { name: 'Soo-ah Lim', role: 'Sous Chef — noodles & fermentation lead', img: '/chef2.jpg' },
  { name: 'Tae-yang Kim', role: 'Grill Chef — charcoal & bulgogi specialist', img: '/chef3.jpg' },
]

export default function Chefs() {
  return (
    <section className="chefs" id="chefs">
      <p className="section-kicker center">Behind the pass</p>
      <h2 className="section-title center">The hands that cook it</h2>

      <Reveal className="chefs-grid">
        {CHEFS.map((chef) => (
          <div className="chef-card" key={chef.name}>
            <img src={chef.img} alt={chef.name} />
            <h3>{chef.name}</h3>
            <p>{chef.role}</p>
          </div>
        ))}
      </Reveal>
    </section>
  )
}

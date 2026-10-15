import Reveal from './Reveal.jsx'

const CULTURE_POINTS = [
  { label: 'Banchan, always shared', detail: 'Small side dishes fill the table before the main ever arrives — food here is generosity, not portion.' },
  { label: 'Grilled at the table', detail: "Korean BBQ was never meant to be served. It's cooked together, one piece at a time, as the conversation runs." },
  { label: 'Kimchi, the family recipe', detail: 'Every household ferments it differently — ours has been passed down for three generations.' },
]

export default function Culture() {
  return (
    <section className="culture" id="culture">
      <Reveal className="culture-grid">
        <div className="culture-copy">
          <p className="section-kicker">More than a menu</p>
          <h2 className="section-title">Food built around<br />family, not just flavor.</h2>
          <p className="culture-text">
            In Korea, a meal isn't finished until the table is full and everyone's eaten
            past comfortable. We cook the same way here — loud, shared, and a little chaotic.
          </p>

          <div className="culture-points">
            {CULTURE_POINTS.map((point) => (
              <div className="culture-point" key={point.label}>
                <h4>{point.label}</h4>
                <p>{point.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="culture-media">
          <img src="/culture.jpg" alt="Traditional Korean food spread" />
        </div>
      </Reveal>
    </section>
  )
}
import Reveal from './Reveal.jsx'

export default function About() {
  return (
    <section className="about" id="about">
      <Reveal className="about-grid">
        <div className="about-media">
          <img src="/about.jpg" alt="Inside Seoulmate restaurant" className="about-img-main" />
          <img src="/fresh.jpg" alt="Fresh ingredients" className="about-img-float" />
        </div>
        <div className="about-copy">
          <p className="section-kicker">Our story</p>
          <h2 className="section-title">Every dish starts<br />at the market, not the menu.</h2>
          <p className="about-text">
            Seoulmate was built on one rule: nothing reaches the grill unless it was
            fresh that morning. Our cooks train in Busan and Seoul before they touch
            our kitchen, carrying recipes passed down through three generations of
            home cooking — now plated for a city that never quite sleeps.
          </p>
          <div className="about-stats">
            <div className="stat"><span className="stat-num">12</span><span className="stat-label">years grilling</span></div>
            <div className="stat"><span className="stat-num">40+</span><span className="stat-label">dishes on rotation</span></div>
            <div className="stat"><span className="stat-num">100%</span><span className="stat-label">fresh, daily market</span></div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

import heroBg from "../assets/hero.jpg";

export default function Hero() {
  return (
    <section id="home" className="hero-section" style={{ backgroundImage: `url(${heroBg})` }}>
      <div className="hero-overlay" />
      <div className="hero-frame" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="hero-content">
        <p className="hero-kicker"><span /> WELCOME TO <span /></p>
        <h1>KAMAR-TAJ <span>REFECTORY</span></h1>
        <div className="ornament"><span />✧<span /></div>
        <p className="hero-tagline">Where every meal finds its balance.</p>
        <p className="hero-description">A dining experience rooted in tradition,<br className="desktop-break" /> nourished by good food, and guided by a higher purpose.</p>
        <div className="hero-actions">
          <a href="#menu" className="pill-button">Explore today’s menu <span>→</span></a>
          <a href="#booking" className="pill-button pill-outline">Enter the refectory</a>
        </div>
        <a className="scroll-cue" href="#menu"><span className="scroll-mouse">↓</span><span>SCROLL TO DISCOVER</span></a>
      </div>
    </section>
  );
}

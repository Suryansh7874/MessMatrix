import diningHallImg from "../assets/dininghall.jpg";

const features = [
  { icon: "◷", title: "Book Meals", copy: "Plan your dining ahead with ease." },
  { icon: "♨", title: "Upcoming Meals", copy: "Know what’s being served next." },
  { icon: "▤", title: "Meal History", copy: "Keep track of your dining activity." },
  { icon: "♙", title: "Your Profile", copy: "Manage your dining preferences." },
];

export default function RefectorySection() {
  return (
    <section id="booking" className="refectory-section">
      <div className="refectory-image">
        <img src={diningHallImg} alt="Warmly lit Kamar-Taj refectory dining hall" loading="lazy" />
        <div className="refectory-image-shade" />
        <span className="image-caption">A PLACE TO GATHER · A SPACE TO GROW</span>
      </div>
      <div className="refectory-content reveal">
        <p className="eyebrow">ENTER THE REFECTORY</p>
        <h2>More than a mess.<br /><em>Your personal dining hub.</em></h2>
        <p className="section-copy">A thoughtful dining experience helps you spend less time planning and more time doing what matters.</p>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-item" key={feature.title}>
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
        <a href="/login" className="pill-button pill-outline">Go to dashboard <span>→</span></a>
        <p className="login-hint">Sign in to access your personal dining tools.</p>
      </div>
    </section>
  );
}

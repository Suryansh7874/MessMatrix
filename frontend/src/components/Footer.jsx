import footerImg from "../assets/footer.jpg";

const footerLinks = [
  { label: "Home", href: "#home" },
  { label: "Today’s Menu", href: "#menu" },
  { label: "Booking", href: "#booking" },
  { label: "My Meals", href: "#my-meals" },
];

export default function Footer() {
  return (
    <footer className="site-footer" style={{ backgroundImage: `url(${footerImg})` }}>
      <div className="footer-shade" />
      <div className="footer-inner">
        <div className="footer-brand">
          <a href="#home" className="brand-mark"><span className="brand-seal">✺</span><span><strong>MESS MATRIX</strong><small>KAMAR-TAJ REFECTORY</small></span></a>
          <p>Good food, a clear mind, and a place to belong.<br />Your campus dining experience, thoughtfully reimagined.</p>
        </div>
        <div className="footer-links">
          <h3>Explore</h3>
          {footerLinks.map(link => <a key={link.label} href={link.href}>{link.label}</a>)}
        </div>
        <div className="footer-links">
          <h3>Account</h3>
          <a href="/login">Sign in</a>
          <a href="/register">Create account</a>
          <a href="#my-meals">Dining help</a>
        </div>
        <div className="footer-contact">
          <h3>Stay connected</h3>
          <p>Questions or feedback about your dining experience?</p>
          <a className="footer-mail" href="mailto:support@messmatrix.example">support@messmatrix.example</a>
          <p className="footer-note">Replace this demo contact with your official mess or campus contact before publishing.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MessMatrix. All rights reserved.</span>
        <span>Made for better campus dining <b>✧</b></span>
        <a href="#home">Back to top ↑</a>
      </div>
    </footer>
  );
}

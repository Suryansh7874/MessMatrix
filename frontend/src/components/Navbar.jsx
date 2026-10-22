import { useState } from "react";

const links = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "Booking", href: "#booking" },
  { label: "My Meals", href: "#my-meals" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <nav className="nav-inner" aria-label="Main navigation">
        <a href="#home" className="brand-mark">
          <span className="brand-seal">✺</span>
          <span><strong>MESS MATRIX</strong><small>KAMAR-TAJ REFECTORY</small></span>
        </a>
        <div className="desktop-nav">
          {links.map(link => <a key={link.label} href={link.href}>{link.label}</a>)}
          <a href="/login" className="nav-login">♙ <span>Sign in</span></a>
        </div>
        <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>{menuOpen ? "×" : "☰"}</button>
      </nav>
      {menuOpen && <div className="mobile-nav">
        {links.map(link => <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>)}
        <a href="/login" onClick={() => setMenuOpen(false)}>Sign in ↗</a>
        <a href="/register" onClick={() => setMenuOpen(false)}>Create account ↗</a>
      </div>}
    </header>
  );
}

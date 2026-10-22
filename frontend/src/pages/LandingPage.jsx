import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import TodayMenu from "../components/TodayMenu";
import RefectorySection from "../components/RefectorySection";
import Footer from "../components/Footer";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach(el => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="site-root">
      <Navbar />
      <Hero />
      <TodayMenu />
      <RefectorySection />
      <section id="my-meals" className="personal-cta section-pad">
        <div className="personal-cta-inner reveal">
          <p className="eyebrow">YOUR TABLE IS WAITING</p>
          <h2>Your meals.<br /><em>Your journey.</em></h2>
          <p className="section-copy">Sign in to explore your dining experience, keep up with the menu, and make every meal count.</p>
          <div className="cta-actions">
            <a href="/login" className="pill-button">Sign in <span>→</span></a>
            <a href="/register" className="quiet-link">New here? Create an account</a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

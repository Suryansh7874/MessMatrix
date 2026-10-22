import breakfastImg from "../assets/breakfast.jpg";
import lunchImg from "../assets/lunch.jpg";
import dinnerImg from "../assets/dinner.jpg";
import MealCard from "./MealCard";

const meals = [
  { name: "BREAKFAST", time: "7:00 AM – 9:30 AM", image: breakfastImg, items: ["Idli & Sambar", "Poha", "Fresh Fruits", "Tea / Coffee"], href: "#menu" },
  { name: "LUNCH", time: "12:30 PM – 2:00 PM", image: lunchImg, items: ["Dal Makhani", "Paneer Butter Masala", "Jeera Rice", "Roti & Salad"], href: "#menu" },
  { name: "DINNER", time: "7:00 PM – 9:00 PM", image: dinnerImg, items: ["Vegetable Curry", "Rice / Jeera Rice", "Fresh Salad", "Soup"], href: "#menu" },
];

export default function TodayMenu() {
  return (
    <section id="menu" className="section-shell section-pad">
      <div className="section-heading reveal">
        <div>
          <p className="eyebrow">FRESHLY PREPARED · EVERY DAY</p>
          <h2>Today’s <em>Menu</em></h2>
          <p className="section-copy">Wholesome meals. Balanced nutrition. Fuel for your journey.</p>
        </div>
        <a className="text-link" href="#menu">Today’s menu <span>↓</span></a>
      </div>
      <div className="meal-grid">
        {meals.map((meal, i) => <div className="reveal" style={{"--delay": `${i * 120}ms`}} key={meal.name}><MealCard meal={meal} /></div>)}
      </div>
      <div className="menu-note reveal">
        <span className="note-emblem">✧</span>
        <div><strong>Good food. Good energy. Greater focus.</strong><p>Menus may change based on seasonal ingredients and mess availability.</p></div>
      </div>
    </section>
  );
}

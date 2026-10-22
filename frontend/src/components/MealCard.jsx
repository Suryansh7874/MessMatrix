const mealSymbols = { BREAKFAST: "☼", LUNCH: "☀", DINNER: "☾" };

export default function MealCard({ meal }) {
  return (
    <article className="meal-card">
      <div className="meal-image-wrap">
        <img src={meal.image} alt={`${meal.name.toLowerCase()} at the refectory`} loading="lazy" />
        <div className="meal-image-shade" />
        <span className="meal-badge">{mealSymbols[meal.name] || "✧"} {meal.name}</span>
      </div>
      <div className="meal-card-content">
        <p className="served-label">SERVED DAILY</p>
        <h3>{meal.name.charAt(0) + meal.name.slice(1).toLowerCase()}</h3>
        <p className="meal-time"><span>◷</span>{meal.time}</p>
        <div className="meal-rule" />
        <ul>{meal.items.map(item => <li key={item}><span>✧</span>{item}</li>)}</ul>
        <a className="meal-link" href={meal.href}><span>Explore menu</span><span>→</span></a>
      </div>
    </article>
  );
}

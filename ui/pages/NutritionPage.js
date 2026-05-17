import React from 'react';

/**
 * Страница питания.
 * @param {{
 *   NUTRITION: Array<{label:string, value:string|number, note?:string}>
 * }} props
 * @returns {JSX.Element}
 */
export default function NutritionPage({ NUTRITION }) {
  return (
    <>
      <div className="card">
        <h2>Ежедневный ориентир питания</h2>
        {NUTRITION.map((item, idx) => (
          <div key={idx} className="row" style={{ marginBottom: '0.5rem' }}>
            <div style={{ width: '40%' }}><strong>{item.label}:</strong></div>
            <div style={{ width: '40%' }}>{item.value}</div>
            {item.note && (
              <div style={{ width: '20%', fontSize: '0.875rem', color: 'var(--text2)' }}>
                {item.note}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Простой дневной план</h2>
        <p>
          Завтрак: белковый (яйца, творог) + сложный углевод (овсянка) + фрукт.<br/>
          Обед: нежирное мясо/рыба + овощи + крупа.<br/>
          Ужин: лёгкий белок + овощи.<br/>
          Перекусы: орехи, йогурт, фрукты.<br/>
          Питьё: вода 2–2.5 л, ограничить кофеин после 14:00.
        </p>
      </div>
    </>
  );
}

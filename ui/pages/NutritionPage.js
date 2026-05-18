import React from 'react';
import { NUTRITION } from '../../config/constants.js';

/**
 * Страница питания.
 * @returns {JSX.Element}
 */
export default function NutritionPage() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h2', null, 'Ежедневный ориентир питания'),
      NUTRITION.map((item, idx) =>
        React.createElement(
          'div',
          { key: idx, className: 'row', style: { marginBottom: '0.5rem' } },
          React.createElement(
            'div',
            { style: { width: '40%' } },
            React.createElement('strong', null, item.label, ':')
          ),
          React.createElement('div', { style: { width: '40%' } }, item.value),
          item.note &&
            React.createElement(
              'div',
              { style: { width: '20%', fontSize: '0.875rem', color: 'var(--text2)' } },
              item.note
            )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h2', null, 'Простой дневной план'),
      React.createElement(
        'p',
        null,
        'Завтрак: белковый (яйца, творог) + сложный углевод (овсянка) + фрукт.',
        React.createElement('br', null),
        'Обед: нежирное мясо/рыба + овощи + крупа.',
        React.createElement('br', null),
        'Ужин: лёгкий белок + овощи.',
        React.createElement('br', null),
        'Перекусы: орехи, йогурт, фрукты.',
        React.createElement('br', null),
        'Питьё: вода 2–2.5 л, ограничить кофеин после 14:00.'
      )
    )
  );
}

import React from 'react';
import Pill from '../components/Pill.js';
import Collapsible from '../components/Collapsible.js';
import { ZONES, HRV_GUIDE } from '../../js/config/constants.js';

/**
 * Страница информации.
 * @param {{
 *   showReadiness: boolean,
 *   setShowReadiness: (v:boolean)=>void,
 *   ZONES: Array<{name:string, min:number, max:number, description:string}>,
 *   HRV_GUIDE: Array<{range:string, advice:string}>
 * }} props
 * @returns {JSX.Element}
 */
export default function InfoPage({ showReadiness, setShowReadiness, ZONES, HRV_GUIDE }) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'row center', style: { marginBottom: '1rem' } },
      React.createElement(
        'button',
        {
          className: 'btn btn-accent',
          onClick: () => setShowReadiness(!showReadiness),
        },
        'Правила готовности'
      )
    ),
    showReadiness &&
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement('h2', null, 'Правила готовности'),
        React.createElement(
          'p',
          null,
          'Оценка готовности основана на сне, HRV, пульсе покоя, боли и дыхании. ',
          'Зеленый – готов к полной нагрузке, жёлтый – умеренная, красный – нужен отдых.'
        )
      ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(
        Collapsible,
        { title: 'Пульсовые зоны', defaultOpen: false },
        ZONES.map((zone, idx) =>
          React.createElement(
            'div',
            { key: idx, style: { marginBottom: '0.5rem' } },
            React.createElement('strong', null, zone.name),
            ` (${zone.min}–${zone.max} уд/мин): `,
            zone.description
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(
        Collapsible,
        { title: 'HRV‑гайд', defaultOpen: false },
        HRV_GUIDE.map((guide, idx) =>
          React.createElement(
            'div',
            { key: idx, style: { marginBottom: '0.5rem' } },
            React.createElement('strong', null, guide.range, ':'),
            ' ',
            guide.advice
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(
        Collapsible,
        { title: 'Ограничения и противопоказания', defaultOpen: false },
        React.createElement(
          'p',
          null,
          'При острых болях, высоком давлении или плохом самочувствии тренировку ',
          'следует отменить и проконсультироваться со специалистом.'
        )
      )
    )
  );
}

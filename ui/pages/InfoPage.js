import React from 'react';
import Pill from '../components/Pill';
import Collapsible from '../components/Collapsible';
import { ZONES, HRV_GUIDE } from '../../config/constants';

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
  return (
    <>
      <div className="row center" style={{ marginBottom: '1rem' }}>
        <button
          className="btn btn-accent"
          onClick={() => setShowReadiness(!showReadiness)}
        >
          Правила готовности
        </button>
      </div>

      {showReadiness && (
        <div className="card">
          <h2>Правила готовности</h2>
          <p>
            Оценка готовности основана на сне, HRV, пульсе покоя, боли и дыхании.
            Зеленый – готов к полной нагрузке, жёлтый – умеренная, красный – нужен отдых.
          </p>
        </div>
      )}

      <div className="card">
        <Collapsible title="Пульсовые зоны" defaultOpen={false}>
          {ZONES.map((zone, idx) => (
            <div key={idx} style={{ marginBottom: '0.5rem' }}>
              <strong>{zone.name}</strong> ({zone.min}–{zone.max} уд/мин): {zone.description}
            </div>
          ))}
        </Collapsible>
      </div>

      <div className="card">
        <Collapsible title="HRV‑гайд" defaultOpen={false}>
          {HRV_GUIDE.map((guide, idx) => (
            <div key={idx} style={{ marginBottom: '0.5rem' }}>
              <strong>{guide.range}:</strong> {guide.advice}
            </div>
          ))}
        </Collapsible>
      </div>

      <div className="card">
        <Collapsible title="Ограничения и противопоказания" defaultOpen={false}>
          <p>
            При острых болях, высоком давлении или плохом самочувствии тренировку
            следует отменить и проконсультироваться со специалистом.
          </p>
        </Collapsible>
      </div>
    </>
  );
}

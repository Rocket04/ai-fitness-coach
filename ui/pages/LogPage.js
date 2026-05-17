import React from 'react';
import Pill from '../components/Pill';
import MiniChart from '../components/MiniChart';

/**
 * Страница лога.
 * @param {{
 *   weight: number,
   setWeight: (v:number)=>void,
 *   restHR: number,
   setRestHR: (v:number)=>void,
 *   hrv: number,
   setHrv: (v:number)=>void,
 *   sleepHours: number,
   setSleepHours: (v:number)=>void,
 *   hipPain: number,
   setHipPain: (v:number)=>void,
 *   shoulderPain: number,
   setShoulderPain: (v:number)=>void,
 *   breathing: string,
   setBreathing: (v:string)=>void,
 *   notes: string,
   setNotes: (v:string)=>void,
 *   monthStats: Array<{label:string, value:string|number}>,
 *   weeklySummary: {
 *     completed:number,
 *     avgRPE:number,
 *     green:number,
 *     yellow:number,
 *     red:number,
 *     dominantStatus:string
 *   },
 *   testHistory: Array<{
 *     date:string,
 *     testResults:{pullUps:number, pushUps:number, plankSec:number}
 *   }>,
 *   sessions: Array<{
 *     date:string,
 *     readiness:'green'|'yellow'|'red',
 *     rpe:number,
 *     type:string
 *   }>,
 *   exportData: ()=>void,
 *   importData: (file:File)=>void,
 *   resetAll: ()=>void
 * }} props
 * @returns {JSX.Element}
 */
export default function LogPage({
  weight,
  setWeight,
  restHR,
  setRestHR,
  hrv,
  setHrv,
  sleepHours,
  setSleepHours,
  hipPain,
  setHipPain,
  shoulderPain,
  setShoulderPain,
  breathing,
  setBreathing,
  notes,
  setNotes,
  monthStats,
  weeklySummary,
  testHistory,
  sessions,
  exportData,
  importData,
  resetAll
}) {
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) importData(file);
  };

  return (
    <>
      <div className="card">
        <h2>Ежедневный чек‑ин</h2>
        <div className="row">
          <div>
            <label>Вес (кг):</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(Number(e.target.value))}
              className="btn"
              style={{ width: '80px' }}
            />
          </div>
          <div>
            <label>Пульс покоя:</label>
            <input
              type="number"
              value={restHR}
              onChange={e => setRestHR(Number(e.target.value))}
              className="btn"
              style={{ width: '80px' }}
            />
          </div>
          <div>
            <label>HRV:</label>
            <input
              type="number"
              value={hrv}
              onChange={e => setHrv(Number(e.target.value))}
              className="btn"
              style={{ width: '80px' }}
            />
          </div>
        </div>
        <div className="row" style={{ marginTop: '0.5rem' }}>
          <div>
            <label>Сон (ч):</label>
            <input
              type="number"
              value={sleepHours}
              onChange={e => setSleepHours(Number(e.target.value))}
              className="btn"
              style={{ width: '80px' }}
            />
          </div>
          <div>
            <label>Боль в бедре:</label>
            <input
              type="number"
              min="0"
              max="10"
              value={hipPain}
              onChange={e => setHipPain(Number(e.target.value))}
              className="btn"
              style={{ width: '60px' }}
            />
          </div>
          <div>
            <label>Боль в плече:</label>
            <input
              type="number"
              min="0"
              max="10"
              value={shoulderPain}
              onChange={e => setShoulderPain(Number(e.target.value))}
              className="btn"
              style={{ width: '60px' }}
            />
          </div>
        </div>
        <div className="row" style={{ marginTop: '0.5rem' }}>
          <div>
            <label>Дыхание:</label>
            <select
              value={breathing}
              onChange={e => setBreathing(e.target.value)}
              className="btn"
            >
              <option value="good">Хорошо</option>
              <option value="mild">Умеренно</option>
              <option value="bad">Плохо</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Заметки:</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows="3"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      {monthStats.length > 0 && (
        <div className="card">
          <h2>Месячная статистика</h2>
          <div className="month-stats">
            {monthStats.map((stat, idx) => (
              <div key={idx} className="month-stat-item">
                <div className="month-stat-value">{stat.value}</div>
                <div className="month-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>Сводка за 7 дней</h2>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-value">{weeklySummary.completed}</div>
            <div className="stat-label">Выполнено тренировок</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{weeklySummary.avgRPE?.toFixed(1) ?? '-'}</div>
            <div className="stat-label">Средний RPE</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">
              <Pill tone={weeklySummary.dominantStatus}>
                {weeklySummary.dominantStatus}
              </Pill>
            </div>
            <div className="stat-label">Доминирующий статус</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{weeklySummary.green}</div>
            <div className="stat-label">Зелёных дней</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{weeklySummary.yellow}</div>
            <div className="stat-label">Жёлтых дней</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{weeklySummary.red}</div>
            <div className="stat-label">Красных дней</div>
          </div>
        </div>
      </div>

      {testHistory.length > 0 && (
        <div className="card">
          <h2>Тестовая динамика</h2>
          <div className="row">
            <div>
              <h4>Подтягивания</h4>
              <MiniChart
                data={testHistory.map(h => h.testResults.pullUps ?? 0)}
                maxValue={Math.max(...testHistory.map(h => h.testResults.pullUps ?? 0), 1)}
              />
            </div>
            <div>
              <h4>Отжимания</h4>
              <MiniChart
                data={testHistory.map(h => h.testResults.pushUps ?? 0)}
                maxValue={Math.max(...testHistory.map(h => h.testResults.pushUps ?? 0), 1)}
              />
            </div>
            <div>
              <h4>Планка (сек)</h4>
              <MiniChart
                data={testHistory.map(h => h.testResults.plankSec ?? 0)}
                maxValue={Math.max(...testHistory.map(h => h.testResults.plankSec ?? 0), 1)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Последние 8 записей</h2>
        {sessions.slice(-8).reverse().map((s, idx) => (
          <div key={idx} className="row" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <Pill tone={s.readiness ?? 'gray'}>{s.readiness ?? '-'}</Pill>
            </div>
            <div style={{ flex: 1 }}>
              <strong>{new Date(s.date).toLocaleDateString()}</strong> – {s.type}
            </div>
            <div>
              RPE: {s.rpe ?? '-'}
            </div>
          </div>
        ))}
      </div>

      <div className="row center" style={{ marginTop: '2rem' }}>
        <button className="btn btn-accent" onClick={exportData}>
          Экспорт данных
        </button>
        <input
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          id="import-file"
          onChange={handleFileChange}
        />
        <button
          className="btn"
          onClick={() => document.getElementById('import-file')?.click()}
        >
          Импорт данных
        </button>
        <button className="btn btn-red" onClick={resetAll}>
          Сбросить всё
        </button>
      </div>
    </>
  );
}

import React from 'react';
import Pill from '../components/Pill';
import MiniChart from '../components/MiniChart';

/**
 * Страница лога.
 * @param {{
 *   weight: number,
 *   setWeight: (v:number)=>void,
 *   restHR: number,
 *   setRestHR: (v:number)=>void,
 *   hrv: number,
 *   setHrv: (v:number)=>void,
 *   sleepHours: number,
 *   setSleepHours: (v:number)=>void,
 *   hipPain: number,
 *   setHipPain: (v:number)=>void,
 *   shoulderPain: number,
 *   setShoulderPain: (v:number)=>void,
 *   breathing: string,
 *   setBreathing: (v:string)=>void,
 *   notes: string,
 *   setNotes: (v:string)=>void,
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
 *   onSaveCheckin: ()=>void,
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
  onSaveCheckin,
  exportData,
  importData,
  resetAll
}) {
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) importData(file);
  };

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h2', null, 'Ежедневный чек‑ин'),
      React.createElement(
        'div',
        { className: 'row' },
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'Вес (кг):'),
          React.createElement('input', {
            type: 'number',
            value: weight,
            onChange: e => setWeight(Number(e.target.value)),
            className: 'btn',
            style: { width: '80px' },
          })
        ),
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'Пульс покоя:'),
          React.createElement('input', {
            type: 'number',
            value: restHR,
            onChange: e => setRestHR(Number(e.target.value)),
            className: 'btn',
            style: { width: '80px' },
          })
        ),
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'HRV:'),
          React.createElement('input', {
            type: 'number',
            value: hrv,
            onChange: e => setHrv(Number(e.target.value)),
            className: 'btn',
            style: { width: '80px' },
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'row', style: { marginTop: '0.5rem' } },
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'Сон (ч):'),
          React.createElement('input', {
            type: 'number',
            value: sleepHours,
            onChange: e => setSleepHours(Number(e.target.value)),
            className: 'btn',
            style: { width: '80px' },
          })
        ),
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'Боль в бедре:'),
          React.createElement('input', {
            type: 'number',
            min: '0',
            max: '10',
            value: hipPain,
            onChange: e => setHipPain(Number(e.target.value)),
            className: 'btn',
            style: { width: '60px' },
          })
        ),
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'Боль в плече:'),
          React.createElement('input', {
            type: 'number',
            min: '0',
            max: '10',
            value: shoulderPain,
            onChange: e => setShoulderPain(Number(e.target.value)),
            className: 'btn',
            style: { width: '60px' },
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'row', style: { marginTop: '0.5rem' } },
        React.createElement(
          'div',
          null,
          React.createElement('label', null, 'Дыхание:'),
          React.createElement(
            'select',
            {
              value: breathing,
              onChange: e => setBreathing(e.target.value),
              className: 'btn',
            },
            React.createElement('option', { value: 'good' }, 'Хорошо'),
            React.createElement('option', { value: 'mild' }, 'Умеренно'),
            React.createElement('option', { value: 'bad' }, 'Плохо')
          )
        ),
        React.createElement(
          'div',
          { style: { flex: 1 } },
          React.createElement('label', null, 'Заметки:'),
          React.createElement('textarea', {
            value: notes,
            onChange: e => setNotes(e.target.value),
            rows: '3',
            style: { width: '100%', boxSizing: 'border-box' },
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'row center', style: { marginTop: '1rem' } },
        React.createElement(
          'button',
          { className: 'btn btn-green', onClick: onSaveCheckin },
          'Сохранить чек‑ин'
        )
      )
    ),
    monthStats.length > 0 &&
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement('h2', null, 'Месячная статистика'),
        React.createElement(
          'div',
          { className: 'month-stats' },
          monthStats.map((stat, idx) =>
            React.createElement(
              'div',
              { key: idx, className: 'month-stat-item' },
              React.createElement('div', { className: 'month-stat-value' }, stat.value),
              React.createElement('div', { className: 'month-stat-label' }, stat.label)
            )
          )
        )
      ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h2', null, 'Сводка за 7 дней'),
      React.createElement(
        'div',
        { className: 'stat-grid' },
        React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, weeklySummary.completed),
          React.createElement('div', { className: 'stat-label' }, 'Выполнено тренировок')
        ),
        React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, weeklySummary.avgRPE?.toFixed(1) ?? '-'),
          React.createElement('div', { className: 'stat-label' }, 'Средний RPE')
        ),
        React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement(
            'div',
            { className: 'stat-value' },
            React.createElement(Pill, { tone: weeklySummary.dominantStatus }, weeklySummary.dominantStatus)
          ),
          React.createElement('div', { className: 'stat-label' }, 'Доминирующий статус')
        ),
        React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, weeklySummary.green),
          React.createElement('div', { className: 'stat-label' }, 'Зелёных дней')
        ),
        React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, weeklySummary.yellow),
          React.createElement('div', { className: 'stat-label' }, 'Жёлтых дней')
        ),
        React.createElement(
          'div',
          { className: 'stat-box' },
          React.createElement('div', { className: 'stat-value' }, weeklySummary.red),
          React.createElement('div', { className: 'stat-label' }, 'Красных дней')
        )
      )
    ),
    testHistory.length > 0 &&
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement('h2', null, 'Тестовая динамика'),
        React.createElement(
          'div',
          { className: 'row' },
          React.createElement(
            'div',
            null,
            React.createElement('h4', null, 'Подтягивания'),
            React.createElement(MiniChart, {
              data: testHistory.map(h => h.testResults.pullUps ?? 0),
              maxValue: Math.max(...testHistory.map(h => h.testResults.pullUps ?? 0), 1),
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement('h4', null, 'Отжимания'),
            React.createElement(MiniChart, {
              data: testHistory.map(h => h.testResults.pushUps ?? 0),
              maxValue: Math.max(...testHistory.map(h => h.testResults.pushUps ?? 0), 1),
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement('h4', null, 'Планка (сек)'),
            React.createElement(MiniChart, {
              data: testHistory.map(h => h.testResults.plankSec ?? 0),
              maxValue: Math.max(...testHistory.map(h => h.testResults.plankSec ?? 0), 1),
            })
          )
        )
      ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h2', null, 'Последние 8 записей'),
      sessions
        .slice(-8)
        .reverse()
        .map((s, idx) =>
          React.createElement(
            'div',
            {
              key: idx,
              className: 'row',
              style: { padding: '0.5rem 0', borderBottom: '1px solid var(--border)' },
            },
            React.createElement(
              'div',
              null,
              React.createElement(Pill, { tone: s.readiness ?? 'gray' }, s.readiness ?? '-')
            ),
            React.createElement(
              'div',
              { style: { flex: 1 } },
              React.createElement('strong', null, new Date(s.date).toLocaleDateString()),
              ' – ',
              s.type
            ),
            React.createElement('div', null, 'RPE: ', s.rpe ?? '-')
          )
        )
    ),
    React.createElement(
      'div',
      { className: 'row center', style: { marginTop: '2rem' } },
      React.createElement(
        'button',
        { className: 'btn btn-accent', onClick: exportData },
        'Экспорт данных'
      ),
      React.createElement('input', {
        type: 'file',
        accept: '.json',
        style: { display: 'none' },
        id: 'import-file',
        onChange: handleFileChange,
      }),
      React.createElement(
        'button',
        {
          className: 'btn',
          onClick: () => document.getElementById('import-file')?.click(),
        },
        'Импорт данных'
      ),
      React.createElement(
        'button',
        { className: 'btn btn-red', onClick: resetAll },
        'Сбросить всё'
      )
    )
  );
}

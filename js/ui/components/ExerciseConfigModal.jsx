// js/ui/components/ExerciseConfigModal.jsx
// Модальное окно настройки упражнения (протокол + стартовый вес/уровень)

import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import Modal from './Modal.jsx';
import { estimateCalisthenicsRM } from '../../domains/training/calisthenicsOnboarding.ts';
import styles from './ExerciseConfigModal.module.css';

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   exercise: { id: string, name: string, isCalisthenics: boolean, protocol?: string, currentRM?: number|null, currentLevel?: number|null, usesWeight?: boolean, unit?: string } | null,
 *   onSave: (config: { id: string, protocol: '3'|'6'|'10', currentRM: number|null, currentLevel: number|null, usesWeight?: boolean }) => void
 * }} props
 */
export default function ExerciseConfigModal({ isOpen, onClose, exercise, onSave }) {
  const [protocol, setProtocol] = useState('6');
  const [weight, setWeight] = useState('');
  const [level, setLevel] = useState(1);
  const [error, setError] = useState('');
  const [calisthenicsWeight, setCalisthenicsWeight] = useState('');
  const [calisthenicsReps, setCalisthenicsReps] = useState('');

  // Reset form when exercise changes
  useEffect(() => {
    if (exercise) {
      setProtocol(exercise.protocol || '6');
      setWeight(exercise.currentRM ? String(exercise.currentRM) : '');
      setLevel(exercise.currentLevel || 1);
      setCalisthenicsWeight('');
      setCalisthenicsReps('');
      setError('');
    }
  }, [exercise?.id]);

  if (!exercise) return null;

  const isCalisthenics = exercise.isCalisthenics;

  const handleSave = () => {
    if (isCalisthenics) {
      // Weight-based calisthenics: use weight + reps to estimate RM
      const w = parseFloat(calisthenicsWeight);
      const r = parseInt(calisthenicsReps, 10);
      if (calisthenicsWeight !== '' && calisthenicsReps !== '') {
        if (isNaN(w) || w < 0) {
          setError('Введите корректный вес');
          return;
        }
        if (isNaN(r) || r <= 0) {
          setError('Введите корректное количество повторений');
          return;
        }
        const calculatedRM = estimateCalisthenicsRM(r, w);
        onSave({
          id: exercise.id,
          protocol,
          currentRM: calculatedRM,
          currentLevel: null,
          usesWeight: true,
        });
      } else {
        // Fallback: keep old level-based config (backward compat)
        const currentLevelVal = level || 1;
        onSave({
          id: exercise.id,
          protocol,
          currentRM: null,
          currentLevel: currentLevelVal,
          usesWeight: false,
        });
      }
    } else {
      const w = parseFloat(weight);
      if (!w || w <= 0) {
        setError('Введите корректный вес');
        return;
      }
      onSave({
        id: exercise.id,
        protocol,
        currentRM: w,
        currentLevel: null,
      });
    }
    onClose();
  };

  const protocolInfo = {
    '3': 'Сила: 3-6 повторений, агрессивный прогресс',
    '6': 'Гипертрофия: 6-12 повторений, стандартный протокол',
    '10': 'Выносливость: 10-20 повторений, высокий объем'
  };

  return React.createElement(Modal, {
    isOpen,
    onClose,
    title: React.createElement(React.Fragment, null,
      React.createElement(Settings, { size: 20 }),
      ` Настройка: ${exercise.name}`
    )
  },
    React.createElement('div', { className: styles['exercise-config-modal'] },
      // Протокол APRE
      React.createElement('div', { className: styles['config-section'] },
        React.createElement('label', { className: styles['config-label'] }, 'Протокол APRE'),
        React.createElement('div', { className: styles['protocol-buttons'] },
          ['3', '6', '10'].map(p =>
            React.createElement('button', {
              key: p,
              className: `${styles['protocol-btn']} ${protocol === p ? styles['protocol-btn--active'] : ''}`,
              onClick: () => setProtocol(p)
            }, p)
          )
        ),
        React.createElement('p', { className: styles['protocol-hint'] }, protocolInfo[protocol])
      ),

      // Вес или уровень
      isCalisthenics
        ? React.createElement('div', { className: styles['config-section'] },
            React.createElement('label', { className: styles['config-label'] }, 'Рабочий вес и повторения'),
            React.createElement('p', { className: styles['config-hint'] },
              'Сколько повторений ты можешь сделать с дополнительным весом?'
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px', marginBottom: '8px' } },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('label', { className: styles['config-label'], style: { fontSize: '0.8rem' } }, 'Вес (кг)'),
                React.createElement('input', {
                  type: 'number',
                  className: styles['config-input'],
                  value: calisthenicsWeight,
                  onChange: (e) => { setCalisthenicsWeight(e.target.value); setError(''); },
                  placeholder: 'Вес (кг)',
                  min: '0',
                  step: '0.5'
                })
              ),
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('label', { className: styles['config-label'], style: { fontSize: '0.8rem' } }, 'Повторений'),
                React.createElement('input', {
                  type: 'number',
                  className: styles['config-input'],
                  value: calisthenicsReps,
                  onChange: (e) => { setCalisthenicsReps(e.target.value); setError(''); },
                  placeholder: 'Повторений',
                  min: '1',
                  step: '1'
                })
              )
            ),
            calisthenicsWeight !== '' && calisthenicsReps !== '' && (() => {
              const w = parseFloat(calisthenicsWeight);
              const r = parseInt(calisthenicsReps, 10);
              if (!isNaN(w) && !isNaN(r) && r > 0 && w >= 0) {
                const rm = estimateCalisthenicsRM(r, w);
                return React.createElement('p', {
                  className: styles['weight-hint'],
                  style: { fontWeight: 600, marginBottom: '4px' }
                }, `Расчётный максимум: ~ ${rm} кг`);
              }
              return null;
            })(),
            React.createElement('p', { className: styles['weight-hint'], style: { fontSize: '0.75rem', opacity: 0.7 } },
              'Например: подтягиваюсь 6 раз с рюкзаком +5 кг → введи вес 5, повторений 6'
            )
          )
        : React.createElement('div', { className: styles['config-section'] },
            React.createElement('label', { className: styles['config-label'] },
              `Текущий рабочий вес (${exercise.unit || 'кг'})`
            ),
            React.createElement('input', {
              type: 'number',
              className: styles['config-input'],
              value: weight,
              onChange: (e) => { setWeight(e.target.value); setError(''); },
              placeholder: 'Например: 60',
              min: '0',
              step: '0.5'
            }),
            React.createElement('p', { className: styles['weight-hint'] },
              'Введите вес, с которым вы можете сделать ~6 чистых повторений'
            )
          ),

      // Error
      error && React.createElement('p', { className: styles['config-error'] }, error),

      React.createElement('div', { className: styles['config-buttons'] },
        React.createElement('button', {
          className: 'btn',
          onClick: onClose
        }, 'Отмена'),
        React.createElement('button', {
          className: 'btn btn-accent',
          onClick: handleSave
        }, 'Сохранить')
      )
    )
  );
}

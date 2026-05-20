// js/ui/components/ExerciseConfigModal.jsx
// Модальное окно настройки упражнения (протокол + стартовый вес/уровень)

import React, { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import { CALISTHENICS_PROGRESSIONS } from '../../core/apre/engine.js';

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   exercise: { id: string, name: string, isCalisthenics: boolean, protocol?: string, currentRM?: number|null, currentLevel?: number|null, unit?: string } | null,
 *   onSave: (config: { id: string, protocol: '3'|'6'|'10', currentRM: number|null, currentLevel: number|null }) => void
 * }} props
 */
export default function ExerciseConfigModal({ isOpen, onClose, exercise, onSave }) {
  const [protocol, setProtocol] = useState('6');
  const [weight, setWeight] = useState('');
  const [level, setLevel] = useState(1);
  const [error, setError] = useState('');

  // Reset form when exercise changes
  useEffect(() => {
    if (exercise) {
      setProtocol(exercise.protocol || '6');
      setWeight(exercise.currentRM ? String(exercise.currentRM) : '');
      setLevel(exercise.currentLevel || 1);
      setError('');
    }
  }, [exercise?.id]);

  if (!exercise) return null;

  const isCalisthenics = exercise.isCalisthenics;

  const handleSave = () => {
    if (isCalisthenics) {
      onSave({
        id: exercise.id,
        protocol,
        currentRM: null,
        currentLevel: level,
      });
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
    title: `⚙️ Настройка: ${exercise.name}`
  },
    React.createElement('div', { className: 'exercise-config-modal' },
      // Протокол APRE
      React.createElement('div', { className: 'config-section' },
        React.createElement('label', { className: 'config-label' }, 'Протокол APRE'),
        React.createElement('div', { className: 'protocol-buttons' },
          ['3', '6', '10'].map(p =>
            React.createElement('button', {
              key: p,
              className: `protocol-btn ${protocol === p ? 'protocol-btn--active' : ''}`,
              onClick: () => setProtocol(p)
            }, p)
          )
        ),
        React.createElement('p', { className: 'protocol-hint' }, protocolInfo[protocol])
      ),

      // Вес или уровень
      isCalisthenics
        ? React.createElement('div', { className: 'config-section' },
            React.createElement('label', { className: 'config-label' }, 'Уровень сложности'),
            React.createElement('div', { className: 'level-selector' },
              [1, 2, 3, 4, 5].map(l =>
                React.createElement('button', {
                  key: l,
                  className: `level-btn ${level === l ? 'level-btn--active' : ''}`,
                  onClick: () => setLevel(l)
                }, CALISTHENICS_PROGRESSIONS[l] || l)
              )
            )
          )
        : React.createElement('div', { className: 'config-section' },
            React.createElement('label', { className: 'config-label' },
              `Текущий рабочий вес (${exercise.unit || 'кг'})`
            ),
            React.createElement('input', {
              type: 'number',
              className: 'config-input',
              value: weight,
              onChange: (e) => { setWeight(e.target.value); setError(''); },
              placeholder: 'Например: 60',
              min: '0',
              step: '0.5'
            }),
            React.createElement('p', { className: 'weight-hint' },
              'Введите вес, с которым вы можете сделать ~6 чистых повторений'
            )
          ),

      // Error
      error && React.createElement('p', { className: 'config-error' }, error),

      // Buttons
      React.createElement('div', { className: 'config-buttons' },
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

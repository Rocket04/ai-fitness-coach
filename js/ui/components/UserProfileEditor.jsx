// js/ui/components/UserProfileEditor.jsx
// Advanced user profile editor: level, goals, equipment

import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore.js';
import { saveSetting } from '../../core/storage.js';

const LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: '0-6 months experience' },
  { key: 'intermediate', label: 'Intermediate', desc: '6-24 months experience' },
  { key: 'advanced', label: 'Advanced', desc: '24+ months experience' },
];

const GOALS = [
  { key: 'hypertrophy', label: 'Hypertrophy', desc: 'Muscle growth, 8-12 reps' },
  { key: 'strength', label: 'Strength', desc: 'Max strength, 3-6 reps' },
  { key: 'endurance', label: 'Endurance', desc: 'Stamina, 15-20 reps' },
  { key: 'rehabilitation', label: 'Rehabilitation', desc: 'Recovery, 10-15 reps light' },
];

const EQUIPMENT = [
  { key: 'dumbbells_max_kg', label: 'Dumbbells (max kg)', type: 'number' },
  { key: 'pullup_bar', label: 'Pull-up bar', type: 'checkbox' },
  { key: 'dip_bars', label: 'Dip bars', type: 'checkbox' },
  { key: 'resistance_bands', label: 'Resistance bands', type: 'checkbox' },
  { key: 'barbell', label: 'Barbell', type: 'checkbox' },
  { key: 'kettlebell', label: 'Kettlebell', type: 'checkbox' },
];

export default function UserProfileEditor({ onClose }) {
  const store = useAppStore();
  const [level, setLevel] = useState(store.profileLevel || 'intermediate');
  const [goals, setGoals] = useState(store.profileGoals || []);
  const [equipment, setEquipment] = useState(store.profileEquipment || {});

  const toggleGoal = (goal) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const updateEquipment = (key, value) => {
    setEquipment(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await saveSetting('level', level);
    await saveSetting('goals', goals);
    await saveSetting('equipment', JSON.stringify(equipment));
    if (store.setProfileLevel) store.setProfileLevel(level);
    if (store.setProfileGoals) store.setProfileGoals(goals);
    if (store.setProfileEquipment) store.setProfileEquipment(equipment);
    if (onClose) onClose();
  };

  return React.createElement('div', { className: 'flex flex-column gap-md' },
    // Level selection
    React.createElement('div', null,
      React.createElement('h4', { className: 'mt-0' }, 'Training Level'),
      React.createElement('div', { className: 'flex flex-column gap-sm' },
        LEVELS.map(l => React.createElement('label', { key: l.key, className: 'flex items-center gap-sm' },
          React.createElement('input', {
            type: 'radio',
            name: 'level',
            value: l.key,
            checked: level === l.key,
            onChange: () => setLevel(l.key),
          }),
          React.createElement('div', null,
            React.createElement('strong', null, l.label),
            React.createElement('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', marginLeft: '0.5rem' } }, l.desc)
          )
        ))
      )
    ),

    // Goals multi-select
    React.createElement('div', null,
      React.createElement('h4', null, 'Training Goals'),
      React.createElement('div', { className: 'grid-2 gap-sm' },
        GOALS.map(g => React.createElement('label', { key: g.key, className: 'flex items-center gap-xs' },
          React.createElement('input', {
            type: 'checkbox',
            checked: goals.includes(g.key),
            onChange: () => toggleGoal(g.key),
          }),
          React.createElement('div', null,
            React.createElement('strong', null, g.label),
            React.createElement('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text3)', display: 'block' } }, g.desc)
          )
        ))
      )
    ),

    // Equipment
    React.createElement('div', null,
      React.createElement('h4', null, 'Available Equipment'),
      React.createElement('div', { className: 'grid-2 gap-sm' },
        EQUIPMENT.map(eq => React.createElement('label', { key: eq.key, className: 'flex items-center gap-xs' },
          eq.type === 'checkbox'
            ? React.createElement('input', {
                type: 'checkbox',
                checked: !!equipment[eq.key],
                onChange: (e) => updateEquipment(eq.key, e.target.checked),
              })
            : React.createElement('input', {
                type: 'number',
                value: equipment[eq.key] || '',
                onChange: (e) => updateEquipment(eq.key, parseInt(e.target.value) || 0),
                placeholder: 'kg',
                style: { width: '80px', padding: '0.25rem' },
              }),
          React.createElement('span', null, eq.label)
        ))
      )
    ),

    // Actions
    React.createElement('div', { className: 'flex gap-sm justify-end' },
      React.createElement('button', { className: 'btn', onClick: onClose }, 'Cancel'),
      React.createElement('button', { className: 'btn btn-accent', onClick: handleSave }, 'Save Profile')
    )
  );
}

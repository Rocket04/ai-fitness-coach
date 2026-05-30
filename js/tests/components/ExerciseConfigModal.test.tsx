import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ExerciseConfigModal from '../../ui/components/ExerciseConfigModal.jsx';

vi.mock('../../domains/training/calisthenicsOnboarding.ts', () => ({
  estimateCalisthenicsRM: (reps: number, weight: number) => Math.round(weight * (1 + reps / 30) * 10) / 10,
}));

vi.mock('@base-ui/react/dialog', () => ({
  Dialog: {
    Root: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? children : null,
    Portal: ({ children }: { children: React.ReactNode }) => children,
    Backdrop: () => null,
    Popup: ({ children }: { children: React.ReactNode }) => children,
    Close: ({ children }: { children: React.ReactNode }) => children,
    Title: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe('ExerciseConfigModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const strengthExercise = {
    id: 'bench_press',
    name: 'Жим лёжа',
    isCalisthenics: false,
    protocol: '6' as const,
    currentRM: null as number | null,
    currentLevel: null as number | null,
    unit: 'kg' as const,
  };
  const calisthenicsExercise = {
    id: 'pull_ups',
    name: 'Подтягивания',
    isCalisthenics: true,
    protocol: '6' as const,
    currentRM: null as number | null,
    currentLevel: null as number | null,
    unit: 'kg' as const,
  };

  beforeEach(() => {
    mockOnClose.mockReset();
    mockOnSave.mockReset();
  });

  it('renders weight and reps inputs for calisthenics exercises', () => {
    render(
      <ExerciseConfigModal
        isOpen={true}
        onClose={mockOnClose}
        exercise={calisthenicsExercise}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByText('Рабочий вес и повторения')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Вес (кг)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Повторений')).toBeInTheDocument();
  });

  it('calculates RM from weight and reps on save', () => {
    render(
      <ExerciseConfigModal
        isOpen={true}
        onClose={mockOnClose}
        exercise={calisthenicsExercise}
        onSave={mockOnSave}
      />
    );
    const weightInput = screen.getByPlaceholderText('Вес (кг)');
    const repsInput = screen.getByPlaceholderText('Повторений');
    fireEvent.change(weightInput, { target: { value: '5' } });
    fireEvent.change(repsInput, { target: { value: '6' } });
    const saveButton = screen.getByText('Сохранить');
    fireEvent.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledWith({
      id: 'pull_ups',
      protocol: '6',
      currentRM: 6,
      currentLevel: null,
      usesWeight: true,
    });
  });

  it('does NOT render level selector for weight-based calisthenics', () => {
    render(
      <ExerciseConfigModal
        isOpen={true}
        onClose={mockOnClose}
        exercise={calisthenicsExercise}
        onSave={mockOnSave}
      />
    );
    expect(screen.queryByText('Уровень сложности')).not.toBeInTheDocument();
    expect(screen.queryByText('Easy')).not.toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();
  });

  it('renders weight input for strength exercises', () => {
    render(
      <ExerciseConfigModal
        isOpen={true}
        onClose={mockOnClose}
        exercise={strengthExercise}
        onSave={mockOnSave}
      />
    );
    expect(screen.getByText('Текущий рабочий вес (kg)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Например: 60')).toBeInTheDocument();
  });

  it('shows validation error for invalid calisthenics weight', () => {
    render(
      <ExerciseConfigModal
        isOpen={true}
        onClose={mockOnClose}
        exercise={calisthenicsExercise}
        onSave={mockOnSave}
      />
    );
    const weightInput = screen.getByPlaceholderText('Вес (кг)');
    const repsInput = screen.getByPlaceholderText('Повторений');
    fireEvent.change(weightInput, { target: { value: '-1' } });
    fireEvent.change(repsInput, { target: { value: '6' } });
    const saveButton = screen.getByText('Сохранить');
    fireEvent.click(saveButton);
    expect(screen.getByText('Введите корректный вес')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('falls back to level-based config when weight/reps are empty', () => {
    render(
      <ExerciseConfigModal
        isOpen={true}
        onClose={mockOnClose}
        exercise={calisthenicsExercise}
        onSave={mockOnSave}
      />
    );
    const saveButton = screen.getByText('Сохранить');
    fireEvent.click(saveButton);
    expect(mockOnSave).toHaveBeenCalledWith({
      id: 'pull_ups',
      protocol: '6',
      currentRM: null,
      currentLevel: 1,
      usesWeight: false,
    });
  });
});

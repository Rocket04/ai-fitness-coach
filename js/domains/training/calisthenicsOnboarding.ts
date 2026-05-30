// js/domains/training/calisthenicsOnboarding.ts
// Calisthenics weight-based assessment and RM estimation

export interface CalisthenicsAssessment {
  exerciseName: string;
  reps: number;
  addedWeightKg: number;
}

/**
 * Estimate 1RM for weighted calisthenics using Epley formula.
 * For bodyweight exercises, the user enters only the ADDED weight (backpack, belt).
 * Formula: estimatedRM = addedWeight * (1 + reps / 30)
 *
 * @param reps - number of reps performed with added weight
 * @param addedWeightKg - added weight in kg (0 for bodyweight-only)
 * @returns estimated 1RM in kg, rounded to 1 decimal
 */
export function estimateCalisthenicsRM(reps: number, addedWeightKg: number): number {
  if (reps <= 0 || addedWeightKg < 0) return 0;
  return Math.round(addedWeightKg * (1 + reps / 30) * 10) / 10;
}

export type RunEndReason = 'dawn' | 'stamina';

export interface RunResult {
    score: number;
    alarm: number;
    deliveries: number;
    maxCombo: number;
    reason: RunEndReason;
}

export interface HighScoreEntry {
    initials: string;
    score: number;
    alarm: number;
    deliveries: number;
    maxCombo: number;
    date: string;
}


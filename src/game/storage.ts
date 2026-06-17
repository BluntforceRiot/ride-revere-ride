import type { HighScoreEntry } from './types';

export const HIGH_SCORE_KEY = 'ride-revere-ride.highScores.v1';

const isHighScoreEntry = (value: unknown): value is HighScoreEntry => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const entry = value as Partial<HighScoreEntry>;

    return typeof entry.initials === 'string'
        && typeof entry.score === 'number'
        && typeof entry.alarm === 'number'
        && typeof entry.deliveries === 'number'
        && typeof entry.maxCombo === 'number'
        && typeof entry.date === 'string';
};

export const loadHighScores = (): HighScoreEntry[] => {
    try {
        const rawScores = window.localStorage.getItem(HIGH_SCORE_KEY);

        if (!rawScores) {
            return [];
        }

        const parsed = JSON.parse(rawScores) as unknown;

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter(isHighScoreEntry)
            .sort(compareHighScores)
            .slice(0, 10);
    } catch {
        return [];
    }
};

export const saveHighScore = (entry: HighScoreEntry): HighScoreEntry[] => {
    const highScores = [...loadHighScores(), entry]
        .sort(compareHighScores)
        .slice(0, 10);

    window.localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(highScores));

    return highScores;
};

export const clearHighScores = () => {
    window.localStorage.removeItem(HIGH_SCORE_KEY);
};

const compareHighScores = (a: HighScoreEntry, b: HighScoreEntry): number => {
    if (b.score !== a.score) {
        return b.score - a.score;
    }

    if (b.alarm !== a.alarm) {
        return b.alarm - a.alarm;
    }

    return b.deliveries - a.deliveries;
};

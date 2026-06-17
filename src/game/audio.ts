const AUDIO_MUTE_KEY = 'ride-revere-ride.audioMuted.v1';

type OscillatorKind = OscillatorType;
type AudioContextConstructor = new (contextOptions?: AudioContextOptions) => AudioContext;

interface ToneStep {
    frequency: number;
    duration: number;
    type?: OscillatorKind;
    gain?: number;
}

class ArcadeAudio {
    private context?: AudioContext;
    private masterGain?: GainNode;
    private muted = this.readMutedPreference();

    isMuted() {
        return this.muted;
    }

    getLabel() {
        return this.muted ? 'Sound: muted' : 'Sound: on';
    }

    toggleMute() {
        this.muted = !this.muted;
        this.writeMutedPreference();

        if (!this.muted) {
            this.resume();
        }

        return this.muted;
    }

    resume() {
        const context = this.getContext();

        if (!context || context.state !== 'suspended') {
            return;
        }

        void context.resume().catch(() => {
            // Browsers may block WebAudio until a trusted gesture; cues will retry later.
        });
    }

    playThrow() {
        this.playSequence([
            { frequency: 540, duration: 0.045, type: 'square', gain: 0.038 },
            { frequency: 410, duration: 0.05, type: 'square', gain: 0.028 }
        ]);
    }

    playDelivery() {
        this.playSequence([
            { frequency: 650, duration: 0.055, type: 'triangle', gain: 0.044 },
            { frequency: 860, duration: 0.06, type: 'triangle', gain: 0.042 },
            { frequency: 1120, duration: 0.07, type: 'triangle', gain: 0.034 }
        ]);
    }

    playHazard() {
        this.playSequence([
            { frequency: 180, duration: 0.08, type: 'sawtooth', gain: 0.038 },
            { frequency: 105, duration: 0.12, type: 'sawtooth', gain: 0.034 }
        ]);
    }

    playComboTier() {
        this.playSequence([
            { frequency: 520, duration: 0.05, type: 'square', gain: 0.04 },
            { frequency: 780, duration: 0.055, type: 'square', gain: 0.04 },
            { frequency: 1040, duration: 0.08, type: 'square', gain: 0.035 }
        ]);
    }

    playGameOver() {
        this.playSequence([
            { frequency: 330, duration: 0.09, type: 'triangle', gain: 0.05 },
            { frequency: 247, duration: 0.1, type: 'triangle', gain: 0.046 },
            { frequency: 196, duration: 0.16, type: 'triangle', gain: 0.04 }
        ]);
    }

    playSave() {
        this.playSequence([
            { frequency: 740, duration: 0.06, type: 'triangle', gain: 0.04 },
            { frequency: 990, duration: 0.1, type: 'triangle', gain: 0.035 }
        ]);
    }

    private playSequence(steps: ToneStep[]) {
        if (this.muted) {
            return;
        }

        const context = this.getContext();

        if (!context) {
            return;
        }

        this.resume();

        let start = context.currentTime + 0.01;

        for (const step of steps) {
            this.playTone(context, start, step);
            start += step.duration * 0.88;
        }
    }

    private playTone(context: AudioContext, start: number, step: ToneStep) {
        const gain = context.createGain();
        const oscillator = context.createOscillator();
        const duration = step.duration;
        const peak = step.gain ?? 0.04;

        oscillator.type = step.type ?? 'square';
        oscillator.frequency.setValueAtTime(step.frequency, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.connect(gain);
        gain.connect(this.masterGain ?? context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
    }

    private getContext() {
        if (typeof window === 'undefined') {
            return undefined;
        }

        if (this.context) {
            return this.context;
        }

        try {
            const audioWindow = window as Window & {
                AudioContext?: AudioContextConstructor;
                webkitAudioContext?: AudioContextConstructor;
            };
            const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

            if (!AudioContextCtor) {
                return undefined;
            }

            const context = new AudioContextCtor();

            this.context = context;
            this.masterGain = context.createGain();
            this.masterGain.gain.value = 0.36;
            this.masterGain.connect(context.destination);
        } catch {
            return undefined;
        }

        return this.context;
    }

    private readMutedPreference() {
        try {
            return window.localStorage.getItem(AUDIO_MUTE_KEY) === 'true';
        } catch {
            return false;
        }
    }

    private writeMutedPreference() {
        try {
            window.localStorage.setItem(AUDIO_MUTE_KEY, String(this.muted));
        } catch {
            // localStorage may be unavailable in hardened/private contexts.
        }
    }
}

export const gameAudio = new ArcadeAudio();

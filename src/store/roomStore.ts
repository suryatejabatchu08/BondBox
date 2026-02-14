import { create } from 'zustand';

interface TimerState {
    isRunning: boolean;
    timeLeft: number;
    isBreak: boolean;
    workDuration: number;
    breakDuration: number;
    completedSessions: number;
}

interface RoomState {
    timer: TimerState;
    setTimer: (timer: Partial<TimerState>) => void;
    resetTimer: () => void;
    toggleTimer: () => void;
    tick: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
    timer: {
        isRunning: false,
        timeLeft: 25 * 60,
        isBreak: false,
        workDuration: 25,
        breakDuration: 5,
        completedSessions: 0,
    },

    setTimer: (updates) =>
        set((state) => ({
            timer: { ...state.timer, ...updates },
        })),

    resetTimer: () =>
        set((state) => ({
            timer: {
                ...state.timer,
                isRunning: false,
                timeLeft: state.timer.workDuration * 60,
                isBreak: false,
            },
        })),

    toggleTimer: () =>
        set((state) => ({
            timer: { ...state.timer, isRunning: !state.timer.isRunning },
        })),

    tick: () => {
        const { timer } = get();
        if (!timer.isRunning) return;

        if (timer.timeLeft <= 0) {
            if (timer.isBreak) {
                set({
                    timer: {
                        ...timer,
                        isBreak: false,
                        timeLeft: timer.workDuration * 60,
                        isRunning: false,
                        completedSessions: timer.completedSessions + 1,
                    },
                });
            } else {
                set({
                    timer: {
                        ...timer,
                        isBreak: true,
                        timeLeft: timer.breakDuration * 60,
                        isRunning: false,
                    },
                });
            }
        } else {
            set({
                timer: { ...timer, timeLeft: timer.timeLeft - 1 },
            });
        }
    },
}));

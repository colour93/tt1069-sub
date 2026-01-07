import { create } from 'zustand';

const PREF_KEY = 'reader-prefs';

export type ReaderPrefs = {
  mode: 'light' | 'dark';
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  textColor: string;
  bgColor: string;
};

const defaultPrefs: ReaderPrefs = {
  mode: 'light',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 18,
  fontWeight: 400,
  lineHeight: 1.8,
  textColor: '#1f2933',
  bgColor: '#f5f5f5',
};

const loadPrefs = (): ReaderPrefs => {
  if (typeof window === 'undefined') return defaultPrefs;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw) as Partial<ReaderPrefs>;
    return { ...defaultPrefs, ...parsed };
  } catch {
    return defaultPrefs;
  }
};

const savePrefs = (prefs: ReaderPrefs) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
};

interface State {
  subscribedOnly: boolean;
  setSubscribedOnly: (val: boolean) => void;
  searchKeyword: string;
  setSearchKeyword: (val: string) => void;
  prefs: ReaderPrefs;
  setPrefs: (partial: Partial<ReaderPrefs>) => void;
  hydrated: boolean;
  initPrefs: () => void;
}

export const useStore = create<State>((set) => ({
  subscribedOnly: false,
  setSubscribedOnly: (subscribedOnly) => set({ subscribedOnly }),
  searchKeyword: '',
  setSearchKeyword: (searchKeyword) => set({ searchKeyword }),
  prefs: defaultPrefs,
  setPrefs: (partial) =>
    set((state) => {
      const next = { ...state.prefs, ...partial };
      savePrefs(next);
      return { prefs: next };
    }),
  hydrated: false,
  initPrefs: () =>
    set(() => {
      const prefs = loadPrefs();
      return { prefs, hydrated: true };
    }),
}));

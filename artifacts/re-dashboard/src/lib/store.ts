import { create } from "zustand";

interface State {
  [key: string]: any;
}

export const useStore = create<State>(() => ({}));
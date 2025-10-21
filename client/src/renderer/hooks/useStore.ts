import { create } from 'zustand';

import { State } from '../types';

export default create<State>((set) => ({
  folder: localStorage.getItem('folder') || '',
  token: '',
  rows: {},
  update: (payload) => set((state) => ({ ...state, ...payload })),
  add: (row) => {
    console.log('incoming', row);
    set((state) => ({
      ...state,
      rows: {
        ...state.rows,
        [row.id]: { ...state.rows[row.id], ...row }
      }
    }));
  }
}));

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { TaskVariant } from '@/app/store/types';
import type { StatusOption } from '@/app/store/statusOptions';
import { INITIAL_STATUS_OBJECTS } from '@/app/store/statusOptions';

const INITIAL_STATUS_OPTIONS: StatusOption[] = [
  { id: 'in-progress', label: 'In Progress', variant: TaskVariant.SECONDARY, color: '#f1e0ba' },
  { id: 'new', label: 'New', variant: TaskVariant.GHOST, color: '#1c13011c' },
  { id: 'need-test', label: 'Need Test', variant: TaskVariant.PRIMARY, color: '#cadef6' },
  { id: 'backlog', label: 'Backlog', variant: TaskVariant.BACKLOG, color: '#e7d8d2' },
  INITIAL_STATUS_OBJECTS['canceled'],
  { id: 'blocked', label: 'Blocked', variant: TaskVariant.BLOCKED, color: '#ffcdd2' },
  INITIAL_STATUS_OBJECTS['completed'],
];

const initialState = {
  statusOptions: INITIAL_STATUS_OPTIONS,
  
};

const statusOptionsSlice = createSlice({
  name: 'statusOptions',
  initialState,
  reducers: {
    addStatusOption: (state, action: PayloadAction<StatusOption>) => {
      const { id } = action.payload;
      if (!state.statusOptions.some((item) => item.id === id)) {
        state.statusOptions.push(action.payload);
      }
    },
    removeStatusOption: (state, action: PayloadAction<string>) => {
      state.statusOptions = state.statusOptions.filter((item) => item.id !== action.payload);
    },
    updateStatusOption: (
      state,
      action: PayloadAction<{ id: string; label?: string; color?: string }>
    ) => {
      const { id, label, color } = action.payload;
      const opt = state.statusOptions.find((item) => item.id === id);
      if (opt) {
        if (label !== undefined) opt.label = label;
        if (color !== undefined) opt.color = color;
      }
    },
  },
});

export const { addStatusOption, removeStatusOption, updateStatusOption } = statusOptionsSlice.actions;
export default statusOptionsSlice.reducer;

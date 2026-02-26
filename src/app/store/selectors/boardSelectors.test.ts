import { describe, it, expect } from 'vitest';
import {
  selectFilteredBoardData,
  selectShowCompleted,
} from './boardSelectors';
import type { RootState } from '@/app/store';
import { TaskVariant } from '@/app/store/types';

const mockStatus = {
  id: 'new',
  label: 'New',
  variant: TaskVariant.GHOST,
  color: '#ccc',
};

const makeTask = (id: number, columnAlias = 'new', order = 0, title = `Task ${id}`) => ({
  id,
  columnAlias,
  order,
  title,
  comments: '',
  assignee: { id: '1', name: 'John', src: '' },
  status: mockStatus,
});

const makeColumn = (alias: string, order = 0) => ({
  alias,
  title: alias,
  status: alias,
  color: '#fff',
  order,
  tasks: [],
});

const makeState = (overrides: {
  tasks?: object[];
  columns?: object[];
  searchQuery?: string;
  statusFilterIds?: string[] | null;
  showCompleted?: boolean;
  archivedTasks?: object[];
} = {}): RootState =>
  ({
    tasks: {
      tasks: overrides.tasks ?? [],
      activeTaskId: null,
      searchQuery: overrides.searchQuery ?? '',
      statusFilterIds: overrides.statusFilterIds ?? null,
      selectedTaskIds: [],
      archivedTasks: overrides.archivedTasks ?? [],
      showCompleted: overrides.showCompleted ?? false,
    },
    columns: {
      columns: overrides.columns ?? [],
    },
  }) as unknown as RootState;

describe('selectFilteredBoardData', () => {
  it('returns all columns with their tasks when no filters', () => {
    const state = makeState({
      columns: [makeColumn('new'), makeColumn('in-progress')],
      tasks: [makeTask(1, 'new'), makeTask(2, 'in-progress')],
    });
    const result = selectFilteredBoardData(state);
    expect(result).toHaveLength(2);
    expect(result[0].tasks).toHaveLength(1);
    expect(result[1].tasks).toHaveLength(1);
  });

  it('sorts columns by order', () => {
    const state = makeState({
      columns: [makeColumn('b', 1), makeColumn('a', 0)],
      tasks: [],
    });
    const result = selectFilteredBoardData(state);
    expect(result[0].alias).toBe('a');
    expect(result[1].alias).toBe('b');
  });

  it('sorts tasks within column by order', () => {
    const state = makeState({
      columns: [makeColumn('new')],
      tasks: [makeTask(1, 'new', 2), makeTask(2, 'new', 0), makeTask(3, 'new', 1)],
    });
    const result = selectFilteredBoardData(state);
    expect(result[0].tasks.map((t) => t.id)).toEqual([2, 3, 1]);
  });

  it('filters columns by statusFilterIds', () => {
    const state = makeState({
      columns: [makeColumn('new'), makeColumn('in-progress'), makeColumn('done')],
      tasks: [],
      statusFilterIds: ['new', 'done'],
    });
    const result = selectFilteredBoardData(state);
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.alias)).toEqual(['new', 'done']);
  });

  it('returns empty when statusFilterIds is empty array', () => {
    const state = makeState({
      columns: [makeColumn('new')],
      tasks: [],
      statusFilterIds: [],
    });
    const result = selectFilteredBoardData(state);
    expect(result).toHaveLength(0);
  });

  it('filters tasks by search query on title', () => {
    const state = makeState({
      columns: [makeColumn('new')],
      tasks: [
        makeTask(1, 'new', 0, 'Fix login bug'),
        makeTask(2, 'new', 1, 'Add dark mode'),
        makeTask(3, 'new', 2, 'Fix footer'),
      ],
      searchQuery: 'fix',
    });
    const result = selectFilteredBoardData(state);
    expect(result[0].tasks).toHaveLength(2);
    expect(result[0].tasks.map((t) => t.id)).toEqual([1, 3]);
  });

  it('filters tasks by search query on comments', () => {
    const taskWithComment = { ...makeTask(1, 'new', 0, 'Task title'), comments: 'important comment' };
    const state = makeState({
      columns: [makeColumn('new')],
      tasks: [taskWithComment, makeTask(2, 'new', 1)],
      searchQuery: 'important',
    });
    const result = selectFilteredBoardData(state);
    expect(result[0].tasks).toHaveLength(1);
    expect(result[0].tasks[0].id).toBe(1);
  });

  it('is case-insensitive when searching', () => {
    const state = makeState({
      columns: [makeColumn('new')],
      tasks: [makeTask(1, 'new', 0, 'Fix Login Bug')],
      searchQuery: 'LOGIN',
    });
    const result = selectFilteredBoardData(state);
    expect(result[0].tasks).toHaveLength(1);
  });

  it('smart search: matches when all words present in any order', () => {
    const state = makeState({
      columns: [makeColumn('new')],
      tasks: [
        makeTask(1, 'new', 0, 'Fix login bug'),
        makeTask(2, 'new', 1, 'Add dark mode'),
      ],
      searchQuery: 'bug fix',
    });
    const result = selectFilteredBoardData(state);
    expect(result[0].tasks).toHaveLength(1);
    expect(result[0].tasks[0].id).toBe(1);
  });

  it('smart search: matches by subsequence (abbreviations)', () => {
    const state = makeState({
      columns: [makeColumn('new')],
      tasks: [
        makeTask(1, 'new', 0, 'Fix login bug'),
        makeTask(2, 'new', 1, 'Add dark mode'),
      ],
      searchQuery: 'flb',
    });
    const result = selectFilteredBoardData(state);
    expect(result[0].tasks).toHaveLength(1);
    expect(result[0].tasks[0].id).toBe(1);
  });

  it('smart search: matches by assignee name', () => {
    const state = makeState({
      columns: [makeColumn('new')],
      tasks: [
        makeTask(1, 'new', 0, 'Task A'),
        makeTask(2, 'new', 1, 'Task B'),
      ],
      searchQuery: 'John',
    });
    const result = selectFilteredBoardData(state);
    expect(result[0].tasks).toHaveLength(2);
  });

  describe('showCompleted', () => {
    it('completedTasks is empty when showCompleted is false', () => {
      const state = makeState({
        columns: [makeColumn('new')],
        tasks: [],
        archivedTasks: [{ task: makeTask(99, 'new'), archiveStatus: 'completed' }],
        showCompleted: false,
      });
      const result = selectFilteredBoardData(state);
      expect(result[0].completedTasks).toHaveLength(0);
    });

    it('adds archived completed tasks to matching column when showCompleted is true', () => {
      const state = makeState({
        columns: [makeColumn('new'), makeColumn('in-progress')],
        tasks: [],
        archivedTasks: [
          { task: makeTask(1, 'new'), archiveStatus: 'completed' },
          { task: makeTask(2, 'in-progress'), archiveStatus: 'completed' },
          { task: makeTask(3, 'new'), archiveStatus: 'canceled' },
        ],
        showCompleted: true,
      });
      const result = selectFilteredBoardData(state);
      const newCol = result.find((c) => c.alias === 'new')!;
      const inProgressCol = result.find((c) => c.alias === 'in-progress')!;

      expect(newCol.completedTasks).toHaveLength(1);
      expect(newCol.completedTasks[0].id).toBe(1);
      expect(inProgressCol.completedTasks).toHaveLength(1);
      expect(inProgressCol.completedTasks[0].id).toBe(2);
    });

    it('does not include canceled tasks in completedTasks', () => {
      const state = makeState({
        columns: [makeColumn('new')],
        tasks: [],
        archivedTasks: [
          { task: makeTask(1, 'new'), archiveStatus: 'canceled' },
        ],
        showCompleted: true,
      });
      const result = selectFilteredBoardData(state);
      expect(result[0].completedTasks).toHaveLength(0);
    });
  });
});

describe('selectShowCompleted', () => {
  it('returns false by default', () => {
    const state = makeState({ showCompleted: false });
    expect(selectShowCompleted(state)).toBe(false);
  });

  it('returns true when set', () => {
    const state = makeState({ showCompleted: true });
    expect(selectShowCompleted(state)).toBe(true);
  });
});

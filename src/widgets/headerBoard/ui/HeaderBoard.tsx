import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks/redux';
import { addColumn } from '@/app/store/slices/columnsSlice';
import { addStatusOption } from '@/app/store/slices/statusOptionsSlice';
import {
  setSearchQuery,
  setStatusFilter,
  addTaskStartAndOpenThunk,
} from '@/app/store/slices/tasksSlice';
import { selectStatusObjects } from '@/app/store/selectors/statusSelectors';
import { selectColumns } from '@/app/store/selectors/boardSelectors';
import { AddColumnPopup } from '@/features/addColumn';
import { TaskVariant } from '@/app/store/types';
import { Checkbox } from '@/shared/ui/Checkbox';
import { Badge } from '@/shared/ui/Badge';

import styles from './HeaderBoard.module.scss';

const NEW_COLUMN_ALIAS = 'new';

export function HeaderBoard() {
  const dispatch = useAppDispatch();

  const searchQuery = useAppSelector((state) => state.tasks.searchQuery);
  const statusFilterIds = useAppSelector((state) => state.tasks.statusFilterIds);
  const columns = useAppSelector(selectColumns);
  const statusObjects = useAppSelector(selectStatusObjects);

  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLButtonElement>(null);

  const isColumnChecked = useCallback(
    (alias: string) => {
      if (statusFilterIds === null) return true;
      return statusFilterIds.includes(alias);
    },
    [statusFilterIds]
  );

  const handleFilterToggle = useCallback(
    (alias: string) => {
      const columnAliases = columns.map((c) => c.alias);
      const currentlyChecked = isColumnChecked(alias);

      if (currentlyChecked) {
        if (statusFilterIds === null) {
          dispatch(
            setStatusFilter(columnAliases.filter((item) => item !== alias))
          );
        } else {
          const next = statusFilterIds.filter((item) => item !== alias);
          dispatch(setStatusFilter(next.length > 0 ? next : []));
        }
      } else {
        if (statusFilterIds === null) {
          dispatch(setStatusFilter([alias]));
        } else {
          const next = [...statusFilterIds, alias].sort(
            (a, b) =>
              columnAliases.indexOf(a) - columnAliases.indexOf(b)
          );
          const allSelected = columnAliases.every((a) => next.includes(a));
          dispatch(setStatusFilter(allSelected ? null : next));
        }
      }
    },
    [dispatch, statusFilterIds, columns, isColumnChecked]
  );

  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterAnchorRef.current &&
        !filterAnchorRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest(`.${styles.filterDropdown}`)
      ) {
        setIsFilterOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFilterOpen]);

  const handleNewTask = () => {
    const hasColumn = columns.some((col) => col.alias === NEW_COLUMN_ALIAS);

    if (!hasColumn) {
      const status = statusObjects[NEW_COLUMN_ALIAS];
      if (status) {
        dispatch(
          addColumn({
            alias: NEW_COLUMN_ALIAS,
            title: status.label,
            status: NEW_COLUMN_ALIAS,
            color: status.color,
          })
        );
      }
    }
    dispatch(addTaskStartAndOpenThunk({}));
  };

  const handleAddColumnSubmit = useCallback(
    (title: string, color: string) => {
      const alias = `column-${Date.now()}`;

      dispatch(
        addColumn({
          alias,
          title,
          status: 'new',
          color,
        })
      );
      dispatch(
        addStatusOption({
          id: alias,
          label: title,
          variant: TaskVariant.GHOST,
          color,
        })
      );
    },
    [dispatch]
  );

  return (
    <div className={`${styles.header} flex items-center justify-between`}>
      <div className={styles.searchWrapper}>
        <span className={`${styles.searchIcon} material-icons-outlined`}>
          search
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
        />
      </div>
      <div className={styles.actions}>
        <div className={styles.filterWrapper}>
          <button
            ref={filterAnchorRef}
            type="button"
            className={styles.addColumnButton}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <span className="material-icons-outlined">filter_list</span>
            Status
            {statusFilterIds !== null && (
              <span className={styles.filterBadge}>{statusFilterIds.length}</span>
            )}
          </button>
          {isFilterOpen && (
            <div className={styles.filterDropdown}>
              <div className={styles.filterTitle}>Filter by status</div>
              {columns.map((col) => {
                const status = statusObjects[col.alias] ?? statusObjects[col.status];
                return (
                  <div
                    key={col.alias}
                    className={styles.filterOption}
                    onClick={() => handleFilterToggle(col.alias)}
                  >
                    <span onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        className={styles.filterCheckbox}
                        checked={isColumnChecked(col.alias)}
                        onChange={() => handleFilterToggle(col.alias)}
                      />
                    </span>
                    <Badge
                      variant={(status?.variant ?? 'ghost') as TaskVariant}
                      color={col.color ?? status?.color}
                    >
                      {col.title}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          className={styles.addColumnButton}
          onClick={() => setIsAddColumnOpen(true)}
        >
          <span className="material-icons-outlined">add</span>
          Add column
        </button>
        <button
          type="button"
          className={styles.newButton}
          onClick={handleNewTask}
        >
          <span className="material-icons-outlined">add</span>
          New
        </button>
      </div>
      <AddColumnPopup
        isOpen={isAddColumnOpen}
        onClose={() => setIsAddColumnOpen(false)}
        onSubmit={handleAddColumnSubmit}
      />
    </div>
  );
}

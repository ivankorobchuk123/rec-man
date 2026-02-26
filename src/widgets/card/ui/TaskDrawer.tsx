import { useCallback, useEffect, useRef, useState } from 'react';
import { Drawer } from '@/shared/ui/Drawer';
import { TaskMetadata } from '@/widgets/card/ui/TaskMetadata';
import { TaskProperties } from '@/widgets/card/ui/TaskProperties';
import { TaskComment } from '@/widgets/card/ui/TaskComment';
import { mockUsers, type AssigneeOption } from '@/app/store/mock';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks/redux';
import { addColumn } from '@/app/store/slices/columnsSlice';
import {
  updateTaskTitle,
  updateTaskAssignee,
  updateTaskStatus,
  updateTaskComments,
} from '@/app/store/slices/tasksSlice';
import type { StatusOption } from '@/app/store/statusOptions';

import styles from './TaskDrawer.module.scss';
import type { TaskDto } from '@/shared/api/types/task.dto';


interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taskNumber: string;
  task: TaskDto;
  columnAlias: string;
}

const DRAWER_CLOSE_DURATION = 350;

export function TaskDrawer({
  isOpen,
  onClose,
  taskNumber,
  task,
  columnAlias,
}: TaskDrawerProps) {
  const dispatch = useAppDispatch();
  const columns = useAppSelector((state) => state.columns.columns);
  const column = columns.find((c) => c.alias === columnAlias);
  const taskId = String(task.id);
  const [isClosing, setIsClosing] = useState(false);
  const [localValue, setLocalValue] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const value = localValue ?? task.title;

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    timeoutRef.current = setTimeout(() => {
      setLocalValue(null);
      onClose();
    }, DRAWER_CLOSE_DURATION);
  }, [isClosing, onClose]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleBlur = () => {
    const trimmed = value.trim();
    if (trimmed !== task.title) {
      dispatch(updateTaskTitle({ columnAlias, taskId, newTitle: trimmed }));
    }
    setLocalValue(null);
  };

  const onAssigneeChange = (assigneeOption: AssigneeOption) => {
    dispatch(
      updateTaskAssignee({
        columnAlias,
        taskId,
        assignee: {
          id: String(assigneeOption.id),
          name: assigneeOption.name,
          src: assigneeOption.src ?? '',
        },
      })
    );
  };

  const onStatusChange = (statusOption: StatusOption) => {
    const hasColumn = columns.some((col) => col.alias === statusOption.id);
    if (!hasColumn) {
      dispatch(
        addColumn({
          alias: statusOption.id,
          title: statusOption.label,
          status: statusOption.id,
          color: statusOption.color,
        })
      );
    }
    dispatch(
      updateTaskStatus({
        columnAlias,
        taskId,
        status: {
          id: statusOption.id,
          label: statusOption.label,
          variant: statusOption.variant,
          color: statusOption.color,
        },
      })
    );
  };

  const onTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    dispatch(updateTaskTitle({ columnAlias, taskId, newTitle: val }));
  };


  const onCommentsChange = (comments: string) => {
    dispatch(updateTaskComments({ columnAlias, taskId, comments }));
  };

  return (
    <Drawer isOpen={isOpen && !isClosing} onClose={handleClose} title={taskNumber}>
      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.label}>Description</div>
          <div className={styles.titleInputWrapper}>
            <span className={styles.pinIcon}>📍</span>
            <textarea
              ref={textareaRef}
              className={styles.titleInput}
              value={value}
              onChange={onTitleChange}
              onBlur={handleBlur}
              placeholder="New task"
              rows={1}
            />
          </div>
        </div>
        <div className={styles.section}>
          <TaskMetadata taskNumber={taskNumber} />
        </div>
        <div className={styles.section}>
          <div className={styles.propertiesHeader}>Properties</div>
          <TaskProperties
            task={task}
            users={mockUsers}
            onAssigneeChange={onAssigneeChange}
            onStatusChange={onStatusChange}
            columnColor={column?.color}
          />
        </div>
        <div className={styles.section}>
          <div className={styles.propertiesHeader}>Description</div>
          <TaskComment
            text={task.comments ?? ''}
            onSave={onCommentsChange}
            placeholder="Add a description..."
          />
        </div>
      </div>
    </Drawer>
  );
}

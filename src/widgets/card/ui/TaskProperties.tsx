import { useRef, useState } from 'react';
import { Avatar } from '@/shared/ui/Avatar';
import { Badge } from '@/shared/ui/Badge';
import { EditButton } from '@/shared/ui/EditButton';
import {
  AssigneeSelectDropdown,
  type AssigneeOption,
} from '@/shared/ui/AssigneeSelectDropdown';
import {
  StatusSelectDropdown,
  type StatusOption,
} from '@/shared/ui/StatusSelectDropdown';
import { TaskVariant } from '@/app/store/types';
import { useAppSelector } from '@/shared/lib/hooks/redux';
import { selectStatusOptionGroups } from '@/app/store/selectors/statusSelectors';
import { selectColumns } from '@/app/store/selectors/boardSelectors';
import type { TaskDto } from '@/shared/api/types/task.dto';
import { mockUsers } from '@/app/store/mock';

import styles from './TaskProperties.module.scss';


interface TaskPropertiesProps {
  users?: AssigneeOption[];
  onAssigneeChange?: (assignee: AssigneeOption) => void;
  task: TaskDto;
  onStatusChange?: (status: StatusOption) => void;
  /** Column color — overrides task.status.color for the badge */
  columnColor?: string;
}

export function TaskProperties({
  task,
  users = mockUsers as unknown as AssigneeOption[],
  onAssigneeChange,
  onStatusChange,
  columnColor,
}: TaskPropertiesProps) {
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const executorRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusGroups = useAppSelector(selectStatusOptionGroups);
  const columns = useAppSelector(selectColumns);

  const statusGroupsWithColumnColors = statusGroups.map((group) => ({
    ...group,
    options: group.options.map((opt) => {
      const column = columns.find((c) => c.alias === opt.id);
      return column ? { ...opt, color: column.color } : opt;
    }),
  }));

  const handleAssigneeClick = () => {
    setIsAssigneeOpen((prev) => !prev);
    setIsStatusOpen(false);
  };

  const handleStatusClick = () => {
    setIsStatusOpen((prev) => !prev);
    setIsAssigneeOpen(false);
  };

  const handleAssigneeSelect = (user: AssigneeOption) => {
    onAssigneeChange?.(user);
    setIsAssigneeOpen(false);
  };

  const handleStatusSelect = (s: StatusOption) => {
    onStatusChange?.(s);
    setIsStatusOpen(false);
  };

  return (
    <div className={styles.propertiesList}>
      <div className={styles.propertyRow}>
        <div className={styles.propertyLabel}>
          <span className="material-icons-outlined">person_outline</span>
          Executor
        </div>
        <div
          ref={executorRef}
          className={`${styles.propertyValue} ${styles.propertyExecutor} ${styles.executorWrapper}`}
          onClick={handleAssigneeClick}
        >
          <div className="flex items-center gap-2">
            <Avatar
              src={task.assignee?.src ?? ''}
              alt={task.assignee?.name ?? ''}
              size="xs"
              className={styles.executorAvatar}
            />
            <span>{task.assignee?.name ?? '—'}</span>
          </div>
          <EditButton onClick={handleAssigneeClick} />
          <AssigneeSelectDropdown
            isOpen={isAssigneeOpen}
            onClose={() => setIsAssigneeOpen(false)}
            users={users}
            selectedId={String(task.assignee?.id ?? '')}
            onSelect={handleAssigneeSelect}
            anchorRef={executorRef}
          />
        </div>
      </div>
      <div className={styles.propertyRow}>
        <div className={styles.propertyLabel}>
          <span className="material-icons-outlined">more_vert</span>
          Status
        </div>
        <div
          ref={statusRef}
          className={`${styles.propertyValue} ${styles.statusWrapper}`}
          onClick={handleStatusClick}
        >
          <Badge variant={task.status?.variant ?? TaskVariant.GHOST} color={columnColor ?? task.status?.color}>{task.status?.label ?? '—'}</Badge>
          <EditButton
            onClick={(e) => {
              e.stopPropagation();
              handleStatusClick();
            }}
          />
          <StatusSelectDropdown
            isOpen={isStatusOpen}
            onClose={() => setIsStatusOpen(false)}
            groups={statusGroupsWithColumnColors}
            selectedId={task.status?.id ?? ''}
            onSelect={handleStatusSelect}
            anchorRef={statusRef}
          />
        </div>
      </div>
      <div className={styles.propertyRow}>
        <div className={styles.propertyLabel}>
          <span className="material-icons-outlined">person_add</span>
          Participant
        </div>
        <div className={styles.propertyValueEmpty}>Empty</div>
      </div>
      <div className={styles.propertyRow}>
        <div className={styles.propertyLabel}>
          <span className="material-icons-outlined">groups</span>
          Team
        </div>
        <div className={styles.propertyValueEmpty}>Empty</div>
      </div>

      <div className={styles.propertyRow}>
        <div className={styles.propertyLabel}>
          <span className="material-icons-outlined">calendar_today</span>
          Deadline
        </div>
        <div className={styles.propertyValueEmpty}>Empty</div>
      </div>
      <div className={styles.propertyRow}>
        <div className={styles.propertyLabel}>
          <span className="material-icons-outlined">description</span>
          Task Type
        </div>
        <div className={styles.propertyValueEmpty}>Empty</div>
      </div>
    </div>
  );
}

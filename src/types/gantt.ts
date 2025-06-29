export interface VSNDetail {
  VSNCode: string;
  VSNName: string;
  startDate: Date;
  endDate: Date;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  StartDate: Date;
  EndDate: Date;
  Duration: number;
  Progress: number;
  Dependencies?: string[];
  BaselineStartDate?: Date;
  BaselineEndDate?: Date;
  ActivityNumber?: string;
  Milestone: boolean;
  VSNDetails?: VSNDetail[];
  parentId?: string;
  children?: Task[];
  expanded?: boolean;
  level?: number;
  resources?: string[];
  status?: 'not-started' | 'in-progress' | 'completed' | 'delayed';
}

export interface DependencyLine {
  from: string;
  to: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface GanttColumn {
  field: keyof Task;
  headerText: string;
  width: number;
  visible: boolean;
  sortable?: boolean;
}

export interface ContextMenuItem {
  text: string;
  id: string;
  action?: () => void;
  separator?: boolean;
}

export interface TimelineUnit {
  date: Date;
  width: number;
  isWeekend?: boolean;
}

export interface GanttConfig {
  timelineUnitSize: number;
  taskbarHeight: number;
  rowHeight: number;
  showBaseline: boolean;
  enableVirtualScrolling: boolean;
  progressThreshold: number;
  timelineUnit?: 'year' | 'month' | 'week' | 'day';
}

export interface ResourceAssignment {
  taskId: string;
  resourceId: string;
  resourceName: string;
  allocation: number; // percentage
}

export interface CriticalPathOptions {
  highlightColor: string;
  showSlack: boolean;
  calculateFloat: boolean;
}

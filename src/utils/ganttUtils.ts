
import { Task, TimelineUnit } from '../types/gantt';

export const generateTestData = (parentCount: number = 275, childrenPerParent: number = 5): Task[] => {
  const tasks: Task[] = [];
  
  for (let i = 1; i <= parentCount; i++) {
    const parentStartDate = new Date(2024, 0, 1 + (i * 7));
    const parentEndDate = new Date(parentStartDate.getTime() + (childrenPerParent * 7 * 24 * 60 * 60 * 1000));
    
    const parentTask: Task = {
      TaskID: `P${i}`,
      TaskName: `Parent Task ${i}`,
      StartDate: parentStartDate,
      EndDate: parentEndDate,
      Duration: childrenPerParent * 7,
      Progress: Math.floor(Math.random() * 100),
      Milestone: false,
      ActivityNumber: `ACT-P${i}`,
      children: [],
      expanded: true,
      level: 0
    };

    for (let j = 1; j <= childrenPerParent; j++) {
      const childStartDate = new Date(parentStartDate.getTime() + ((j - 1) * 7 * 24 * 60 * 60 * 1000));
      const childEndDate = new Date(childStartDate.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const childTask: Task = {
        TaskID: `P${i}C${j}`,
        TaskName: `Child Task ${i}.${j}`,
        StartDate: childStartDate,
        EndDate: childEndDate,
        Duration: 7,
        Progress: Math.floor(Math.random() * 100),
        Dependencies: j > 1 ? [`P${i}C${j-1}`] : undefined,
        BaselineStartDate: new Date(childStartDate.getTime() - (2 * 24 * 60 * 60 * 1000)),
        BaselineEndDate: new Date(childEndDate.getTime() + (1 * 24 * 60 * 60 * 1000)),
        Milestone: Math.random() > 0.8,
        ActivityNumber: `ACT-P${i}C${j}`,
        VSNDetails: [
          {
            VSNCode: `VSN${i}${j}A`,
            VSNName: `Version ${i}.${j}.A`,
            startDate: childStartDate,
            endDate: new Date(childStartDate.getTime() + (3 * 24 * 60 * 60 * 1000))
          },
          {
            VSNCode: `VSN${i}${j}B`,
            VSNName: `Version ${i}.${j}.B`,
            startDate: new Date(childStartDate.getTime() + (4 * 24 * 60 * 60 * 1000)),
            endDate: childEndDate
          }
        ],
        parentId: `P${i}`,
        level: 1
      };
      
      parentTask.children!.push(childTask);
    }
    
    tasks.push(parentTask);
  }
  
  return tasks;
};

export const flattenTasks = (tasks: Task[]): Task[] => {
  const flattened: Task[] = [];
  
  const flatten = (taskList: Task[]) => {
    taskList.forEach(task => {
      flattened.push(task);
      if (task.children && task.expanded) {
        flatten(task.children);
      }
    });
  };
  
  flatten(tasks);
  return flattened;
};

export const calculateTaskPosition = (
  task: Task, 
  timelineStart: Date, 
  timelineUnitSize: number
): { left: number; width: number } => {
  const daysDiff = Math.floor((task.StartDate.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000));
  const duration = Math.floor((task.EndDate.getTime() - task.StartDate.getTime()) / (24 * 60 * 60 * 1000));
  
  return {
    left: (daysDiff * timelineUnitSize) / 7, // Weekly units
    width: Math.max((duration * timelineUnitSize) / 7, 20) // Minimum width
  };
};

export const generateTimeline = (startDate: Date, endDate: Date, unitSize: number): TimelineUnit[] => {
  const timeline: TimelineUnit[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    timeline.push({
      date: new Date(current),
      width: unitSize,
      isWeekend
    });
    current.setDate(current.getDate() + 7); // Weekly increments
  }
  
  return timeline;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const isTaskEditable = (task: Task, progressThreshold: number): boolean => {
  return task.Progress < progressThreshold && task.level !== 0;
};

export const detectDependencyCycle = (tasks: Task[], fromId: string, toId: string): boolean => {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  
  const hasCycle = (taskId: string): boolean => {
    if (visiting.has(taskId)) return true;
    if (visited.has(taskId)) return false;
    
    visiting.add(taskId);
    
    const task = tasks.find(t => t.TaskID === taskId);
    if (task?.Dependencies) {
      for (const depId of task.Dependencies) {
        if (hasCycle(depId)) return true;
      }
    }
    
    visiting.delete(taskId);
    visited.add(taskId);
    return false;
  };
  
  // Temporarily add the new dependency and check for cycles
  const toTask = tasks.find(t => t.TaskID === toId);
  if (toTask) {
    const originalDeps = toTask.Dependencies || [];
    toTask.Dependencies = [...originalDeps, fromId];
    const cycleDetected = hasCycle(toId);
    toTask.Dependencies = originalDeps;
    return cycleDetected;
  }
  
  return false;
};

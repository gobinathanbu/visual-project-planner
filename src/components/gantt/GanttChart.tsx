import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Task, GanttColumn, ContextMenuItem, TimelineUnit, GanttConfig, DependencyLine } from '../../types/gantt';
import { 
  generateTestData, 
  flattenTasks, 
  calculateTaskPosition, 
  generateTimeline, 
  isTaskEditable,
  detectDependencyCycle 
} from '../../utils/ganttUtils';
import GanttGrid from './GanttGrid';
import GanttTimeline from './GanttTimeline';
import GanttTaskbar from './GanttTaskbar';
import GanttContextMenu from './GanttContextMenu';
import GanttZoomControls from './GanttZoomControls';
import TaskEditDialog from './TaskEditDialog';
import { toast } from 'sonner';
import { ZoomIn, ZoomOut, Download, Plus, Calendar } from 'lucide-react';

const defaultConfig: GanttConfig = {
  timelineUnitSize: 70,
  taskbarHeight: 25,
  rowHeight: 40,
  showBaseline: true,
  enableVirtualScrolling: true,
  progressThreshold: 50
};

const defaultColumns: GanttColumn[] = [
  { field: 'TaskName', headerText: 'Task Name', width: 200, visible: true, sortable: true },
  { field: 'TaskID', headerText: 'Task ID', width: 100, visible: true, sortable: true },
  { field: 'StartDate', headerText: 'Start Date', width: 120, visible: true, sortable: true },
  { field: 'EndDate', headerText: 'End Date', width: 120, visible: true, sortable: true },
  { field: 'Duration', headerText: 'Duration', width: 80, visible: true, sortable: true },
  { field: 'Progress', headerText: 'Progress', width: 80, visible: true, sortable: true },
  { field: 'Milestone', headerText: 'Milestone', width: 80, visible: true },
  { field: 'ActivityNumber', headerText: 'Activity#', width: 100, visible: true }
];

const GanttChart: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [flatTasks, setFlatTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<GanttColumn[]>(defaultColumns);
  const [config, setConfig] = useState<GanttConfig>(defaultConfig);
  const [timeline, setTimeline] = useState<TimelineUnit[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
  }>({ visible: false, x: 0, y: 0, items: [] });
  
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [criticalPath, setCriticalPath] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    task: Task | null;
    startX: number;
    originalStartDate: Date | null;
    mode: 'move' | 'resize-start' | 'resize-end' | 'dependency' | null;
  }>({ isDragging: false, task: null, startX: 0, originalStartDate: null, mode: null });
  
  const ganttRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Initialize data
  useEffect(() => {
    const testTasks = generateTestData(10, 3);
    setTasks(testTasks);
    
    // Generate timeline
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date(2024, 11, 31);
    const timelineUnits = generateTimeline(startDate, endDate, config.timelineUnitSize);
    setTimeline(timelineUnits);
  }, [config.timelineUnitSize]);

  // Update timeline when zoom changes
  useEffect(() => {
    const newUnitSize = (defaultConfig.timelineUnitSize * zoomLevel) / 100;
    setConfig(prev => ({ ...prev, timelineUnitSize: newUnitSize }));
  }, [zoomLevel]);

  // Flatten tasks when hierarchy changes
  useEffect(() => {
    setFlatTasks(flattenTasks(tasks));
  }, [tasks]);

  // Calculate critical path
  useEffect(() => {
    const calculateCriticalPath = () => {
      // Simplified critical path calculation
      const path: string[] = [];
      flatTasks.forEach(task => {
        if (task.Dependencies && task.Dependencies.length > 0 && task.level !== 0) {
          const totalDuration = task.Duration + (task.Dependencies.length * 2);
          if (totalDuration > 10) { // Threshold for critical path
            path.push(task.TaskID);
          }
        }
      });
      setCriticalPath(path);
    };
    
    calculateCriticalPath();
  }, [flatTasks]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(100);
  }, []);

  // Task editing
  const handleEditTask = useCallback((task: Task) => {
    if (!isTaskEditable(task, config.progressThreshold)) {
      toast.error(`Cannot edit task with ${task.Progress}% progress`);
      return;
    }
    setEditingTask(task);
    setShowEditDialog(true);
  }, [config.progressThreshold]);

  const handleSaveTask = useCallback((updatedTask: Task) => {
    setTasks(prevTasks => {
      const updateTask = (taskList: Task[]): Task[] => {
        return taskList.map(task => {
          if (task.TaskID === updatedTask.TaskID) {
            return updatedTask;
          }
          if (task.children) {
            return { ...task, children: updateTask(task.children) };
          }
          return task;
        });
      };
      return updateTask(prevTasks);
    });
    
    setShowEditDialog(false);
    setEditingTask(null);
    toast.success('Task updated successfully');
  }, []);

  // Enhanced drag functionality
  const handleDragStart = useCallback((task: Task, e: React.MouseEvent, mode: 'move' | 'resize-start' | 'resize-end' | 'dependency' = 'move') => {
    if (!isTaskEditable(task, config.progressThreshold)) {
      toast.error(`Cannot edit task with ${task.Progress}% progress`);
      return;
    }
    
    setDragState({
      isDragging: true,
      task,
      startX: e.clientX,
      originalStartDate: new Date(task.StartDate),
      mode
    });
  }, [config.progressThreshold]);

  const handleDragEnd = useCallback((task: Task, e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.originalStartDate) return;
    
    const deltaX = e.clientX - dragState.startX;
    const daysDelta = Math.round(deltaX / (config.timelineUnitSize / 7));
    
    if (daysDelta !== 0) {
      let newStartDate = new Date(dragState.originalStartDate);
      let newEndDate = new Date(task.EndDate);
      
      switch (dragState.mode) {
        case 'move':
          newStartDate.setDate(newStartDate.getDate() + daysDelta);
          newEndDate.setDate(newEndDate.getDate() + daysDelta);
          break;
        case 'resize-start':
          newStartDate.setDate(newStartDate.getDate() + daysDelta);
          break;
        case 'resize-end':
          newEndDate.setDate(newEndDate.getDate() + daysDelta);
          break;
      }
      
      // Update task dates
      setTasks(prevTasks => {
        const updateTaskDates = (taskList: Task[]): Task[] => {
          return taskList.map(t => {
            if (t.TaskID === task.TaskID) {
              const duration = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (24 * 60 * 60 * 1000));
              return { ...t, StartDate: newStartDate, EndDate: newEndDate, Duration: duration };
            }
            if (t.children) {
              return { ...t, children: updateTaskDates(t.children) };
            }
            return t;
          });
        };
        return updateTaskDates(prevTasks);
      });
      
      toast.success(`Task ${dragState.mode === 'move' ? 'moved' : 'resized'} successfully`);
    }
    
    setDragState({ isDragging: false, task: null, startX: 0, originalStartDate: null, mode: null });
  }, [dragState, config.timelineUnitSize]);

  // Export functionality
  const handleExportToExcel = useCallback(() => {
    // Create CSV data
    const headers = columns.filter(col => col.visible).map(col => col.headerText);
    const csvContent = [
      headers.join(','),
      ...flatTasks.map(task => 
        columns.filter(col => col.visible).map(col => {
          const value = task[col.field];
          if (value instanceof Date) {
            return value.toLocaleDateString();
          }
          return String(value || '');
        }).join(',')
      )
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gantt-chart.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Gantt chart exported to CSV');
  }, [flatTasks, columns]);

  // Context menu items
  const getContextMenuItems = useCallback((isHeader: boolean = false): ContextMenuItem[] => {
    if (isHeader) {
      return [
        { text: 'AutoFitAll', id: 'autoFitAll', action: () => toast.info('Auto fit all columns') },
        { text: 'AutoFit', id: 'autoFit', action: () => toast.info('Auto fit column') },
        { separator: true, text: '', id: 'sep1' },
        { text: 'Hide Column', id: 'hideColumn', action: () => toast.info('Hide column') },
        { text: 'SortAscending', id: 'sortAsc', action: () => toast.info('Sort ascending') },
        { text: 'SortDescending', id: 'sortDesc', action: () => toast.info('Sort descending') }
      ];
    }
    
    return [
      { text: 'Add Task', id: 'add', action: () => handleAddTask() },
      { text: 'Edit Task', id: 'edit', action: () => selectedTask && handleEditTask(selectedTask) },
      { text: 'Delete Task', id: 'delete', action: () => handleDeleteTask() },
      { separator: true, text: '', id: 'sep1' },
      { text: 'Link Activity from other plan', id: 'linkActivity', action: () => toast.info('Link activity from other plan') },
      { text: 'Convert', id: 'convert', action: () => toast.info('Convert task') },
      { separator: true, text: '', id: 'sep2' },
      { text: 'Collapse Row', id: 'collapse', action: () => handleCollapseRow() },
      { text: 'Expand Row', id: 'expand', action: () => handleExpandRow() },
      { separator: true, text: '', id: 'sep3' },
      { text: 'Delete Dependency', id: 'deleteDep', action: () => handleDeleteDependency() },
      { text: 'Save', id: 'save', action: () => toast.success('Saved changes') },
      { text: 'Cancel', id: 'cancel', action: () => toast.info('Cancelled') }
    ];
  }, [selectedTask]);

  // Event handlers
  const handleToggleExpand = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const updateTask = (taskList: Task[]): Task[] => {
        return taskList.map(task => {
          if (task.TaskID === taskId) {
            return { ...task, expanded: !task.expanded };
          }
          if (task.children) {
            return { ...task, children: updateTask(task.children) };
          }
          return task;
        });
      };
      return updateTask(prevTasks);
    });
  }, []);

  const handleTaskbarClick = useCallback((task: Task) => {
    setSelectedTask(task);
    toast.info(`Selected: ${task.TaskName}`);
    
    // Navigate to external URL example
    if (task.ActivityNumber) {
      console.log(`Navigate to activity: ${task.ActivityNumber}`);
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, isHeader: boolean = false) => {
    e.preventDefault();
    const items = getContextMenuItems(isHeader);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      items
    });
  }, [getContextMenuItems]);

  const handleAddTask = useCallback(() => {
    const newTask: Task = {
      TaskID: `NEW${Date.now()}`,
      TaskName: 'New Task',
      StartDate: new Date(),
      EndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      Duration: 7,
      Progress: 0,
      Milestone: false,
      level: 1
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    toast.success('Task added');
  }, []);

  const handleDeleteTask = useCallback(() => {
    if (!selectedTask) {
      toast.error('No task selected');
      return;
    }
    
    if (selectedTask.Progress >= config.progressThreshold) {
      toast.error(`Cannot delete task with ${selectedTask.Progress}% progress`);
      return;
    }
    
    setTasks(prevTasks => {
      const deleteTask = (taskList: Task[]): Task[] => {
        return taskList.filter(task => {
          if (task.TaskID === selectedTask.TaskID) {
            return false;
          }
          if (task.children) {
            task.children = deleteTask(task.children);
          }
          return true;
        });
      };
      return deleteTask(prevTasks);
    });
    
    setSelectedTask(null);
    toast.success('Task deleted');
  }, [selectedTask, config.progressThreshold]);

  const handleCollapseRow = useCallback(() => {
    if (selectedTask) {
      handleToggleExpand(selectedTask.TaskID);
    }
  }, [selectedTask, handleToggleExpand]);

  const handleExpandRow = useCallback(() => {
    if (selectedTask) {
      handleToggleExpand(selectedTask.TaskID);
    }
  }, [selectedTask, handleToggleExpand]);

  const handleDeleteDependency = useCallback(() => {
    if (!selectedTask || !selectedTask.Dependencies) {
      toast.error('No dependencies to delete');
      return;
    }
    
    if (selectedTask.Progress >= config.progressThreshold) {
      toast.error(`Cannot modify dependencies for task with ${selectedTask.Progress}% progress`);
      return;
    }
    
    setTasks(prevTasks => {
      const updateTaskDeps = (taskList: Task[]): Task[] => {
        return taskList.map(task => {
          if (task.TaskID === selectedTask.TaskID) {
            return { ...task, Dependencies: undefined };
          }
          if (task.children) {
            return { ...task, children: updateTaskDeps(task.children) };
          }
          return task;
        });
      };
      return updateTaskDeps(prevTasks);
    });
    
    toast.success('Dependencies deleted');
  }, [selectedTask, config.progressThreshold]);

  const handleCellClick = useCallback((task: Task, field: keyof Task) => {
    setSelectedTask(task);
    console.log(`Cell clicked: ${task.TaskID}.${field}`);
  }, []);

  // Calculate timeline start date
  const timelineStart = useMemo(() => timeline[0]?.date || new Date(), [timeline]);

  // Enhanced dependency line rendering
  const renderDependencyLines = useCallback(() => {
    const lines: JSX.Element[] = [];
    
    flatTasks.forEach((task, index) => {
      if (task.Dependencies && task.level !== 0) {
        task.Dependencies.forEach(depId => {
          const depTask = flatTasks.find(t => t.TaskID === depId);
          if (depTask) {
            const fromPos = calculateTaskPosition(depTask, timelineStart, config.timelineUnitSize);
            const toPos = calculateTaskPosition(task, timelineStart, config.timelineUnitSize);
            
            const fromY = (flatTasks.indexOf(depTask) * config.rowHeight) + (config.rowHeight / 2);
            const toY = (index * config.rowHeight) + (config.rowHeight / 2);
            
            const isCritical = criticalPath.includes(task.TaskID) && criticalPath.includes(depId);
            
            lines.push(
              <svg
                key={`${depId}-${task.TaskID}`}
                className="absolute pointer-events-none z-10"
                style={{
                  left: fromPos.left + fromPos.width,
                  top: Math.min(fromY, toY),
                  width: Math.abs(toPos.left - (fromPos.left + fromPos.width)),
                  height: Math.abs(toY - fromY) + 20
                }}
              >
                <path
                  d={`M 0 ${fromY <= toY ? 0 : Math.abs(toY - fromY)} 
                      L ${Math.abs(toPos.left - (fromPos.left + fromPos.width)) - 10} ${fromY <= toY ? Math.abs(toY - fromY) : 0}`}
                  stroke={isCritical ? "#ef4444" : "#666"}
                  strokeWidth={isCritical ? "3" : "2"}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill={isCritical ? "#ef4444" : "#666"} />
                  </marker>
                </defs>
              </svg>
            );
          }
        });
      }
    });
    
    return lines;
  }, [flatTasks, timelineStart, config, criticalPath]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Enhanced Toolbar */}
      <div className="bg-white border-b border-gray-300 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800">Project Gantt Chart</h1>
          
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 border-l pl-4">
            <button
              className="p-2 hover:bg-gray-100 rounded"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm font-medium min-w-12 text-center">{zoomLevel}%</span>
            <button
              className="p-2 hover:bg-gray-100 rounded"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button
              className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
              onClick={handleZoomReset}
            >
              Reset
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 border-l pl-4">
            <button
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleAddTask}
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
            <button
              className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={handleExportToExcel}
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>Tasks: {flatTasks.length}</span>
          </div>
          <div className="text-sm text-gray-600">
            Selected: {selectedTask?.TaskName || 'None'}
          </div>
          {criticalPath.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Critical Path: {criticalPath.length} tasks</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Gantt Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Grid */}
        <div 
          className="w-1/3 overflow-auto"
          onContextMenu={(e) => handleContextMenu(e, true)}
        >
          <GanttGrid
            tasks={flatTasks}
            columns={columns}
            onToggleExpand={handleToggleExpand}
            onCellClick={handleCellClick}
            rowHeight={config.rowHeight}
          />
        </div>

        {/* Right Timeline */}
        <div 
          className="flex-1 overflow-auto relative"
          ref={ganttRef}
          onContextMenu={(e) => handleContextMenu(e, false)}
          onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        >
          <GanttTimeline
            timeline={timeline}
            scrollLeft={scrollLeft}
          />
          
          {/* Task bars container */}
          <div className="relative" style={{ width: timeline.length * config.timelineUnitSize }}>
            {/* Weekend highlighting */}
            {timeline.map((unit, index) => (
              unit.isWeekend && (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 bg-red-50 opacity-50 pointer-events-none"
                  style={{
                    left: index * config.timelineUnitSize,
                    width: config.timelineUnitSize
                  }}
                />
              )
            ))}
            
            {/* Dependency lines */}
            {renderDependencyLines()}
            
            {/* Task bars */}
            {flatTasks.map((task, index) => {
              const position = calculateTaskPosition(task, timelineStart, config.timelineUnitSize);
              const isEditable = isTaskEditable(task, config.progressThreshold);
              const isCritical = criticalPath.includes(task.TaskID);
              
              return (
                <div
                  key={task.TaskID}
                  className="absolute"
                  style={{
                    top: index * config.rowHeight,
                    height: config.rowHeight
                  }}
                >
                  <GanttTaskbar
                    task={task}
                    left={position.left}
                    width={position.width}
                    onTaskbarClick={handleTaskbarClick}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    showTooltip={true}
                    isEditable={isEditable}
                    isCritical={isCritical}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <GanttContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        items={contextMenu.items}
      />

      {/* Task Edit Dialog */}
      {showEditDialog && editingTask && (
        <TaskEditDialog
          task={editingTask}
          onSave={handleSaveTask}
          onCancel={() => {
            setShowEditDialog(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default GanttChart;

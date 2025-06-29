
import React, { useState } from 'react';
import { Task, GanttColumn } from '../../types/gantt';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/ganttUtils';

interface GanttGridProps {
  tasks: Task[];
  columns: GanttColumn[];
  onToggleExpand: (taskId: string) => void;
  onCellClick: (task: Task, field: keyof Task) => void;
  rowHeight: number;
}

const GanttGrid: React.FC<GanttGridProps> = ({
  tasks,
  columns,
  onToggleExpand,
  onCellClick,
  rowHeight
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderCellValue = (task: Task, field: keyof Task) => {
    const value = task[field];
    
    switch (field) {
      case 'StartDate':
      case 'EndDate':
        return value instanceof Date ? formatDate(value) : '';
      case 'Progress':
        return `${value}%`;
      case 'Milestone':
        return value ? '📍' : '';
      case 'Duration':
        return `${value}d`;
      default:
        return String(value || '');
    }
  };

  return (
    <div className="bg-white border-r border-gray-300">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-300">
        <div className="flex">
          {columns.filter(col => col.visible).map((column) => (
            <div
              key={column.field}
              className="px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
              style={{ width: column.width }}
              onClick={() => column.sortable && handleSort(column.field)}
            >
              <span>{column.headerText}</span>
              {column.sortable && sortConfig?.key === column.field && (
                <span className="ml-1">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="overflow-y-auto">
        {tasks.map((task, index) => (
          <div
            key={task.TaskID}
            className={`flex border-b border-gray-100 hover:bg-gray-50 ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
            }`}
            style={{ height: rowHeight }}
          >
            {columns.filter(col => col.visible).map((column, colIndex) => (
              <div
                key={column.field}
                className="px-3 py-2 text-sm border-r border-gray-200 flex items-center cursor-pointer hover:bg-blue-50"
                style={{ 
                  width: column.width,
                  paddingLeft: colIndex === 0 ? `${(task.level || 0) * 20 + 12}px` : '12px'
                }}
                onClick={() => onCellClick(task, column.field)}
              >
                {/* Expand/Collapse icon for first column */}
                {colIndex === 0 && task.children && task.children.length > 0 && (
                  <button
                    className="mr-2 p-1 hover:bg-gray-200 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand(task.TaskID);
                    }}
                  >
                    {task.expanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                )}
                
                {/* Cell content */}
                <span className="truncate flex-1">
                  {renderCellValue(task, column.field)}
                </span>
                
                {/* Parent task indicator */}
                {task.level === 0 && colIndex === 0 && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Parent
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GanttGrid;

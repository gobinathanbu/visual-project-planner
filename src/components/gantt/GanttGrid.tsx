
import React, { useState } from 'react';
import { Task, GanttColumn } from '../../types/gantt';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/ganttUtils';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';

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

  const visibleColumns = columns.filter(col => col.visible);

  return (
    <div className="h-full bg-white border-r border-gray-300">
      <Table>
        <TableHeader className="sticky top-0 z-20 bg-gray-50">
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead
                key={column.field}
                className="px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-100"
                style={{ width: column.width, minWidth: column.width }}
                onClick={() => column.sortable && handleSort(column.field)}
              >
                <div className="flex items-center justify-between">
                  <span>{column.headerText}</span>
                  {column.sortable && sortConfig?.key === column.field && (
                    <span className="ml-1 text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {tasks.map((task, index) => (
            <TableRow
              key={task.TaskID}
              className={`hover:bg-gray-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
              }`}
              style={{ height: rowHeight }}
            >
              {visibleColumns.map((column, colIndex) => (
                <TableCell
                  key={column.field}
                  className="px-3 py-2 text-sm border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                  style={{ 
                    width: column.width,
                    minWidth: column.width,
                    paddingLeft: colIndex === 0 ? `${(task.level || 0) * 20 + 12}px` : '12px'
                  }}
                  onClick={() => onCellClick(task, column.field)}
                >
                  <div className="flex items-center">
                    {/* Expand/Collapse icon for first column */}
                    {colIndex === 0 && task.children && task.children.length > 0 && (
                      <button
                        className="mr-2 p-1 hover:bg-gray-200 rounded flex-shrink-0"
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
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                        Parent
                      </span>
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GanttGrid;

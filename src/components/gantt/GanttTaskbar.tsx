
import React, { useState } from 'react';
import { Task } from '../../types/gantt';
import { formatDate } from '../../utils/ganttUtils';

interface GanttTaskbarProps {
  task: Task;
  left: number;
  width: number;
  onTaskbarClick: (task: Task) => void;
  onDragStart: (task: Task, e: React.MouseEvent) => void;
  onDragEnd: (task: Task, e: React.MouseEvent) => void;
  showTooltip: boolean;
  isEditable: boolean;
}

const GanttTaskbar: React.FC<GanttTaskbarProps> = ({
  task,
  left,
  width,
  onTaskbarClick,
  onDragStart,
  onDragEnd,
  showTooltip,
  isEditable
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showTaskTooltip, setShowTaskTooltip] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditable) return;
    setIsDragging(true);
    onDragStart(task, e);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd(task, e);
    }
  };

  const progressWidth = (width * task.Progress) / 100;

  return (
    <div
      className="relative"
      style={{ left, width }}
      onMouseEnter={() => setShowTaskTooltip(true)}
      onMouseLeave={() => setShowTaskTooltip(false)}
    >
      {/* Baseline bar */}
      {task.BaselineStartDate && task.BaselineEndDate && (
        <div
          className="absolute h-2 bg-orange-400 opacity-70 rounded-sm"
          style={{
            top: '32px',
            width: width * 0.8,
            left: '10%'
          }}
        />
      )}
      
      {/* Main taskbar */}
      {task.level !== 0 && (
        <div
          className={`absolute h-6 rounded cursor-pointer transition-all duration-200 ${
            task.Milestone 
              ? 'bg-blue-500 transform rotate-45' 
              : 'bg-green-300 hover:bg-green-400'
          } ${isDragging ? 'opacity-75 scale-105' : ''} ${
            !isEditable ? 'cursor-not-allowed opacity-60' : ''
          }`}
          style={{
            top: '8px',
            width: task.Milestone ? '12px' : width,
            height: task.Milestone ? '12px' : '24px'
          }}
          onClick={() => onTaskbarClick(task)}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {/* Progress indicator */}
          {!task.Milestone && task.Progress > 0 && (
            <div
              className="h-full bg-green-600 rounded-l"
              style={{ width: `${task.Progress}%` }}
            />
          )}
          
          {/* Task text */}
          {!task.Milestone && width > 100 && (
            <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-800 truncate">
              {task.TaskName}
            </span>
          )}
        </div>
      )}

      {/* Tooltip */}
      {showTaskTooltip && showTooltip && (
        <div className="absolute z-30 p-3 bg-gray-900 text-white text-sm rounded shadow-lg whitespace-nowrap"
             style={{ top: '-80px', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="font-medium">{task.TaskName}</div>
          <div>Activity: {task.ActivityNumber}</div>
          <div>Start: {formatDate(task.StartDate)}</div>
          <div>End: {formatDate(task.EndDate)}</div>
          <div>Progress: {task.Progress}%</div>
          {task.Milestone && <div className="text-blue-300">Milestone</div>}
          
          {/* VSN Details tooltip */}
          {task.VSNDetails && task.VSNDetails.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="font-medium">VSN Details:</div>
              {task.VSNDetails.map((vsn, idx) => (
                <div key={idx} className="text-xs mt-1">
                  <div>{vsn.VSNCode} - {vsn.VSNName}</div>
                  <div>{formatDate(vsn.startDate)} - {formatDate(vsn.endDate)}</div>
                </div>
              ))}
            </div>
          )}
          
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export default GanttTaskbar;


import React, { useState } from 'react';
import { Task } from '../../types/gantt';
import { formatDate } from '../../utils/ganttUtils';

interface GanttTaskbarProps {
  task: Task;
  left: number;
  width: number;
  onTaskbarClick: (task: Task) => void;
  onDragStart: (task: Task, e: React.MouseEvent, mode?: 'move' | 'resize-start' | 'resize-end' | 'dependency') => void;
  onDragEnd: (task: Task, e: React.MouseEvent) => void;
  showTooltip: boolean;
  isEditable: boolean;
  isCritical?: boolean;
}

const GanttTaskbar: React.FC<GanttTaskbarProps> = ({
  task,
  left,
  width,
  onTaskbarClick,
  onDragStart,
  onDragEnd,
  showTooltip,
  isEditable,
  isCritical = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showTaskTooltip, setShowTaskTooltip] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);

  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'resize-start' | 'resize-end' = 'move') => {
    if (!isEditable) return;
    e.preventDefault();
    setIsDragging(true);
    setDragMode(mode);
    onDragStart(task, e, mode);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      setDragMode(null);
      onDragEnd(task, e);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskbarClick(task);
  };

  const progressWidth = (width * task.Progress) / 100;

  // Calculate colors based on task state
  const getTaskbarColors = () => {
    if (isCritical) {
      return {
        background: 'bg-red-400',
        hover: 'hover:bg-red-500',
        progress: 'bg-red-600'
      };
    }
    
    if (task.Progress >= 100) {
      return {
        background: 'bg-green-500',
        hover: 'hover:bg-green-600',
        progress: 'bg-green-700'
      };
    }
    
    if (task.Progress >= 50) {
      return {
        background: 'bg-yellow-400',
        hover: 'hover:bg-yellow-500',
        progress: 'bg-yellow-600'
      };
    }
    
    return {
      background: 'bg-blue-400',
      hover: 'hover:bg-blue-500',
      progress: 'bg-blue-600'
    };
  };

  const colors = getTaskbarColors();

  return (
    <div
      className="relative"
      style={{ left, width }}
      onMouseEnter={() => setShowTaskTooltip(true)}
      onMouseLeave={() => setShowTaskTooltip(false)}
      onMouseUp={handleMouseUp}
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
              ? `${colors.background} transform rotate-45` 
              : `${colors.background} ${colors.hover}`
          } ${isDragging ? 'opacity-75 scale-105 shadow-lg' : ''} ${
            !isEditable ? 'cursor-not-allowed opacity-60' : ''
          } ${isCritical ? 'ring-2 ring-red-500 ring-opacity-50' : ''}`}
          style={{
            top: '8px',
            width: task.Milestone ? '12px' : width,
            height: task.Milestone ? '12px' : '24px'
          }}
          onClick={handleClick}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
          {/* Progress indicator */}
          {!task.Milestone && task.Progress > 0 && (
            <div
              className={`h-full ${colors.progress} rounded-l transition-all duration-300`}
              style={{ width: `${task.Progress}%` }}
            />
          )}
          
          {/* Task text */}
          {!task.Milestone && width > 100 && (
            <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white truncate pointer-events-none">
              {task.TaskName}
            </span>
          )}
          
          {/* Resize handles */}
          {!task.Milestone && isEditable && width > 40 && (
            <>
              {/* Left resize handle */}
              <div
                className="absolute left-0 top-0 w-2 h-full cursor-w-resize bg-transparent hover:bg-white hover:bg-opacity-30"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'resize-start');
                }}
              />
              
              {/* Right resize handle */}
              <div
                className="absolute right-0 top-0 w-2 h-full cursor-e-resize bg-transparent hover:bg-white hover:bg-opacity-30"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'resize-end');
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Enhanced Tooltip - Positioned Below Task Bar */}
      {showTaskTooltip && showTooltip && (
        <div className="absolute z-30 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl whitespace-nowrap min-w-64"
             style={{ top: '50px', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="space-y-2">
            <div className="font-semibold text-lg border-b border-gray-600 pb-2">{task.TaskName}</div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <span className="text-gray-400">ID:</span> {task.TaskID}
              </div>
              <div>
                <span className="text-gray-400">Activity:</span> {task.ActivityNumber || 'N/A'}
              </div>
              <div>
                <span className="text-gray-400">Start:</span> {formatDate(task.StartDate)}
              </div>
              <div>
                <span className="text-gray-400">End:</span> {formatDate(task.EndDate)}
              </div>
              <div>
                <span className="text-gray-400">Duration:</span> {task.Duration}d
              </div>
              <div>
                <span className="text-gray-400">Progress:</span> {task.Progress}%
              </div>
            </div>
            
            {task.Milestone && (
              <div className="text-blue-300 font-medium">📍 Milestone</div>
            )}
            
            {isCritical && (
              <div className="text-red-300 font-medium">🔥 Critical Path</div>
            )}
            
            {task.Dependencies && task.Dependencies.length > 0 && (
              <div className="text-purple-300">
                <span className="text-gray-400">Dependencies:</span> {task.Dependencies.join(', ')}
              </div>
            )}
          </div>
          
          {/* VSN Details tooltip */}
          {task.VSNDetails && task.VSNDetails.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="font-medium text-orange-300 mb-2">VSN Details:</div>
              <div className="space-y-1">
                {task.VSNDetails.map((vsn, idx) => (
                  <div key={idx} className="text-xs bg-gray-800 p-2 rounded">
                    <div className="font-medium">{vsn.VSNCode} - {vsn.VSNName}</div>
                    <div className="text-gray-400">
                      {formatDate(vsn.startDate)} - {formatDate(vsn.endDate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Tooltip arrow pointing up */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  );
};

export default GanttTaskbar;

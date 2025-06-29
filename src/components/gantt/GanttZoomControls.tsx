
import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GanttZoomControlsProps {
  zoomLevel: number;
  timelineUnit: 'year' | 'month' | 'week' | 'day';
  onZoomChange: (level: number) => void;
  onTimelineUnitChange: (unit: 'year' | 'month' | 'week' | 'day') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

const GanttZoomControls: React.FC<GanttZoomControlsProps> = ({
  zoomLevel,
  timelineUnit,
  onZoomChange,
  onTimelineUnitChange,
  onZoomIn,
  onZoomOut,
  onZoomReset
}) => {
  const timelineOptions = [
    { value: 'year', label: 'Year' },
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' }
  ] as const;

  return (
    <div className="flex items-center space-x-4 bg-white border border-gray-300 rounded-lg px-4 py-2">
      {/* Timeline Unit Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">View:</span>
        <select
          value={timelineUnit}
          onChange={(e) => onTimelineUnitChange(e.target.value as 'year' | 'month' | 'week' | 'day')}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {timelineOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-l border-gray-300 pl-4 flex items-center space-x-3">
        <button
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          onClick={onZoomOut}
          disabled={zoomLevel <= 50}
          title="Zoom Out"
        >
          <ZoomOut size={16} className={zoomLevel <= 50 ? 'text-gray-400' : 'text-gray-600'} />
        </button>
        
        <div className="text-sm font-medium text-gray-700 min-w-12 text-center">
          {zoomLevel}%
        </div>
        
        <button
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          onClick={onZoomIn}
          disabled={zoomLevel >= 200}
          title="Zoom In"
        >
          <ZoomIn size={16} className={zoomLevel >= 200 ? 'text-gray-400' : 'text-gray-600'} />
        </button>
        
        <button
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          onClick={onZoomReset}
          title="Reset Zoom"
        >
          <RotateCcw size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default GanttZoomControls;

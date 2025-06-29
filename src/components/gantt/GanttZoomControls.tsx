
import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Slider } from '../ui/slider';

interface GanttZoomControlsProps {
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

const GanttZoomControls: React.FC<GanttZoomControlsProps> = ({
  zoomLevel,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onZoomReset
}) => {
  return (
    <div className="flex items-center space-x-3 bg-white border border-gray-300 rounded-lg px-4 py-2">
      <button
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        onClick={onZoomOut}
        disabled={zoomLevel <= 50}
        title="Zoom Out"
      >
        <ZoomOut size={16} className={zoomLevel <= 50 ? 'text-gray-400' : 'text-gray-600'} />
      </button>
      
      <div className="flex items-center space-x-2 min-w-32">
        <Slider
          value={[zoomLevel]}
          onValueChange={(values) => onZoomChange(values[0])}
          min={50}
          max={200}
          step={25}
          className="flex-1"
        />
      </div>
      
      <button
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        onClick={onZoomIn}
        disabled={zoomLevel >= 200}
        title="Zoom In"
      >
        <ZoomIn size={16} className={zoomLevel >= 200 ? 'text-gray-400' : 'text-gray-600'} />
      </button>
      
      <div className="border-l border-gray-300 pl-3">
        <span className="text-sm font-medium text-gray-700 min-w-12 text-center">
          {zoomLevel}%
        </span>
      </div>
      
      <button
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        onClick={onZoomReset}
        title="Reset Zoom"
      >
        <RotateCcw size={16} className="text-gray-600" />
      </button>
    </div>
  );
};

export default GanttZoomControls;


import React from 'react';
import { TimelineUnit } from '../../types/gantt';

interface GanttTimelineProps {
  timeline: TimelineUnit[];
  scrollLeft: number;
}

const GanttTimeline: React.FC<GanttTimelineProps> = ({ timeline, scrollLeft }) => {
  return (
    <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-300">
      {/* Month tier */}
      <div className="flex h-8 border-b border-gray-200">
        {timeline.reduce((acc, unit, index) => {
          const monthKey = `${unit.date.getFullYear()}-${unit.date.getMonth()}`;
          const isFirstOfMonth = index === 0 || 
            timeline[index - 1].date.getMonth() !== unit.date.getMonth();
          
          if (isFirstOfMonth) {
            const monthUnits = timeline.slice(index).filter(u => 
              u.date.getMonth() === unit.date.getMonth() &&
              u.date.getFullYear() === unit.date.getFullYear()
            ).length;
            
            acc.push(
              <div
                key={monthKey}
                className="flex items-center justify-center text-xs font-medium border-r border-gray-200 bg-gray-100"
                style={{ width: monthUnits * unit.width }}
              >
                {unit.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            );
          }
          return acc;
        }, [] as JSX.Element[])}
      </div>
      
      {/* Week tier */}
      <div className="flex h-8">
        {timeline.map((unit, index) => (
          <div
            key={index}
            className={`flex items-center justify-center text-xs border-r border-gray-200 ${
              unit.isWeekend ? 'bg-red-50' : 'bg-white'
            }`}
            style={{ width: unit.width }}
          >
            {unit.date.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GanttTimeline;

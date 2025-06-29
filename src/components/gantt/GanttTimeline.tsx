
import React from 'react';
import { TimelineUnit } from '../../types/gantt';

interface GanttTimelineProps {
  timeline: TimelineUnit[];
  scrollLeft: number;
  zoomLevel: 'year' | 'month' | 'week' | 'day';
}

const GanttTimeline: React.FC<GanttTimelineProps> = ({ timeline, scrollLeft, zoomLevel }) => {
  const renderTimelineHeader = () => {
    switch (zoomLevel) {
      case 'year':
        return (
          <div className="flex h-8 border-b border-gray-200">
            {timeline.reduce((acc, unit, index) => {
              const yearKey = unit.date.getFullYear().toString();
              const isFirstOfYear = index === 0 || 
                timeline[index - 1].date.getFullYear() !== unit.date.getFullYear();
              
              if (isFirstOfYear) {
                const yearUnits = timeline.slice(index).filter(u => 
                  u.date.getFullYear() === unit.date.getFullYear()
                ).length;
                
                acc.push(
                  <div
                    key={yearKey}
                    className="flex items-center justify-center text-sm font-medium border-r border-gray-200 bg-gray-100"
                    style={{ width: yearUnits * unit.width }}
                  >
                    {yearKey}
                  </div>
                );
              }
              return acc;
            }, [] as JSX.Element[])}
          </div>
        );
      
      case 'month':
        return (
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
        );
      
      case 'week':
        return (
          <div className="flex h-8 border-b border-gray-200">
            {timeline.reduce((acc, unit, index) => {
              const weekStart = new Date(unit.date);
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
              
              const isFirstOfWeek = index === 0 || 
                timeline[index - 1].date.getDay() > unit.date.getDay();
              
              if (isFirstOfWeek) {
                const weekUnits = timeline.slice(index).filter((u, i) => i < 7).length;
                
                acc.push(
                  <div
                    key={weekKey}
                    className="flex items-center justify-center text-xs font-medium border-r border-gray-200 bg-gray-100"
                    style={{ width: weekUnits * unit.width }}
                  >
                    Week {Math.ceil(unit.date.getDate() / 7)}
                  </div>
                );
              }
              return acc;
            }, [] as JSX.Element[])}
          </div>
        );
      
      case 'day':
      default:
        return (
          <div className="flex h-8 border-b border-gray-200">
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
        );
    }
  };

  return (
    <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-300">
      {renderTimelineHeader()}
      
      {/* Day tier for detailed view */}
      {(zoomLevel === 'week' || zoomLevel === 'day') && (
        <div className="flex h-6">
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
      )}
    </div>
  );
};

export default GanttTimeline;


import React, { useState, useEffect } from 'react';
import { Task } from '../../types/gantt';
import { X, Calendar, Clock, BarChart3, Target } from 'lucide-react';

interface TaskEditDialogProps {
  task: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
}

const TaskEditDialog: React.FC<TaskEditDialogProps> = ({ task, onSave, onCancel }) => {
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setEditedTask({ ...task });
  }, [task]);

  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseInputDate = (dateString: string) => {
    return new Date(dateString);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!editedTask.TaskName.trim()) {
      newErrors.TaskName = 'Task name is required';
    }
    
    if (editedTask.StartDate >= editedTask.EndDate) {
      newErrors.EndDate = 'End date must be after start date';
    }
    
    if (editedTask.Progress < 0 || editedTask.Progress > 100) {
      newErrors.Progress = 'Progress must be between 0 and 100';
    }
    
    if (editedTask.Duration <= 0) {
      newErrors.Duration = 'Duration must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Calculate duration based on dates
      const duration = Math.ceil((editedTask.EndDate.getTime() - editedTask.StartDate.getTime()) / (24 * 60 * 60 * 1000));
      const finalTask = { ...editedTask, Duration: duration };
      onSave(finalTask);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Edit Task</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Target size={16} className="inline mr-2" />
              Task Name
            </label>
            <input
              type="text"
              value={editedTask.TaskName}
              onChange={(e) => handleChange('TaskName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.TaskName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter task name"
              autoFocus
            />
            {errors.TaskName && (
              <p className="text-red-500 text-xs mt-1">{errors.TaskName}</p>
            )}
          </div>

          {/* Task ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task ID
            </label>
            <input
              type="text"
              value={editedTask.TaskID}
              onChange={(e) => handleChange('TaskID', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task ID"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} className="inline mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={formatDateForInput(editedTask.StartDate)}
                onChange={(e) => handleChange('StartDate', parseInputDate(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} className="inline mr-2" />
                End Date
              </label>
              <input
                type="date"
                value={formatDateForInput(editedTask.EndDate)}
                onChange={(e) => handleChange('EndDate', parseInputDate(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.EndDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.EndDate && (
                <p className="text-red-500 text-xs mt-1">{errors.EndDate}</p>
              )}
            </div>
          </div>

          {/* Duration & Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock size={16} className="inline mr-2" />
                Duration (days)
              </label>
              <input
                type="number"
                value={editedTask.Duration}
                onChange={(e) => handleChange('Duration', parseInt(e.target.value))}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.Duration ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.Duration && (
                <p className="text-red-500 text-xs mt-1">{errors.Duration}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <BarChart3 size={16} className="inline mr-2" />
                Progress (%)
              </label>
              <input
                type="number"
                value={editedTask.Progress}
                onChange={(e) => handleChange('Progress', parseInt(e.target.value))}
                min="0"
                max="100"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.Progress ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.Progress && (
                <p className="text-red-500 text-xs mt-1">{errors.Progress}</p>
              )}
            </div>
          </div>

          {/* Activity Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Number
            </label>
            <input
              type="text"
              value={editedTask.ActivityNumber || ''}
              onChange={(e) => handleChange('ActivityNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter activity number"
            />
          </div>

          {/* Milestone */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="milestone"
              checked={editedTask.Milestone}
              onChange={(e) => handleChange('Milestone', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="milestone" className="ml-2 text-sm font-medium text-gray-700">
              This is a milestone
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditDialog;

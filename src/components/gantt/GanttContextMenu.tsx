
import React, { useState, useEffect } from 'react';
import { ContextMenuItem } from '../../types/gantt';

interface GanttContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
}

const GanttContextMenu: React.FC<GanttContextMenuProps> = ({
  x,
  y,
  visible,
  onClose,
  items
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    
    if (visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-md shadow-lg z-50 py-1 min-w-48"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.separator ? (
            <hr className="my-1 border-gray-200" />
          ) : (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
              onClick={() => {
                item.action?.();
                onClose();
              }}
            >
              {item.text}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default GanttContextMenu;

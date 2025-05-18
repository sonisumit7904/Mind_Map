import React, { useState, useEffect, useRef } from 'react';
import { useMindMap, Node } from '../../context/MindMapContext';
import styles from './NodeComponent.module.css';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

interface NodeComponentProps {
  node: Node;
  onPositionUpdate: (element: HTMLElement) => void;
  onDrag: (nodeId: string, dx: number, dy: number) => void;
  scale: number;
}

const NodeComponent: React.FC<NodeComponentProps> = ({ 
  node, 
  onPositionUpdate, 
  onDrag,
  scale 
}) => {
  const { dispatch } = useMindMap();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nodeRef.current) {
      onPositionUpdate(nodeRef.current);
    }
  }, [node.position, onPositionUpdate]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
  };

  const handleBlur = () => {
    if (editText.trim() !== node.text) {
      dispatch({
        type: 'UPDATE_NODE_TEXT',
        nodeId: node.id,
        newText: editText.trim() || 'Untitled Node',
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const childPosition = {
      x: node.position.x + 200,
      y: node.position.y + node.childrenIds.length * 100,
    };
    
    dispatch({
      type: 'ADD_NODE',
      parentId: node.id,
      text: 'New Child',
      position: childPosition,
    });
  };

  const handleToggleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'TOGGLE_NODE_EXPANSION',
      nodeId: node.id,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    onDrag(node.id, dx, dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  const hasChildren = node.childrenIds.length > 0;
  const isRoot = node.parentId === null;
  const nodeClassName = `${styles.nodeContainer} ${isRoot ? styles.root : ''}`;

  return (
    <div
      ref={nodeRef}
      className={nodeClassName}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {isEditing ? (
        <input
          type="text"
          className={styles.editInput}
          value={editText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <p className={styles.nodeText} onDoubleClick={handleDoubleClick}>
          {node.text}
        </p>
      )}
      
      <div className={styles.nodeControls}>
        {hasChildren && (
          <button className={styles.toggleButton} onClick={handleToggleExpansion}>
            {node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        <button className={styles.addButton} onClick={handleAddChild}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default NodeComponent;
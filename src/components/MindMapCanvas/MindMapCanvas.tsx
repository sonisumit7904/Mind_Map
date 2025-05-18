import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useMindMap, Node } from '../../context/MindMapContext';
import NodeComponent from '../NodeComponent/NodeComponent';
import styles from './MindMapCanvas.module.css';

interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MindMapCanvas: React.FC = () => {
  const { state, dispatch } = useMindMap();
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === containerRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom functionality
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const scaleChange = delta > 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(transform.scale * scaleChange, 0.1), 3);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setTransform(prev => {
        const scaleDiff = newScale - prev.scale;
        return {
          scale: newScale,
          x: prev.x - (mouseX - prev.x) * (scaleDiff / prev.scale),
          y: prev.y - (mouseY - prev.y) * (scaleDiff / prev.scale),
        };
      });
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Node visibility check
  const shouldRenderNode = (node: Node): boolean => {
    if (node.parentId === null) return true;
    const parentNode = state.nodes[node.parentId];
    if (!parentNode || !parentNode.isExpanded) return false;
    return shouldRenderNode(parentNode);
  };

  // Calculate control point for Bezier curve
  const calculateControlPoint = (start: NodePosition, end: NodePosition) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const offset = Math.min(Math.abs(dx), 100);
    const angle = Math.atan2(dy, dx);
    const perpendicular = angle + Math.PI / 2;
    
    return {
      x: midX + Math.cos(perpendicular) * offset,
      y: midY + Math.sin(perpendicular) * offset,
    };
  };

  // Generate SVG paths for connections
  const generatePaths = () => {
    const paths: JSX.Element[] = [];
    
    Object.values(state.nodes).forEach(node => {
      if (!shouldRenderNode(node)) return;
      
      const parentNode = state.nodes[node.parentId || '']; // Get parent to access its connection style for the child
      const childPos = nodePositions[node.id]; // Current node is the child in this context
      if (!childPos) return;

      if (node.parentId && parentNode) {
        const parentPos = nodePositions[node.parentId];
        if (!parentPos || !shouldRenderNode(parentNode)) return;

        const startX = parentPos.x + parentPos.width / 2;
        const startY = parentPos.y + parentPos.height;
        const endX = childPos.x + childPos.width / 2;
        const endY = childPos.y;
        
        const control = calculateControlPoint(
          { ...parentPos, x: startX, y: startY },
          { ...childPos, x: endX, y: endY }
        );
        
        const path = `M ${startX} ${startY} Q ${control.x} ${control.y} ${endX} ${endY}`;
        
        // Apply connection styles from the child node (which stores style for line from parent)
        const connectionStyle = node.connectionStyle || {};
        const strokeColor = connectionStyle.color || '#CBD5E1';
        const strokeWidth = connectionStyle.thickness || 2;
        let strokeDasharray = '';
        if (connectionStyle.lineStyle === 'dashed') {
          strokeDasharray = '5,5';
        } else if (connectionStyle.lineStyle === 'dotted') {
          strokeDasharray = '2,2';
        }

        paths.push(
          <path
            key={`${node.parentId}-${node.id}`}
            d={path}
            stroke={strokeColor}
            strokeWidth={strokeWidth.toString()}
            strokeDasharray={strokeDasharray}
            fill="none"
          />
        );
      }
    });
    
    return paths;
  };

  // Update node position
  const updateNodePosition = (nodeId: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    
    setNodePositions(prev => ({
      ...prev,
      [nodeId]: {
        id: nodeId,
        x: (rect.left - canvasRect.left) / transform.scale,
        y: (rect.top - canvasRect.top) / transform.scale,
        width: rect.width,
        height: rect.height,
      },
    }));
  };

  // Handle node drag
  const handleNodeDrag = (nodeId: string, dx: number, dy: number) => {
    dispatch({
      type: 'SET_NODE_POSITION',
      nodeId,
      position: {
        x: state.nodes[nodeId].position.x + dx / transform.scale,
        y: state.nodes[nodeId].position.y + dy / transform.scale,
      },
    });
  };

  // Render nodes
  const renderNodes = () => {
    return Object.values(state.nodes)
      .filter(shouldRenderNode)
      .map((node) => (
        <NodeComponent
          key={node.id}
          node={node}
          onPositionUpdate={(element) => updateNodePosition(node.id, element)}
          onDrag={handleNodeDrag}
        />
      ));
  };

  return (
    <div 
      ref={containerRef}
      className={styles.canvasContainer}
      onMouseDown={handleMouseDown}
    >
      <div
        ref={canvasRef}
        className={styles.canvas}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <svg className={styles.connections}>
          {generatePaths()}
        </svg>
        {renderNodes()}
      </div>
      
      <div className={styles.instructions}>
        <div className={styles.instructionsTitle}>Instructions</div>
        <ul className={styles.instructionsList}>
          <li>Double-click a node to edit its text</li>
          <li>Click and drag nodes to reposition them</li>
          <li>Use mouse wheel to zoom in/out</li>
          <li>Click and drag the canvas to pan</li>
          <li>Click the "+" button to add a child node</li>
          <li>Click the arrow icon to expand/collapse children</li>
        </ul>
      </div>
    </div>
  );
};

export default MindMapCanvas;
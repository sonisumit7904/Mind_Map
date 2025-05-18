import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMindMap, Node } from '../../context/MindMapContext';
import styles from './NodeComponent.module.css';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
// Import a lightweight rich text editor, e.g., react-quill or create a simple one
// For simplicity, we'll use a textarea for htmlContent, but a proper editor is recommended.

interface NodeComponentProps {
  node: Node;
  onPositionUpdate: (element: HTMLElement) => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({ 
  node, 
  onPositionUpdate, 
}) => {
  const { dispatch } = useMindMap();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [editHtmlContent, setEditHtmlContent] = useState(node.htmlContent || '');
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
    // If htmlContent exists, prioritize editing that, otherwise edit simple text
    setEditText(node.text); // Keep simple text in sync for fallback or if rich editor is not used
    setEditHtmlContent(node.htmlContent || node.text); // Initialize editor with htmlContent or convert text
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
    // If not using a rich editor, you might want to update htmlContent as well, or vice-versa
    // For this example, we assume separate editing or a mechanism to convert
  };

  const handleHtmlContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditHtmlContent(e.target.value);
  };

  const handleBlur = () => {
    // If htmlContent was edited, save it
    if (editHtmlContent.trim() !== (node.htmlContent || '')) {
      dispatch({
        type: 'UPDATE_NODE_HTML_CONTENT',
        nodeId: node.id,
        htmlContent: editHtmlContent.trim(),
      });
      // Optionally, update simple text as a fallback or plain text representation
      // For now, we assume htmlContent takes precedence if it exists
      if (editText.trim() !== node.text && !editHtmlContent.trim()) {
         dispatch({
            type: 'UPDATE_NODE_TEXT',
            nodeId: node.id,
            newText: editText.trim() || 'Untitled Node',
        });
      }
    } else if (editText.trim() !== node.text) {
      dispatch({
        type: 'UPDATE_NODE_TEXT',
        nodeId: node.id,
        newText: editText.trim() || 'Untitled Node',
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    // Prevent canvas pan when clicking on a node
    e.stopPropagation(); 
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Instead of onDrag, dispatch the delta update directly
    // This keeps the logic consistent with how canvas panning might update positions
    dispatch({
      type: 'UPDATE_NODE_POSITION_BY_DELTA',
      nodeId: node.id,
      dx,
      dy,
      currentScale: 1, // Assuming node drags are not affected by canvas scale directly here
                       // Or, pass the actual currentScale from MindMapCanvas if needed
    });

    // Update dragStart for the next movement delta calculation
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, dispatch, node.id]); // Added dispatch and node.id to dependencies

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]); // Added isDragging to dependencies

  useEffect(() => {
    // Only add/remove listeners if isDragging state changes
    if (isDragging) {
      // console.log('NodeComponent: Adding mousemove/mouseup listeners');
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        // console.log('NodeComponent: Removing mousemove/mouseup listeners');
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]); // handleMouseMove and handleMouseUp are now dependencies

  const hasChildren = node.childrenIds.length > 0;
  const isRoot = node.parentId === null;
  const nodeClassName = `${styles.nodeContainer} ${isRoot ? styles.root : ''}`;

  // Apply dynamic styles from node.style
  const dynamicNodeStyle: React.CSSProperties = {
    left: `${node.position.x}px`,
    top: `${node.position.y}px`,
    cursor: isDragging ? 'grabbing' : 'grab',
    color: node.style?.color,
    backgroundColor: node.style?.backgroundColor,
    fontSize: node.style?.fontSize,
    fontWeight: node.style?.fontWeight as React.CSSProperties['fontWeight'], // Cast for type safety
    borderColor: node.style?.borderColor,
    borderWidth: node.style?.borderWidth,
    borderStyle: node.style?.borderStyle,
    borderRadius: node.style?.borderRadius,
    // backgroundImage: node.style?.backgroundImage ? `url(${node.style.backgroundImage})` : undefined,
    // For actual background image, ensure the URL is correctly formatted and accessible.
    // Consider security implications if URLs are user-provided.
  };
  if (node.style?.backgroundImage) {
    dynamicNodeStyle.backgroundImage = `url('${node.style.backgroundImage}')`;
    dynamicNodeStyle.backgroundSize = 'cover'; // Or other appropriate size
    dynamicNodeStyle.backgroundPosition = 'center';
  }

  return (
    <div
      ref={nodeRef}
      className={nodeClassName}
      style={dynamicNodeStyle} // Apply dynamic styles here
      onMouseDown={handleMouseDown}
    >
      {isEditing ? (
        // Basic example: allow editing simple text or HTML content via a textarea
        // A proper rich text editor component should be used for a better UX
        node.htmlContent || editHtmlContent ? (
          <textarea
            className={styles.editInput} // May need specific styling for textarea
            value={editHtmlContent}
            onChange={handleHtmlContentChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{ width: '100%', minHeight: '60px' }} // Basic styling
          />
        ) : (
          <input
            type="text"
            className={styles.editInput}
            value={editText}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        )
      ) : (
        // Render HTML content if available, otherwise simple text
        node.htmlContent ? (
          <div 
            className={styles.nodeText} 
            onDoubleClick={handleDoubleClick}
            dangerouslySetInnerHTML={{ __html: node.htmlContent }}
          />
        ) : (
          <p className={styles.nodeText} onDoubleClick={handleDoubleClick}>
            {node.text}
          </p>
        )
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
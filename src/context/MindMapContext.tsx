import React, { createContext, useReducer, useContext, ReactNode } from 'react';

// Define the Node type
export interface Node {
  id: string;
  text: string;
  parentId: string | null;
  childrenIds: string[];
  position: { x: number; y: number };
  isExpanded: boolean;
  // New properties for Milestone 1
  style?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string; // e.g., '16px'
    fontWeight?: string; // e.g., 'bold'
    borderColor?: string;
    borderWidth?: string; // e.g., '2px'
    borderStyle?: 'solid' | 'dotted' | 'dashed';
    borderRadius?: string; // For shape, e.g., '50%' for ellipse, '4px' for rectangle
    backgroundImage?: string; // URL for background image
  };
  htmlContent?: string; // For rich text
  connectionStyle?: { // Style of the line connecting this node to its parent
    color?: string;
    thickness?: number; // e.g., 2
    lineStyle?: 'solid' | 'dashed' | 'dotted';
  };
}

// Define the state shape
interface MindMapState {
  nodes: Record<string, Node>;
  rootId: string;
}

// Define action types
type MindMapAction =
  | { type: 'ADD_NODE'; parentId: string; text: string; position: { x: number; y: number } }
  | { type: 'UPDATE_NODE_TEXT'; nodeId: string; newText: string }
  | { type: 'TOGGLE_NODE_EXPANSION'; nodeId: string }
  | { type: 'SET_NODE_POSITION'; nodeId: string; position: { x: number; y: number } }
  // New actions for Milestone 1
  | { type: 'UPDATE_NODE_STYLE'; nodeId: string; style: Partial<Node['style']> }
  | { type: 'UPDATE_NODE_HTML_CONTENT'; nodeId: string; htmlContent: string }
  | { type: 'UPDATE_NODE_CONNECTION_STYLE'; nodeId: string; connectionStyle: Partial<Node['connectionStyle']> };

// Generate unique IDs
const generateId = (): string => Date.now().toString();

// Calculate position for a new child based on parent
const calculateChildPosition = (
  parentNode: Node,
  parentChildrenCount: number
): { x: number; y: number } => {
  return {
    x: parentNode.position.x + 200,
    y: parentNode.position.y + parentChildrenCount * 100,
  };
};

// Create initial state with root node
const rootId = generateId();
const initialState: MindMapState = {
  rootId,
  nodes: {
    [rootId]: {
      id: rootId,
      text: 'Root Node',
      parentId: null,
      childrenIds: [],
      position: { x: 300, y: 200 },
      isExpanded: true,
      // Default styles for Milestone 1 features
      style: {
        color: '#333333',
        backgroundColor: '#FFFFFF',
        fontSize: '16px',
        fontWeight: 'normal',
        borderColor: '#CCCCCC',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '8px',
      },
      htmlContent: '', // Initially no rich text
      connectionStyle: { // Default style for line from parent (none for root)
        color: '#CBD5E1', // Default color from MindMapCanvas
        thickness: 2,       // Default thickness from MindMapCanvas
        lineStyle: 'solid',
      },
    },
  },
};

// Create the reducer function
const mindMapReducer = (state: MindMapState, action: MindMapAction): MindMapState => {
  switch (action.type) {
    case 'ADD_NODE': {
      const nodeId = generateId();
      const parentNode = state.nodes[action.parentId];
      
      if (!parentNode) {
        return state;
      }
      
      const childPosition = calculateChildPosition(
        parentNode,
        parentNode.childrenIds.length
      );
      
      const newNode: Node = {
        id: nodeId,
        text: action.text,
        parentId: action.parentId,
        childrenIds: [],
        position: action.position || childPosition,
        isExpanded: true,
        // Inherit or set default styles for new nodes
        style: {
          ...(parentNode.style || initialState.nodes[rootId].style), // Inherit parent's style or default
          backgroundColor: '#FFFFFF', // Default for new nodes
        },
        htmlContent: '',
        connectionStyle: { // Default style for line connecting to this new node
          color: '#CBD5E1',
          thickness: 2,
          lineStyle: 'solid',
        },
      };
      
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [nodeId]: newNode,
          [action.parentId]: {
            ...parentNode,
            childrenIds: [...parentNode.childrenIds, nodeId],
          },
        },
      };
    }
    
    case 'UPDATE_NODE_TEXT': {
      const node = state.nodes[action.nodeId];
      
      if (!node) {
        return state;
      }
      
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: {
            ...node,
            text: action.newText,
          },
        },
      };
    }
    
    case 'TOGGLE_NODE_EXPANSION': {
      const node = state.nodes[action.nodeId];
      
      if (!node) {
        return state;
      }
      
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: {
            ...node,
            isExpanded: !node.isExpanded,
          },
        },
      };
    }
    
    case 'SET_NODE_POSITION': {
      const node = state.nodes[action.nodeId];
      
      if (!node) {
        return state;
      }
      
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: {
            ...node,
            position: action.position,
          },
        },
      };
    }
    // Reducers for new actions
    case 'UPDATE_NODE_STYLE': {
      const node = state.nodes[action.nodeId];
      if (!node) return state;
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: {
            ...node,
            style: { ...node.style, ...action.style },
          },
        },
      };
    }
    case 'UPDATE_NODE_HTML_CONTENT': {
      const node = state.nodes[action.nodeId];
      if (!node) return state;
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: {
            ...node,
            htmlContent: action.htmlContent,
            // Optionally clear simple text if htmlContent is set
            // text: action.htmlContent ? '' : node.text, 
          },
        },
      };
    }
    case 'UPDATE_NODE_CONNECTION_STYLE': {
      const node = state.nodes[action.nodeId];
      if (!node) return state;
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: {
            ...node,
            connectionStyle: { ...node.connectionStyle, ...action.connectionStyle },
          },
        },
      };
    }
    default:
      return state;
  }
};

// Create context
interface MindMapContextType {
  state: MindMapState;
  dispatch: React.Dispatch<MindMapAction>;
}

const MindMapContext = createContext<MindMapContextType | undefined>(undefined);

// Create provider component
interface MindMapProviderProps {
  children: ReactNode;
}

export const MindMapProvider: React.FC<MindMapProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(mindMapReducer, initialState);
  
  return (
    <MindMapContext.Provider value={{ state, dispatch }}>
      {children}
    </MindMapContext.Provider>
  );
};

// Custom hook for using the mind map context
export const useMindMap = (): MindMapContextType => {
  const context = useContext(MindMapContext);
  
  if (context === undefined) {
    throw new Error('useMindMap must be used within a MindMapProvider');
  }
  
  return context;
};
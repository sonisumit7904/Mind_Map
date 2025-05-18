import React, { createContext, useReducer, useContext, ReactNode } from 'react';

// Define the Node type
export interface Node {
  id: string;
  text: string;
  parentId: string | null;
  childrenIds: string[];
  position: { x: number; y: number };
  isExpanded: boolean;
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
  | { type: 'SET_NODE_POSITION'; nodeId: string; position: { x: number; y: number } };

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
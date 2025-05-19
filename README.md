# Mind Map Application

## Project Overview

This is a dynamic and interactive Mind Mapping application built with React, Vite, TypeScript, and Tailwind CSS. It allows users to create, visualize, and organize their ideas in a hierarchical tree structure. Nodes can be created, edited, styled, and connected, providing a flexible way to brainstorm and structure thoughts. The canvas supports panning and zooming for easy navigation of complex mind maps.

## Features

- **Node Creation and Management:**
    - Add new nodes to the mind map.
    - Edit node text and rich HTML content.
    - Delete nodes.
    - Expand and collapse child nodes.
- **Interactive Canvas:**
    - Pan the canvas to navigate large mind maps.
    - Zoom in and out for different levels of detail.
- **Node Styling:**
    - Customize individual node appearance:
        - Text color
        - Background color
        - Font size and weight
        - Border color, width, style, and radius
        - Background image
- **Connection Styling:**
    - Customize the appearance of lines connecting nodes:
        - Color
        - Thickness
        - Line style (solid, dashed, dotted)
- **Drag and Drop Nodes:**
    - Reposition nodes freely on the canvas.
- **State Management:**
    - Centralized state management using React Context.
- **Responsive Design (Basic):**
    - The application is built with web technologies that can be adapted for responsiveness.

## Tech Stack

- **Frontend:**
    - React
    - TypeScript
    - Vite (Build tool and dev server)
    - Tailwind CSS (Styling)
- **State Management:**
    - React Context API (as seen in `MindMapContext.tsx`)
- **Icons:**
    - `lucide-react` (for UI icons)
- **Linting & Formatting:**
    - ESLint
    - Prettier (implicitly, common with this stack)

## Getting Started

### Prerequisites

- Node.js (v18.x or later recommended)
- npm or yarn

### Installation

1.  **Clone the repository (if applicable) or download the source code.**
2.  **Navigate to the project directory:**
    ```bash
    cd MIND_MAP
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:5173` (Vite's default, can be configured with `--host`).
2.  **Open your browser** and navigate to the provided URL.

### Building for Production

To create an optimized production build:

```bash
npm run build
```
The build artifacts will be located in the `dist/` directory.

### Linting

To check for linting errors:

```bash
npm run lint
```

## Project Structure

```
MIND_MAP/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── MindMapCanvas/   # Canvas logic and rendering
│   │   │   ├── MindMapCanvas.module.css
│   │   │   └── MindMapCanvas.tsx
│   │   └── NodeComponent/   # Individual node rendering and interaction
│   │       ├── NodeComponent.module.css
│   │       └── NodeComponent.tsx
│   ├── context/             # React Context for state management
│   │   └── MindMapContext.tsx
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles (Tailwind imports)
│   ├── main.tsx             # Entry point of the application
│   └── vite-env.d.ts        # Vite environment type definitions
├── .eslintrc.cjs            # ESLint configuration
├── index.html               # Main HTML file
├── package.json             # Project metadata and dependencies
├── postcss.config.js        # PostCSS configuration (for Tailwind)
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript compiler options
├── tsconfig.node.json       # TypeScript config for Node.js environment (e.g., Vite config)
└── vite.config.ts           # Vite configuration
```

## Key Components and Their Roles

### `App.tsx`
- The root component of the application.
- Sets up the `MindMapProvider` to make the mind map state available to its children.
- Renders the `MindMapCanvas`.

### `MindMapCanvas.tsx` (`src/components/MindMapCanvas/`)
- The main interactive area where the mind map is displayed.
- **Responsibilities:**
    - Manages canvas-level interactions like panning and zooming.
    - Renders all nodes by iterating through the `state.nodes`.
    - Generates and renders SVG paths for connections between nodes.
    - Calculates control points for Bezier curves to create smooth connections.
    - Handles node visibility based on parent expansion state.
    - Updates node positions in its local state (`nodePositions`) for rendering, potentially for layout calculations or optimizations.

### `NodeComponent.tsx` (`src/components/NodeComponent/`)
- Represents a single node in the mind map.
- **Responsibilities:**
    - Displays the node's text or HTML content.
    - Handles node-specific interactions:
        - Double-click to edit text/HTML content.
        - Dragging to reposition the node (updates position via `MindMapContext`).
        - Adding child nodes (button, dispatches action).
        - Toggling expansion of child nodes (button, dispatches action).
    - Applies dynamic styles to the node based on `node.style` from the context.
    - Communicates its DOM element's position back to `MindMapCanvas` via `onPositionUpdate` for connection drawing.

### `MindMapContext.tsx` (`src/context/`)
- Provides the global state and actions for the mind map.
- **Core Elements:**
    - **`Node` Interface:** Defines the structure of a mind map node, including `id`, `text`, `parentId`, `childrenIds`, `position`, `isExpanded`, and styling properties (`style`, `htmlContent`, `connectionStyle`).
    - **`MindMapState` Interface:** Defines the shape of the global state, primarily `nodes` (a record of all nodes) and `rootId`.
    - **`MindMapAction` Type:** A discriminated union of all possible actions that can modify the state (e.g., `ADD_NODE`, `UPDATE_NODE_TEXT`, `SET_NODE_POSITION`).
    - **`initialState`:** The default state when the application loads, including a pre-defined root node.
    - **`mindMapReducer`:** A pure function that takes the current state and an action, and returns a new state. This is where the core logic for updating the mind map resides. (Note: The reducer logic is not fully shown in the provided snippet but is crucial).
    - **`MindMapContext`:** The React context object.
    - **`MindMapProvider`:** A component that wraps parts of the application, making the context available. It manages the state using `useReducer`.
    - **`useMindMap` Hook:** A custom hook for easy consumption of the `MindMapContext` in components.

## State Management

The application primarily uses React's Context API (`MindMapContext.tsx`) for global state management.

- **State (`MindMapState`):**
    - `nodes`: An object where keys are node IDs and values are `Node` objects. This allows for efficient lookup and updates of individual nodes.
    - `rootId`: The ID of the root node, serving as the entry point for traversing the mind map.
- **Actions (`MindMapAction`):**
    - Actions are dispatched from components (e.g., `NodeComponent`, `MindMapCanvas`) to update the state.
    - Examples: `ADD_NODE`, `UPDATE_NODE_TEXT`, `TOGGLE_NODE_EXPANSION`, `SET_NODE_POSITION`, `UPDATE_NODE_STYLE`.
- **Reducer (`mindMapReducer`):**
    - This function handles all state transitions in a predictable way. It takes the current state and an action, and returns the new state.
    - It ensures that state updates are immutable.
- **Provider (`MindMapProvider`):**
    - Wraps the application (or relevant parts) and provides the state and dispatch function to all descendant components via the `useMindMap` hook.

The `package.json` also lists `zustand` as a dependency. This might indicate:
- A planned migration or addition of `zustand` for more complex state scenarios.
- `zustand` being used for local component state or a different feature set not immediately apparent from the core mind map context.
- An unused dependency.

For the core mind map functionality described, `React.Context` is the active state management solution.

## Future Enhancements / Roadmap

- **Local Storage Persistence:** Save the mind map state to the browser's local storage so users don't lose their work on refresh.
- **Export/Import:** Allow users to export their mind maps (e.g., as JSON, SVG, or PNG) and import them.
- **Collaboration:** Real-time collaborative editing (would require a backend and WebSockets).
- **Advanced Styling Options:** More granular control over node and connection styles, possibly a style editor UI.
- **Keyboard Shortcuts:** For common actions like adding nodes, editing, navigating.
- **Search Functionality:** Find nodes within a large mind map.
- **Undo/Redo:** Implement an undo/redo stack for actions.
- **Themes:** Pre-defined themes for the mind map appearance.
- **Node Icons/Images:** Allow users to add icons or images to nodes.
- **Accessibility Improvements:** Ensure the application is usable by people with disabilities (e.g., keyboard navigation, ARIA attributes).
- **Performance Optimization:** For very large mind maps, further optimize rendering and state updates.
- **Touch Support:** Improved interactions on touch devices.
- **Integration with `zustand`:** If intended, fully integrate `zustand` for potentially more optimized or flexible state management.

## For Hackathon Judgers

- **Innovation:** The application provides a modern and visually appealing way to organize thoughts, leveraging React's component model for a modular structure.
- **Technical Complexity:**
    - Dynamic rendering of nodes and connections (SVG Bezier curves).
    - Interactive canvas with pan and zoom.
    - Rich text editing capabilities within nodes.
    - Customizable styling for nodes and connections.
    - Robust state management to handle complex interactions and data flow.
- **User Experience:** The drag-and-drop interface, along with pan and zoom, aims for an intuitive user experience.
- **Completion:** The core features of a mind mapping tool are implemented.
- **Learning:** The project demonstrates proficiency in React, TypeScript, state management patterns, and modern frontend tooling.

## For Developers

- **Code Structure:** The code is organized into components, context, and main application files, promoting modularity.
- **TypeScript:** The use of TypeScript enhances code quality and maintainability.
- **Styling:** Tailwind CSS is used for utility-first styling, allowing for rapid UI development. CSS Modules are also used for component-specific styles.
- **State Management:** Understand the `MindMapContext.tsx` for how data flows and is updated.
- **Key Files to Check:**
    - `src/context/MindMapContext.tsx`: For state structure, actions, and reducer logic.
    - `src/components/MindMapCanvas/MindMapCanvas.tsx`: For canvas interactions and rendering logic.
    - `src/components/NodeComponent/NodeComponent.tsx`: For individual node behavior and styling.

## Contribution Guidelines (Example)

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Ensure your code lints (`npm run lint`).
5.  Commit your changes (`git commit -m 'Add some feature'`).
6.  Push to the branch (`git push origin feature/your-feature-name`).
7.  Open a Pull Request.

---

This README provides a comprehensive overview of the Mind Map application. Feel free to expand or modify sections as the project evolves.

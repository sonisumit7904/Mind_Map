import React from 'react';
import { MindMapProvider } from './context/MindMapContext';
import MindMapCanvas from './components/MindMapCanvas/MindMapCanvas';

function App() {
  return (
    <div className="app">
      <MindMapProvider>
        <MindMapCanvas />
      </MindMapProvider>
    </div>
  );
}

export default App;
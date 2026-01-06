// src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes';
import './App.css';

/**
 * Main Application Component
 * Handles routing and error boundaries
 */
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}

export default App;

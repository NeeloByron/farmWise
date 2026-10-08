import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Navbar from './components/Navbar';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Navbar />
  </React.StrictMode>,
);

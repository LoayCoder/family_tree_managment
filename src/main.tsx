import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import FamilyTreePage from './components/FamilyTreePage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FamilyTreePage />
  </StrictMode>
);
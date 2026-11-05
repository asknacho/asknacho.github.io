import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Preview } from './Preview';
import { Scene } from './Scene';
import './styles.css';

const isPreview = new URLSearchParams(location.search).has('preview');

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isPreview ? <Preview /> : <Scene />}</StrictMode>,
);

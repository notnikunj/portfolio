import { notes } from './notes.js';

const allRegions = [
  { id: 'projects', label: 'Projects', center: [0.32, 0.08], spread: 0.17, points: 120, marker: 'dot', panel: false },
  { id: 'work', label: 'Work', center: [-0.52, -0.3], spread: 0.11, points: 96, marker: 'square', panel: true },
  { id: 'education', label: 'Education', center: [-0.5, 0.42], spread: 0.11, points: 96, marker: 'ring', panel: true },
  { id: 'about', label: 'About', center: [-0.06, -0.58], spread: 0.12, points: 90, marker: 'triangle', panel: true },
  { id: 'lens', label: 'Lens', center: [0.9, -0.48], spread: 0.1, points: 130, marker: 'box', panel: true },
  { id: 'contact', label: 'Contact', center: [0.82, 0.6], spread: 0.08, points: 36, marker: 'cross', panel: true },
  { id: 'notes', label: 'Notes', center: [-0.08, 0.66], spread: 0.08, points: 36, marker: 'ring', panel: true, hidden: notes.length === 0 },
];

export const regions = allRegions.filter((r) => !r.hidden);

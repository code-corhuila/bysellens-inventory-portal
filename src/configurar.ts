import { configurarFrontend } from '@bysellens/frontend-core/configuracion';
configurarFrontend({ modo: import.meta.env.VITE_DATA_MODE === 'real' ? 'real' : 'mock', apiBase: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', portal: 'inventory' });

import './configurar';
import { configurarFrontend } from '@bysellens/frontend-core/configuracion';
import { setupIonicReact } from '@ionic/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '@bysellens/frontend-core/auth/AuthContext';
import Login from '@bysellens/frontend-core/auth/Login';
import { login } from '@bysellens/frontend-core/auth/authService';
import Inventario from './pages/Inventario';
import PortalApp from '@bysellens/frontend-core/runtime/PortalApp';

const EstadoSesion = () => {
  const { autenticado, logout } = useAuth();
  return <><output>{autenticado ? 'Autenticado' : 'Sin sesión'}</output>
    <button onClick={logout}>Cerrar sesión de prueba</button></>;
};

setupIonicReact();
beforeEach(() => {
  sessionStorage.clear();
  configurarFrontend({ modo: 'mock', apiBase: '', portal: 'inventory' });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('monta el punto de arranque de Inventario', () => {
  render(<Inventario />);
  expect(screen.getByRole('heading', { name: 'Inventario' })).toBeTruthy();
});

it('redirige al login compartido cuando no hay sesión', async () => {
  window.history.replaceState({}, '', '/inventario');
  render(<AuthProvider><PortalApp pantalla={Inventario} inicioSesion={Login} /></AuthProvider>);
  await waitFor(() => expect(window.location.pathname).toBe('/login'));
  await waitFor(() => expect(document.getElementById('email')).toBeTruthy());
  expect(screen.queryByRole('heading', { name: 'Inventario' })).toBeNull();
});

it('inicia sesión desde el login compartido, persiste y cierra sesión sin backend', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const vista = render(<MemoryRouter><AuthProvider><Login /><EstadoSesion /></AuthProvider></MemoryRouter>);
  fireEvent.change(document.getElementById('email')!, { target: { value: 'admin@bysellens.com' } });
  fireEvent.change(document.getElementById('password')!, { target: { value: 'demo123' } });
  fireEvent.submit(document.querySelector('form')!);
  await waitFor(() => expect(screen.getByText('Autenticado')).toBeTruthy());
  expect(sessionStorage.getItem('bysellens_access_token')).toBe('mock-demo');
  expect(JSON.parse(sessionStorage.getItem('bysellens_usuario')!).email).toBe('admin@bysellens.com');
  vista.unmount();
  render(<AuthProvider><EstadoSesion /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('Autenticado')).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión de prueba' }));
  expect(screen.getByText('Sin sesión')).toBeTruthy();
  expect(sessionStorage.getItem('bysellens_access_token')).toBeNull();
  expect(sessionStorage.getItem('bysellens_usuario')).toBeNull();
  expect(fetchSpy).not.toHaveBeenCalled();
});

it('rechaza credenciales MOCK incorrectas sin crear una sesión', async () => {
  await expect(login({ email: 'incorrecto@example.com', password: 'incorrecta' })).rejects.toThrow();
  expect(sessionStorage.getItem('bysellens_access_token')).toBeNull();
});

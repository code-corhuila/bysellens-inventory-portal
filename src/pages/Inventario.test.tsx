import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { configurarFrontend } from '@bysellens/frontend-core/configuracion';
import * as servicio from '../services/productoService';
import Inventario from './Inventario';

beforeEach(() => {
  localStorage.clear();
  configurarFrontend({ modo: 'mock', apiBase: '', portal: 'inventory' });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('consulta el MOCK y muestra los datos comerciales y precios en COP', async () => {
  render(<Inventario />);
  expect(screen.getByRole('status').textContent).toBe('Cargando inventario...');
  expect(await screen.findByText('Labial rosa')).toBeTruthy();
  expect(screen.getByText('LAB001')).toBeTruthy();
  expect(screen.getByText('Labiales')).toBeTruthy();
  expect(screen.getByText('Rosa')).toBeTruthy();
  expect(screen.getByText(/10\.000/)).toBeTruthy();
  expect(screen.getByText(/18\.000/)).toBeTruthy();
});

it.each(['lab001', 'LABIAL ROSA', 'labiales', 'ROSA'])('busca por los campos originales: %s', async (texto) => {
  render(<Inventario />);
  await screen.findByText('Labial rosa');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: texto } });
  expect(screen.getByText('Labial rosa')).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'sin coincidencias' } });
  expect(screen.getByText('No se encontraron productos')).toBeTruthy();
  expect(screen.queryByRole('table')).toBeNull();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
  expect(screen.getByRole('table')).toBeTruthy();
});

it('muestra errores del servicio y permite recuperar la consulta con Actualizar', async () => {
  vi.spyOn(servicio, 'obtenerProductos').mockRejectedValueOnce(new Error('Fallo simulado'));
  render(<Inventario />);
  expect((await screen.findByRole('alert')).textContent).toBe('No fue posible cargar el inventario.');
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
  expect(await screen.findByText('Labial rosa')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('muestra el estado vacío cuando el catálogo no tiene productos activos', async () => {
  await servicio.eliminarProducto(1);
  render(<Inventario />);
  expect(await screen.findByText('No se encontraron productos')).toBeTruthy();
  expect(screen.getByText('0 productos registrados')).toBeTruthy();
});

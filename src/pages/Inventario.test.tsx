import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

it('cancela la eliminación sin llamar al servicio ni cambiar la tabla', async () => {
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
  const eliminar = vi.spyOn(servicio, 'eliminarProducto');
  render(<Inventario />);
  fireEvent.click(await screen.findByRole('button', { name: 'Eliminar Labial rosa' }));
  expect(confirmar).toHaveBeenCalledWith('¿Deseas eliminar "Labial rosa"?');
  expect(eliminar).not.toHaveBeenCalled();
  expect(screen.getByText('Labial rosa')).toBeTruthy();
});

it('desactiva en MOCK, actualiza el contador y conserva el borrado tras recargar', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<Inventario />);
  fireEvent.click(await screen.findByRole('button', { name: 'Eliminar Labial rosa' }));
  expect(await screen.findByText('0 productos registrados')).toBeTruthy();
  expect(screen.queryByText('Labial rosa')).toBeNull();
  expect((await servicio.obtenerProductoPorId(1)).activo).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
  expect(await screen.findByText('No se encontraron productos')).toBeTruthy();
});

it.each([undefined, 'Producto vinculado'])('conserva la fila al fallar y muestra el mensaje: %s', async (mensaje) => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const alertar = vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(servicio, 'eliminarProducto').mockRejectedValueOnce(
    mensaje ? { isAxiosError: true, response: { data: { message: mensaje } } } : new Error('Fallo'),
  );
  render(<Inventario />);
  fireEvent.click(await screen.findByRole('button', { name: 'Eliminar Labial rosa' }));
  await waitFor(() => expect(alertar).toHaveBeenCalledWith(mensaje || 'No fue posible eliminar el producto.'));
  expect(screen.getByText('Labial rosa')).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Eliminar Labial rosa' }) as HTMLButtonElement).disabled).toBe(false);
});

it('bloquea acciones repetidas y Actualizar durante una eliminación pendiente', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  let terminar!: () => void;
  const eliminar = vi.spyOn(servicio, 'eliminarProducto').mockImplementation(() => new Promise<void>((resolve) => { terminar = resolve; }));
  render(<Inventario />);
  const boton = await screen.findByRole('button', { name: 'Eliminar Labial rosa' });
  fireEvent.click(boton);
  expect(screen.getByRole('status').textContent).toBe('Eliminando producto...');
  expect((boton as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('button', { name: 'Actualizar' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(boton);
  expect(eliminar).toHaveBeenCalledTimes(1);
  terminar();
  expect(await screen.findByText('0 productos registrados')).toBeTruthy();
});

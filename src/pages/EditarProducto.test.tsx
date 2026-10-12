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
const abrir = async () => {
  render(<Inventario />);
  fireEvent.click(await screen.findByRole('button', { name: 'Editar Labial rosa' }));
};
const cambiar = (etiqueta: string, value: string) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value } });

it('precarga, permite cancelar y reabrir sin guardar cambios', async () => {
  const guardar = vi.spyOn(servicio, 'actualizarProducto');
  await abrir();
  expect((screen.getByLabelText('Código *') as HTMLInputElement).value).toBe('LAB001');
  expect((screen.getByLabelText('Categoría *') as HTMLSelectElement).value).toBe('Labiales');
  cambiar('Nombre *', 'Descartado');
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(guardar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Editar Labial rosa' }));
  expect((screen.getByLabelText('Nombre *') as HTMLInputElement).value).toBe('Labial rosa');
});

it('guarda información comercial en MOCK y conserva cantidades, estado e imagen', async () => {
  const anterior = await servicio.obtenerProductoPorId(1);
  await abrir();
  cambiar('Nombre *', 'Labial actualizado');
  cambiar('Tono', 'Coral');
  cambiar('Descripción', 'Nueva descripción');
  cambiar('Precio venta', '20000');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByText('Labial actualizado')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(await servicio.obtenerProductoPorId(1)).toMatchObject({
    nombre: 'Labial actualizado', tono: 'Coral', descripcion: 'Nueva descripción', precioVenta: 20000,
    stock: anterior.stock, stockMinimo: anterior.stockMinimo, activo: anterior.activo, imagen: anterior.imagen,
  });
});

it.each([
  ['Código *', ' ', 'El código es obligatorio.'],
  ['Nombre *', ' ', 'El nombre del producto es obligatorio.'],
  ['Categoría *', '', 'La categoría es obligatoria.'],
  ['Precio compra', '-1', 'El precio de compra no puede ser negativo.'],
  ['Precio venta', '1', 'El precio de venta no puede ser menor que el precio de compra.'],
])('valida %s antes de invocar el servicio', async (campo, valor, mensaje) => {
  const guardar = vi.spyOn(servicio, 'actualizarProducto');
  await abrir();
  cambiar(campo, valor);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(screen.getByRole('alert').textContent).toBe(mensaje);
  expect(guardar).not.toHaveBeenCalled();
});

it.each([undefined, 'Código duplicado'])('conserva el formulario y permite reintentar tras error: %s', async (mensaje) => {
  vi.spyOn(servicio, 'actualizarProducto').mockRejectedValueOnce(
    mensaje ? { isAxiosError: true, response: { data: { message: mensaje } } } : new Error('Fallo'),
  );
  await abrir();
  cambiar('Nombre *', 'Reintento');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect((await screen.findByRole('alert')).textContent).toBe(mensaje || 'No fue posible guardar el producto.');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByText('Reintento')).toBeTruthy();
});

it('bloquea campos, cancelar y envíos repetidos mientras guarda', async () => {
  let terminar!: (producto: servicio.Producto) => void;
  const guardar = vi.spyOn(servicio, 'actualizarProducto').mockImplementation(() => new Promise((resolve) => { terminar = resolve; }));
  const producto = await servicio.obtenerProductoPorId(1);
  await abrir();
  const boton = screen.getByRole('button', { name: 'Guardar cambios' });
  fireEvent.click(boton);
  expect(screen.getByRole('status').textContent).toBe('Guardando producto...');
  expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByLabelText('Nombre *').closest('fieldset')?.disabled).toBe(true);
  fireEvent.click(boton);
  expect(guardar).toHaveBeenCalledTimes(1);
  terminar(producto);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

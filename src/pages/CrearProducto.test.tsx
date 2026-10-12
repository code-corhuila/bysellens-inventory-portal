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
const cambiar = (etiqueta: string, value: string) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value } });
const abrir = async () => {
  render(<Inventario />);
  await screen.findByText('Labial rosa');
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }));
};
const completar = () => {
  cambiar('Código *', 'NUEVO001');
  cambiar('Nombre *', 'Producto nuevo');
  cambiar('Categoría *', 'Maquillaje');
  cambiar('Tono', 'Coral');
  cambiar('Descripción', 'Descripción comercial');
  cambiar('Precio compra', '100');
  cambiar('Precio venta', '150');
};
const crear = () => fireEvent.click(screen.getByRole('button', { name: 'Crear producto' }));

it('registra, actualiza contador/listado, limpia búsqueda y persiste usando valores originales', async () => {
  const guardar = vi.spyOn(servicio, 'crearProducto');
  await abrir();
  cambiar('Buscar productos', 'sin coincidencias');
  completar();
  crear();
  expect(await screen.findByText('Producto creado correctamente.')).toBeTruthy();
  expect(screen.getByText('Producto nuevo')).toBeTruthy();
  expect(screen.getByText('2 productos registrados')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(guardar).toHaveBeenCalledWith({
    codigo: 'NUEVO001', nombre: 'Producto nuevo', categoria: 'Maquillaje', tono: 'Coral',
    descripcion: 'Descripción comercial', precioCompra: 100, precioVenta: 150,
    stock: 0, stockMinimo: 5, activo: true,
  }, null);
  fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
  expect(await screen.findByText('Producto nuevo')).toBeTruthy();
  expect(await servicio.obtenerProductos()).toHaveLength(2);
});

it.each([
  ['Código *', ' ', 'El código es obligatorio.'],
  ['Nombre *', ' ', 'El nombre del producto es obligatorio.'],
  ['Categoría *', '', 'La categoría es obligatoria.'],
  ['Precio compra', '-1', 'El precio de compra no puede ser negativo.'],
  ['Precio venta', '1', 'El precio de venta no puede ser menor que el precio de compra.'],
])('valida %s sin registrar datos', async (campo, valor, mensaje) => {
  const guardar = vi.spyOn(servicio, 'crearProducto');
  await abrir();
  completar();
  cambiar(campo, valor);
  crear();
  expect(screen.getByRole('alert').textContent).toBe(mensaje);
  expect(guardar).not.toHaveBeenCalled();
});

it('cancela sin guardar y vuelve a abrir un formulario vacío', async () => {
  const guardar = vi.spyOn(servicio, 'crearProducto');
  await abrir();
  completar();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(guardar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }));
  expect((screen.getByLabelText('Código *') as HTMLInputElement).value).toBe('');
});

it('rechaza código duplicado en MOCK y permite corregirlo sin perder los campos', async () => {
  await abrir();
  completar();
  cambiar('Código *', 'LAB001');
  crear();
  expect((await screen.findByRole('alert')).textContent).toBe('El código ya existe');
  expect((screen.getByLabelText('Nombre *') as HTMLInputElement).value).toBe('Producto nuevo');
  cambiar('Código *', 'OTRO001');
  crear();
  expect(await screen.findByText('Producto creado correctamente.')).toBeTruthy();
});

it('muestra el error genérico y permite reintentar', async () => {
  vi.spyOn(servicio, 'crearProducto').mockRejectedValueOnce(new Error('Fallo simulado'));
  await abrir();
  completar();
  crear();
  expect((await screen.findByRole('alert')).textContent).toBe('No fue posible guardar el producto.');
  crear();
  expect(await screen.findByText('Producto nuevo')).toBeTruthy();
});

it('bloquea cancelar y registros repetidos mientras espera al servicio', async () => {
  let terminar!: (producto: servicio.Producto) => void;
  const guardar = vi.spyOn(servicio, 'crearProducto').mockImplementation(() => new Promise((resolve) => { terminar = resolve; }));
  await abrir();
  completar();
  crear();
  expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByLabelText('Código *').closest('fieldset')?.disabled).toBe(true);
  crear();
  expect(guardar).toHaveBeenCalledTimes(1);
  terminar({ ...(await servicio.obtenerProductoPorId(1)), id: 2, codigo: 'NUEVO001', nombre: 'Producto nuevo' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

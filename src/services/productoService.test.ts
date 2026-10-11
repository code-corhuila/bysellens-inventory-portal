import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { configurarFrontend } from '@bysellens/frontend-core/configuracion';
import { clave, leer } from '@bysellens/frontend-core/mock';
import api from '@bysellens/frontend-core/api';
import {
  actualizarProducto, crearProducto, eliminarProducto,
  obtenerProductoPorId, obtenerProductos, type ProductoRequest,
} from './productoService';

const productoNuevo = (): ProductoRequest => ({
  codigo: 'LAB002', nombre: 'Labial coral', descripcion: 'Producto sintético',
  categoria: 'Labiales', tono: 'Coral', precioCompra: 12000, precioVenta: 20000,
  stock: 0, stockMinimo: 0, activo: true,
});

beforeEach(() => {
  localStorage.clear();
  configurarFrontend({ modo: 'mock', apiBase: '', portal: 'inventory' });
});
afterEach(() => { vi.restoreAllMocks(); });

it('consulta el producto sintético del core sin persistir ni llamar al backend', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  const getSpy = vi.spyOn(api, 'get').mockRejectedValue(new Error('No usar backend'));
  const productos = await obtenerProductos();
  expect(productos).toHaveLength(1);
  expect(productos[0]).toMatchObject({ codigo: 'LAB001', nombre: 'Labial rosa', activo: true });
  expect(await obtenerProductoPorId(productos[0].id)).toEqual(productos[0]);
  expect(localStorage.getItem(clave)).toBeNull();
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(getSpy).not.toHaveBeenCalled();
});

it('crea un producto comercial con ID nuevo y conserva los demás datos compartidos', async () => {
  const datosAntes = leer();
  const postSpy = vi.spyOn(api, 'post').mockRejectedValue(new Error('No usar backend'));
  const creado = await crearProducto(productoNuevo());
  expect(creado).toMatchObject({ ...productoNuevo(), id: 2, imagen: '' });
  expect(await obtenerProductoPorId(creado.id)).toEqual(creado);
  expect(JSON.parse(localStorage.getItem(clave)!).productos).toHaveLength(2);
  expect(leer().clientes).toEqual(datosAntes.clientes);
  expect(leer().ventas).toEqual(datosAntes.ventas);
  expect(postSpy).not.toHaveBeenCalled();
});

it('edita código, categoría, tono y precios sin alterar las cantidades recibidas', async () => {
  const original = (await obtenerProductos())[0];
  const putSpy = vi.spyOn(api, 'put').mockRejectedValue(new Error('No usar backend'));
  const cambios = { ...original, codigo: 'LAB-EDITADO', categoria: 'Maquillaje', tono: 'Vino', precioCompra: 15000, precioVenta: 22000 };
  const editado = await actualizarProducto(original.id, cambios);
  expect(editado).toMatchObject(cambios);
  expect(editado.stock).toBe(original.stock);
  expect(editado.stockMinimo).toBe(original.stockMinimo);
  expect(await obtenerProductoPorId(original.id)).toEqual(editado);
  expect(putSpy).not.toHaveBeenCalled();
});

it('rechaza códigos duplicados al crear o editar y no cambia los datos', async () => {
  const creado = await crearProducto(productoNuevo());
  const datosAntes = localStorage.getItem(clave);
  await expect(crearProducto({ ...productoNuevo(), codigo: 'LAB001' })).rejects.toThrow('El código ya existe');
  await expect(actualizarProducto(creado.id, { ...productoNuevo(), codigo: 'LAB001' })).rejects.toThrow('El código ya existe');
  expect(localStorage.getItem(clave)).toBe(datosAntes);
  await expect(actualizarProducto(creado.id, productoNuevo())).resolves.toMatchObject({ id: creado.id });
});

it.each([
  { precioCompra: -1 },
  { precioCompra: 25000, precioVenta: 20000 },
  { stock: -1 },
  { stock: 1.5 },
])('mantiene la validación original para %j sin guardar datos inválidos', async (cambio) => {
  await expect(crearProducto({ ...productoNuevo(), ...cambio })).rejects.toThrow('Precio o stock inválido');
  expect(localStorage.getItem(clave)).toBeNull();
});

it('acepta precios iguales y cantidades cero como el adaptador original', async () => {
  await expect(crearProducto({ ...productoNuevo(), precioCompra: 0, precioVenta: 0 })).resolves.toMatchObject({ precioCompra: 0, precioVenta: 0, stock: 0 });
});

it('convierte la imagen a data URL y la conserva al editar sin una imagen nueva', async () => {
  const imagen = new File(['imagen'], 'labial.png', { type: 'image/png' });
  const creado = await crearProducto(productoNuevo(), imagen);
  expect(creado.imagen).toBe('data:image/png;base64,aW1hZ2Vu');
  const editado = await actualizarProducto(creado.id, { ...productoNuevo(), nombre: 'Labial editado' });
  expect(editado.imagen).toBe(creado.imagen);
});

it('desactiva el producto, lo oculta del listado y conserva el registro', async () => {
  const deleteSpy = vi.spyOn(api, 'delete').mockRejectedValue(new Error('No usar backend'));
  await eliminarProducto(1);
  expect(await obtenerProductos()).toEqual([]);
  expect(await obtenerProductoPorId(1)).toMatchObject({ id: 1, activo: false });
  expect(leer().productos).toHaveLength(1);
  expect(deleteSpy).not.toHaveBeenCalled();
});

it('informa registros inexistentes en consultas, edición y desactivación', async () => {
  await expect(obtenerProductoPorId(999)).rejects.toThrow('Registro no encontrado');
  await expect(actualizarProducto(999, productoNuevo())).rejects.toThrow('Registro no encontrado');
  await expect(eliminarProducto(999)).rejects.toThrow('Registro no encontrado');
  expect(localStorage.getItem(clave)).toBeNull();
});

it('conserva el contrato REAL de creación multipart sin enviar peticiones reales', async () => {
  configurarFrontend({ modo: 'real', apiBase: 'http://localhost:8080', portal: 'inventory' });
  const imagen = new File(['imagen'], 'labial.png', { type: 'image/png' });
  const respuesta = { ...productoNuevo(), id: 2, imagen: 'labial.png' };
  const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: respuesta });
  expect(await crearProducto(productoNuevo(), imagen)).toEqual(respuesta);
  expect(postSpy).toHaveBeenCalledWith('/api/productos', expect.any(FormData));
  const multipart = postSpy.mock.calls[0][1] as FormData;
  expect(multipart.get('producto')).toBeInstanceOf(Blob);
  expect((multipart.get('producto') as Blob).type).toBe('application/json');
  expect(multipart.get('imagen')).toEqual(imagen);
});

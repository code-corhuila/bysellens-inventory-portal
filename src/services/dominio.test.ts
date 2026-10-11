import { beforeEach, expect, it } from 'vitest';
import { configurarFrontend } from '@bysellens/frontend-core/configuracion';
import { obtenerProductos, actualizarProducto } from './productoService';
beforeEach(() => { localStorage.clear(); configurarFrontend({ modo: 'mock', apiBase: '', portal: 'inventory' }); });
it('edita la información comercial y conserva el stock', async () => {
  const producto = (await obtenerProductos())[0];
  await actualizarProducto(producto.id, { ...producto, nombre: 'Nombre editado' });
  expect((await obtenerProductos())[0]).toMatchObject({ nombre: 'Nombre editado', stock: producto.stock });
});

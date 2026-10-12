import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configurarFrontend, imagenProducto } from '@bysellens/frontend-core/configuracion';
import * as servicio from '../services/productoService';
import EditarProducto from './EditarProducto';

beforeEach(() => {
  localStorage.clear();
  configurarFrontend({ modo: 'mock', apiBase: '', portal: 'inventory' });
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:preview');
    static revokeObjectURL = vi.fn();
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const seleccionar = (archivo?: File) => fireEvent.change(screen.getByLabelText('Imagen del producto'), {
  target: { files: archivo ? [archivo] : [] },
});
const imagen = (tipo = 'image/png') => new File(['imagen'], 'producto.png', { type: tipo });
const completar = () => {
  for (const [campo, value] of [['Código *', 'IMG001'], ['Nombre *', 'Con imagen'], ['Categoría *', 'Maquillaje']]) {
    fireEvent.change(screen.getByLabelText(campo), { target: { value } });
  }
};

it.each(['image/jpeg', 'image/png', 'image/webp'])('crea con %s, vista previa accesible y persistencia MOCK', async (tipo) => {
  const guardar = vi.fn();
  render(<EditarProducto alGuardar={guardar} alCerrar={vi.fn()} />);
  expect(screen.getByText('Sin imagen seleccionada.')).toBeTruthy();
  completar();
  seleccionar(imagen(tipo));
  expect(screen.getByRole('img', { name: 'Vista previa de Con imagen' }).getAttribute('src')).toBe('blob:preview');
  fireEvent.click(screen.getByRole('button', { name: 'Crear producto' }));
  await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
  expect(guardar.mock.calls[0][0].imagen).toBe(`data:${tipo};base64,aW1hZ2Vu`);
  expect((await servicio.obtenerProductos()).find((producto) => producto.codigo === 'IMG001')?.imagen).toBe(`data:${tipo};base64,aW1hZ2Vu`);
});

it('muestra y conserva una imagen existente al guardar cambios comerciales', async () => {
  const producto = await servicio.obtenerProductoPorId(1);
  const conImagen = await servicio.actualizarProducto(1, producto, imagen());
  const guardar = vi.fn();
  render(<EditarProducto producto={conImagen} alGuardar={guardar} alCerrar={vi.fn()} />);
  expect(screen.getByRole('img').getAttribute('src')).toBe(conImagen.imagen);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
  expect((await servicio.obtenerProductoPorId(1)).imagen).toBe(conImagen.imagen);
});

it('resuelve nombres de imagen con frontend-core y muestra alternativa si no carga', async () => {
  const producto = { ...(await servicio.obtenerProductoPorId(1)), imagen: 'labial.png' };
  render(<EditarProducto producto={producto} alGuardar={vi.fn()} alCerrar={vi.fn()} />);
  expect(screen.getByRole('img').getAttribute('src')).toBe(imagenProducto('labial.png'));
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByText('Imagen no disponible.')).toBeTruthy();
  expect(screen.queryByRole('img')).toBeNull();
  seleccionar(imagen());
  expect(screen.getByRole('img')).toBeTruthy();
});

it('reemplaza la imagen al editar y libera previews al cambiar y cerrar', async () => {
  const producto = await servicio.obtenerProductoPorId(1);
  const guardar = vi.fn();
  const vista = render(<EditarProducto producto={producto} alGuardar={guardar} alCerrar={vi.fn()} />);
  seleccionar(imagen());
  seleccionar(imagen('image/webp'));
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
  expect((await servicio.obtenerProductoPorId(1)).imagen).toBe('data:image/webp;base64,aW1hZ2Vu');
  vista.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});

it.each([
  ['image/gif', 10, 'Solo se permiten imágenes JPG, PNG o WEBP.'],
  ['image/png', 5 * 1024 * 1024 + 1, 'La imagen no puede superar los 5 MB.'],
])('rechaza %s de %i bytes sin generar una preview', (tipo, size, mensaje) => {
  render(<EditarProducto alGuardar={vi.fn()} alCerrar={vi.fn()} />);
  const archivo = imagen(tipo);
  Object.defineProperty(archivo, 'size', { value: size });
  seleccionar(archivo);
  expect(screen.getByRole('alert').textContent).toBe(mensaje);
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(screen.queryByRole('img')).toBeNull();
});

it('acepta el límite de 5 MB y conserva selección al cancelar el selector de archivos', () => {
  render(<EditarProducto alGuardar={vi.fn()} alCerrar={vi.fn()} />);
  const archivo = imagen();
  Object.defineProperty(archivo, 'size', { value: 5 * 1024 * 1024 });
  seleccionar(archivo);
  seleccionar();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('img')).toBeTruthy();
});

it('cancelar el formulario no guarda el archivo seleccionado', async () => {
  const producto = await servicio.obtenerProductoPorId(1);
  const cancelar = vi.fn();
  const actualizar = vi.spyOn(servicio, 'actualizarProducto');
  render(<EditarProducto producto={producto} alGuardar={vi.fn()} alCerrar={cancelar} />);
  seleccionar(imagen());
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(cancelar).toHaveBeenCalledTimes(1);
  expect(actualizar).not.toHaveBeenCalled();
  expect((await servicio.obtenerProductoPorId(1)).imagen).toBe(producto.imagen);
});

import type { Producto, ProductoRequest } from '@bysellens/frontend-core/modelos';
export type { Producto, ProductoRequest } from '@bysellens/frontend-core/modelos';
import { modoMock } from '@bysellens/frontend-core/configuracion';
import { mockProductos } from './mock';
import api from '@bysellens/frontend-core/api';

const API_URL = '/api/productos';





/* =========================================================
   OBTENER TODOS LOS PRODUCTOS
   ========================================================= */

export const obtenerProductos = async (): Promise<Producto[]> => {
  if (modoMock) return mockProductos.listar();
  const response = await api.get<Producto[]>(API_URL);

  return response.data;
};

/* =========================================================
   OBTENER PRODUCTO POR ID
   ========================================================= */

export const obtenerProductoPorId = async (
  id: number
): Promise<Producto> => {
  if (modoMock) return mockProductos.obtener(id);
  const response = await api.get<Producto>(
    `${API_URL}/${id}`
  );

  return response.data;
};

/* =========================================================
   CREAR PRODUCTO + IMAGEN
   ========================================================= */

export const crearProducto = async (
  producto: ProductoRequest,
  imagen?: File | null
): Promise<Producto> => {
  if (modoMock) return mockProductos.guardar(producto, imagen);
  const formData = new FormData();

  formData.append(
    'producto',
    new Blob(
      [JSON.stringify(producto)],
      {
        type: 'application/json',
      }
    )
  );

  if (imagen) {
    formData.append('imagen', imagen);
  }

  const response = await api.post<Producto>(
    API_URL,
    formData
  );

  return response.data;
};

/* =========================================================
   ACTUALIZAR PRODUCTO + IMAGEN
   ========================================================= */

export const actualizarProducto = async (
  id: number,
  producto: ProductoRequest,
  imagen?: File | null
): Promise<Producto> => {
  if (modoMock) return mockProductos.guardar(producto, imagen, id);
  const formData = new FormData();

  formData.append(
    'producto',
    new Blob(
      [JSON.stringify(producto)],
      {
        type: 'application/json',
      }
    )
  );

  if (imagen) {
    formData.append('imagen', imagen);
  }

  const response = await api.put<Producto>(
    `${API_URL}/${id}`,
    formData
  );

  return response.data;
};

/* =========================================================
   ACTUALIZAR STOCK
   ========================================================= */

export const eliminarProducto = async (
  id: number
): Promise<void> => {
  if (modoMock) return mockProductos.eliminar(id);
  await api.delete(`${API_URL}/${id}`);
};
import { leer, guardar, siguiente, fallo, buscar } from '@bysellens/frontend-core/mock';
import type { Producto, ProductoRequest } from '@bysellens/frontend-core/modelos';
const convertirImagen = (archivo: File): Promise<string> => new Promise((resolve, reject) => {
  const lector = new FileReader(); lector.onload = () => resolve(String(lector.result)); lector.onerror = reject; lector.readAsDataURL(archivo);
});
export const mockProductos = {
  listar: async () => leer().productos.filter(p => p.activo),
  obtener: async (id: number) => buscar(leer().productos, id),
  guardar: async (producto: ProductoRequest, imagen?: File | null, id?: number) => {
    if (producto.precioVenta < producto.precioCompra || producto.precioCompra < 0 || producto.stock < 0 || !Number.isInteger(producto.stock)) fallo('Precio o stock inválido');
    const imagenNueva = imagen ? await convertirImagen(imagen) : undefined;
    const datos = leer();
    if (datos.productos.some(p => p.codigo === producto.codigo && p.id !== id)) fallo('El código ya existe');
    const anterior = id === undefined ? undefined : buscar(datos.productos, id);
    const resultado: Producto = { ...producto, id: id ?? siguiente(datos.productos), imagen: imagenNueva ?? anterior?.imagen ?? '' };
    if (anterior) Object.assign(anterior, resultado); else datos.productos.push(resultado);
    guardar(datos); return resultado;
  },
  eliminar: async (id: number) => { const datos = leer(); buscar(datos.productos, id).activo = false; guardar(datos); },
};

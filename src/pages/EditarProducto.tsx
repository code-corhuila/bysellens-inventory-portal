import { useEffect, useState } from 'react';
import { imagenProducto } from '@bysellens/frontend-core/configuracion';
import { isAxiosError } from 'axios';
import { actualizarProducto, crearProducto, type Producto, type ProductoRequest } from '../services/productoService';
import './EditarProducto.css';

interface Props {
  producto?: Producto;
  alGuardar: (producto: Producto) => void;
  alCerrar: () => void;
}

// Bloque comercial del formulario original; conserva cantidades y estado recibidos.
const EditarProducto: React.FC<Props> = ({ producto, alGuardar, alCerrar }) => {
  const [formulario, setFormulario] = useState<ProductoRequest>(producto ? {
    codigo: producto.codigo, nombre: producto.nombre, descripcion: producto.descripcion || '',
    categoria: producto.categoria || '', tono: producto.tono || '',
    precioCompra: producto.precioCompra, precioVenta: producto.precioVenta,
    stock: producto.stock, stockMinimo: producto.stockMinimo, activo: producto.activo,
  } : {
    codigo: '', nombre: '', descripcion: '', categoria: '', tono: '',
    precioCompra: 0, precioVenta: 0, stock: 0, stockMinimo: 5, activo: true,
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState('');
  const [imagenNoDisponible, setImagenNoDisponible] = useState(false);
  useEffect(() => {
    setImagenNoDisponible(false);
    if (!archivoImagen) {
      setPreviewImagen(producto?.imagen ? imagenProducto(producto.imagen) : '');
      return;
    }
    const url = URL.createObjectURL(archivoImagen);
    setPreviewImagen(url);
    return () => URL.revokeObjectURL(url);
  }, [archivoImagen, producto?.imagen]);
  const seleccionarImagen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;
    const error = !['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)
      ? 'Solo se permiten imágenes JPG, PNG o WEBP.'
      : archivo.size > 5 * 1024 * 1024 ? 'La imagen no puede superar los 5 MB.' : '';
    setMensaje(error);
    if (error) {
      event.target.value = '';
      return;
    }
    setArchivoImagen(archivo);
  };
  const cambiarCampo = (campo: keyof ProductoRequest, valor: string | number) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  };
  const guardarProducto = async () => {
    if (guardando) return;
    const error = !formulario.codigo.trim() ? 'El código es obligatorio.'
      : !formulario.nombre.trim() ? 'El nombre del producto es obligatorio.'
      : !formulario.categoria.trim() ? 'La categoría es obligatoria.'
      : formulario.precioCompra < 0 ? 'El precio de compra no puede ser negativo.'
      : formulario.precioVenta < formulario.precioCompra ? 'El precio de venta no puede ser menor que el precio de compra.'
      : formulario.stock < 0 ? 'El stock no puede ser negativo.'
      : formulario.stockMinimo < 0 ? 'El stock mínimo no puede ser negativo.' : '';
    setMensaje(error);
    if (error) return;
    setGuardando(true);
    try {
      const actualizado = producto
        ? await actualizarProducto(producto.id, formulario, archivoImagen)
        : await crearProducto(formulario, archivoImagen);
      alGuardar(actualizado);
    } catch (error: unknown) {
      const datos = isAxiosError<{ message?: string; mensaje?: string }>(error) ? error.response?.data
        : error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: unknown; mensaje?: unknown } } }).response?.data
          : undefined;
      const detalle = datos?.message || datos?.mensaje;
      setMensaje(typeof detalle === 'string' && detalle ? detalle : 'No fue posible guardar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  return <>
    <div className="inventario-drawer-overlay" />
    <aside className="inventario-drawer" aria-label={producto ? 'Editar producto' : 'Nuevo producto'}>
      <form className="product-form" noValidate onSubmit={(event) => { event.preventDefault(); void guardarProducto(); }}>
        <h2>{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
        <p>{producto ? 'Modifica la información del producto.' : 'Registra un nuevo producto en el inventario.'}</p>
        <fieldset disabled={guardando}>
          <div className="form-grid">
            {(['codigo', 'nombre', 'tono'] as const).map((campo) => (
              <div className="form-field" key={campo}>
                <label htmlFor={campo}>{campo === 'codigo' ? 'Código *' : campo === 'nombre' ? 'Nombre *' : 'Tono'}</label>
                <input id={campo} value={formulario[campo]} onChange={(event) => cambiarCampo(campo, event.target.value)} />
              </div>
            ))}
            <div className="form-field">
              <label htmlFor="categoria">Categoría *</label>
              <select id="categoria" value={formulario.categoria} onChange={(event) => cambiarCampo('categoria', event.target.value)}>
                <option value="">Seleccionar categoría</option>
                {[...new Set([producto?.categoria, 'Maquillaje', 'Perfumería', 'Cuidado facial', 'Cuidado corporal', 'Accesorios'])].filter(Boolean).map((categoria) => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>
            <div className="form-field form-field-full">
              <label htmlFor="descripcion">Descripción</label>
              <textarea id="descripcion" value={formulario.descripcion} onChange={(event) => cambiarCampo('descripcion', event.target.value)} />
            </div>
            {(['precioCompra', 'precioVenta'] as const).map((campo) => (
              <div className="form-field" key={campo}>
                <label htmlFor={campo}>{campo === 'precioCompra' ? 'Precio compra' : 'Precio venta'}</label>
                <input id={campo} type="number" value={formulario[campo]} onChange={(event) => cambiarCampo(campo, Number(event.target.value))} />
              </div>
            ))}
          </div>
          <div className="form-field">
            <label htmlFor="imagen-producto">Imagen del producto</label>
            <input id="imagen-producto" type="file" accept="image/jpeg,image/png,image/webp"
              aria-describedby="imagen-ayuda" onChange={seleccionarImagen} />
            <p id="imagen-ayuda">JPG, PNG o WEBP. Máximo 5 MB. Selecciona otra imagen para reemplazarla.</p>
            {previewImagen && !imagenNoDisponible ? <div className="inventario-image-preview">
              <img src={previewImagen} alt={`Vista previa de ${formulario.nombre || 'producto'}`}
                onError={() => setImagenNoDisponible(true)} />
            </div> : <p>{imagenNoDisponible ? 'Imagen no disponible.' : 'Sin imagen seleccionada.'}</p>}
          </div>
        </fieldset>
        {mensaje && <div className="form-error" role="alert">{mensaje}</div>}
        {guardando && <p role="status">Guardando producto...</p>}
        <div className="form-actions">
          <button type="button" className="secondary-button" disabled={guardando} onClick={alCerrar}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={guardando}>{producto ? 'Guardar cambios' : 'Crear producto'}</button>
        </div>
      </form>
    </aside>
  </>;
};

export default EditarProducto;

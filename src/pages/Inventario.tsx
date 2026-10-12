import { IonContent, IonPage } from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import { eliminarProducto, obtenerProductos, type Producto } from '../services/productoService';
import { isAxiosError } from 'axios';
import './Inventario.css';
import EditarProducto from './EditarProducto';

// Consulta y desactivación extraídas de la pantalla original.
const Inventario: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const cargarProductos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setProductos(await obtenerProductos());
    } catch {
      setError('No fue posible cargar el inventario.');
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => { void cargarProductos(); }, [cargarProductos]);

  const eliminar = async (producto: Producto) => {
    if (eliminando !== null || !window.confirm(`¿Deseas eliminar "${producto.nombre}"?`)) return;
    setEliminando(producto.id);
    try {
      await eliminarProducto(producto.id);
      setProductos((anteriores) => anteriores.filter((item) => item.id !== producto.id));
    } catch (error: unknown) {
      console.error('Error eliminando producto:', error);
      const mensaje = isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      window.alert(mensaje || 'No fue posible eliminar el producto.');
    } finally {
      setEliminando(null);
    }
  };

  const productosFiltrados = productos.filter((producto) => {
    const texto = busqueda.toLowerCase();
    return producto.codigo?.toLowerCase().includes(texto)
      || producto.nombre?.toLowerCase().includes(texto)
      || producto.categoria?.toLowerCase().includes(texto)
      || producto.tono?.toLowerCase().includes(texto);
  });
  const formatoPrecio = (precio: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(precio);

  return (
    <IonPage>
      <IonContent>
        <div className="page-content">
          <div className="page-header"><h1>Inventario</h1></div>
          <button className="table-button" disabled={cargando || eliminando !== null}
            onClick={() => { setProductoEditando(null); setMensajeExito(''); setMostrarFormulario(true); }}>Nuevo producto</button>
          <div className="products-card">
            <div className="products-header">
              <div>
                <h2>Control de inventario</h2>
                <span className="product-count">{productos.length} productos registrados</span>
              </div>
              <button className="refresh-button" onClick={cargarProductos} disabled={cargando || eliminando !== null}>Actualizar</button>
            </div>
            <div className="search-container">
              <input type="text" aria-label="Buscar productos"
                placeholder="Buscar por código, nombre, categoría o tono..."
                value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
            </div>
            {cargando && <div className="message" role="status">Cargando inventario...</div>}
            {mensajeExito && <div className="message" role="status">{mensajeExito}</div>}
            {eliminando !== null && <div className="message" role="status">Eliminando producto...</div>}
            {!cargando && error && <div className="message error" role="alert">{error}</div>}
            {!cargando && !error && productosFiltrados.length > 0 && (
              <div className="table-container">
                <table aria-label="Catálogo de productos">
                  <thead><tr>
                    {['Código', 'Producto', 'Categoría', 'Tono', 'Compra', 'Venta', 'Acciones'].map((titulo) => <th scope="col" key={titulo}>{titulo}</th>)}
                  </tr></thead>
                  <tbody>{productosFiltrados.map((producto) => (
                    <tr key={producto.id}>
                      <td><span className="product-code">{producto.codigo}</span></td>
                      <td><div className="product-name"><strong>{producto.nombre}</strong>
                        {producto.descripcion && <small>{producto.descripcion}</small>}
                      </div></td>
                      <td>{producto.categoria}</td>
                      <td>{producto.tono || '-'}</td>
                      <td>{formatoPrecio(producto.precioCompra)}</td>
                      <td>{formatoPrecio(producto.precioVenta)}</td>
                      <td><div className="actions">
                        <button className="table-button" aria-label={`Editar ${producto.nombre}`}
                          disabled={eliminando !== null} onClick={() => {
                            setProductoEditando(producto); setMensajeExito(''); setMostrarFormulario(true);
                          }}>Editar</button>
                        <button className="table-button delete" aria-label={`Eliminar ${producto.nombre}`}
                          disabled={eliminando !== null} onClick={() => { void eliminar(producto); }}>
                          Eliminar
                        </button>
                      </div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {!cargando && !error && productosFiltrados.length === 0 && (
              <div className="empty-products">
                <div className="empty-title">No se encontraron productos</div>
                <div className="empty-text">Cambia el criterio de búsqueda.</div>
              </div>
            )}
          </div>
          {mostrarFormulario && <EditarProducto producto={productoEditando ?? undefined}
            alCerrar={() => { setMostrarFormulario(false); setProductoEditando(null); }}
            alGuardar={(actualizado) => {
              setProductos((anteriores) => productoEditando
                ? anteriores.map((producto) => producto.id === actualizado.id ? actualizado : producto)
                : [...anteriores, actualizado]);
              if (!productoEditando) setBusqueda('');
              setMensajeExito(productoEditando ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
              setMostrarFormulario(false);
              setProductoEditando(null);
            }} />}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Inventario;

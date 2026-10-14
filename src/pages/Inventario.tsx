import { IonContent, IonPage } from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import { obtenerProductos, type Producto } from '../services/productoService';
import './Inventario.css';

// Bloque de consulta extraído de la pantalla original; las acciones van en otro PR.
const Inventario: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
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
          <div className="products-card">
            <div className="products-header">
              <div>
                <h2>Control de inventario</h2>
                <span className="product-count">{productos.length} productos registrados</span>
              </div>
              <button className="refresh-button" onClick={cargarProductos} disabled={cargando}>Actualizar</button>
            </div>
            <div className="search-container">
              <input type="text" aria-label="Buscar productos"
                placeholder="Buscar por código, nombre, categoría o tono..."
                value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
            </div>
            {cargando && <div className="message" role="status">Cargando inventario...</div>}
            {!cargando && error && <div className="message error" role="alert">{error}</div>}
            {!cargando && !error && productosFiltrados.length > 0 && (
              <div className="table-container">
                <table aria-label="Catálogo de productos">
                  <thead><tr>
                    {['Código', 'Producto', 'Categoría', 'Tono', 'Compra', 'Venta'].map((titulo) => <th scope="col" key={titulo}>{titulo}</th>)}
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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Inventario;

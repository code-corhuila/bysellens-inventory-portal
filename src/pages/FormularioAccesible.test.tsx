import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import EditarProducto from './EditarProducto';
import * as servicio from '../services/productoService';

afterEach(() => { cleanup(); vi.restoreAllMocks(); document.getElementById('root')?.remove(); });

it('monta el diálogo fuera de Ionic, enfoca el código y restaura foco e inert al cerrar', () => {
  const fondo = document.createElement('div');
  fondo.id = 'root';
  fondo.innerHTML = '<button>Nuevo producto</button>';
  document.body.append(fondo);
  const activador = fondo.querySelector('button')!;
  const contenedor = document.createElement('div');
  fondo.append(contenedor);
  activador.focus();
  const vista = render(<EditarProducto alGuardar={vi.fn()} alCerrar={vi.fn()} />, { container: contenedor });
  const dialogo = screen.getByRole('dialog', { name: 'Nuevo producto' });
  expect(dialogo.parentElement).toBe(document.body);
  expect(dialogo.getAttribute('aria-modal')).toBe('true');
  expect(document.activeElement).toBe(screen.getByLabelText('Código *'));
  expect(fondo.inert).toBe(true);
  vista.unmount();
  expect(fondo.inert).toBe(false);
  expect(document.activeElement).toBe(activador);
});

it('contiene Tab y Shift+Tab y permite cancelar con Escape', () => {
  const cerrar = vi.fn();
  render(<EditarProducto alGuardar={vi.fn()} alCerrar={cerrar} />);
  const primero = screen.getByLabelText('Código *');
  const ultimo = screen.getByRole('button', { name: 'Crear producto' });
  ultimo.focus();
  fireEvent.keyDown(ultimo, { key: 'Tab' });
  expect(document.activeElement).toBe(primero);
  fireEvent.keyDown(primero, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(ultimo);
  fireEvent.keyDown(ultimo, { key: 'Escape' });
  expect(cerrar).toHaveBeenCalledTimes(1);
});

it('impide Escape y salida de foco durante el guardado', () => {
  vi.spyOn(servicio, 'crearProducto').mockImplementation(() => new Promise(() => {}));
  const cerrar = vi.fn();
  render(<EditarProducto alGuardar={vi.fn()} alCerrar={cerrar} />);
  for (const [campo, value] of [['Código *', 'QA001'], ['Nombre *', 'QA'], ['Categoría *', 'Maquillaje']]) {
    fireEvent.change(screen.getByLabelText(campo), { target: { value } });
  }
  fireEvent.click(screen.getByRole('button', { name: 'Crear producto' }));
  const dialogo = screen.getByRole('dialog');
  fireEvent.keyDown(dialogo, { key: 'Escape' });
  expect(cerrar).not.toHaveBeenCalled();
  fireEvent.keyDown(dialogo, { key: 'Tab' });
  expect(document.activeElement).toBe(dialogo);
});

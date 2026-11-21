import { validarRepuesto, repuestosBajoStock, formatoCOP, aCSV } from '../logic.js';
import { esc, modal, cerrarModal, leerForm, mostrarErrores, toast, confirmar, vacio, opciones, descargar } from '../ui.js';

let filtro = { texto: '', categoria: '', soloBajo: false };

export function render(el, ctx) {
  const { store } = ctx;
  const todos = store.todos('repuestos');
  const categorias = [...new Set(todos.map((r) => r.categoria))].sort();
  const bajo = new Set(repuestosBajoStock(todos).map((r) => r.id));
  const lista = todos
    .filter((r) => !filtro.categoria || r.categoria === filtro.categoria)
    .filter((r) => !filtro.soloBajo || bajo.has(r.id))
    .filter((r) => {
      const t = filtro.texto.toLowerCase();
      return !t || [r.codigo, r.nombre, r.proveedor].some((v) => String(v).toLowerCase().includes(t));
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const valorInventario = todos.reduce((s, r) => s + r.stock * r.costo, 0);

  el.innerHTML = `
  <div class="cabecera">
    <div><h1>Inventario de repuestos</h1><p>Control de existencias con alertas de stock mínimo. Valor del inventario al costo: <strong>${formatoCOP(valorInventario)}</strong></p></div>
    <div class="acciones"><button class="btn btn-sec" id="btn-csv">Exportar CSV</button><button class="btn" id="btn-nuevo">+ Nuevo repuesto</button></div>
  </div>
  <div class="panel">
    <div class="filtros">
      <input type="search" id="f-texto" placeholder="Buscar por código, nombre o proveedor" value="${esc(filtro.texto)}" aria-label="Buscar repuestos">
      <select id="f-cat" aria-label="Categoría">${opciones(categorias, filtro.categoria, { vacio: 'Todas las categorías' })}</select>
      <label class="check"><input type="checkbox" id="f-bajo" ${filtro.soloBajo ? 'checked' : ''}> Solo bajo stock (${bajo.size})</label>
    </div>
    ${lista.length ? `<div class="tabla-scroll"><table class="tabla">
      <thead><tr><th>Código</th><th>Repuesto</th><th class="num">Stock</th><th class="num ocultar-movil">Costo</th><th class="num">Precio</th><th class="ocultar-movil">Proveedor</th><th></th></tr></thead>
      <tbody>${lista.map((r) => `<tr>
        <td><code>${esc(r.codigo)}</code></td>
        <td>${esc(r.nombre)}<br><span class="muted">${esc(r.categoria)}</span></td>
        <td class="num">${bajo.has(r.id) ? `<span class="badge badge-rojo" title="Mínimo ${r.stockMinimo}">${r.stock}</span>` : r.stock}<br><span class="muted">mín. ${r.stockMinimo}</span></td>
        <td class="num ocultar-movil">${formatoCOP(r.costo)}</td>
        <td class="num">${formatoCOP(r.precioVenta)}</td>
        <td class="ocultar-movil">${esc(r.proveedor || '')}</td>
        <td><div class="acciones">
          <button class="btn btn-sec btn-peq" data-entrada="${esc(r.id)}">+ Entrada</button>
          <button class="btn btn-sec btn-peq" data-editar="${esc(r.id)}">Editar</button>
          <button class="btn btn-sec btn-peq" data-eliminar="${esc(r.id)}" aria-label="Eliminar repuesto">🗑</button>
        </div></td></tr>`).join('')}
      </tbody></table></div>` : vacio('No hay repuestos con los filtros aplicados.')}
  </div>`;

  el.querySelector('#f-texto').addEventListener('input', (e) => {
    filtro.texto = e.target.value;
    render(el, ctx);
    const i = el.querySelector('#f-texto');
    i.focus();
    i.setSelectionRange(filtro.texto.length, filtro.texto.length);
  });
  el.querySelector('#f-cat').addEventListener('change', (e) => { filtro.categoria = e.target.value; render(el, ctx); });
  el.querySelector('#f-bajo').addEventListener('change', (e) => { filtro.soloBajo = e.target.checked; render(el, ctx); });
  el.querySelector('#btn-nuevo').addEventListener('click', () => formulario(null, el, ctx));
  el.querySelector('#btn-csv').addEventListener('click', () => descargar('inventario_altf4.csv', '﻿' + aCSV(lista, [
    { titulo: 'Código', valor: 'codigo' }, { titulo: 'Repuesto', valor: 'nombre' }, { titulo: 'Categoría', valor: 'categoria' },
    { titulo: 'Stock', valor: 'stock' }, { titulo: 'Stock mínimo', valor: 'stockMinimo' }, { titulo: 'Costo', valor: 'costo' },
    { titulo: 'Precio venta', valor: 'precioVenta' }, { titulo: 'Proveedor', valor: 'proveedor' },
  ]), 'text/csv;charset=utf-8'));
  el.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => formulario(store.obtener('repuestos', b.dataset.editar), el, ctx)));
  el.querySelectorAll('[data-entrada]').forEach((b) => b.addEventListener('click', () => entrada(store.obtener('repuestos', b.dataset.entrada), el, ctx)));
  el.querySelectorAll('[data-eliminar]').forEach((b) => b.addEventListener('click', async () => {
    const usado = store.todos('ordenes').some((o) => (o.repuestos || []).some((r) => r.repuestoId === b.dataset.eliminar));
    if (usado) return toast('No se puede eliminar: el repuesto figura en órdenes de servicio.', 'error');
    if (await confirmar('¿Eliminar este repuesto del inventario?')) { store.eliminar('repuestos', b.dataset.eliminar); toast('Repuesto eliminado.'); render(el, ctx); }
  }));
}

function formulario(rep, el, ctx) {
  const { store } = ctx;
  const r = rep || { stock: 0, stockMinimo: 1, costo: 0, precioVenta: 0 };
  const m = modal({
    titulo: rep ? 'Editar repuesto' : 'Nuevo repuesto',
    cuerpo: `<form id="form-rep" novalidate><div class="campos">
      <label>Código *<input name="codigo" value="${esc(r.codigo || '')}" style="text-transform:uppercase"></label>
      <label>Categoría<input name="categoria" value="${esc(r.categoria || '')}" list="cats"></label>
      <datalist id="cats">${[...new Set(store.todos('repuestos').map((x) => x.categoria))].map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
      <label class="ancho">Nombre *<input name="nombre" value="${esc(r.nombre || '')}"></label>
      <label>Stock actual *<input type="number" name="stock" value="${r.stock}" min="0"></label>
      <label>Stock mínimo *<input type="number" name="stockMinimo" value="${r.stockMinimo}" min="0"></label>
      <label>Costo unitario *<input type="number" name="costo" value="${r.costo}" min="0" step="500"></label>
      <label>Precio de venta *<input type="number" name="precioVenta" value="${r.precioVenta}" min="0" step="500"></label>
      <label class="ancho">Proveedor<input name="proveedor" value="${esc(r.proveedor || '')}"></label>
    </div></form>`,
    acciones: [
      { texto: 'Cancelar', clase: 'btn-sec', onClick: cerrarModal },
      { texto: 'Guardar', onClick: () => {
        const form = m.querySelector('#form-rep');
        const d = leerForm(form);
        d.codigo = String(d.codigo).toUpperCase();
        const v = validarRepuesto(d);
        if (store.todos('repuestos').some((x) => x.codigo === d.codigo && x.id !== rep?.id)) v.errores.codigo = 'El código ya existe.';
        if (Object.keys(v.errores).length) return mostrarErrores(form, v.errores);
        rep ? store.actualizar('repuestos', rep.id, d) : store.crear('repuestos', d);
        cerrarModal();
        toast('Repuesto guardado.');
        render(el, ctx);
      } },
    ],
  });
}

function entrada(rep, el, ctx) {
  const m = modal({
    titulo: `Entrada de inventario — ${rep.nombre}`,
    cuerpo: `<form id="form-ent" novalidate><div class="campos">
      <label>Cantidad recibida *<input type="number" name="cantidad" value="1" min="1"></label>
      <label>Costo unitario<input type="number" name="costo" value="${rep.costo}" min="0" step="500"></label>
    </div><p class="muted">Stock actual: ${rep.stock}</p></form>`,
    acciones: [
      { texto: 'Cancelar', clase: 'btn-sec', onClick: cerrarModal },
      { texto: 'Registrar entrada', onClick: () => {
        const form = m.querySelector('#form-ent');
        const d = leerForm(form);
        if (!Number.isInteger(d.cantidad) || d.cantidad < 1) return mostrarErrores(form, { cantidad: 'Ingrese una cantidad entera mayor a 0.' });
        ctx.store.actualizar('repuestos', rep.id, { stock: rep.stock + d.cantidad, costo: Number(d.costo) || rep.costo });
        cerrarModal();
        toast(`Entrada registrada. Nuevo stock: ${rep.stock + d.cantidad}.`);
        render(el, ctx);
      } },
    ],
  });
}

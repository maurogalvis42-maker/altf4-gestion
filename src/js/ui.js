/** Utilidades de interfaz: escape de HTML, modales, notificaciones y formularios. */

export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function toast(mensaje, tipo = 'ok') {
  const cont = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.setAttribute('role', 'status');
  el.textContent = mensaje;
  cont.appendChild(el);
  setTimeout(() => el.classList.add('salir'), 3200);
  setTimeout(() => el.remove(), 3700);
}

export function modal({ titulo, cuerpo, acciones = [], ancho = '' }) {
  cerrarModal();
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.id = 'modal';
  fondo.innerHTML = `
    <div class="modal ${ancho}" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <header class="modal-cab">
        <h2 id="modal-titulo">${esc(titulo)}</h2>
        <button class="btn-icono" data-cerrar aria-label="Cerrar">✕</button>
      </header>
      <div class="modal-cuerpo">${cuerpo}</div>
      <footer class="modal-pie"></footer>
    </div>`;
  const pie = $('.modal-pie', fondo);
  for (const a of acciones) {
    const b = document.createElement('button');
    b.className = `btn ${a.clase || ''}`;
    b.textContent = a.texto;
    b.type = 'button';
    b.addEventListener('click', () => a.onClick?.(fondo));
    pie.appendChild(b);
  }
  fondo.addEventListener('click', (e) => {
    if (e.target === fondo || e.target.closest('[data-cerrar]')) cerrarModal();
  });
  document.body.appendChild(fondo);
  setTimeout(() => $('input,select,textarea', fondo)?.focus(), 30);
  return fondo;
}

export function cerrarModal() {
  $('#modal')?.remove();
}

export function confirmar(mensaje) {
  return new Promise((resolve) => {
    modal({
      titulo: 'Confirmar acción',
      cuerpo: `<p>${esc(mensaje)}</p>`,
      acciones: [
        { texto: 'Cancelar', clase: 'btn-sec', onClick: () => { cerrarModal(); resolve(false); } },
        { texto: 'Confirmar', clase: 'btn-peligro', onClick: () => { cerrarModal(); resolve(true); } },
      ],
    });
  });
}

/** Lee un formulario a objeto. Checkboxes → boolean, inputs number → Number. */
export function leerForm(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.type === 'number') out[el.name] = el.value === '' ? '' : Number(el.value);
    else out[el.name] = el.value.trim();
  }
  return out;
}

export function mostrarErrores(form, errores) {
  $$('.campo-error', form).forEach((e) => e.remove());
  $$('[aria-invalid]', form).forEach((e) => e.removeAttribute('aria-invalid'));
  for (const [campo, msg] of Object.entries(errores)) {
    const el = form.elements[campo];
    if (!el) continue;
    el.setAttribute('aria-invalid', 'true');
    const p = document.createElement('small');
    p.className = 'campo-error';
    p.textContent = msg;
    (el.closest('label') || el.parentElement).appendChild(p);
  }
  const primero = Object.keys(errores)[0];
  if (primero) form.elements[primero]?.focus();
}

export function opciones(lista, seleccionado, { valor = (x) => x, texto = (x) => x, vacio = null } = {}) {
  const ops = lista.map((x) => {
    const v = valor(x);
    return `<option value="${esc(v)}" ${String(v) === String(seleccionado ?? '') ? 'selected' : ''}>${esc(texto(x))}</option>`;
  });
  if (vacio !== null) ops.unshift(`<option value="">${esc(vacio)}</option>`);
  return ops.join('');
}

export function badge(texto) {
  const mapa = {
    Recibido: 'gris', 'En diagnóstico': 'ambar', 'En reparación': 'azul', 'Listo para entrega': 'violeta', Entregado: 'verde',
    Programada: 'gris', Confirmada: 'azul', Atendida: 'verde', Cancelada: 'rojo',
  };
  return `<span class="badge badge-${mapa[texto] || 'gris'}">${esc(texto)}</span>`;
}

export function descargar(nombre, contenido, tipo = 'text/plain;charset=utf-8') {
  const blob = new Blob([contenido], { type: tipo });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export function vacio(texto) {
  return `<div class="vacio"><p>${esc(texto)}</p></div>`;
}

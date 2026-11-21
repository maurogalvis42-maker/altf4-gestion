import { esc } from '../ui.js';
/** Gráfico de barras liviano sobre <canvas> (sin librerías externas). */
export function graficoBarras(canvas, datos, formato = (v) => String(v), color = '#1f5fa8') {
  if (!canvas || !canvas.getContext) return;
  const dpr = window.devicePixelRatio || 1;
  const ancho = canvas.clientWidth || 500;
  const alto = canvas.clientHeight || 240;
  canvas.width = ancho * dpr;
  canvas.height = alto * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, ancho, alto);

  const m = { arriba: 22, abajo: 28, izq: 8, der: 8 };
  const max = Math.max(1, ...datos.map((d) => d.valor));
  const n = datos.length || 1;
  const paso = (ancho - m.izq - m.der) / n;
  const barra = Math.min(56, paso * 0.6);
  const h = alto - m.arriba - m.abajo;

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = m.arriba + (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(m.izq, y);
    ctx.lineTo(ancho - m.der, y);
    ctx.stroke();
  }

  ctx.font = '12px Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  datos.forEach((d, i) => {
    const x = m.izq + paso * i + (paso - barra) / 2;
    const bh = (d.valor / max) * h;
    const y = m.arriba + h - bh;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barra, bh, [4, 4, 0, 0]);
    else ctx.rect(x, y, barra, bh);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillText(d.etiqueta, x + barra / 2, alto - 9);
    if (d.valor > 0) {
      ctx.fillStyle = '#1b2533';
      const t = formato(d.valor).replace('$ ', '$');
      ctx.fillText(t.length > 11 ? t.slice(0, -4) + 'k' : t, x + barra / 2, y - 6);
    }
  });
}

/** Barras horizontales en HTML (accesible y responsivo). */
export function barrasHTML(datos, formato = (v) => String(v)) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return datos
    .map(
      (d) => `<div style="margin:6px 0">
      <div style="display:flex;justify-content:space-between;font-size:.86rem"><span>${esc(d.etiqueta)}</span><strong>${formato(d.valor)}</strong></div>
      <div class="progreso"><span style="width:${(d.valor / max) * 100}%;background:#1f5fa8"></span></div></div>`
    )
    .join('');
}

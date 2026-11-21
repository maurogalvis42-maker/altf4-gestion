/**
 * Datos simulados de demostración (entorno relevante controlado).
 * Los nombres de clientes son ficticios. Las fechas se generan relativas al día
 * actual para que los indicadores del tablero siempre muestren información.
 */
import { hashPassword, hoyISO, calcularTotales, CHECKLIST_PREVENTIVO } from './logic.js';

export const CREDENCIALES_DEMO = [
  { email: 'admin@altf4.co', password: 'Altf4*2026', nombre: 'Andrés Galvis', rol: 'Administrador' },
  { email: 'tecnico@altf4.co', password: 'Tecnico*2026', nombre: 'Técnico de soporte', rol: 'Técnico' },
];

function dias(n, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return hoyISO(d);
}

function proximoHabil(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return hoyISO(d);
}

export async function generarDatosDemo() {
  const usuarios = [];
  for (const [i, u] of CREDENCIALES_DEMO.entries()) {
    usuarios.push({ id: `usr_${i + 1}`, email: u.email, nombre: u.nombre, rol: u.rol, hash: await hashPassword(u.password), activo: true });
  }

  const servicios = [
    { id: 'srv_1', nombre: 'Mantenimiento preventivo', tarifa: 90000, duracion: 120 },
    { id: 'srv_2', nombre: 'Mantenimiento correctivo', tarifa: 120000, duracion: 180 },
    { id: 'srv_3', nombre: 'Diagnóstico de hardware', tarifa: 40000, duracion: 60 },
    { id: 'srv_4', nombre: 'Optimización de sistema operativo', tarifa: 70000, duracion: 90 },
    { id: 'srv_5', nombre: 'Ensamble de equipo', tarifa: 150000, duracion: 240 },
    { id: 'srv_6', nombre: 'Eliminación de malware', tarifa: 80000, duracion: 90 },
  ];

  const clientes = [
    ['cli_1', 'Microempresa', 'Papelería y Variedades El Centro', '901234567-1', '3104567890', 'papeleriacentro@correo.co', 'Av. 5 # 10-21, Centro'],
    ['cli_2', 'Profesional independiente', 'Laura Méndez — Contadora', '1090456789', '3157894561', 'lmendez.contadora@correo.co', 'Calle 11 # 3-45, Quinta Oriental'],
    ['cli_3', 'Microempresa', 'Confecciones Norte S.A.S.', '900765432-4', '6075712345', 'admin@confeccionesnorte.co', 'Zona Industrial, Bodega 12'],
    ['cli_4', 'Residencial', 'Carlos Ramírez', '88234567', '3201239876', 'carlos.r@correo.co', 'Barrio La Riviera, Mz 4 Casa 8'],
    ['cli_5', 'Microempresa', 'Droguería Salud Total Los Patios', '901998877-2', '3176543210', 'drogueriasalud@correo.co', 'Av. 10 # 25-30, Los Patios'],
    ['cli_6', 'Profesional independiente', 'Estudio de Diseño Pixel', '1093765432', '3009876543', 'hola@estudiopixel.co', 'Calle 14 # 0-56, Caobos'],
    ['cli_7', 'Microempresa', 'Ferretería La Esperanza', '900112233-5', '3112223344', 'ferreesperanza@correo.co', 'Av. 7 # 2-15, Villa del Rosario'],
    ['cli_8', 'Residencial', 'Diana Contreras', '1092345678', '3045556677', 'diana.c@correo.co', 'Conjunto Prados del Este, Torre 3'],
  ].map(([id, tipo, nombre, documento, telefono, email, direccion], i) => ({
    id, tipo, nombre, documento, telefono, email, direccion,
    consentimiento: true, fechaConsentimiento: dias(-170 + i * 9), creado: dias(-170 + i * 9) + 'T10:00:00.000Z',
  }));

  const equipos = [
    ['eq_1', 'cli_1', 'Escritorio', 'Lenovo', 'ThinkCentre M70', 'LNV-8821A', 'Windows 10 Pro', '8 GB', 'HDD 1 TB'],
    ['eq_2', 'cli_1', 'Impresora', 'Epson', 'L3250', 'EPS-55120', '—', '—', '—'],
    ['eq_3', 'cli_2', 'Portátil', 'HP', 'ProBook 440 G8', 'HPB-44081', 'Windows 11 Pro', '16 GB', 'SSD 512 GB'],
    ['eq_4', 'cli_3', 'Escritorio', 'Dell', 'OptiPlex 3080', 'DLL-30801', 'Windows 10 Pro', '8 GB', 'HDD 500 GB'],
    ['eq_5', 'cli_3', 'Escritorio', 'Dell', 'OptiPlex 3080', 'DLL-30802', 'Windows 10 Pro', '8 GB', 'HDD 500 GB'],
    ['eq_6', 'cli_4', 'Portátil', 'Asus', 'VivoBook 15', 'ASU-15X09', 'Windows 11 Home', '8 GB', 'SSD 256 GB'],
    ['eq_7', 'cli_5', 'Todo en uno', 'HP', '22-dd0010la', 'HPA-22D10', 'Windows 10 Home', '4 GB', 'HDD 1 TB'],
    ['eq_8', 'cli_6', 'Escritorio', 'Ensamblado', 'Ryzen 7 / RTX 3060', 'ALT-ENS-001', 'Windows 11 Pro', '32 GB', 'NVMe 1 TB'],
    ['eq_9', 'cli_7', 'Escritorio', 'Compumax', 'Blackbox', 'CMX-77310', 'Windows 10 Pro', '4 GB', 'HDD 500 GB'],
    ['eq_10', 'cli_8', 'Portátil', 'Acer', 'Aspire 5', 'ACR-A5133', 'Windows 11 Home', '8 GB', 'SSD 512 GB'],
  ].map(([id, clienteId, tipo, marca, modelo, serial, so, ram, almacenamiento]) => ({ id, clienteId, tipo, marca, modelo, serial, so, ram, almacenamiento }));

  const repuestos = [
    ['rep_1', 'SSD-480', 'Unidad SSD SATA 480 GB', 'Almacenamiento', 6, 3, 105000, 160000, 'Distribuidora TecnoNorte'],
    ['rep_2', 'SSD-NV1T', 'Unidad SSD NVMe 1 TB', 'Almacenamiento', 2, 2, 210000, 290000, 'Distribuidora TecnoNorte'],
    ['rep_3', 'RAM-D4-8', 'Memoria RAM DDR4 8 GB 3200', 'Memoria', 8, 4, 85000, 130000, 'Importadora Digital'],
    ['rep_4', 'RAM-SO-8', 'Memoria SODIMM DDR4 8 GB', 'Memoria', 3, 4, 90000, 135000, 'Importadora Digital'],
    ['rep_5', 'PST-MX4', 'Pasta térmica Arctic MX-4 4 g', 'Consumibles', 14, 5, 22000, 35000, 'Electrónica Cúcuta'],
    ['rep_6', 'FAN-LAP', 'Ventilador / disipador de CPU (genérico)', 'Refrigeración', 4, 2, 35000, 60000, 'Electrónica Cúcuta'],
    ['rep_7', 'FTE-500', 'Fuente de poder 500 W 80+', 'Energía', 3, 2, 140000, 200000, 'Distribuidora TecnoNorte'],
    ['rep_8', 'BAT-HP-440', 'Batería HP ProBook 440', 'Energía', 1, 1, 160000, 230000, 'Importadora Digital'],
    ['rep_9', 'TEC-USB', 'Teclado USB en español', 'Periféricos', 10, 3, 25000, 40000, 'Electrónica Cúcuta'],
    ['rep_10', 'CBL-SATA', 'Cable SATA III', 'Cables', 20, 5, 4000, 8000, 'Electrónica Cúcuta'],
    ['rep_11', 'ALC-ISO', 'Alcohol isopropílico 500 ml', 'Consumibles', 2, 3, 18000, 26000, 'Electrónica Cúcuta'],
    ['rep_12', 'PIL-CR2032', 'Pila CMOS CR2032', 'Energía', 15, 5, 2500, 6000, 'Electrónica Cúcuta'],
  ].map(([id, codigo, nombre, categoria, stock, stockMinimo, costo, precioVenta, proveedor]) => ({ id, codigo, nombre, categoria, stock, stockMinimo, costo, precioVenta, proveedor }));

  const precio = (rid) => repuestos.find((r) => r.id === rid).precioVenta;
  const tarifa = (nombre) => servicios.find((s) => s.nombre === nombre).tarifa;
  const checklistCompleto = Object.fromEntries(CHECKLIST_PREVENTIVO.map((t) => [t, true]));

  const defs = [
    // [n, cliente, equipo, servicio, ingreso(días), entrega(días)|null, estado, repuestos, diagnostico]
    [1, 'cli_1', 'eq_1', 'Mantenimiento preventivo', -160, -158, 'Entregado', [['rep_5', 1]], 'Equipo con temperatura de CPU de 89 °C en carga y polvo acumulado.'],
    [2, 'cli_3', 'eq_4', 'Mantenimiento correctivo', -140, -136, 'Entregado', [['rep_1', 1], ['rep_10', 1]], 'Disco HDD con sectores reasignados (S.M.A.R.T. en estado de precaución). Se migra a SSD.'],
    [3, 'cli_3', 'eq_5', 'Mantenimiento preventivo', -139, -138, 'Entregado', [['rep_5', 1]], 'Mantenimiento programado. Sin fallas críticas.'],
    [4, 'cli_2', 'eq_3', 'Optimización de sistema operativo', -120, -119, 'Entregado', [], 'Arranque lento (2 min 40 s) por 23 programas de inicio.'],
    [5, 'cli_5', 'eq_7', 'Mantenimiento correctivo', -95, -90, 'Entregado', [['rep_3', 1], ['rep_1', 1]], 'Equipo con 4 GB de RAM insuficientes y disco mecánico lento.'],
    [6, 'cli_6', 'eq_8', 'Ensamble de equipo', -80, -77, 'Entregado', [['rep_2', 1], ['rep_7', 1]], 'Ensamble de estación de diseño gráfico según cotización aprobada.'],
    [7, 'cli_4', 'eq_6', 'Eliminación de malware', -60, -59, 'Entregado', [], 'Navegador con extensiones maliciosas y publicidad emergente.'],
    [8, 'cli_7', 'eq_9', 'Mantenimiento correctivo', -45, -41, 'Entregado', [['rep_3', 1], ['rep_12', 1]], 'Equipo no arranca: pila CMOS agotada y módulo de RAM defectuoso.'],
    [9, 'cli_8', 'eq_10', 'Mantenimiento preventivo', -30, -29, 'Entregado', [['rep_5', 1]], 'Mantenimiento preventivo semestral.'],
    [10, 'cli_1', 'eq_2', 'Diagnóstico de hardware', -20, -19, 'Entregado', [], 'Impresora con atasco recurrente; se limpia rodillo de arrastre.'],
    [11, 'cli_2', 'eq_3', 'Mantenimiento correctivo', -12, -8, 'Entregado', [['rep_8', 1]], 'Batería con 38 % de salud; se reemplaza.'],
    [12, 'cli_5', 'eq_7', 'Mantenimiento preventivo', -6, -5, 'Entregado', [['rep_5', 1]], 'Mantenimiento preventivo de seguimiento.'],
    [13, 'cli_3', 'eq_4', 'Diagnóstico de hardware', -3, null, 'En reparación', [['rep_6', 1]], 'Ruido anormal en ventilador del procesador.'],
    [14, 'cli_7', 'eq_9', 'Optimización de sistema operativo', -2, null, 'En diagnóstico', [], 'Cliente reporta lentitud general y bloqueos.'],
    [15, 'cli_6', 'eq_8', 'Mantenimiento preventivo', -1, null, 'Recibido', [], 'Ingreso para mantenimiento preventivo programado.'],
    [16, 'cli_4', 'eq_6', 'Mantenimiento correctivo', -4, null, 'Listo para entrega', [['rep_4', 1]], 'Ampliación de memoria a 16 GB solicitada por el cliente.'],
  ];

  const anio = new Date().getFullYear();
  const ordenes = defs.map(([n, clienteId, equipoId, tipoServicio, ing, ent, estado, reps, diagnostico]) => {
    const orden = {
      id: `ord_${n}`,
      consecutivo: `OS-${anio}-${String(n).padStart(4, '0')}`,
      clienteId, equipoId, tipoServicio, estado, diagnostico,
      fechaIngreso: dias(ing),
      fechaEntrega: ent === null ? null : dias(ent),
      tecnico: n % 3 === 0 ? 'Técnico de soporte' : 'Andrés Galvis',
      repuestos: reps.map(([repuestoId, cantidad]) => ({ repuestoId, cantidad, precioUnit: precio(repuestoId) })),
      manoObra: tarifa(tipoServicio),
      descuento: 0,
      checklist: tipoServicio === 'Mantenimiento preventivo' && estado === 'Entregado' ? checklistCompleto : {},
      garantiaDias: 30,
      observaciones: estado === 'Entregado' ? 'Equipo entregado funcionando. Se recomienda mantenimiento preventivo cada 6 meses.' : '',
      creado: dias(ing) + 'T09:00:00.000Z',
    };
    orden.totales = calcularTotales(orden);
    return orden;
  });

  const citas = [
    ['cit_1', 'cli_2', 'eq_3', proximoHabil(0), '09:00', 60, 'Diagnóstico de hardware', 'Confirmada'],
    ['cit_2', 'cli_5', 'eq_7', proximoHabil(0), '14:00', 120, 'Mantenimiento preventivo', 'Programada'],
    ['cit_3', 'cli_1', 'eq_1', proximoHabil(1), '10:00', 120, 'Mantenimiento preventivo', 'Programada'],
    ['cit_4', 'cli_8', 'eq_10', proximoHabil(2), '08:30', 90, 'Optimización de sistema operativo', 'Programada'],
    ['cit_5', 'cli_3', 'eq_5', proximoHabil(3), '15:00', 120, 'Mantenimiento preventivo', 'Confirmada'],
    ['cit_6', 'cli_6', 'eq_8', dias(-1), '11:00', 60, 'Mantenimiento preventivo', 'Atendida'],
    ['cit_7', 'cli_4', 'eq_6', dias(-4), '16:00', 60, 'Mantenimiento correctivo', 'Atendida'],
  ].map(([id, clienteId, equipoId, fecha, hora, duracion, tipoServicio, estado]) => ({
    id, clienteId, equipoId, fecha, hora, duracion, tipoServicio, estado, tecnico: 'Andrés Galvis', notas: '',
  }));

  const config = {
    empresa: 'ALT+F4 Mantenimiento y Soporte Técnico Informático',
    nit: '1.090.000.000-0 (simulado)',
    telefono: '310 000 0000',
    direccion: 'Cúcuta, Norte de Santander',
    email: 'contacto@altf4.co',
    periodoPreventivoMeses: 6,
    garantiaDias: 30,
  };

  return { usuarios, servicios, clientes, equipos, repuestos, ordenes, citas, bitacora: [], config };
}

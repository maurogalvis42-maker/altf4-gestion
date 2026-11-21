# Product Backlog — ALT+F4 Gestión

Priorización MoSCoW y estimación en puntos de historia (Fibonacci). Total: 71 puntos; 63 comprometidos en esta versión.

## Requerimientos funcionales

| Código | Requerimiento | Descripción | Prioridad |
|---|---|---|---|
| RF-01 | Autenticación de usuarios | El sistema debe permitir el ingreso con correo y contraseña, almacenando la contraseña como hash SHA-256 y controlando el acceso por rol (Administrador, Técnico). | Alta |
| RF-02 | Gestión de clientes | Registrar, consultar, buscar, editar, exportar y eliminar clientes (microempresa, profesional independiente o residencial), exigiendo la autorización de tratamiento de datos personales. | Alta |
| RF-03 | Gestión de equipos | Registrar la hoja de vida de cada equipo del cliente: tipo, marca, modelo, serial único, sistema operativo, RAM y almacenamiento. | Alta |
| RF-04 | Agenda de citas | Programar, confirmar, atender, editar y cancelar citas, validando horario de atención (lunes a sábado, 08:00–18:00) y cruces de horario por técnico. | Alta |
| RF-05 | Órdenes de servicio | Crear órdenes con consecutivo automático, gestionar el flujo de estados (Recibido → En diagnóstico → En reparación → Listo para entrega → Entregado) y registrar diagnóstico y observaciones. | Alta |
| RF-06 | Checklist de mantenimiento preventivo | Registrar las 10 actividades estandarizadas del mantenimiento preventivo e impedir la entrega de un preventivo con el checklist incompleto. | Alta |
| RF-07 | Repuestos y costos de la orden | Agregar repuestos del inventario a la orden descontando existencias, calcular mano de obra, descuento, IVA (19 %) y total. | Alta |
| RF-08 | Inventario de repuestos | Administrar repuestos (código, categoría, stock, stock mínimo, costo, precio, proveedor), registrar entradas y alertar el stock bajo. | Media |
| RF-09 | Documentos del servicio | Generar el informe técnico y la cotización de cada orden en formato imprimible / PDF. | Media |
| RF-10 | Reportes e indicadores | Mostrar indicadores de gestión (ingresos, ticket promedio, tiempo de entrega, servicios por tipo, segmentos y clientes principales) y exportarlos a CSV. | Media |
| RF-11 | Recordatorio de mantenimiento preventivo | Alertar los equipos cuyo último mantenimiento preventivo supera el periodo configurado (6 meses por defecto). | Baja |
| RF-12 | Configuración y respaldo | Configurar datos de la empresa y tarifas, descargar y restaurar respaldos en JSON y consultar la bitácora de auditoría. | Baja |

## Requerimientos no funcionales

| Código | Atributo | Descripción |
|---|---|---|
| RNF-01 | Usabilidad | Interfaz en español, navegación con máximo 2 clics a cualquier módulo, mensajes de validación junto al campo y notificaciones de confirmación. |
| RNF-02 | Diseño responsivo | La interfaz debe adaptarse a celular (≥ 360 px), tablet y escritorio sin desplazamiento horizontal de la página. |
| RNF-03 | Seguridad | Contraseñas almacenadas como hash, control de acceso por rol, escape de HTML para prevenir inyección de código (XSS) y bitácora de auditoría de las operaciones. |
| RNF-04 | Protección de datos | Cumplimiento de la Ley 1581 de 2012: autorización explícita del titular, finalidad declarada y derecho de supresión. |
| RNF-05 | Rendimiento | Carga inicial inferior a 2 segundos en una conexión de 10 Mbps y respuesta de las operaciones inferior a 300 ms con el volumen de datos esperado. |
| RNF-06 | Mantenibilidad | Arquitectura por capas (presentación, lógica y datos), código modular documentado y reglas de negocio cubiertas por pruebas automatizadas. |
| RNF-07 | Portabilidad | Funcionamiento en navegadores modernos (Chrome, Edge, Firefox) sin instalación; despliegue en un hosting estático gratuito. |
| RNF-08 | Disponibilidad y respaldo | Posibilidad de exportar y restaurar toda la información en un archivo JSON. |

## Reglas de negocio

- **RN-01**: No se registra un cliente sin autorización de tratamiento de datos (Ley 1581 de 2012).
- **RN-02**: El documento (CC/NIT) del cliente y el serial del equipo son únicos.
- **RN-03**: No se agendan citas los domingos ni fuera de 08:00–18:00; un técnico no puede tener dos citas que se crucen.
- **RN-04**: La orden solo avanza al estado inmediatamente siguiente; una orden entregada queda en modo de solo lectura.
- **RN-05**: Una orden de mantenimiento preventivo solo se entrega con el checklist al 100 %.
- **RN-06**: No se puede consumir un repuesto sin existencias suficientes; al retirarlo de la orden se reintegra al inventario.
- **RN-07**: Total = (repuestos + mano de obra − descuento) + IVA 19 %; el descuento no puede superar el subtotal.
- **RN-08**: No se eliminan clientes, equipos o repuestos con órdenes asociadas (trazabilidad).

## Historias de usuario

| ID | Historia | Prioridad | Pts. | Sprint | Criterios de aceptación |
|---|---|---|---|---|---|
| HU-01 | Como técnico quiero iniciar sesión con mi correo y contraseña para acceder de forma segura al sistema. | Must | 3 | S1 | Con credenciales válidas ingresa al tablero; con credenciales inválidas muestra un mensaje y limpia la contraseña; la contraseña nunca se guarda en texto plano. |
| HU-02 | Como administrador quiero que el menú se adapte al celular para usar el sistema en visitas a domicilio. | Must | 3 | S1 | En pantallas menores a 760 px el menú lateral se convierte en menú desplegable y no hay desplazamiento horizontal. |
| HU-03 | Como técnico quiero registrar clientes con su autorización de datos para cumplir la Ley 1581 y tener su información de contacto. | Must | 5 | S1 | No permite guardar sin autorización, con teléfono/correo inválido o con documento duplicado; muestra el error junto al campo. |
| HU-04 | Como técnico quiero buscar clientes y ver su historial para conocer los equipos y servicios previos. | Should | 3 | S1 | La búsqueda filtra por nombre, documento, teléfono o correo; el historial lista equipos y órdenes del cliente. |
| HU-05 | Como técnico quiero registrar los equipos de cada cliente para llevar su hoja de vida. | Must | 3 | S1 | El serial es obligatorio y único; el equipo queda asociado al cliente. |
| HU-06 | Como técnico quiero agendar citas sin cruces de horario para organizar mi jornada. | Must | 5 | S2 | Rechaza domingos, horas fuera de 08:00–18:00 y cruces con otra cita del mismo técnico; las citas se agrupan por día. |
| HU-07 | Como técnico quiero atender una cita y convertirla en orden para no digitar dos veces la información. | Should | 2 | S2 | Al pulsar «Atender», la cita queda atendida y se abre una orden prellenada con cliente, equipo y servicio. |
| HU-08 | Como técnico quiero crear una orden de servicio con consecutivo para dar trazabilidad al equipo recibido. | Must | 5 | S2 | Genera el consecutivo OS-AAAA-0000, exige cliente, equipo y falla reportada (≥ 10 caracteres) y queda en estado «Recibido». |
| HU-09 | Como técnico quiero avanzar los estados de la orden para saber en qué etapa está cada equipo. | Must | 3 | S2 | Solo permite pasar al estado siguiente; al entregar pide confirmación, registra la fecha y bloquea la edición. |
| HU-10 | Como técnico quiero diligenciar el checklist de mantenimiento preventivo para estandarizar la calidad del servicio. | Must | 3 | S2 | Muestra el avance en porcentaje y no permite entregar un preventivo con el checklist incompleto. |
| HU-11 | Como técnico quiero agregar repuestos a la orden y ver el total con IVA para cobrar correctamente. | Must | 5 | S3 | Descuenta el stock, rechaza cantidades mayores a las existencias y recalcula subtotal, descuento, IVA 19 % y total. |
| HU-12 | Como administrador quiero administrar el inventario con alertas de stock mínimo para no quedarme sin repuestos. | Should | 5 | S3 | Permite crear, editar, registrar entradas y filtrar por stock bajo; resalta en rojo los repuestos en o bajo el mínimo. |
| HU-13 | Como técnico quiero generar el informe técnico y la cotización en PDF para entregar soporte formal al cliente. | Should | 3 | S3 | El documento incluye datos de la empresa, cliente, equipo, diagnóstico, checklist, costos, garantía y firmas, y se puede imprimir. |
| HU-14 | Como administrador quiero ver un tablero con indicadores para tomar decisiones del negocio. | Should | 5 | S4 | Muestra citas del día, órdenes abiertas, ingresos del mes, stock bajo, tiempo promedio de entrega y gráfico de ingresos. |
| HU-15 | Como administrador quiero consultar reportes y exportarlos a CSV para analizar la operación por periodos. | Could | 5 | S4 | Filtra por rango de fechas y muestra ingresos por mes, servicios por tipo, segmentos y clientes principales. |
| HU-16 | Como administrador quiero configurar tarifas, respaldar datos y ver la bitácora para mantener el sistema actualizado y seguro. | Could | 3 | S4 | Las tarifas se reflejan en las nuevas órdenes; el respaldo JSON se descarga y restaura; la bitácora lista las últimas operaciones. |
| HU-17 | Como administrador quiero recibir alertas de equipos sin mantenimiento preventivo reciente para ofrecer el servicio de forma proactiva. | Could | 2 | S4 | El tablero lista los equipos cuyo último preventivo supera el periodo configurado. |
| HU-18 | Como cliente quiero recibir una notificación por WhatsApp cuando mi equipo esté listo para recogerlo a tiempo. | Won't (esta versión) | 8 | — | Se prioriza para una versión posterior con backend e integración de mensajería. |

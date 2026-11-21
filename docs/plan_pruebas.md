# Plan y resultados de pruebas

## Pruebas automatizadas (`npm test`)

Resultado de la ejecución final: **38/38 aprobadas**, 11 grupos, 0 fallas.

| Código | Grupo | Tipo | Casos | Resultado |
|---|---|---|---|---|
| CP-01 | Validación de clientes (RF-02, Ley 1581) | Unitaria | 5 | Aprobado |
| CP-02 | Validación de equipos y repuestos (RF-03, RF-08) | Unitaria | 4 | Aprobado |
| CP-03 | Agenda: cruces, domingos y horario (RF-04) | Unitaria | 5 | Aprobado |
| CP-04 | Totales con descuento e IVA 19 % (RF-07) | Unitaria | 2 | Aprobado |
| CP-05 | Inventario: descuento, reintegro y stock bajo (RF-07, RF-08) | Unitaria | 5 | Aprobado |
| CP-06 | Flujo de estados, consecutivo y checklist (RF-05, RF-06) | Unitaria | 3 | Aprobado |
| CP-07 | Indicadores, reportes y recordatorios (RF-10, RF-11) | Unitaria | 4 | Aprobado |
| CP-08 | Formato de moneda, CSV y hash de contraseñas (RNF-03) | Unitaria | 3 | Aprobado |
| CI-01 | Repositorio de datos: CRUD, bitácora y respaldo (RF-12) | Integración | 3 | Aprobado |
| CI-02 | Consistencia de los datos de demostración y credenciales | Integración | 3 | Aprobado |
| CI-03 | Flujo extremo a extremo: recepción → repuesto → entrega | Integración | 1 | Aprobado |

## Pruebas funcionales en el navegador

| Código | Caso | Resultado esperado / obtenido | Estado |
|---|---|---|---|
| PF-01 | Ingreso con credenciales válidas de administrador | Ingresa al tablero y muestra «Bienvenido(a)» | Aprobada |
| PF-02 | Ingreso con contraseña incorrecta | Mensaje «Credenciales incorrectas» y limpia la contraseña | Aprobada |
| PF-03 | Guardar cliente con nombre corto, teléfono inválido y sin autorización | Cuatro mensajes de error junto a los campos; no guarda | Aprobada |
| PF-04 | Agregar 5 unidades de un repuesto con 2 en stock | Mensaje «Stock insuficiente…»; la orden no cambia | Aprobada |
| PF-05 | Agregar 1 pasta térmica a una orden (mano de obra $40.000 + repuestos $95.000) | Stock baja de 14 a 13; total $160.650 (IVA incluido) | Aprobada |
| PF-06 | Ruta de Configuración con rol Técnico | El menú no muestra el módulo y la ruta redirige al tablero | Aprobada |
| PF-07 | Entregar un preventivo con checklist incompleto | Mensaje que exige completar el checklist | Aprobada |
| PF-08 | Generar informe técnico de una orden entregada | Documento con checklist, costos, garantía y firmas; botón Imprimir/PDF | Aprobada |
| PF-09 | Visualización en celular (375 × 812 px) | Menú desplegable, indicadores en 2 columnas y sin desplazamiento horizontal | Aprobada (tras corregir desborde de la rejilla) |
| PF-10 | Restablecer datos de demostración | Recarga los datos iniciales y mantiene la sesión | Aprobada |

## Protocolo de validación con usuarios (usabilidad)

Mínimo 5 participantes del público objetivo, con consentimiento informado. Tareas:

- T1. Iniciar sesión con el usuario Técnico.
- T2. Registrar un cliente nuevo con su equipo.
- T3. Agendar una cita para mañana a las 10:00.
- T4. Atender la cita y crear la orden de servicio.
- T5. Agregar un repuesto y avanzar la orden hasta «Listo para entrega».
- T6. Generar la cotización en PDF.
- T7. Consultar cuántos repuestos están bajo el stock mínimo.

Cuestionario SUS (1 = totalmente en desacuerdo, 5 = totalmente de acuerdo):

1. Creo que me gustaría usar este sistema con frecuencia.
2. Encontré el sistema innecesariamente complejo.
3. Pensé que el sistema era fácil de usar.
4. Creo que necesitaría ayuda de una persona técnica para poder usar este sistema.
5. Encontré que las funciones del sistema estaban bien integradas.
6. Pensé que había demasiada inconsistencia en el sistema.
7. Imagino que la mayoría de las personas aprendería a usar este sistema muy rápido.
8. Encontré el sistema muy difícil de usar.
9. Me sentí muy seguro(a) usando el sistema.
10. Necesité aprender muchas cosas antes de poder usar el sistema.

Cálculo SUS: ítems impares (valor − 1), ítems pares (5 − valor); sumar y multiplicar por 2,5. Aceptable > 68.


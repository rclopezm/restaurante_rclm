// ============================================================
// RUTAS: Reservaciones — /api/reservaciones
// ============================================================
// IMPORTANTE: El orden de los routes importa en Express.
//   /mis   DEBE registrarse ANTES de /:id
//   porque Express leería "mis" como un parámetro :id
// ============================================================

const express    = require('express')
const router     = express.Router()
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware')
const {
    crearReservacion,
    misReservaciones,
    listarReservaciones,
    cambiarEstado,
    cancelarReservacion
} = require('../controllers/reservaciones.controller')

// ============================================================
// SWAGGER SCHEMAS — Reservacion
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     ReservacionInput:
 *       type: object
 *       required: [mesa_id, fecha, hora_inicio, hora_fin, num_personas]
 *       properties:
 *         mesa_id:
 *           type: integer
 *           example: 3
 *         fecha:
 *           type: string
 *           format: date
 *           example: "2026-08-15"
 *         hora_inicio:
 *           type: string
 *           example: "19:00"
 *         hora_fin:
 *           type: string
 *           example: "21:00"
 *         num_personas:
 *           type: integer
 *           example: 3
 *         notas:
 *           type: string
 *           example: "Mesa cerca de la ventana, es aniversario"
 *
 *     Reservacion:
 *       type: object
 *       properties:
 *         id:           { type: integer, example: 1 }
 *         usuario_id:   { type: integer, example: 5 }
 *         mesa_id:      { type: integer, example: 3 }
 *         fecha:        { type: string, format: date, example: "2026-08-15" }
 *         hora_inicio:  { type: string, example: "19:00:00" }
 *         hora_fin:     { type: string, example: "21:00:00" }
 *         num_personas: { type: integer, example: 3 }
 *         estado:
 *           type: string
 *           enum: [pendiente, confirmada, cancelada, completada]
 *           example: "pendiente"
 *         notas:        { type: string, example: "Aniversario" }
 *         nombre_usuario: { type: string, example: "Juan Pérez" }
 *         numero_mesa:  { type: integer, example: 5 }
 *         ubicacion:    { type: string, example: "Terraza" }
 *         created_at:   { type: string, format: date-time }
 *
 *     CambiarEstadoInput:
 *       type: object
 *       required: [estado]
 *       properties:
 *         estado:
 *           type: string
 *           enum: [pendiente, confirmada, cancelada, completada]
 *           example: "confirmada"
 */

// ============================================================
// POST /api/reservaciones — crear (cliente autenticado)
// ============================================================

/**
 * @swagger
 * /api/reservaciones:
 *   post:
 *     summary: Crear una reservación
 *     description: |
 *       Crea una reservación para el usuario autenticado.
 *       Incluye **9 validaciones** antes de guardar:
 *       campos obligatorios, formato de fecha/hora, fecha futura,
 *       existencia de mesa, capacidad, y **conflicto de horario**.
 *     tags: [Reservaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservacionInput'
 *     responses:
 *       201:
 *         description: Reservación creada exitosamente
 *       400:
 *         description: Datos inválidos (formato, fecha pasada, hora incorrecta)
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Mesa no encontrada
 *       409:
 *         description: Conflicto — mesa ocupada, fuera de servicio, o capacidad excedida
 */
router.post('/', verifyToken, crearReservacion)

// ============================================================
// GET /api/reservaciones/mis — cliente (solo las suyas)
// DEBE ir ANTES de /:id para que Express no lo confunda
// ============================================================

/**
 * @swagger
 * /api/reservaciones/mis:
 *   get:
 *     summary: Mis reservaciones
 *     description: Devuelve únicamente las reservaciones del usuario autenticado.
 *     tags: [Reservaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reservaciones del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 reservaciones:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservacion'
 *       401:
 *         description: No autenticado
 */
router.get('/mis', verifyToken, misReservaciones)

// ============================================================
// GET /api/reservaciones — admin (todas con filtros)
// ============================================================

/**
 * @swagger
 * /api/reservaciones:
 *   get:
 *     summary: Listar todas las reservaciones (admin)
 *     description: |
 *       Devuelve todas las reservaciones del sistema.
 *       Soporta filtros opcionales por fecha, estado y mesa.
 *       **Solo administradores.**
 *     tags: [Reservaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         example: "2026-08-15"
 *         description: Filtrar por fecha (YYYY-MM-DD)
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, confirmada, cancelada, completada]
 *         description: Filtrar por estado
 *       - in: query
 *         name: mesa_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de mesa
 *     responses:
 *       200:
 *         description: Lista de reservaciones
 *       400:
 *         description: Estado de filtro inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de admin
 */
router.get('/', verifyToken, requireAdmin, listarReservaciones)

// ============================================================
// PUT /api/reservaciones/:id/estado — admin cambia estado
// ============================================================

/**
 * @swagger
 * /api/reservaciones/{id}/estado:
 *   put:
 *     summary: Cambiar estado de una reservación (admin)
 *     description: |
 *       Permite al admin cambiar el estado de una reservación.
 *       Reglas de transición:
 *       - Una reservación **cancelada** o **completada** no puede reabrirse.
 *       - Estados posibles: `pendiente` → `confirmada` → `completada`
 *       - Cualquier estado puede ir a `cancelada`.
 *     tags: [Reservaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CambiarEstadoInput'
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Estado inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de admin
 *       404:
 *         description: Reservación no encontrada
 *       409:
 *         description: Transición de estado no permitida
 */
router.put('/:id/estado', verifyToken, requireAdmin, cambiarEstado)

// ============================================================
// DELETE /api/reservaciones/:id — cliente cancela la suya
// ============================================================

/**
 * @swagger
 * /api/reservaciones/{id}:
 *   delete:
 *     summary: Cancelar una reservación
 *     description: |
 *       El cliente cancela **su propia** reservación.
 *       El admin puede cancelar cualquiera.
 *       No elimina el registro — cambia el estado a `cancelada`.
 *     tags: [Reservaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reservación cancelada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No puedes cancelar una reservación que no te pertenece
 *       404:
 *         description: Reservación no encontrada
 *       409:
 *         description: Ya estaba cancelada o completada
 */
router.delete('/:id', verifyToken, cancelarReservacion)

module.exports = router

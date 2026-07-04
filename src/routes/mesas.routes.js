// ============================================================
// RUTAS: Mesas — /api/mesas
// ============================================================
// Tabla de permisos:
//   GET  /api/mesas        → Público
//   GET  /api/mesas/:id    → Público
//   POST /api/mesas        → Admin
//   PUT  /api/mesas/:id    → Admin
//   DELETE /api/mesas/:id  → Admin (soft delete)
// ============================================================

const express    = require('express')
const router     = express.Router()
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware')
const {
    listarMesas,
    obtenerMesa,
    crearMesa,
    actualizarMesa,
    eliminarMesa
} = require('../controllers/mesas.controller')

// ============================================================
// SWAGGER SCHEMAS — Mesa
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Mesa:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 3
 *         numero:
 *           type: integer
 *           description: Número visible de la mesa en el restaurante
 *           example: 5
 *         capacidad:
 *           type: integer
 *           description: Número máximo de personas
 *           example: 4
 *         ubicacion:
 *           type: string
 *           example: "Terraza"
 *         activa:
 *           type: boolean
 *           description: false = mesa fuera de servicio (soft delete)
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     MesaInput:
 *       type: object
 *       required: [numero, capacidad]
 *       properties:
 *         numero:
 *           type: integer
 *           example: 11
 *         capacidad:
 *           type: integer
 *           example: 4
 *         ubicacion:
 *           type: string
 *           example: "Jardín"
 *
 *     MesaUpdateInput:
 *       type: object
 *       required: [numero, capacidad]
 *       properties:
 *         numero:
 *           type: integer
 *           example: 11
 *         capacidad:
 *           type: integer
 *           example: 6
 *         ubicacion:
 *           type: string
 *           example: "VIP"
 *         activa:
 *           type: boolean
 *           description: Permite reactivar una mesa desactivada
 *           example: true
 */

// ============================================================
// GET /api/mesas
// ============================================================

/**
 * @swagger
 * /api/mesas:
 *   get:
 *     summary: Listar todas las mesas
 *     description: |
 *       Devuelve la lista de mesas del restaurante.
 *       Usa el query param `soloActivas=true` para filtrar
 *       solo las mesas disponibles (no desactivadas).
 *     tags: [Mesas]
 *     parameters:
 *       - in: query
 *         name: soloActivas
 *         schema:
 *           type: boolean
 *         description: Si es true, devuelve solo mesas activas
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de mesas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 10
 *                 soloActivas:
 *                   type: boolean
 *                   example: false
 *                 mesas:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Mesa'
 */
router.get('/', listarMesas)

// ============================================================
// GET /api/mesas/:id
// ============================================================

/**
 * @swagger
 * /api/mesas/{id}:
 *   get:
 *     summary: Obtener una mesa por ID
 *     tags: [Mesas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la mesa
 *     responses:
 *       200:
 *         description: Datos de la mesa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mesa:
 *                   $ref: '#/components/schemas/Mesa'
 *       404:
 *         description: Mesa no encontrada
 */
router.get('/:id', obtenerMesa)

// ============================================================
// POST /api/mesas  (admin)
// ============================================================

/**
 * @swagger
 * /api/mesas:
 *   post:
 *     summary: Crear una nueva mesa
 *     description: Solo accesible por administradores.
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MesaInput'
 *     responses:
 *       201:
 *         description: Mesa creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de admin
 *       409:
 *         description: El número de mesa ya existe
 */
router.post('/', verifyToken, requireAdmin, crearMesa)

// ============================================================
// PUT /api/mesas/:id  (admin)
// ============================================================

/**
 * @swagger
 * /api/mesas/{id}:
 *   put:
 *     summary: Actualizar una mesa
 *     description: |
 *       Actualiza los datos de una mesa existente.
 *       También permite reactivar una mesa desactivada
 *       enviando `"activa": true`.
 *       Solo accesible por administradores.
 *     tags: [Mesas]
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
 *             $ref: '#/components/schemas/MesaUpdateInput'
 *     responses:
 *       200:
 *         description: Mesa actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de admin
 *       404:
 *         description: Mesa no encontrada
 *       409:
 *         description: El número de mesa ya existe en otra mesa
 */
router.put('/:id', verifyToken, requireAdmin, actualizarMesa)

// ============================================================
// DELETE /api/mesas/:id  (admin — soft delete)
// ============================================================

/**
 * @swagger
 * /api/mesas/{id}:
 *   delete:
 *     summary: Desactivar una mesa (soft delete)
 *     description: |
 *       **No elimina el registro de la base de datos.**
 *       Marca la mesa como inactiva (`activa = false`).
 *       El historial de reservaciones se conserva intacto.
 *       Para reactivarla, usa PUT con `"activa": true`.
 *       Solo accesible por administradores.
 *     tags: [Mesas]
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
 *         description: Mesa desactivada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de admin
 *       404:
 *         description: Mesa no encontrada
 *       409:
 *         description: La mesa ya estaba desactivada
 */
router.delete('/:id', verifyToken, requireAdmin, eliminarMesa)

module.exports = router

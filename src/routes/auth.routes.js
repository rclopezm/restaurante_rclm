// ============================================================
// RUTAS: Autenticación — /api/auth
// ============================================================
// Aquí conectamos las URLs con sus controladores.
// Los comentarios de Swagger generan la documentación
// automática que aparece en /api-docs
// ============================================================

const express    = require('express')
const router     = express.Router()
const { register, login, perfil } = require('../controllers/auth.controller')
const { verifyToken }             = require('../middlewares/auth.middleware')

// ============================================================
// SWAGGER SCHEMAS — definiciones reutilizables
// ============================================================

/**
 * @swagger 
 * components:
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required: [nombre, correo, password]
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Juan Pérez"
 *         correo:
 *           type: string
 *           format: email
 *           example: "juan@email.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "MiClave123"
 *
 *     LoginInput:
 *       type: object
 *       required: [correo, password]
 *       properties:
 *         correo:
 *           type: string
 *           format: email
 *           example: "juan@email.com"
 *         password:
 *           type: string
 *           example: "MiClave123"
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Bienvenido, Juan Pérez!"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         usuario:
 *           type: object
 *           properties:
 *             id:     { type: integer, example: 1 }
 *             nombre: { type: string,  example: "Juan Pérez" }
 *             correo: { type: string,  example: "juan@email.com" }
 *             rol:    { type: string,  example: "cliente" }
 *
 *     UsuarioPerfil:
 *       type: object
 *       properties:
 *         id:         { type: integer, example: 1 }
 *         nombre:     { type: string,  example: "Juan Pérez" }
 *         correo:     { type: string,  example: "juan@email.com" }
 *         rol:        { type: string,  example: "cliente" }
 *         created_at: { type: string,  format: date-time }
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Descripción del error"
 */

// ============================================================
// POST /api/auth/register
// ============================================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo cliente
 *     description: Crea una cuenta de usuario con rol 'cliente'. La contraseña se almacena cifrada con bcrypt.
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente
 *       400:
 *         description: Datos inválidos o campos faltantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: El correo ya está registrado
 */
router.post('/register', register)

// ============================================================
// POST /api/auth/login
// ============================================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión y obtener token JWT
 *     description: |
 *       Verifica las credenciales del usuario. Si son correctas, devuelve
 *       un **JWT** que debe incluirse en peticiones protegidas como:
 *       `Authorization: Bearer <token>`
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login exitoso — incluye el token JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Campos obligatorios faltantes
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', login)

// ============================================================
// GET /api/auth/perfil  (ruta protegida — requiere JWT)
// ============================================================

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     description: |
 *       Devuelve los datos del usuario dueño del token JWT.
 *       **Requiere autenticación** — incluye el token en el header:
 *       `Authorization: Bearer <token>`
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/UsuarioPerfil'
 *       401:
 *         description: Token no proporcionado o inválido
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/perfil', verifyToken, perfil)

module.exports = router

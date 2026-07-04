// ============================================================
// MIDDLEWARE: Autenticación y Autorización por Roles
// ============================================================
//
// Este archivo exporta TRES middlewares encadenables:
//
//   1. verifyToken    → ¿Quién eres? (Autenticación)
//                       Lee el JWT y pone el usuario en req.user
//
//   2. requireAdmin   → ¿Eres admin?  (Autorización — caso específico)
//                       Atajo para rutas exclusivas de administradores
//
//   3. requireRole()  → ¿Tienes alguno de estos roles? (Autorización — flexible)
//                       Fábrica de middlewares: recibe los roles permitidos
//                       y devuelve un middleware personalizado
//
// DIFERENCIA IMPORTANTE:
//   Autenticación = verificar IDENTIDAD  ("¿eres tú?")
//   Autorización  = verificar PERMISO    ("¿puedes hacer esto?")
//
// ORDEN OBLIGATORIO en las rutas:
//   router.metodo('/ruta', verifyToken, requireAdmin, controlador)
//   verifyToken SIEMPRE debe ir ANTES que requireAdmin o requireRole
// ============================================================

const jwt = require('jsonwebtoken')

// ============================================================
// 1. verifyToken — Autenticación
// ============================================================

/**
 * Verifica que la petición traiga un JWT válido en el header.
 *
 * Header esperado:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * Si el token es válido → adjunta el payload en req.user y llama next()
 * Si no               → responde 401 Unauthorized (sin llegar al controlador)
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization']

    // Verificar presencia y formato "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Acceso denegado. No se proporcionó un token de autenticación.',
            hint:  'Incluye el header: Authorization: Bearer <tu_token>'
        })
    }

    // Extraer el token después de "Bearer "
    const token = authHeader.split(' ')[1]

    // El token tiene 3 partes separadas por puntos:
    //   HEADER.PAYLOAD.FIRMA
    // jwt.verify decodifica el payload Y valida que la firma
    // fue creada con nuestro JWT_SECRET → imposible de falsificar
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // req.user estará disponible en TODOS los middlewares y
        // controladores que se ejecuten después de este
        req.user = decoded

        next() // ✅ Token válido → continúa la cadena
    } catch (error) {
        // jwt lanza errores específicos que podemos distinguir
        const mensaje = error.name === 'TokenExpiredError'
            ? 'Tu sesión ha expirado. Inicia sesión nuevamente.'
            : 'Token inválido. Inicia sesión nuevamente.'

        return res.status(401).json({ error: mensaje })
    }
}

// ============================================================
// 2. requireAdmin — Autorización (atajo para rol 'admin')
// ============================================================

/**
 * Verifica que el usuario autenticado tenga rol 'admin'.
 *
 * REQUIERE que verifyToken haya corrido antes (para tener req.user).
 *
 * Si es admin  → llama next()
 * Si no lo es  → responde 403 Forbidden
 *
 * Diferencia entre 401 y 403:
 *   401 = No sé quién eres (no autenticado)
 *   403 = Sé quién eres, pero NO tienes permiso (no autorizado)
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        // Protección defensiva: si alguien pone requireAdmin sin verifyToken antes
        return res.status(401).json({
            error: 'No autenticado. Usa verifyToken antes de requireAdmin.'
        })
    }

    if (req.user.rol !== 'admin') {
        return res.status(403).json({
            error: `Acceso denegado. Se requiere rol 'admin'. Tu rol actual es '${req.user.rol}'.`
        })
    }

    next() // ✅ Es admin → continúa
}

// ============================================================
// 3. requireRole() — Autorización flexible (fábrica de middlewares)
// ============================================================

/**
 * Genera un middleware que acepta UNO O VARIOS roles permitidos.
 *
 * Uso en rutas:
 *   router.get('/ruta', verifyToken, requireRole('admin'), handler)
 *   router.get('/ruta', verifyToken, requireRole('admin', 'cliente'), handler)
 *
 * ¿Por qué una función que devuelve una función?
 *   Porque los middlewares de Express deben ser funciones (req, res, next).
 *   requireRole('admin') DEVUELVE esa función ya configurada con los roles
 *   que debe aceptar. Es el patrón "middleware factory" (fábrica de middlewares).
 *
 * @param {...string} roles - Roles permitidos (ej: 'admin', 'cliente')
 */
function requireRole(...roles) {
    // Esta es la función que Express ejecuta como middleware
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                error: 'No autenticado. Usa verifyToken antes de requireRole.'
            })
        }

        // ¿El rol del usuario está entre los roles permitidos?
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                error: `Acceso denegado. Roles permitidos: [${roles.join(', ')}]. Tu rol: '${req.user.rol}'.`
            })
        }

        next() // ✅ Rol autorizado → continúa
    }
}

// ============================================================
// RESUMEN DE USO
// ============================================================
//
//  Solo autenticado (cualquier rol):
//    router.get('/perfil', verifyToken, controlador)
//
//  Solo admin:
//    router.delete('/mesas/:id', verifyToken, requireAdmin, controlador)
//    router.delete('/mesas/:id', verifyToken, requireRole('admin'), controlador)
//
//  Admin o cliente (ambos):
//    router.get('/mesas', verifyToken, requireRole('admin', 'cliente'), controlador)
//
// ============================================================

module.exports = { verifyToken, requireAdmin, requireRole }

// ============================================================
// DEMO: Cómo proteger rutas con roles — referencia visual
// ============================================================
// Este archivo NO es parte del servidor real.
// Es una referencia comentada para entender el patrón.
// ============================================================

const express                            = require('express')
const router                             = express.Router()
const { verifyToken, requireAdmin,
        requireRole }                    = require('../middlewares/auth.middleware')

// -----------------------------------------------------------
// PATRÓN 1: Ruta PÚBLICA — sin protección
// Cualquiera puede acceder, incluso sin token
// -----------------------------------------------------------
router.get('/mesas', (req, res) => {
    res.json({ mensaje: 'Lista pública de mesas disponibles' })
})

// -----------------------------------------------------------
// PATRÓN 2: Ruta PRIVADA — solo autenticado (cualquier rol)
// verifyToken verifica el JWT y pone req.user disponible
// -----------------------------------------------------------
router.get('/mis-reservaciones', verifyToken, (req, res) => {
    // Aquí ya tenemos req.user gracias a verifyToken
    res.json({ mensaje: `Reservaciones de ${req.user.nombre}` })
})

// -----------------------------------------------------------
// PATRÓN 3: Solo ADMIN — con requireAdmin (atajo directo)
// -----------------------------------------------------------
router.delete('/mesas/:id', verifyToken, requireAdmin, (req, res) => {
    res.json({ mensaje: 'Mesa eliminada (solo admin puede hacer esto)' })
})

// -----------------------------------------------------------
// PATRÓN 4: Solo ADMIN — con requireRole (equivalente al 3)
// Más flexible: puedes cambiar los roles sin tocar el middleware
// -----------------------------------------------------------
router.post('/mesas', verifyToken, requireRole('admin'), (req, res) => {
    res.json({ mensaje: 'Mesa creada (solo admin)' })
})

// -----------------------------------------------------------
// PATRÓN 5: ADMIN o CLIENTE — varios roles permitidos
// -----------------------------------------------------------
router.get('/reservaciones/:id', verifyToken, requireRole('admin', 'cliente'), (req, res) => {
    res.json({ mensaje: 'Detalle de reservación (admin o cliente)' })
})

// -----------------------------------------------------------
// PATRÓN 6: El controlador distingue comportamiento por rol
// La ruta admite ambos roles pero el controlador actúa diferente
// -----------------------------------------------------------
router.get('/reservaciones', verifyToken, (req, res) => {
    if (req.user.rol === 'admin') {
        // Admin ve TODAS las reservaciones
        res.json({ mensaje: 'Admin: todas las reservaciones del restaurante' })
    } else {
        // Cliente solo ve LAS SUYAS
        res.json({ mensaje: `Cliente: solo mis reservaciones (id: ${req.user.id})` })
    }
})

module.exports = router

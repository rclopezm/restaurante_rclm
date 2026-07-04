// ============================================================
// CONTROLADOR: Mesas
// ============================================================
// Contiene la lógica de negocio para gestionar las mesas
// del restaurante. Conecta las rutas con Prisma.
//
// Permisos por endpoint:
//   GET  /api/mesas        → público (sin token)
//   GET  /api/mesas/:id    → público
//   POST /api/mesas        → solo admin
//   PUT  /api/mesas/:id    → solo admin
//   DELETE /api/mesas/:id  → solo admin (soft delete)
// ============================================================

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ============================================================
// GET /api/mesas
// Lista todas las mesas. Query param ?soloActivas=true
// para filtrar solo las que están en servicio.
// ============================================================
async function listarMesas(req, res, next) {
    try {
        const soloActivas = req.query.soloActivas === 'true'

        const mesas = await prisma.mesa.findMany({
            where: soloActivas ? { activa: true } : undefined,
            orderBy: { numero: 'asc' }
        })

        res.status(200).json({
            total:       mesas.length,
            soloActivas,
            mesas
        })
    } catch (error) {
        next(error)
    }
}

// ============================================================
// GET /api/mesas/:id
// Devuelve una mesa específica por su ID
// ============================================================
async function obtenerMesa(req, res, next) {
    try {
        const id   = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID de la mesa debe ser un número entero positivo.' })
        }

        const mesa = await prisma.mesa.findUnique({
            where: { id }
        })

        if (!mesa) {
            return res.status(404).json({ error: `No existe una mesa con ID ${id}.` })
        }

        res.status(200).json({ mesa })
    } catch (error) {
        next(error)
    }
}

// ============================================================
// POST /api/mesas
// Crea una nueva mesa. Solo admin.
// ============================================================
async function crearMesa(req, res, next) {
    try {
        const { numero, capacidad, ubicacion } = req.body

        if (!numero || !capacidad) {
            return res.status(400).json({
                error: 'Los campos numero y capacidad son obligatorios.'
            })
        }

        if (!Number.isInteger(Number(numero)) || Number(numero) <= 0) {
            return res.status(400).json({ error: 'El numero de mesa debe ser un entero positivo.' })
        }
        if (!Number.isInteger(Number(capacidad)) || Number(capacidad) <= 0) {
            return res.status(400).json({ error: 'La capacidad debe ser un entero positivo.' })
        }

        const mesaCreada = await prisma.mesa.create({
            data: {
                numero:    Number(numero),
                capacidad: Number(capacidad),
                ubicacion: ubicacion || 'Salón principal'
            }
        })

        res.status(201).json({
            message: `Mesa #${numero} creada exitosamente.`,
            mesa:     mesaCreada
        })
    } catch (error) {
        // P2002 es el código de Prisma para "Unique constraint failed"
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: `Ya existe una mesa con el número ${req.body.numero}.`
            })
        }
        next(error)
    }
}

// ============================================================
// PUT /api/mesas/:id
// Actualiza todos los campos de una mesa. Solo admin.
// ============================================================
async function actualizarMesa(req, res, next) {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID de la mesa debe ser un número entero positivo.' })
        }

        const mesaExistente = await prisma.mesa.findUnique({ where: { id } })
        if (!mesaExistente) {
            return res.status(404).json({ error: `No existe una mesa con ID ${id}.` })
        }

        const { numero, capacidad, ubicacion, activa } = req.body

        if (!numero || !capacidad) {
            return res.status(400).json({
                error: 'Los campos numero y capacidad son obligatorios para actualizar.'
            })
        }
        if (!Number.isInteger(Number(numero)) || Number(numero) <= 0) {
            return res.status(400).json({ error: 'El numero de mesa debe ser un entero positivo.' })
        }
        if (!Number.isInteger(Number(capacidad)) || Number(capacidad) <= 0) {
            return res.status(400).json({ error: 'La capacidad debe ser un entero positivo.' })
        }

        const activaFinal = activa !== undefined ? Boolean(activa) : mesaExistente.activa

        const mesaActualizada = await prisma.mesa.update({
            where: { id },
            data: {
                numero:    Number(numero),
                capacidad: Number(capacidad),
                ubicacion: ubicacion || mesaExistente.ubicacion,
                activa:    activaFinal
            }
        })

        res.status(200).json({
            message: `Mesa #${mesaActualizada.numero} actualizada exitosamente.`,
            mesa:     mesaActualizada
        })
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: `Ya existe una mesa con el número ${req.body.numero}.`
            })
        }
        next(error)
    }
}

// ============================================================
// DELETE /api/mesas/:id  →  SOFT DELETE
// ============================================================
// Con Prisma, un soft delete es un simple 'update'
// de la propiedad activa a false.
// ============================================================
async function eliminarMesa(req, res, next) {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID de la mesa debe ser un número entero positivo.' })
        }

        const mesa = await prisma.mesa.findUnique({ where: { id } })
        if (!mesa) {
            return res.status(404).json({ error: `No existe una mesa con ID ${id}.` })
        }

        if (!mesa.activa) {
            return res.status(409).json({
                error: `La mesa #${mesa.numero} ya está desactivada.`
            })
        }

        // SOFT DELETE
        await prisma.mesa.update({
            where: { id },
            data: { activa: false }
        })

        res.status(200).json({
            message: `Mesa #${mesa.numero} desactivada exitosamente (soft delete). El historial se conserva.`,
            mesa_id: id
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    listarMesas,
    obtenerMesa,
    crearMesa,
    actualizarMesa,
    eliminarMesa
}

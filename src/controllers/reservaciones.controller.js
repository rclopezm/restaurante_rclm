// ============================================================
// CONTROLADOR: Reservaciones
// ============================================================
// Lógica de negocio para el sistema de reservaciones.
// Refactorizado a Prisma ORM.
//
// Tabla de permisos:
//   POST   /api/reservaciones          → Cliente (autenticado)
//   GET    /api/reservaciones/mis      → Cliente (solo las suyas)
//   GET    /api/reservaciones          → Admin (todas, con filtros)
//   PUT    /api/reservaciones/:id/estado → Admin
//   DELETE /api/reservaciones/:id      → Cliente (cancela la suya)
// ============================================================

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Estados válidos según el ENUM de Prisma (Estado)
const ESTADOS_VALIDOS = ['pendiente', 'confirmada', 'cancelada', 'completada']

// ============================================================
// Funciones Helper para manejo de Fechas y Horas en Prisma
// Prisma maneja Time(0) y Date(0) como objetos Date de JS.
// ============================================================
function parseDate(fechaString) {
    return new Date(`${fechaString}T00:00:00.000Z`)
}

function parseTime(horaString) {
    return new Date(`1970-01-01T${horaString}:00.000Z`)
}

// ============================================================
// POST /api/reservaciones
// El cliente crea una reservación para sí mismo.
// Incluye validación completa de disponibilidad de horario.
// ============================================================
async function crearReservacion(req, res, next) {
    try {
        const { mesa_id, fecha, hora_inicio, hora_fin, num_personas, notas } = req.body

        // ── 1. Validar campos obligatorios ─────────────────────
        if (!mesa_id || !fecha || !hora_inicio || !hora_fin || !num_personas) {
            return res.status(400).json({
                error: 'Campos obligatorios: mesa_id, fecha, hora_inicio, hora_fin, num_personas.'
            })
        }

        // ── 2. Validar formato de fecha (YYYY-MM-DD) ────────────
        const regexFecha = /^\d{4}-\d{2}-\d{2}$/
        if (!regexFecha.test(fecha)) {
            return res.status(400).json({
                error: 'El campo fecha debe tener formato YYYY-MM-DD. Ejemplo: 2026-08-15'
            })
        }

        // ── 3. Validar que la fecha no sea en el pasado ─────────
        const hoy = new Date().toISOString().split('T')[0]
        if (fecha < hoy) {
            return res.status(400).json({
                error: 'No puedes reservar en una fecha pasada.'
            })
        }

        // ── 4. Validar formato de horas (HH:MM) ────────────────
        const regexHora = /^([01]\d|2[0-3]):[0-5]\d$/
        if (!regexHora.test(hora_inicio) || !regexHora.test(hora_fin)) {
            return res.status(400).json({
                error: 'Las horas deben tener formato HH:MM. Ejemplo: 19:00 o 21:30'
            })
        }

        // ── 5. Validar que hora_fin > hora_inicio ───────────────
        if (hora_fin <= hora_inicio) {
            return res.status(400).json({
                error: `La hora de fin (${hora_fin}) debe ser posterior a la de inicio (${hora_inicio}).`
            })
        }

        // ── 6. Verificar que la mesa existe y está activa ───────
        const mesa = await prisma.mesa.findUnique({ where: { id: Number(mesa_id) } })
        if (!mesa) {
            return res.status(404).json({
                error: `No existe una mesa con ID ${mesa_id}.`
            })
        }
        if (!mesa.activa) {
            return res.status(409).json({
                error: `La mesa #${mesa.numero} no está disponible (fuera de servicio).`
            })
        }

        // ── 7. Validar que num_personas no excede la capacidad ──
        if (Number(num_personas) > mesa.capacidad) {
            return res.status(409).json({
                error: `La mesa #${mesa.numero} tiene capacidad para ${mesa.capacidad} personas. ` +
                       `Solicitaste ${num_personas}.`
            })
        }

        // ── 8. VERIFICAR CONFLICTO DE HORARIO (Prisma) ─────────
        const conflicto = await prisma.reservacion.findFirst({
            where: {
                mesa_id: Number(mesa_id),
                fecha: parseDate(fecha),
                estado: { notIn: ['cancelada', 'completada'] },
                hora_inicio: { lt: parseTime(hora_fin) },
                hora_fin:    { gt: parseTime(hora_inicio) }
            },
            select: { hora_inicio: true, hora_fin: true }
        })

        if (conflicto) {
            // Formatear la hora de Date a string HH:MM para el usuario
            const hi = conflicto.hora_inicio.toISOString().substring(11, 16)
            const hf = conflicto.hora_fin.toISOString().substring(11, 16)
            return res.status(409).json({
                error:   `La mesa #${mesa.numero} ya está reservada en ese horario.`,
                detalle: `Existe una reservación de ${hi} a ${hf}.`,
                sugerencia: 'Elige otro horario o una mesa diferente.'
            })
        }

        // ── 9. Todo validado → crear la reservación ─────────────
        const reservacionCreada = await prisma.reservacion.create({
            data: {
                usuario_id:   req.user.id,
                mesa_id:      Number(mesa_id),
                fecha:        parseDate(fecha),
                hora_inicio:  parseTime(hora_inicio),
                hora_fin:     parseTime(hora_fin),
                num_personas: Number(num_personas),
                notas:        notas || null
            },
            include: { mesa: true, usuario: true }
        })

        res.status(201).json({
            message:     '¡Reservación creada exitosamente! Estado: pendiente de confirmación.',
            reservacion: reservacionCreada
        })

    } catch (error) {
        next(error)
    }
}

// ============================================================
// GET /api/reservaciones/mis
// El cliente autenticado consulta SOLO sus propias reservaciones.
// ============================================================
async function misReservaciones(req, res, next) {
    try {
        const reservaciones = await prisma.reservacion.findMany({
            where: { usuario_id: req.user.id },
            include: { mesa: true },
            orderBy: [
                { fecha: 'desc' },
                { hora_inicio: 'asc' }
            ]
        })

        res.status(200).json({
            total:       reservaciones.length,
            usuario_id:  req.user.id,
            reservaciones
        })
    } catch (error) {
        next(error)
    }
}

// ============================================================
// GET /api/reservaciones
// Solo admin — lista TODAS con filtros opcionales.
// ============================================================
async function listarReservaciones(req, res, next) {
    try {
        const { fecha, estado, mesa_id } = req.query

        if (estado && !ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({
                error:   `Estado inválido: '${estado}'.`,
                validos: ESTADOS_VALIDOS
            })
        }

        const reservaciones = await prisma.reservacion.findMany({
            where: {
                ...(fecha && { fecha: parseDate(fecha) }),
                ...(estado && { estado }),
                ...(mesa_id && { mesa_id: Number(mesa_id) })
            },
            include: { usuario: true, mesa: true },
            orderBy: [
                { fecha: 'desc' },
                { hora_inicio: 'asc' }
            ]
        })

        res.status(200).json({
            total:       reservaciones.length,
            filtros:     { fecha: fecha || 'todas', estado: estado || 'todos', mesa_id: mesa_id || 'todas' },
            reservaciones
        })
    } catch (error) {
        next(error)
    }
}

// ============================================================
// PUT /api/reservaciones/:id/estado
// Solo admin — cambia el estado de una reservación.
// ============================================================
async function cambiarEstado(req, res, next) {
    try {
        const id = Number(req.params.id)
        const { estado } = req.body

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID debe ser un entero positivo.' })
        }

        if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({
                error:   `Estado inválido: '${estado}'.`,
                validos: ESTADOS_VALIDOS
            })
        }

        const reservacion = await prisma.reservacion.findUnique({ where: { id } })
        if (!reservacion) {
            return res.status(404).json({ error: `No existe la reservación con ID ${id}.` })
        }

        if (reservacion.estado === 'cancelada' && estado !== 'cancelada') {
            return res.status(409).json({ error: 'No se puede cambiar el estado de una reservación ya cancelada.' })
        }
        if (reservacion.estado === 'completada' && estado !== 'completada') {
            return res.status(409).json({ error: 'No se puede cambiar el estado de una reservación ya completada.' })
        }

        const actualizada = await prisma.reservacion.update({
            where: { id },
            data: { estado },
            include: { mesa: true }
        })

        res.status(200).json({
            message:     `Estado actualizado a '${estado}' exitosamente.`,
            reservacion: actualizada
        })
    } catch (error) {
        next(error)
    }
}

// ============================================================
// DELETE /api/reservaciones/:id
// ============================================================
async function cancelarReservacion(req, res, next) {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'El ID debe ser un entero positivo.' })
        }

        const reservacion = await prisma.reservacion.findUnique({
            where: { id },
            include: { mesa: true }
        })
        
        if (!reservacion) {
            return res.status(404).json({ error: `No existe la reservación con ID ${id}.` })
        }

        const esAdmin  = req.user.rol === 'admin'
        const esDueño  = reservacion.usuario_id === req.user.id

        if (!esAdmin && !esDueño) {
            return res.status(403).json({ error: 'No puedes cancelar una reservación que no te pertenece.' })
        }

        if (reservacion.estado === 'cancelada') {
            return res.status(409).json({ error: 'Esta reservación ya fue cancelada.' })
        }
        if (reservacion.estado === 'completada') {
            return res.status(409).json({ error: 'No puedes cancelar una reservación ya completada.' })
        }

        const cancelada = await prisma.reservacion.update({
            where: { id },
            data: { estado: 'cancelada' }
        })

        res.status(200).json({
            message:        'Reservación cancelada exitosamente.',
            reservacion_id: id,
            mesa:           `#${reservacion.mesa.numero}`,
            fecha:          cancelada.fecha
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    crearReservacion,
    misReservaciones,
    listarReservaciones,
    cambiarEstado,
    cancelarReservacion
}

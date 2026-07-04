// ============================================================
// MIDDLEWARE: Manejo centralizado de errores
// ============================================================
// Express reconoce este como "error handler" porque tiene
// 4 parámetros: (err, req, res, next).
// Se registra ÚLTIMO en app.js con app.use(errorHandler).
// ============================================================

function errorHandler(err, req, res, next) {
    // Log del error en consola del servidor (para debugging)
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`)
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack)
    }

    // Código de estado: usa el del error si existe, sino 500
    const statusCode = err.statusCode || err.status || 500

    res.status(statusCode).json({
        error:   err.message || 'Error interno del servidor.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
}

module.exports = errorHandler

// ============================================================
// APP.JS — Configuración de Express
// ============================================================
// Responsabilidades:
//   - Middlewares globales
//   - Documentación Swagger en /api-docs
//   - Registro de módulos de rutas
//   - Manejo de errores centralizado
// ============================================================

const express        = require('express')
const swaggerUi      = require('swagger-ui-express')
const swaggerSpec    = require('./config/swagger')
const errorHandler   = require('./middlewares/errorHandler.middleware')

// --- Módulos de rutas ---
const authRoutes          = require('./routes/auth.routes')
const mesasRoutes         = require('./routes/mesas.routes')
const reservacionesRoutes = require('./routes/reservaciones.routes')

const app = express()

// ============================================================
// MIDDLEWARES GLOBALES
// ============================================================
app.use(express.json())

// ============================================================
// SWAGGER UI — Interfaz interactiva en /api-docs
// ============================================================
// customCss personaliza el aspecto visual de la UI
const swaggerUiOptions = {
    customSiteTitle: 'API Restaurante 🍽️',
    customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar .link { display: none; }
        .swagger-ui .info h2.title { color: #e94560; }
        .swagger-ui .scheme-container { background: #16213e; padding: 15px; border-radius: 8px; }
    `,
    swaggerOptions: {
        persistAuthorization: true,     // conserva el token al recargar
        displayRequestDuration: true,   // muestra cuánto tardó cada petición
        docExpansion: 'list',           // muestra las rutas contraídas por defecto
        filter: true,                   // habilita barra de búsqueda de endpoints
        tryItOutEnabled: true           // abre "Try it out" automáticamente
    }
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions))

// ── Endpoint extra: expone el JSON crudo de OpenAPI ──────────
// Útil para importar la colección directamente en Postman o Insomnia
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
})

// ============================================================
// RUTAS PRINCIPALES
// ============================================================

// Health check — ruta raíz
app.get('/', (req, res) => {
    res.status(200).json({
        message:  '🍽️  API Restaurante funcionando correctamente',
        version:  '1.0.0',
        entorno:  process.env.NODE_ENV || 'development',
        endpoints: {
            docs:         'GET /api-docs',
            docsJson:     'GET /api-docs.json',
            auth:         '/api/auth',
            mesas:        '/api/mesas',
            reservaciones: '/api/reservaciones'
        }
    })
})

// Montar los módulos de la API
app.use('/api/auth',          authRoutes)
app.use('/api/mesas',         mesasRoutes)
app.use('/api/reservaciones', reservacionesRoutes)

// ============================================================
// RUTA NO ENCONTRADA (404)
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        error:    `Ruta '${req.method} ${req.url}' no encontrada.`,
        sugerencia: 'Consulta la documentación en /api-docs'
    })
})

// ============================================================
// MANEJADOR GLOBAL DE ERRORES
// ============================================================
// DEBE ser el último middleware registrado
app.use(errorHandler)

module.exports = app

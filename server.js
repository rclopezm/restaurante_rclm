// ============================================================
// SERVER.JS — Punto de entrada del servidor
// ============================================================
// Responsabilidades de este archivo:
//   1. Cargar variables de entorno (.env)
//   2. Verificar la conexión a la base de datos
//   3. Iniciar el servidor en el puerto configurado
//
// Importa 'app' desde app.js (que ya tiene Express configurado)
// ============================================================

require('dotenv').config()                        // 1. Cargar .env PRIMERO
const app                    = require('./src/app')
const { testConnection }     = require('./src/config/db')

const PORT = process.env.PORT || 3000

// Función principal: primero prueba la BD, luego levanta el servidor
async function startServer() {
    await testConnection()  // 2. Si falla, detiene todo (process.exit en db.js)

    // 3. Iniciar el servidor HTTP
    app.listen(PORT, () => {
        console.log('============================================')
        console.log(`🚀  Servidor corriendo en http://localhost:${PORT}`)
        console.log(`📚  Documentación en  http://localhost:${PORT}/api-docs`)
        console.log(`🌿  Entorno: ${process.env.NODE_ENV || 'development'}`)
        console.log('============================================')
    })
}

startServer()

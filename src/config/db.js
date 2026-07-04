// ============================================================
// DB.JS — Verificación de conexión a la base de datos
// ============================================================
// Usa Prisma Client para probar que la conexión con PostgreSQL
// funciona antes de levantar el servidor Express.
// ============================================================

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
    try {
        await prisma.$connect()
        console.log('✅  Conexión a la base de datos establecida correctamente')
    } catch (error) {
        console.error('❌  No se pudo conectar a la base de datos:')
        console.error(error.message)
        process.exit(1)
    }
}

module.exports = { testConnection, prisma }
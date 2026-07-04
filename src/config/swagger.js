// ============================================================
// CONFIGURACIÓN DE SWAGGER (Documentación automática)
// ============================================================
// ¿Cómo funciona el pipeline completo?
//
//  1. TÚ escribes comentarios /** @swagger */ en los archivos
//     de rutas. No son comentarios normales — tienen formato
//     YAML estructurado que describe los endpoints.
//
//  2. swagger-jsdoc recorre los archivos indicados en `apis`,
//     extrae esos comentarios y los COMBINA con la definición
//     base (info, servers, components) para generar un objeto
//     JSON llamado "OpenAPI Specification" (antes Swagger 2.0).
//
//  3. swagger-ui-express recibe ese JSON y sirve una aplicación
//     web React pre-construida en /api-docs que lo renderiza
//     como una interfaz interactiva: puedes leer, probar y
//     autenticarte directamente desde el navegador.
//
// Resultado final:
//   comentarios @swagger  →  JSON OpenAPI  →  UI interactiva
// ============================================================

const swaggerJsdoc = require('swagger-jsdoc')

const options = {
    definition: {
        openapi: '3.0.0',

        // ── Información general de la API ─────────────────────
        info: {
            title:   'API Restaurante 🍽️',
            version: '1.0.0',
            description: `
## Bienvenido a la documentación de la API de Reservaciones

Esta API permite a **clientes** reservar mesas y a **administradores**
gestionar el restaurante completo.

### Cómo autenticarse
1. Crea una cuenta con **POST /api/auth/register**
2. Inicia sesión con **POST /api/auth/login** — recibirás un \`token\`
3. Haz clic en el botón **Authorize 🔓** (arriba a la derecha)
4. Escribe: \`Bearer <tu_token>\`
5. Ahora puedes usar los endpoints protegidos 🔐

### Roles del sistema
| Rol | Permisos |
|-----|----------|
| \`cliente\` | Crear/cancelar sus propias reservaciones, ver mesas |
| \`admin\`   | Todo lo anterior + gestionar mesas y ver todas las reservaciones |

### Admin por defecto
- **Correo:** admin@restaurante.com
- **Contraseña:** Admin123!
            `,
            contact: {
                name:  'Soporte API Restaurante',
                email: 'admin@restaurante.com'
            },
            license: {
                name: 'ISC'
            }
        },

        // ── Servidores disponibles ─────────────────────────────
        servers: [
            {
                url:         `http://localhost:${process.env.PORT || 3000}`,
                description: '🖥️  Servidor de desarrollo local'
            }
        ],

        // ── Tags: agrupan los endpoints en secciones visuales ──
        // El orden aquí determina el orden en la UI de Swagger
        tags: [
            {
                name:        'Autenticación',
                description: '🔑 Registro, login y perfil de usuario'
            },
            {
                name:        'Mesas',
                description: '🪑 Catálogo de mesas del restaurante (CRUD)'
            },
            {
                name:        'Reservaciones',
                description: '📅 Sistema de reservaciones con validación de disponibilidad'
            }
        ],

        // ── Componentes reutilizables ──────────────────────────
        components: {
            // Esquema de seguridad: cómo se envía el JWT
            securitySchemes: {
                bearerAuth: {
                    type:         'http',
                    scheme:       'bearer',
                    bearerFormat: 'JWT',
                    description:  '**Formato:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`\n\nObtén el token en **POST /api/auth/login**'
                }
            },

            // Respuestas de error reutilizables (evitan repetición)
            responses: {
                Unauthorized: {
                    description: '401 — Token no proporcionado o inválido',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: { type: 'string', example: 'Token inválido o expirado. Inicia sesión nuevamente.' }
                                }
                            }
                        }
                    }
                },
                Forbidden: {
                    description: '403 — Sin permisos suficientes',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: { type: 'string', example: "Acceso denegado. Se requiere rol 'admin'." }
                                }
                            }
                        }
                    }
                },
                NotFound: {
                    description: '404 — Recurso no encontrado',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: { type: 'string', example: 'No existe el recurso solicitado.' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    // ── Archivos que swagger-jsdoc va a escanear ───────────────
    // Lee todos los archivos .js dentro de src/routes/
    // Busca bloques /** @swagger */ y los parsea como YAML
    apis: ['./src/routes/*.js']
}

// Genera el objeto OpenAPI Specification completo
const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec

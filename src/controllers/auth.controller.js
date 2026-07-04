// ============================================================
// CONTROLADOR: Autenticación
// ============================================================
// Este archivo contiene la lógica de negocio para:
//   - Registro de nuevos clientes
//   - Login (genera y devuelve el JWT)
//   - Consulta del perfil del usuario autenticado
//
// Flujo de datos:
//   Cliente HTTP → Ruta → [este Controlador] → Prisma Client → BD
// ============================================================

const bcrypt  = require('bcryptjs')   // para cifrar y comparar contraseñas
const jwt     = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ============================================================
// POST /api/auth/register
// Registra un nuevo usuario con rol 'cliente'
// ============================================================
async function register(req, res, next) {
    try {
        const { nombre, correo, password } = req.body

        // --- Validación de campos obligatorios ---
        if (!nombre || !correo || !password) {
            return res.status(400).json({
                error: 'Los campos nombre, correo y password son obligatorios.'
            })
        }

        // --- Validación de formato de correo ---
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(correo)) {
            return res.status(400).json({ error: 'El correo no tiene un formato válido.' })
        }

        // --- Validación de contraseña mínima ---
        if (password.length < 6) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 6 caracteres.'
            })
        }

        // --- Verificar que el correo no esté registrado ya ---
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { correo }
        })
        if (usuarioExistente) {
            return res.status(409).json({
                error: 'Ya existe una cuenta con ese correo electrónico.'
            })
        }

        // --- Cifrar la contraseña con bcrypt ---
        const password_hash = await bcrypt.hash(password, 10)

        // --- Crear el usuario en la BD vía Prisma ---
        const nuevoUsuario = await prisma.usuario.create({
            data: { 
                nombre, 
                correo, 
                password_hash,
                rol: 'cliente' // Por defecto en Prisma schema, pero lo dejamos explícito si se desea
            }
        })

        // Respondemos 201 Created sin devolver el hash
        res.status(201).json({
            message:  'Cuenta creada exitosamente. Ya puedes iniciar sesión.',
            usuario: {
                id:     nuevoUsuario.id,
                nombre: nuevoUsuario.nombre,
                correo: nuevoUsuario.correo,
                rol:    nuevoUsuario.rol
            }
        })

    } catch (error) {
        next(error) // pasa al errorHandler global
    }
}

// ============================================================
// POST /api/auth/login
// Verifica credenciales y devuelve un JWT firmado
// ============================================================
async function login(req, res, next) {
    try {
        const { correo, password } = req.body

        // --- Validación básica ---
        if (!correo || !password) {
            return res.status(400).json({
                error: 'Correo y contraseña son obligatorios.'
            })
        }

        // --- Buscar el usuario por correo vía Prisma ---
        const usuario = await prisma.usuario.findUnique({
            where: { correo }
        })
        
        if (!usuario) {
            return res.status(401).json({
                error: 'Credenciales incorrectas.'
            })
        }

        // --- Comparar la contraseña ingresada con el hash guardado ---
        const passwordValida = await bcrypt.compare(password, usuario.password_hash)
        if (!passwordValida) {
            return res.status(401).json({
                error: 'Credenciales incorrectas.'
            })
        }

        // --- Generar el JWT ---
        const payload = {
            id:     usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol:    usuario.rol
        }

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        )

        // --- Respuesta exitosa ---
        res.status(200).json({
            message: `Bienvenido, ${usuario.nombre}!`,
            token,
            usuario: {
                id:     usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol:    usuario.rol
            }
        })

    } catch (error) {
        next(error)
    }
}

// ============================================================
// GET /api/auth/perfil
// Devuelve el perfil del usuario autenticado
// ============================================================
async function perfil(req, res, next) {
    try {
        // Consultamos la BD vía Prisma por el ID que viene en el token
        const usuario = await prisma.usuario.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                nombre: true,
                correo: true,
                rol: true,
                created_at: true
                // Excluimos explícitamente password_hash
            }
        })

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' })
        }

        res.status(200).json({ usuario })

    } catch (error) {
        next(error)
    }
}

module.exports = { register, login, perfil }

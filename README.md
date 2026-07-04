# 🍽️ API REST - Sistema de Reservaciones de Restaurante

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=Swagger&logoColor=black)

Backend RESTful desarrollado con Node.js y Express para administrar de forma completa las reservaciones de un restaurante. Incluye detección automática de conflictos de horario, autenticación mediante JWT y control de acceso diferenciado por roles.

---

## ✨ Funcionalidades Destacadas

* **Autenticación con JWT:** Registro e inicio de sesión con contraseñas encriptadas usando Bcrypt. Acceso controlado mediante dos roles definidos: `admin` y `cliente`.
* **Administración de Mesas (CRUD):** Los administradores pueden registrar, modificar y desactivar mesas del catálogo. Se utiliza Soft Delete para preservar la integridad del historial de reservaciones.
* **Reservaciones sin Conflictos de Horario:** Lógica de validación que verifica superposición de fechas y horas antes de registrar una reserva, asegurando que ninguna mesa quede asignada a dos clientes simultáneamente.
* **ORM con Prisma:** Acceso a la base de datos completamente gestionado por **Prisma ORM**, con tipado seguro, protección contra inyecciones SQL y esquema de datos declarativo.
* **Documentación en Vivo:** Todos los endpoints están documentados y son probables directamente desde Swagger UI.

---

## 🚀 Requisitos Previos

Asegúrate de contar con las siguientes herramientas instaladas:
- [Node.js](https://nodejs.org/es/) (v16+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)

---

## 🛠️ Instalación y Puesta en Marcha

Sigue los pasos a continuación para ejecutar el proyecto en tu entorno local:

1. **Clona el repositorio e instala las dependencias:**
   ```bash
   npm install
   ```

2. **Configura las variables de entorno:**
   - Copia el archivo `.env.example` y renómbralo como `.env`.
   - Completa los datos de tu conexión local a PostgreSQL, especialmente el `DATABASE_URL` que utiliza Prisma:
   ```env
   # Ejemplo de configuración
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=tu_contraseña_aqui
   DB_NAME=restaurante_db
   DB_PORT=5432

   # Cadena de conexión para Prisma
   DATABASE_URL="postgresql://postgres:tu_contraseña_aqui@localhost:5432/restaurante_db"
   ```

3. **Crea las tablas en la base de datos:**
   Prisma genera la estructura automáticamente sin necesidad de scripts SQL manuales:
   ```bash
   npx prisma db push
   ```
   *(Nota: si requieres datos de prueba iniciales, el archivo `database/schema.sql` incluye los INSERT de mesas y un usuario administrador por defecto que puedes ejecutar manualmente desde tu gestor de base de datos).*

4. **Inicia el servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```

El servidor estará disponible en `http://localhost:3000`.

---

## 📖 Documentación Interactiva (Swagger UI)

La API incluye una interfaz visual donde puedes explorar y probar cada endpoint directamente desde el navegador.

Una vez iniciado el servidor, accede desde:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

### Endpoints principales:
- `POST /api/auth/login`: Obtén tu token JWT para autenticarte.
- `GET /api/mesas`: Consulta el catálogo completo de mesas disponibles.
- `POST /api/reservaciones`: Registra una nueva reservación (requiere token de cliente).

---

## 🧱 Estructura del Proyecto

El proyecto aplica el patrón **MVC (Model-View-Controller)** adaptado para APIs sin vistas.
- **`/prisma`**: Contiene `schema.prisma`, la fuente de verdad del modelo de datos.
- **`/src/routes`**: Declara las rutas de cada módulo y aplica los middlewares de protección.
- **`/src/middlewares`**: Interceptores reutilizables como `auth.middleware` para validar tokens JWT y `errorHandler.middleware` para el manejo centralizado de errores.
- **`/src/controllers`**: Concentra toda la lógica de negocio, comunicándose con la base de datos a través de Prisma Client.
- **`/src/config`**: Archivos de configuración general como Swagger y variables globales.

---
*Proyecto académico — Sistema de reservaciones para restaurante desarrollado como práctica de API REST con Node.js.*

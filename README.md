# Sistema Web de Agricultura Inteligente — Región Junín (AgriJunín)

Plataforma Full Stack para gestión de agricultores, cultivos, lotes, sensores IoT, monitoreo ambiental y alertas inteligentes.

**Repositorio:** [github.com/Pierox123274/agri-junin](https://github.com/Pierox123274/agri-junin)

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 20+, Signals, Standalone, Reactive Forms, SCSS |
| Backend | Node.js, Express.js, JWT, MVC |
| Base de datos | MySQL 8+ con integridad referencial |

## Requisitos previos

- Node.js 20+
- MySQL 8+ (o MariaDB 10.4+)
- npm
- Git (opcional, para clonar)

## Instalación rápida

### 1. Clonar el proyecto

```bash
git clone https://github.com/Pierox123274/agri-junin.git
cd agri-junin
```

### 2. Configurar entorno (automático en Windows)

```powershell
.\setup.ps1
```

Esto crea `backend/.env` desde `.env.example`, instala dependencias de backend y frontend.

**Manual (cualquier SO):**

```bash
cp backend/.env.example backend/.env   # Windows: copy backend\.env.example backend\.env
```

Edite `backend/.env` con:

- Contraseña de MySQL (`DB_PASSWORD`)
- `TREFLE_API_TOKEN` — [Trefle.io](https://trefle.io/) (nombres científicos de cultivos)
- `GOOGLE_MAPS_API_KEY` — Google Cloud (mapas al registrar lotes)
- `APISPERU_DNI_TOKEN` — opcional (validación de DNI en registro)

### 3. Base de datos

**Opción recomendada — script único:**

```bash
mysql -u root -p < backend/database/agri_junin_completo.sql
```

Incluye estructura + datos demo. Contraseña de usuarios demo: `Admin123!`

Si el login no funciona tras importar:

```bash
cd backend
node database/fix-passwords.js
```

**Opción por partes:**

```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seeds.sql
cd backend && node database/fix-passwords.js
```

**BD ya existente (migraciones):**

```bash
cd backend
node database/migrate-alertas-origen.js
node database/migrate-lotes-aprobacion.js
# ... otras migrate-*.js según necesidad
```

### 4. Ejecutar la aplicación (recomendado)

```powershell
.\ejecutar.ps1
```

Hace todo automáticamente: `.env`, contraseñas demo, backend, verificación de APIs/BD y frontend.

Verificar sin abrir navegador:

```bash
cd backend
npm run verify
```

Alternativa rápida:

```powershell
.\start.ps1
```

O por separado:

```bash
cd backend && npm run dev    # http://localhost:3000/api
cd frontend && npx ng serve  # http://localhost:4200
```

## Credenciales de prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@agrijunin.pe | Admin123! | administrador |
| maria.quispe@agrijunin.pe | Admin123! | agricultor |
| juan.rojas@agrijunin.pe | Admin123! | agricultor |
| ana.tello@agrijunin.pe | Admin123! | técnico |
| pedro.huaman@agrijunin.pe | Admin123! | técnico |

## API REST (endpoints principales)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Inicio de sesión |
| POST | `/api/auth/register` | Registro |
| GET | `/api/dashboard/stats` | KPIs del dashboard |
| GET | `/api/clima/huancayo` | Clima Huancayo (Open-Meteo) |
| POST | `/api/clima/sincronizar` | Sincroniza clima → registros, sensores y alertas |
| GET | `/api/plantas/buscar?q=` | Búsqueda nombres científicos (Trefle) |
| CRUD | `/api/agricultores`, `/cultivos`, `/lotes`, `/sensores`, `/registros`, `/alertas` | Módulos del sistema |

## Roles

- **Administrador:** acceso total, aprobar técnicos y solicitudes
- **Técnico:** gestión de campo, aprobar lotes/cultivos de agricultores
- **Agricultor:** sus lotes, cultivos, clima y alertas

## Estructura del proyecto

```
agri-junin/
├── backend/          # API REST Node.js
│   ├── database/     # schema.sql, seeds.sql, agri_junin_completo.sql
│   ├── services/
│   └── src/
├── frontend/         # Angular 20
├── setup.ps1         # Configuración inicial
└── start.ps1         # Arranque backend + frontend
```

## Seguridad

- **No suba** `backend/.env` a GitHub (contiene claves secretas).
- Use `.env.example` como plantilla.
- Cambie `JWT_SECRET` en producción.

## Autor

Proyecto Final — Ingeniería Web

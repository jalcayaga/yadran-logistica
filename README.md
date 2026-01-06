# Logística Yadran App

Sistema de control logístico de movimientos de personas en la Patagonia.

## Requisitos Previos
- Node.js 18+
- Supabase Project

## Setup

1. **Instalar Dependencias**
   ```bash
   npm install
   ```

2. **Configurar Variables de Entorno**
   Copiar `.env.example` a `.env.local` y completar:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   APP_BASE_URL=http://localhost:3000
   ```

3. **Base de Datos (Supabase)**
   Ir al Dashboard de Supabase > SQL Editor y ejecutar el archivo:
   `supabase/migrations/20251215190000_init_schema.sql`

   Esto creará:
   - Tablas: `profiles`, `people`, `locations`, `operators`, `vessels`, `routes`, `itineraries`, `itinerary_segments`, `itinerary_shares`, `notifications`.
   - Triggers y Funciones para notificaciones automáticas y tokens.
   - Políticas RLS estrictas.

4. **Crear Usuario Admin**
   - Crear usuario en Supabase Auth (Email/Password).
   - Insertar registro en `profiles`:
     ```sql
     insert into profiles (id, role, full_name) 
     values ('USER_UUID_FROM_AUTH', 'admin', 'Super Admin');
     ```

## Uso

- **Admin Dashboard**: `/admin/people` (Gestión de catálogos)
- **Logística Dashboard**: `/logistica/plan` (Creación de itinerarios)
- **Login**: `/login` (Redirecciona según rol)

## API Endpoints

### Privado (Logística/Admin)
- `GET/POST /api/people`
- `GET/POST /api/locations`
- `POST /api/itineraries`
- `GET /api/notifications/queued` (Para n8n)

### Público
- `GET /api/public/itinerary/[token]` (Consume Service Role)
- App View: `/i/[token]`

## Notificaciones (WhatsApp)
El sistema encola eventos `ASSIGNED`, `CANCELLED`, `UPDATED` en la tabla `notifications`.
Configurar n8n para:
1. Leer cola: `GET /api/notifications/queued`
2. Enviar WhatsApp.
3. Marcar como enviado: `POST /api/notifications/[id]/mark { status: 'sent' }`

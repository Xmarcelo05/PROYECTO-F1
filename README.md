# Diagramación Arquitectónica — Plataforma de Pronósticos Deportivos F1
> Modelado como código en Mermaid.js (estilo C4: Contexto + Contenedores)

---

## Nivel 1 — Diagrama de Contexto del Sistema

```mermaid
C4Context
    title Contexto del Sistema — Plataforma de Pronósticos Deportivos
    Person(visitante, "Visitante", "Usuario no registrado que desea acceder a la plataforma.")
    Person(usuario, "Usuario Registrado", "Consulta pronósticos, calendario, historial y ranking, y gestiona su suscripción.")
    Person(admin, "Administrador", "Gestiona Grandes Premios, pilotos, escuderías, resultados oficiales y suscripciones de usuarios.")
    System(plataforma, "Plataforma de Pronósticos Deportivos", "Aplicación web que genera y muestra pronósticos de carreras de Fórmula 1 basados en estadísticas históricas, con modelo freemium de suscripción.")
    System_Ext(f1api, "API de Datos F1", "Fuente externa de datos sobre pilotos, escuderías, calendarios y resultados oficiales.")
    System_Ext(email, "Servicio de Email", "Envío de correos para recuperación de contraseña, notificaciones y confirmaciones de suscripción.")
    System_Ext(pasarela, "Pasarela de Pago", "Servicio externo (ej. Stripe/PayPal) que procesa el pago de la suscripción premium.")
    Rel(visitante, plataforma, "Se registra e inicia sesión")
    Rel(usuario, plataforma, "Consulta pronósticos, calendario, historial, ranking y gestiona su suscripción", "HTTPS")
    Rel(admin, plataforma, "Gestiona datos del sistema, resultados oficiales y suscripciones de usuarios", "HTTPS")
    Rel(plataforma, f1api, "Consume datos de pilotos, escuderías y resultados", "REST/JSON")
    Rel(plataforma, email, "Envía correos de recuperación, notificaciones y confirmación de suscripción", "SMTP")
    Rel(plataforma, pasarela, "Procesa el pago de la suscripción premium", "REST/JSON")
```

---

## Nivel 2 — Diagrama de Contenedores

```mermaid
C4Container
    title Contenedores del Sistema — Plataforma de Pronósticos Deportivos
    Person(usuario, "Usuario Registrado", "Consulta pronósticos y gestiona su suscripción desde el navegador.")
    Person(admin, "Administrador", "Gestiona el sistema y las suscripciones.")
    System_Boundary(plataforma, "Plataforma de Pronósticos Deportivos") {
        Container(webapp, "Aplicación Web", "React + Vite (TypeScript)", "Interfaz principal para usuarios: calendario, consulta de pronósticos, historial, ranking y gestión de suscripción. Organizada por features alineadas a las épicas EP-01 a EP-07.")
        Container(adminpanel, "Panel de Administración", "React (SPA)", "Gestión de GPs, pilotos, escuderías, resultados oficiales y administración de suscripciones de usuarios. Corresponde a EP-06.")
        Container(api, "API Backend", "FastAPI (Python)", "Lógica de negocio: autenticación, generación de pronósticos, puntuación, rankings y control de suscripciones/límites de uso. Organizada en módulos por épica (modules/auth, modules/pronosticos, modules/suscripciones, etc.). Expone endpoints REST.")
        Container(db, "Base de Datos", "PostgreSQL", "Almacena usuarios, pronósticos, resultados, pilotos, escuderías y suscripciones.")
        Container(cache, "Caché", "Redis", "Almacena sesiones activas, datos de clasificación frecuentes y el conteo de consultas gratuitas por usuario.")
        Container(auth, "Servicio de Autenticación", "JWT (python-jose)", "Gestiona tokens de acceso y flujo de recuperación de contraseña.")
    }
    System_Ext(f1api, "API de Datos F1", "Datos externos de Fórmula 1.")
    System_Ext(email, "Servicio de Email", "Envío de notificaciones.")
    System_Ext(pasarela, "Pasarela de Pago", "Procesa el pago de la suscripción premium (ej. Stripe/PayPal).")
    Rel(usuario, webapp, "Usa", "HTTPS")
    Rel(admin, adminpanel, "Administra", "HTTPS")
    Rel(webapp, api, "Llamadas a la API", "REST/JSON")
    Rel(adminpanel, api, "Llamadas a la API", "REST/JSON")
    Rel(api, db, "Lee y escribe datos", "SQL / SQLAlchemy")
    Rel(api, cache, "Lee y escribe sesiones/clasificación/límites de uso", "Redis Protocol")
    Rel(api, auth, "Valida y genera tokens JWT")
    Rel(api, f1api, "Obtiene datos de pilotos y resultados", "REST/JSON")
    Rel(api, pasarela, "Procesa el pago de la suscripción", "REST/JSON")
    Rel(auth, email, "Solicita envío de correo", "SMTP")
```

---

## Estructura del Proyecto

### Backend — `proyecto_f1_bcknd/`

```
proyecto_f1_bcknd/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── init.sql
├── .env.example
│
└── app/
    ├── main.py                    # Punto de entrada, registra todos los routers
    ├── database.py                # Conexión a PostgreSQL (SessionLocal, Base, get_db)
    ├── config.py                  # Variables de entorno centralizadas
    │
    ├── core/
    │   ├── security.py            # JWT, hash de passwords, dependencias de auth
    │   └── exceptions.py          # Excepciones HTTP reutilizables
    │
    └── modules/                   # Un paquete por épica del backlog
        ├── auth/                  # EP-01 Gestión de usuarios
        │   ├── models.py
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py          # /auth/register, /login, /logout, /forgot-password
        │
        ├── usuarios/              # EP-02 Gestión del perfil
        │   ├── models.py
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py          # /users/me (GET, PUT), /users/me/pronosticos, /users/me/estadisticas
        │
        ├── calendario/            # EP-03 Calendario de Grandes Premios
        │   ├── models.py          # GranPremio
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py          # /grandes-premios
        │
        ├── pilotos/               # EP-04 (parte 1) Información de pilotos
        │   ├── models.py          # Piloto
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py          # /pilotos, /pilotos/clasificacion
        │
        ├── escuderias/            # EP-04 (parte 2) Información de escuderías
        │   ├── models.py          # Escuderia
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py          # /escuderias, /escuderias/clasificacion
        │
        ├── pronosticos/           # EP-05 Pronósticos de carreras
        │   ├── models.py          # Pronostico
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py          # /pronosticos (CRUD + confirmar)
        │
        ├── resultados/            # EP-06 Resultados y clasificación
        │   ├── models.py          # ResultadoOficial
        │   ├── schemas.py
        │   ├── crud.py
        │   └── router.py          # /grandes-premios/{id}/resultados, /ranking
        │
        └── admin/                 # EP-08 Panel de administración
            ├── schemas.py
            └── router.py          # CRUD protegido de GPs, pilotos, escuderías,
                                   # resultados oficiales, apertura/cierre de pronósticos
```

> **Nota:** EP-07 (Historial y estadísticas, HU-23 a HU-26) no tiene tablas propias — son consultas agregadas sobre `pronosticos` + `resultados_oficiales`. Sus endpoints viven en `usuarios/router.py` (`/users/me/pronosticos`, `/users/me/estadisticas`) y `resultados/router.py` (`/ranking`).

---

### Frontend — `proyecto_f1_frontend/`

```
proyecto_f1_frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
│
└── src/
    ├── main.tsx                    # Punto de entrada, monta <App />
    ├── App.tsx                     # Define las rutas (React Router)
    │
    ├── core/
    │   ├── api/
    │   │   └── axiosClient.ts      # Instancia de Axios con baseURL de la API
    │   ├── context/
    │   │   └── AuthContext.tsx     # Estado global de sesión (usuario, token)
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   └── useFetch.ts
    │   └── guards/
    │       ├── PrivateRoute.tsx    # Protege rutas privadas
    │       └── AdminRoute.tsx      # Protege rutas de EP-08
    │
    ├── shared/
    │   └── components/             # Navbar, Card, Button y otros componentes reutilizables
    │
    └── features/                   # Una carpeta por épica
        ├── auth/                   # EP-01
        │   ├── pages/
        │   │   ├── Login.tsx
        │   │   ├── Registro.tsx
        │   │   └── RecuperarPassword.tsx
        │   └── services/
        │       └── authService.ts
        │
        ├── perfil/                 # EP-02
        │   ├── pages/
        │   │   └── EditarPerfil.tsx
        │   └── services/
        │       └── perfilService.ts
        │
        ├── calendario/             # EP-03
        │   ├── pages/
        │   │   ├── ListaGPs.tsx
        │   │   └── DetalleGP.tsx
        │   └── services/
        │       └── calendarioService.ts
        │
        ├── competencia/            # EP-04
        │   ├── pages/
        │   │   ├── Pilotos.tsx
        │   │   └── Escuderias.tsx
        │   └── services/
        │       └── competenciaService.ts
        │
        ├── pronosticos/            # EP-05
        │   ├── pages/
        │   │   ├── FormularioPronostico.tsx
        │   │   └── ConfirmarPronostico.tsx
        │   └── services/
        │       └── pronosticosService.ts
        │
        ├── resultados/             # EP-06
        │   ├── pages/
        │   │   └── Clasificacion.tsx
        │   └── services/
        │       └── resultadosService.ts
        │
        ├── historial/              # EP-07
        │   ├── pages/
        │   │   ├── MisPronosticos.tsx
        │   │   └── Ranking.tsx
        │   └── services/
        │       └── historialService.ts
        │
        └── admin/                  # EP-08
            ├── pages/
            │   ├── GestionGPs.tsx
            │   ├── GestionPilotos.tsx
            │   ├── GestionEscuderias.tsx
            │   └── RegistrarResultados.tsx
            └── services/
                └── adminService.ts
```

---

## Mapeo Épica → Módulo backend → Módulo frontend

| Épica | Módulo backend                             | Módulo frontend (React)  |
|-------|--------------------------------------------|--------------------------|
| EP-01 | `modules/auth`                             | `features/auth`          |
| EP-02 | `modules/usuarios`                         | `features/perfil`        |
| EP-03 | `modules/calendario`                       | `features/calendario`    |
| EP-04 | `modules/pilotos` + `modules/escuderias`   | `features/competencia`   |
| EP-05 | `modules/pronosticos`                      | `features/pronosticos`   |
| EP-06 | `modules/resultados`                       | `features/resultados`    |
| EP-07 | consultas en `usuarios` + `resultados`     | `features/historial`     |
| EP-08 | `modules/admin`                            | `features/admin`         |

---

## Notas de diseño

| Contenedor        | Responsabilidad principal                                                        |
|-------------------|----------------------------------------------------------------------------------|
| **Web App**       | UI para usuarios: pronósticos, calendario, historial, ranking (React + Vite)     |
| **Admin Panel**   | CRUD de GPs, pilotos, escuderías; cierre de pronósticos; resultados (React SPA)  |
| **API Backend**   | Toda la lógica de negocio; punto único de acceso a datos (FastAPI)               |
| **Base de Datos** | Persistencia de usuarios, pronósticos, resultados y estadísticas (PostgreSQL)    |
| **Caché (Redis)** | Sesiones JWT y clasificaciones de alta demanda                                   |
| **Auth Service**  | Emisión/validación de JWT y flujo de recuperación de contraseña (python-jose)    |

---

### Modelo de dominio

```mermaid
classDiagram
    direction TB

    class Usuario {
        <<Abstract>>
        +UUID id
        +String nombre
        +String correo
        +String passwordHash
        +iniciarSesion()
        +cerrarSesion()
    }

    class UsuarioRegistrado {
        +boolean correo_verificado
        +String telefono
        +boolean telefono_verificado
        +String kyc_estado
        +UUID gp_gratis_id
        +actualizarPerfil()
        +seleccionarPilotoFavorito(Piloto piloto)
        +seleccionarEscuderiaFavorita(Escuderia escuderia)
        +realizarPronostico(GranPremio gp)
        +comprarPaseTemporada()
    }

    class Administrador {
        +gestionarGranPremio(GranPremio gp, String accion)
        +sincronizarDatosTheSportsDB()
        +registrarResultadosOficiales(GranPremio gp, ResultadoOficial resultado)
    }

    class PaseTemporada {
        +UUID id
        +String estado
        +float monto
        +String stripe_checkout_session_id
        +Date fecha_pago
        +Date fecha_expiracion
        +verificarVigencia()
    }

    class GranPremio {
        +UUID id
        +String nombre
        +String circuito
        +String pais
        +int temporada
        +int ronda
        +Date fecha_inicio
        +Date fecha_carrera
        +boolean finalizado
    }

    class PrediccionAlgoritmica {
        <<Motor Determinista>>
        +String nivelConfianza
        +List observaciones
        +generarProbabilidades()
    }

    class Pronostico {
        +UUID id
        +Date fechaRegistro
        +boolean confirmado
        +int puntos_obtenidos
        +validarCierrePeriodo()
        +calcularAciertos(ResultadoOficial resultado)
    }

    class ResultadoOficial {
        +UUID id
        +Date registrado_en
        +dispararCalculoPuntuaciones()
    }

    class Piloto {
        +UUID id
        +String nombre
        +String nacionalidad
        +int puntos_temporada
    }

    class Escuderia {
        +UUID id
        +String nombre
        +String color
        +int puntos_temporada
    }

    %% Jerarquía de Roles
    Usuario <|-- UsuarioRegistrado
    Usuario <|-- Administrador

    %% Relaciones de Usuario Registrado
    UsuarioRegistrado "1" --> "0..1" PaseTemporada : posee
    UsuarioRegistrado "1" --> "0..*" Pronostico : registra
    UsuarioRegistrado "1" --> "0..1" Piloto : prefiere
    UsuarioRegistrado "1" --> "0..1" Escuderia : prefiere
    UsuarioRegistrado "1" --> "0..1" GranPremio : tiene pronóstico gratis

    %% Relaciones del Administrador
    Administrador "1" --> "0..*" GranPremio : gestiona
    Administrador "1" --> "0..*" ResultadoOficial : publica

    %% Estructura de Carreras y Resultados
    GranPremio "1" *-- "0..1" ResultadoOficial : finaliza con
    GranPremio "1" *-- "0..1" PrediccionAlgoritmica : procesa
    GranPremio "1" --> "0..*" Pronostico : recibe
    Escuderia "1" o-- "1..*" Piloto : posee

    %% Dependencias Físicas (Pronóstico vs Algoritmo vs Realidad)
    Pronostico "1" --> "5" Piloto : predice P1/P2/P3/Pole/VR
    ResultadoOficial "1" --> "5" Piloto : consagra P1/P2/P3/Pole/VR
    PrediccionAlgoritmica "1" --> "3" Piloto : sugiere Podio

```

---

## Plan de Acción: Verificación de Seguridad y KYC (Costo Cero)

Para habilitar el flujo de depósitos y garantizar la autenticidad de los usuarios sin incurrir en costos elevados durante el prototipo y lanzamiento inicial, se implementará el siguiente plan con tecnologías 100% gratuitas en sus niveles iniciales:

### 1. Verificación de Correo (Registro)
* **Herramienta:** **Resend** (Plan Free — 3,000 correos/mes gratis).
* **Propósito:** Validar que la dirección de correo proporcionada al registrarse es real antes de permitir acceso completo a la aplicación.
* **Implementación:**
  1. Durante el registro (`POST /auth/register`), el backend genera un código aleatorio de 6 dígitos con fecha de expiración (15 minutos) en la tabla `codigos_verificacion`.
  2. El backend (FastAPI) envía un email con el código utilizando la API de **Resend**.
  3. El frontend (React) muestra una pantalla de bloqueo de verificación tras el registro donde el usuario ingresa el código.
  4. Al ingresar el código correcto, el backend cambia `correo_verificado = True` y permite el inicio de sesión ordinario.

### 2. Verificación Telefónica (Perfil)
* **Herramienta:** **Firebase Phone Auth** (Spark Plan — 10,000 SMS/mes gratis globales).
* **Propósito:** Reemplazar el costoso e inestable AWS SNS para validar el número de teléfono del usuario antes de habilitar la opción de depósito.
* **Implementación:**
  1. En la página de perfil, el usuario ingresa su teléfono.
  2. El frontend (React) utiliza la librería de Firebase Web SDK para inicializar el captcha invisible y enviar el código SMS directamente al dispositivo móvil.
  3. Firebase se encarga de la entrega de red del SMS sin costo.
  4. El usuario introduce el código recibido en el frontend; el frontend lo valida con Firebase y recibe un token de confirmación de éxito.
  5. El frontend envía este token de verificación al backend (`POST /users/me/verificar-telefono`) para almacenar `telefono_verificado = True` y guardar de forma segura el número en la base de datos.

### 3. Verificación de Identidad (KYC - Cédula y Selfie)
* **Herramienta:** **Didit** (Plan Sandbox/Free — 500 verificaciones KYC/mes gratis para siempre).
* **Propósito:** Reemplazar plataformas empresariales de pago (como Onfido o Veriff) para autenticar la identidad del usuario mediante fotos de su cédula (frente y dorso) y una selfie biométrica (liveness test).
* **Implementación:**
  1. Si el usuario intenta acceder a la sección de depósito y no tiene su identidad verificada, se le redirige automáticamente a su Perfil con un aviso de advertencia.
  2. El frontend solicita al backend un token de sesión de verificación (`POST /users/me/kyc/session`).
  3. El backend (FastAPI) realiza una petición autenticada a la API de **Didit** para iniciar una sesión y se la entrega al frontend.
  4. El frontend renderiza el SDK de Didit (`@didit-protocol/sdk-web`) para guiar al usuario en la captura de su cédula y su rostro.
  5. Una vez completado en la UI, Didit procesa la validez del documento y la foto en segundo plano y notifica el veredicto final mediante un Webhook (`POST /webhooks/didit`) hacia nuestro backend, el cual actualiza el estado en la base de datos a `kyc_estado = 'aprobado'`.
  6. Una vez aprobados el teléfono y el KYC de Didit, el usuario puede acceder a la sección de depósitos.


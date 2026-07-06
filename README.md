# Diagramación Arquitectónica — Plataforma de Pronósticos Deportivos

> Modelado como código en Mermaid.js (estilo C4: Contexto + Contenedores)

---

## Nivel 1 — Diagrama de Contexto del Sistema

```mermaid
C4Context
    title Contexto del Sistema — Plataforma de Pronósticos Deportivos

    Person(visitante, "Visitante", "Usuario no registrado que desea acceder a la plataforma.")
    Person(usuario, "Usuario Registrado", "Realiza pronósticos, consulta calendario, historial y ranking.")
    Person(admin, "Administrador", "Gestiona Grandes Premios, pilotos, escuderías y resultados oficiales.")

    System(plataforma, "Plataforma de Pronósticos Deportivos", "Aplicación web/móvil que permite realizar pronósticos de carreras de Fórmula 1 basados en estadísticas históricas.")

    System_Ext(f1api, "API de Datos F1", "Fuente externa de datos sobre pilotos, escuderías, calendarios y resultados oficiales.")
    System_Ext(email, "Servicio de Email", "Envío de correos para recuperación de contraseña y notificaciones.")

    Rel(visitante, plataforma, "Se registra e inicia sesión")
    Rel(usuario, plataforma, "Realiza pronósticos, consulta calendario, historial y ranking", "HTTPS")
    Rel(admin, plataforma, "Gestiona datos del sistema y resultados oficiales", "HTTPS")
    Rel(plataforma, f1api, "Consume datos de pilotos, escuderías y resultados", "REST/JSON")
    Rel(plataforma, email, "Envía correos de recuperación y confirmación", "SMTP")
```

---

## Nivel 2 — Diagrama de Contenedores

```mermaid
C4Container
    title Contenedores del Sistema — Plataforma de Pronósticos Deportivos

    Person(usuario, "Usuario Registrado", "Realiza pronósticos desde navegador o móvil.")
    Person(admin, "Administrador", "Gestiona el sistema.")

    System_Boundary(plataforma, "Plataforma de Pronósticos Deportivos") {

        Container(webapp, "Aplicación Web", "React", "Interfaz principal para usuarios: calendario, pronósticos, historial y ranking.")

        Container(mobileapp, "Aplicación Móvil", "React Native", "Acceso desde dispositivos móviles a las mismas funcionalidades.")

        Container(adminpanel, "Panel de Administración", "React (SPA)", "Gestión de GPs, pilotos, escuderías y resultados.")

        Container(api, "API Backend", "Node.js", "Lógica de negocio: autenticación, pronósticos, puntuación y rankings.")

        Container(db, "Base de Datos", "PostgreSQL", "Almacena usuarios, pronósticos, resultados, pilotos y escuderías.")

        Container(cache, "Caché", "Redis", "Almacena sesiones activas y datos de clasificación frecuentes.")

        Container(auth, "Servicio de Autenticación", "JWT / OAuth2", "Gestiona tokens de acceso y recuperación de contraseña.")
    }

    System_Ext(f1api, "API de Datos F1", "Datos externos de Fórmula 1.")
    System_Ext(email, "Servicio de Email", "Envío de notificaciones.")

    Rel(usuario, webapp, "Usa", "HTTPS")
    Rel(usuario, mobileapp, "Usa", "HTTPS")
    Rel(admin, adminpanel, "Administra", "HTTPS")

    Rel(webapp, api, "Llamadas a la API", "REST/JSON")
    Rel(mobileapp, api, "Llamadas a la API", "REST/JSON")
    Rel(adminpanel, api, "Llamadas a la API", "REST/JSON")

    Rel(api, db, "Lee y escribe datos", "SQL")
    Rel(api, cache, "Lee y escribe sesiones/clasificación", "Redis Protocol")
    Rel(api, auth, "Valida y genera tokens")
    Rel(api, f1api, "Obtiene datos de pilotos y resultados", "REST/JSON")
    Rel(auth, email, "Solicita envío de correo", "SMTP")
```

---

## Notas de diseño

| Contenedor        | Responsabilidad principal                                           |
| ----------------- | ------------------------------------------------------------------- |
| **Web App**       | UI para usuarios: pronósticos, calendario, historial, ranking       |
| **Mobile App**    | Misma experiencia en dispositivos móviles                           |
| **Admin Panel**   | CRUD de GPs, pilotos, escuderías; cierre de pronósticos; resultados |
| **API Backend**   | Toda la lógica de negocio; punto único de acceso a datos            |
| **Base de Datos** | Persistencia de usuarios, pronósticos, resultados y estadísticas    |
| **Caché (Redis)** | Sesiones JWT y clasificaciones de alta demanda                      |
| **Auth Service**  | Emisión/validación de JWT y flujo de recuperación de contraseña     |

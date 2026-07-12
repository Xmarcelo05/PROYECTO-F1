# Plan de Reconciliación y Cierre del MVP — Pronósticos Deportivos F1

> Elaborado a partir de: `DocPronósticosDeportivosF1.pdf` (backlog original), `HistoriasYEpicas.pdf` (backlog simplificado), el `README.md` (plan de verificación KYC), y el estado **real** actual del código en `PROYECTO-F1-Backend` y `PROYECTO-F1-Frontend`.

---

## 1. Resumen ejecutivo — qué es realmente el producto

Se confirma la reconciliación que pediste: el producto **es** el de `DocPronósticosDeportivosF1.pdf`, no el de `HistoriasYEpicas.pdf`. Concretamente:

- Los usuarios **crean sus propios pronósticos manuales** (ganador, pole, podio, vuelta rápida) por Gran Premio — esto es EP-05 del documento original y **ya existe y funciona en el backend** (`/pronosticos`), pero **no tiene ninguna pantalla en el frontend todavía**.
- El acceso a crear pronósticos está limitado por un **Pase de Temporada de pago** (freemium) — esto es la Épica 8 que agregaron en el "Cambio 3" del documento original, y coincide con la Épica 7 de `HistoriasYEpicas.pdf`. **Ya existe en el backend** (`/acceso`) y el frontend de Perfil ya lo integra (checkout, KYC, teléfono).
- La pantalla de "Predicciones" que yo construí en la sesión anterior como simulación 100% cliente **ya fue reemplazada** por un motor real en el backend (`app/modules/predicciones/motor.py`): un algoritmo estadístico determinista (no IA) que combina puntos de campeonato, rendimiento histórico en el circuito y forma reciente. Es contenido informativo público, separado de los pronósticos que el usuario apuesta.
- Se agregó verificación de correo (Resend), teléfono (Firebase, simulado en `.env`) y KYC (Didit, simulado) como requisito para poder comprar el Pase de Temporada — esto no estaba en ninguno de los dos backlogs originales, es una decisión posterior documentada solo en el README.

**Conclusión:** hay dos productos coexistiendo en los documentos que enviaste — el backend ya implementó una síntesis propia de ambos (pronósticos manuales + suscripción + predicción informativa algorítmica + KYC). El frontend se quedó atrás en una sola pieza: **no hay pantalla para que el usuario cree/edite/confirme su pronóstico**, que es el corazón del producto.

---

## 2. Backlog unificado (Doc original + HistoriasYEpicas), con estado real

| Épica | HU origen | Descripción | Estado |
|---|---|---|---|
| EP-01 Usuarios | HU-01 a HU-04 | Registro, login, recuperar contraseña, logout | ✅ Backend + Frontend (+ verificación de correo, no prevista en ningún backlog) |
| EP-02 Perfil | HU-05 a HU-07 | Editar perfil, piloto/escudería favorita | ⚠️ Backend listo (`PUT /users/me`); Frontend de Perfil actual está enfocado en KYC/pase, **no expone edición de nombre/correo ni favoritos** |
| EP-03 Calendario | HU-08 a HU-10 | Calendario, detalle de GP, estado del evento | ✅ Backend + Frontend. Nota: ya **no** requiere pase para ver el detalle (antes sí, con `gp_gratis_id`) |
| EP-04 Pilotos/Escuderías | HU-11 a HU-14 | Listado y clasificación | ✅ Backend + Frontend |
| EP-05 Pronósticos (manual, del doc original) | HU-15 a HU-20 | Pronosticar ganador/pole/podio/vuelta rápida, editar, confirmar | ⚠️ **Backend 100% listo, Frontend inexistente** — no hay carpeta `features/pronosticos` |
| EP-06 Resultados y clasificación | HU-21, HU-22 | Resultados oficiales, clasificación del campeonato | ✅ Backend + Frontend (ya público, sin pase) |
| EP-07 Historial y estadísticas | HU-23 a HU-26 | Mis pronósticos, aciertos/fallos, puntuación, ranking | ⚠️ **Backend 100% listo (`/users/me/pronosticos`, `/users/me/estadisticas`, `/ranking`), Frontend inexistente** |
| EP-08 Admin | HU-27 a HU-31 | CRUD GP/pilotos/escuderías, registrar resultados, abrir/cerrar pronósticos | ✅ CRUD completo en Backend + Frontend. HU-31 (abrir/cerrar manualmente) **no existe**: el cierre es automático al llegar `fecha_inicio` del GP (decisión de diseño ya tomada, no es una brecha) |
| EP-07 (HistoriasYEpicas) Suscripción y límites | HU-21/32 a HU-25/36 | Pronóstico gratis limitado, suscripción premium, cancelar, gestionar | 🔀 **Parcial y con una contradicción real** — ver §4.1 |
| — (nuevo, no está en ningún backlog) | — | Predicciones algorítmicas informativas | ✅ Backend + Frontend, público |
| — (nuevo, no está en ningún backlog) | — | Verificación de correo / teléfono / KYC | ✅ Backend + Frontend (Perfil) |

---

## 3. Investigación: cómo funcionan los sitios de pronósticos reales

Resumen aplicado a este proyecto (fuentes al final):

1. **Nunca se presentan como casas de apuestas.** Los sitios de "tipsters" (ProTipster, Tipstrr, TipMaster, Betting Gods) se posicionan como *contenido informativo/de entretenimiento*, no como operadores de juego. Muestran un disclaimer visible: uso informativo, sin garantías, 18+, "juega responsablemente". **Recomendación:** agregar un disclaimer fijo (footer o banner) en toda la plataforma. No hace falta cumplimiento regulatorio de casino (self-exclusion, licencias estatales) porque el producto no procesa apuestas con dinero real de terceros ni paga premios en efectivo — es un juego de puntos con pase de acceso, más parecido a una fantasy league que a una casa de apuestas. Aun así, el disclaimer de "entretenimiento, no es asesoría financiera/de apuestas" es barato de implementar y evita malentendidos (importante para un proyecto universitario evaluado por terceros).
2. **La transparencia del historial es lo que genera confianza.** Plataformas serias (Tipstrr, Betting Gods) verifican y bloquean la edición de picks después de publicados, y muestran el récord histórico real (aciertos/fallos) de cada usuario o tipster de forma pública. Esto mapea **exactamente** con lo que ya modela el backend: `pronostico.confirmado` (no editable tras confirmar) + `puntos_obtenidos` + `/ranking`. **La brecha no es de backend, es que el frontend no muestra nada de esto todavía.**
3. **Indicador de confianza simple, no un número pseudo-científico.** Los sitios usan etiquetas como "Bet of the Day" o 1-5 estrellas, no "73.42% de probabilidad". El motor de predicciones del backend ya devuelve `nivel_confianza: bajo/medio/alto` — es el patrón correcto, hay que asegurarse de que el frontend lo use como elemento central y no lo entierre.
4. **Freemium con límite claro, no todo-o-nada.** El patrón estándar (y el que describe `HistoriasYEpicas.pdf` con HU-21/HU-32 "pronóstico gratuito") es dejar probar el producto gratis de forma limitada antes de pedir pago. El backend actual **no** implementa eso (ver §4.1) — es la brecha de producto más importante a decidir.
5. **Mobile-first y formularios simples.** El formulario de "hacer mi pronóstico" debe ser un solo paso claro (elegir P1/P2/P3/pole/vuelta rápida desde selects o tarjetas de piloto), con un resumen antes de confirmar — igual que HU-20 ("debe mostrar un resumen antes de confirmar").

**Fuentes:**
- [Sports Betting UI/UX: Strategic Guide for Sportsbooks](https://www.gammastack.com/blog/sports-betting-ui-ux-guide/)
- [Free Betting Tips, Predictions & Best Bet Offers | ProTipster](https://www.protipster.com/)
- [Tipster Prediction - Free Football Prediction Site](https://www.tipsterspredict.com/)
- [Tipstrr - Betting tips from professional tipsters](https://tipstrr.com/)
- [Compare Verified Betting Tipsters | Betting Gods](https://bettinggods.com/tipsters/)
- [TipMaster - Verified Sports Tipping Platform](https://tipmaster.ai/)
- [Responsible Gaming Regulations and Statutes Guide - AGA](https://www.americangaming.org/resources/responsible-gaming-regulations-and-statutes-guide/)

---

## 4. Decisiones de producto que hay que tomar antes de programar

### 4.1 — Contradicción real: ¿existe el "pronóstico gratis" o no?

- `HistoriasYEpicas.pdf` (HU-21, HU-32) y el "Cambio 3" del doc original dicen: *"sin suscripción, el usuario puede realizar únicamente un pronóstico en una sola carrera"*.
- El backend actual (`verificar_pase_pronosticos`) **no implementa esto**: sin pase activo, un usuario no-admin no puede crear **ningún** pronóstico (402 directo). El campo `gp_gratis_id` sigue en la tabla `usuarios` pero ya no lo usa ninguna dependencia — quedó huérfano de la refactorización anterior.
- **Investigación de mercado (confirmada):** este es un patrón real y muy común en sitios de pronósticos/tipsters — PickDawgz, Ftipster, WagerTalk, ProTipster y Pickswise ofrecen todos algún pick gratis limitado (por día, o "el pick del día") junto con una suscripción de pago para acceso ilimitado. No es una idea forzada del backlog académico, es el modelo freemium estándar de la industria.
- **Decisión tomada: SÍ, implementarlo.** Reenganchar `gp_gratis_id` en `verificar_pase_pronosticos` (backend) y reflejar el estado "pronóstico gratis disponible / usado / necesitas el pase" en el frontend.

### 4.2 — ¿La pantalla de Predicciones (algorítmica) debe requerir login? — ✅ Resuelto

Decisión tomada: **pública**. Ya aplicado:
- `App.tsx`: `/predicciones` se movió fuera de `<PrivateRoute />`.
- `Navbar.tsx`: el link "Predicciones" se movió a `linksPublicos`, visible para cualquier visitante.
- Verificado: `npm run build` y `tsc -b` sin errores tras el cambio.

---

## 5. Brechas a cerrar para que el MVP funcione como una plataforma real

Ordenadas por impacto en la "sensación de producto real":

1. **`features/pronosticos` (crítico, es el corazón del producto).** Falta por completo:
   - `pronosticosService.ts` → `POST /pronosticos`, `PUT /pronosticos/{id}`, `POST /pronosticos/{id}/confirmar`, `GET /pronosticos/gp/{gp_id}`.
   - `MiPronostico.tsx` (en la página de detalle del GP o accesible desde ahí): selección de P1/P2/P3/pole/vuelta rápida, validación de podio sin repetidos (ya la valida el backend, pero conviene repetirla en cliente para UX), resumen antes de confirmar (HU-20), bloqueo de edición si `confirmado = true` o si ya pasó `fecha_inicio`.
   - Manejo del 402 (`verificar_pase_pronosticos`) reutilizando el patrón que ya existe en Perfil para dirigir al usuario a comprar el pase.
2. **`features/historial` (EP-07, ya tiene 100% del backend listo).**
   - `MisPronosticos.tsx` → `GET /users/me/pronosticos`, cruzada con el nombre del GP y de los pilotos elegidos.
   - `MisEstadisticas.tsx` o una sección dentro de Perfil → `GET /users/me/estadisticas` (aciertos de pole, vuelta rápida, podio, puntos totales).
   - `Ranking.tsx` → `GET /ranking`, tabla pública ordenada por puntos — esto es exactamente el elemento de "transparencia/track record" que la investigación (§3.2) identifica como el que genera confianza en un sitio de pronósticos real.
3. **Enlazar todo desde la navegación y desde el detalle del GP.** Hoy `DetalleGP.tsx` solo enlaza a resultados; debe enlazar también a "Mi pronóstico para este GP" cuando el GP está en estado `proximo`.
4. **Resolver 4.1 y 4.2** antes de tocar código, para no construir la pantalla de pronósticos con el supuesto equivocado.
5. **Disclaimer de juego responsable / uso informativo** (barato, alto valor percibido) — un banner fijo o bloque en el Footer: *"Pronósticos F1 es un juego de predicción con fines de entretenimiento. No constituye una casa de apuestas ni asesoría financiera. Uso para mayores de 18 años."*
6. **Perfil (EP-02) incompleto** — falta edición de nombre/correo y selección de piloto/escudería favorita (`PUT /users/me` ya soporta ambos campos), la pantalla actual de Perfil solo cubre KYC/teléfono/pase.

---

## 6. Plan de verificación y seguridad (del README, + una adición)

El README ya documenta el plan vigente y **se mantiene sin cambios**:

1. **Correo** (Resend, 3,000/mes gratis): código de 6 dígitos, expira en 15 min, bloquea login hasta verificar. *(Implementado)*
2. **Teléfono** (Firebase Phone Auth, 10,000 SMS/mes gratis): captcha invisible + SMS, token de confirmación se valida en backend. *(Implementado, en modo simulado en `.env`)*
3. **KYC** (Didit, 500 verificaciones/mes gratis): sesión de verificación de cédula + selfie, veredicto por webhook (`kyc_estado`). *(Implementado, en modo simulado)*
4. Solo con teléfono y KYC aprobados se habilita la compra del Pase de Temporada (`/acceso/checkout`).

**Adición recomendada, no estaba en el README:** dado que ahora los pronósticos SÍ tienen consecuencia de puntos/ranking públicos ligados a la identidad del usuario, conviene:
- Agregar el disclaimer de juego responsable del punto 5 anterior.
- Confirmar que el checkbox de mayoría de edad (18+) se pida explícitamente en el registro o antes del primer pronóstico — hoy no se pide en ningún punto del flujo.

---

## 7. Próximos pasos (decisiones ya tomadas — listo para ejecutar)

1. ~~Resolver las decisiones §4.1 y §4.2~~ ✅ Ambas resueltas: predicciones públicas (ya aplicado), pronóstico gratis SÍ se implementa.
2. **Backend:** reenganchar `gp_gratis_id` en `verificar_pase_pronosticos` (`app/modules/acceso/dependencies.py`): admin, o pase activo, o `usuario.gp_gratis_id == gran_premio_id` del pronóstico → permitido. Si el usuario no tiene `gp_gratis_id` asignado aún, asignarle el próximo GP (misma lógica que existía antes en `verificar_acceso`, hoy removida).
3. Construir `features/pronosticos` (crear/editar/confirmar) — el bloqueador real para que el "juego" funcione de punta a punta. Debe mostrar claramente si el usuario está usando su pronóstico gratis o su pase de temporada.
4. Construir `features/historial` (mis pronósticos, estadísticas, ranking).
5. Completar EP-02 (perfil/favoritos) y el disclaimer de juego responsable.
6. Verificar de nuevo end-to-end en navegador (registro → verificar correo → pronóstico gratis en el GP asignado → intento de pronóstico en otro GP → paywall → comprar pase simulado → pronóstico ilimitado → admin registra resultado → ver puntos reflejados en historial y ranking).

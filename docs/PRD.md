# PRD — Lobby

**Versión:** 1.0 · **Fecha:** Julio 2026 · **Owner:** Christian
**Estado:** Aprobado para desarrollo de v1

---

## 1. Visión

Jahuga es una plataforma social web donde grupos de amigos se enfrentan en minijuegos, acumulan Coins con su habilidad, construyen su identidad con avatares y skins, y compiten por reputación. La referencia de experiencia es chess.com (retar / jugar / vs máquina / buscar rival) con la identidad visual y el sistema de avatares de un lobby estilo Fortnite.

**Tesis de producto:** la diversión no está solo en los minijuegos, está en la capa social — el historial contra tu amigo, la racha, la apuesta de coins, la frase icónica en el perfil. La plataforma es el producto; los minijuegos son contenido.

**Visión de largo plazo (no v1):** grupos de amigos enfrentándose a otros grupos por dominación de zonas en un mapa, con avatares 3D personalizados reutilizables en todos los minijuegos.

## 2. Usuarios

- **v1:** el grupo de amigos del fundador (~5–15 personas). Producto privado, invite-only en la práctica.
- **Futuro:** cualquier grupo de amigos que quiera su propio espacio de competencia.

Implicancia de diseño: en v1 no hay problema de descubrimiento ni de masa crítica. Se optimiza por profundidad de enganche del grupo, no por adquisición.

## 3. Principios de producto

1. **Habilidad, no azar ni billetera.** Las Lobby Coins solo se ganan jugando (partidas, misiones, rachas, torneos). No se compran. No se retiran. No existe dinero real en la economía. Esto es una restricción de diseño permanente, no una limitación temporal.
2. **El avatar es de la plataforma, no del juego.** Un solo Avatar por usuario, consumido por todos los minijuegos. Skins y accesorios se equipan una vez y aparecen en todos lados.
3. **Cada minijuego es un módulo.** Cumple el contrato del Game SDK (recibe jugadores, reporta resultado) y no conoce la economía ni el social graph.
4. **Mobile-first.** La mayoría de las partidas van a ocurrir desde el celular. PWA instalable.

## 4. Funcionalidades v1 (scope cerrado)

### 4.1 Cuentas y onboarding
- Registro con nickname (único), correo y contraseña (validación de fortaleza + confirmación). Auth vía Supabase Auth.
- Wizard post-registro: nombre, fecha de nacimiento (la edad se deriva, no se pide), foto de perfil.
- Perfil público o privado (toggle). Link de invitación de amistad compartible.

### 4.2 Perfiles
- Foto, nickname, nombre, edad, cumpleaños, frases icónicas (lista editable), stats (partidas jugadas, ganadas, winrate por minijuego), balance de coins, skins equipadas.
- Avatar 2D en v1 (ver §6). El modelo de datos ya contempla avatar 3D.

### 4.3 Amigos
- Solicitud de amistad por nickname o por link de invitación. Aceptar / rechazar. Lista de amigos.

### 4.4 Grupos
- Crear grupo: nombre, descripción, imagen, fecha de creación visible.
- Invitar miembros por nickname. Un usuario puede pertenecer a un grupo (v1: uno solo; el modelo de datos soporta N).
- Página del grupo: miembros, stats agregadas.

### 4.5 Desafíos y partidas
- Flujo estilo chess.com: elegir minijuego → **Jugar** (vs máquina) o **Retar** (elegir amigo de la lista o buscar usuario).
- Al retar se define: minijuego, modo (amistoso / con apuesta), monto de coins si aplica.
- El retado recibe la invitación y acepta o rechaza. Si hay apuesta, ambos montos quedan **en escrow** al aceptar; el ganador se lleva el pozo.
- Dos modos de resolución: **en vivo** (ambos conectados, turno a turno con revelación penal por penal — modo por defecto) y **asíncrono** (cada uno juega cuando puede, estilo Wordfeud).
- Vs máquina: bot con dificultades; no otorga coins apostadas (puede otorgar recompensas de misión).

### 4.6 Economía — Lobby Coins
- Fuentes: bono de bienvenida, victoria en partidas con apuesta, misiones, racha diaria (day streak), torneos (futuro), cupones/regalos del admin.
- Usos: apuestas en desafíos, transferencias entre usuarios (con límites anti-abuso), compra de skins con coins.
- Sumideros (importante para que la economía no se infle): costo de skins, ¿fee de rake en apuestas? → ver decisiones abiertas.
- Toda la contabilidad vía ledger inmutable (ver modelo de datos).

### 4.7 Primer minijuego: Tandas de Penales
- Spec completa en `docs/minijuego-penales.md`. Resumen: 5 penales por lado, cada jugador define patear + atajar, decisión simultánea, resolución determinística en servidor.

### 4.8 Home / Lobby principal
- Al ingresar: tu avatar en grande (2D en v1, con la composición pensada para el 3D futuro), botón **Jugar** prominente, selector de minijuegos en scroll vertical (cards), acceso a grupo, wallet visible, notificaciones de retos pendientes.
- Referencia visual: lobby de Fortnite adaptado a mobile.

### 4.9 Plataforma
- PWA: instalable, manifest, service worker, funciona a pantalla completa en el celular.
- Responsive real: diseñado a 390px primero.
- Notificaciones in-app de retos (push notifications: fase posterior).

## 5. Fuera de scope v1 (backlog explícito)

- Torneos automatizados y brackets.
- Batallas de grupo vs grupo y mapa de dominación de zonas.
- Avatares 3D (Ready Player Me u otro pipeline) y skins 3D.
- Compra de cosméticos con dinero real (si algún día se hace: solo cosméticos, moneda separada no apostable ni transferible).
- Editor de skins tipo Roblox.
- Partidas de más de 2 jugadores.
- Segundo minijuego en adelante (trivia, cartas RPG, carrera 3D).
- Push notifications, apps nativas en stores (Capacitor como camino si hace falta).
- Chat dentro de la plataforma.

## 6. Decisión de avatares (resuelta para v1)

- **v1: avatar 2D** — foto de perfil del usuario compuesta sobre cuerpo ilustrado de jugador ("sticker"), con variantes de pose para los contextos: lobby (parado), penales (pateando / atajando). Skins v1 = camisetas/colores sobre el cuerpo ilustrado.
- **Futuro: avatar 3D.** Camino candidato: Ready Player Me (selfie → GLB) renderizado con React Three Fiber. La entidad `avatars` del modelo de datos ya tiene campos para ambos formatos.

## 7. Métricas de éxito v1

- ≥ 80% del grupo fundador creó cuenta y jugó al menos 1 partida en la primera semana.
- ≥ 3 partidas por usuario activo por semana a las 4 semanas.
- ≥ 50% de las partidas son con apuesta de coins (señal de que la economía importa).
- Al menos una rivalidad visible (par de usuarios con 10+ enfrentamientos).

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Scope creep (patrón conocido) | Roadmap por fases con gates; ideas nuevas van al backlog, no al sprint |
| El minijuego no es divertido → nada más importa | Fase de prototipo jugable del sistema de penales antes de construir social |
| Economía inflacionaria (coins entran, no salen) | Ledger + sumideros desde el día 1; monitorear masa monetaria |
| Trampa (ver movimientos del rival, resolver en cliente) | Resolución server-side, commit oculto de movimientos, RLS estricto |
| Un solo desarrollador | Cada fase termina en algo usable; no hay fases de infraestructura pura |

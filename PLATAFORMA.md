# Boston Global Business — Especificación de plataforma (fases de backend)

Este documento acompaña al diseño `Boston Global Business.dc.html`. El diseño es
la capa de presentación; **las fases A–D, F, G y H del brief requieren un
repositorio de aplicación real** (base de datos, servidor, autenticación,
almacenamiento privado, correo transaccional, tests y build). Este documento es
la especificación de handoff para implementarlas.

## Estado actual del proyecto

| Capa | Estado |
| --- | --- |
| Sitio público (home, nosotros, servicios, productos, estadísticas, contacto) | Implementado, bilingüe ES/EN |
| Boston Global Trade Network — globo 3D | **Implementado** (`trade-globe.js`, globe.gl + WebGL) |
| Datos de rutas | `trade-routes.seed.json` — seed estático verificado, listo para migrar a `trade_routes` |
| Tracking público | Formulario funcional; sin backend devuelve estado "no encontrado" |
| Portal cliente / trabajador, dashboards | Prototipo visual, marcado como demo |
| Base de datos, auth, RBAC, RLS, MFA, storage, email, auditoría | **No implementado** — requiere repositorio de aplicación |

## Lo que sí quedó implementado en esta iteración (frontend, sin backend)

### Globo 3D — `trade-globe.js`

- Web component `<trade-globe lang="es|en">`, reemplaza el mapa 2D en la sección Red Global.
- **Carga diferida**: el módulo globe.gl se descarga solo cuando la sección entra
  en viewport (`IntersectionObserver`, `rootMargin: 200px`). No afecta la carga inicial.
- **Pausa fuera de pantalla**: `pauseAnimation()` cuando el globo no está visible.
- **Fallback**: si no hay WebGL o el dispositivo tiene ≤2 núcleos / ≤1 GB, cae al
  mapa 2D existente (`route-map.js`). También cae al 2D si globe.gl no carga.
- **`prefers-reduced-motion`**: mantiene el globo pero desactiva auto-rotación y
  animación de arcos (`arcDashAnimateTime = 0`).
- **Interacción**: drag para rotar, scroll/pinch para zoom, hover en puerto muestra
  nombre + país, click en puerto o en ruta emite `trade-select` (CustomEvent).
- **Orbital intro**: rotación a 0.85 → baja a 0.18 tras 4.2 s; se detiene de
  inmediato con `pointerdown`, `wheel` o `touchstart`.
- **Colores**: océano `#053B50`, continentes gris azulado, rutas BGB `#64CCC5`,
  otras `#176B87`, atmósfera turquesa. Sin neón.
- **Geografía real**: los arcos usan coordenadas de puerto (lat/lon del seed), no
  centroides de país.
- **Ficha de ruta** en el tooltip: clasificación, origen, destino, carrier,
  frecuencia, transit time, trend score, última verificación y fuente. Los campos
  sin fuente verificada muestran "Pendiente de fuente verificada"; el trend score
  sin datos muestra "Datos insuficientes".

### Datos de rutas — `trade-routes.seed.json`

Estructura alineada con la tabla `trade_routes` del brief. Contiene:

- `ports[]` con `unlocode`, `name`, `country_code`, `lat`, `lon` (Seattle, Tacoma,
  Los Angeles, Long Beach, Houston, Port Everglades, PortMiami, Callao, Paita).
- `routes[]` con `classification`, `bgb_operated`, `is_public`, `source_name`,
  `last_verified`, y `null` explícito en carrier / frecuencia / transit time /
  trend score cuando no hay fuente verificada.
- 3 rutas `BGB_ROUTE` (Seattle→Callao, Los Angeles→Callao, Los Angeles→Paita).
- 2 `MARKET_OPPORTUNITY` con fuente (Port of Los Angeles + USDA AMS;
  Northwest Seaport Alliance). Ninguna se presenta como servicio de BGB.

Migración: cada objeto de `routes[]` corresponde a una fila de `trade_routes`;
cada `source_name`/`source_url`/`last_verified` a una fila de `route_sources`.

## Fases pendientes — requieren repositorio de aplicación

### Fase A — Base de datos, auth, RBAC

Tablas: `organizations`, `profiles`. Tipos de usuario `client` / `worker`;
roles `client`, `admin`, `operations`, `documentation`, `logistics`,
`commercial`, `readonly`. RLS obligatoria:

```sql
-- Un cliente solo ve embarques de su organización
create policy client_reads_own_org on shipments for select
  using (organization_id = (select organization_id from profiles
                            where auth_user_id = auth.uid()));
```

Registro público **solo** para clientes. Cuentas de trabajador únicamente por
invitación de administrador. MFA obligatoria para `worker` (email OTP mínimo,
TOTP después). Verificación de email antes de acceder a información privada.

### Fase B — Embarques, contenedores, tracking

Tablas: `shipments`, `shipment_containers` (1..n por embarque),
`shipment_identifiers` (tracking / bl / booking / container / customer_reference,
con `normalized_identifier` para búsqueda), `shipment_events`.

- Tracking `BGB-2026-000001`, UNIQUE, más `public_uuid` interno. El secuencial
  nunca es el identificador de seguridad.
- Validación ISO 6346 (4 letras + 7 dígitos + check digit) con revisión manual
  permitida para trabajadores autorizados.
- Timeline generado desde `shipment_events` reales — nunca mostrar etapas que la
  operación no tiene (por ejemplo `transshipment` si no hubo transbordo).
- Cada evento guarda `data_source` (`MANUAL_BGB`, `CARRIER_API`, `TERMINAL_API`,
  `CENSUS`, `PORT_AUTHORITY`, `ADMIN_RESEARCH`), `event_timestamp` y `raw_event`.
- "Última actualización" = timestamp del último evento real, nunca `Date.now()`.
- Anti-enumeración en el tracking público: rate limiting por IP, throttling, logs,
  CAPTCHA solo ante comportamiento sospechoso.
- Tracking público expone solo: estado, origen, destino, puertos, ETD, ETA,
  último milestone público, última actualización. Nunca cliente, invoice, precios,
  contactos ni documentos.

### Fase C — Portales reales

Sustituir los dashboards demo por consultas reales. Estados vacíos:
"Todavía no tienes operaciones registradas." / "No existen operaciones para
mostrar." Nunca datos seed en producción. Diferenciar ETD/ATD y ETA/ATA; cada
cambio de ETA queda en `audit_logs` conservando el valor anterior.

### Fase D — Documentos, notas, notificaciones, auditoría

`documents` en bucket privado con signed URLs temporales; autorización antes de
la descarga; el path nunca es el mecanismo de autorización. `shipment_notes` con
`note_type` `internal` | `customer` — las internas nunca salen en una respuesta
de API dirigida a un cliente. `notifications`, `exceptions`, `audit_logs`.
Soft delete (`deleted_at`) en shipments, documents y trade routes.

### Fase F — Estadísticas de comercio

`trade_statistics` con `hs_code`, `period`, `export_value_usd`, `quantity`,
`quantity_unit`, `source`, `retrieved_at`. Job mensual que consulta el U.S.
Census Bureau (`CENSUS_API_KEY` **solo en backend**) para HS 080810 y 080510 con
destino Perú, guarda snapshot y sirve desde caché. Nunca consultar Census en cada
visita. Los gráficos leen de la tabla, no de literales en el código.

### Fase G — Trend Score y ruta en tendencia

Score 0–100 con pesos configurables (30% crecimiento comercial reciente, 25%
cambios de frecuencia/capacidad, 20% exportaciones cargadas del gateway, 15%
nuevo servicio o expansión, 10% otros indicadores). Si faltan variables:
"Datos insuficientes para calcular una tendencia confiable" — nunca un score
inventado. Publicación solo tras aprobación humana en `/admin`.

### Fase H — Adaptadores de carrier

Interfaz `CarrierTrackingProvider` (`trackContainer`, `trackBillOfLading`,
`getEvents`, `getETA`, `getVessel`). Adaptadores reales solo cuando existan API,
documentación y credencial. Sin credenciales, el estado interno es
"Carrier integration not configured" y el trabajador actualiza manualmente.

## Variables de entorno requeridas

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CENSUS_API_KEY=
EMAIL_API_KEY=
EMAIL_FROM=
APP_URL=
# Futuras, solo cuando existan contratos de API
MAERSK_API_KEY=
MSC_API_KEY=
ONE_API_KEY=
```

`.env` en `.gitignore`; nunca secretos en el frontend.

## Tests obligatorios antes de considerar la plataforma lista

1. Cliente A intenta leer un embarque de Cliente B por URL, API o ID modificado → 403.
2. Cliente abre un documento con `customer_visible = false` conociendo la URL → 403.
3. Una nota `internal` nunca aparece en una respuesta de API a un cliente.
4. Generación de tracking: unicidad bajo concurrencia.
5. Validación ISO 6346, incluido el check digit.
6. Login: no revelar si el email existe ("Credenciales incorrectas").
7. Trend score con variables faltantes → "datos insuficientes", nunca un número.
8. Registro público de trabajador → rechazado.

## Requiere credenciales externas (no implementable sin accesos)

- Supabase / PostgreSQL gestionado.
- Proveedor de email transaccional (Resend / Postmark / SendGrid).
- U.S. Census Bureau API key.
- APIs de navieras (Maersk, MSC, ONE, CMA CGM, Hapag-Lloyd, ZIM).
- Object storage privado con signed URLs.


---

# Reposicionamiento comercial y SEO (agosto 2026)

## Copy: títulos anteriores → nuevos

| Antes | Ahora |
| --- | --- |
| Comercio internacional sin complicaciones | Fruta de Estados Unidos. Directa para tu negocio. |
| Coordinación completa de tu operación (Servicios) | Nos encargamos de lo complejo |
| Nos encargamos de cada etapa (Cómo trabajamos) | Del huerto a tu almacén |
| Un agente asignado a tu operación (Por qué BGB) | No solo movemos fruta. Abrimos acceso. |
| Rastrea tu carga | Tu carga, siempre visible |
| Boston Global Trade Network | Donde está el mercado, trazamos la ruta + Boston Global Trade Network |
| ¿Tienes una carga por movilizar? | ¿Qué fruta necesita tu negocio? |
| Cuéntanos sobre tu operación (Cotización) | ¿Buscas abastecimiento desde USA? |
| Solicitar cotización (submit del formulario) | Solicitar propuesta |

CTA del hero: "Consultar disponibilidad" (principal) + "Solicitar cotización"
(secundario) + enlace "Conocer nuestros productores".

## Secciones nuevas

1. **`#b2b` — ¿Para quién trabajamos?** Cuatro tarjetas: importadores,
   distribuidores y mayoristas, supermercados, empresas que venden fruta. Distintivo
   "SOLUCIONES B2B · Importadores · Distribuidores · Mayoristas · Supermercados".
2. **`#origen` — Acceso directo al origen.** Tres bloques de valor
   (ACCESO / CONTROL / VISIBILIDAD), tarjeta premium de productor destacado y
   carrusel "Marcas que conectamos con tu mercado" con filtros por fruta.

## Productores publicados

**Ninguno con relación comercial verificada.**

`Evans Fruit Company` se presenta como **referencia de mercado**
(`relationship_status = MARKET_REFERENCE`): datos públicos del productor
(Washington, más de seis décadas, variedades conocidas) sin afirmar relación
comercial, distribución oficial ni exclusividad. La insignia "Acceso comercial BGB"
y el texto de acceso confirmado están **desactivados** hasta que Boston lo confirme.

Para activarlo: prop `evansRelationship` → `VERIFIED_BGB_ACCESS` o
`ACTIVE_SUPPLIER` (panel de Tweaks). Solo esos dos estados publican un productor
en el carrusel; `MARKET_REFERENCE` y `COMMERCIAL_CONTACT` nunca aparecen como
proveedor de BGB.

El carrusel muestra hoy su estado vacío con la explicación correspondiente. No se
reproduce ningún logotipo de terceros: las tarjetas son tipográficas.

## SEO implementado en el Home

| Elemento | Valor |
| --- | --- |
| Title | Importación de frutas desde USA a Perú \| Boston Global Business |
| Meta description | Conectamos importadores, distribuidores y supermercados con productores de fruta fresca en Estados Unidos. Gestionamos documentación, transporte y seguimiento hasta Perú y otros destinos. |
| H1 | Fruta de Estados Unidos. Directa para tu negocio. |
| Keyword principal | importación de frutas de Estados Unidos a Perú |
| Canonical | `https://bostonglobalbusiness.com/` |
| Structured data | `Organization` + `WebSite` (JSON-LD). Sin `Product` — no hay precio, stock ni reviews reales, y añadirlos sería falso. |
| Open Graph | og:type, og:title, og:description, og:url |
| `robots.txt` | Creado. Disallow en /login, /register, /client/, /operations/, /admin/ |
| `sitemap.xml` | Creado con las 8 URLs públicas previstas |

## Pendiente — requiere sitio con routing real

Las landing pages por producto (`/frutas-usa`, `/manzanas-estados-unidos`,
`/manzanas/granny-smith`, `/manzanas/red-delicious`,
`/naranjas-estados-unidos`, `/productores-usa`,
`/logistica-frutas-usa-peru`, `/insights`) necesitan un framework con rutas
(Next.js) para tener title, meta description, H1, canonical y contenido propios.
Aquí el sitio es una sola página: crear esas URLs no es posible. El `sitemap.xml`
ya las declara para cuando existan.

Igualmente pendiente por la misma razón: `noindex` por ruta privada, SSR/SSG,
breadcrumbs con `BreadcrumbList`, tablas `producers` / `brands` /
`fruit_varieties` administrables, eventos de analítica
(`quote_request_submitted`, `producer_clicked`, etc.), y persistencia de
`quote_requests`.

## Imágenes

Los espacios de imagen del sitio son marcadores que el equipo rellena. Al subir las
fotos reales, usar nombres y alt descriptivos:

| Espacio | Filename sugerido | Alt sugerido |
| --- | --- | --- |
| Hero | `puerto-contenedores-buque-carga-usa-peru.webp` | Puerto internacional con contenedores y buque de carga |
| Productor destacado | `evans-fruit-huerto-manzanas-washington.webp` | Huerto de manzanas en Washington, Estados Unidos |
| Granny Smith | `manzana-granny-smith-washington-usa.webp` | Manzanas Granny Smith de Washington preparadas para exportación |
| Red Delicious | `manzana-red-delicious-usa-exportacion.webp` | Manzanas Red Delicious de Estados Unidos en presentación de exportación |
| Naranja | `naranja-fancy-estados-unidos.webp` | Naranjas U.S. Fancy en cajas comerciales de exportación |

Formato AVIF o WebP, `srcset` responsive, lazy loading en todo salvo la imagen
LCP del hero.


---

# Número de carpeta en el módulo de tracking (agosto 2026)

## Implementado en el frontend

Cuarto método de búsqueda **NÚMERO DE CARPETA** dentro de "Tu carga, siempre
visible", con la misma tipografía, colores, tamaño de input y estilo de botón que
los tres existentes.

- Distribución 2×2. **Desktop:** Tracking | BL / Container | Carpeta.
  **Móvil:** una columna, con las referencias propias de BGB primero
  (Tracking → Carpeta → BL → Container).
- Búsqueda rápida: placeholder ahora "Tracking, carpeta, BL o Container".
- **Scanner effect** (~700 ms) reutilizado en los cuatro métodos y en la búsqueda
  rápida; no se creó una animación distinta para el campo nuevo.
- Icono outline de carpeta en `#64CCC5`; cada método tiene su propio icono lineal.
- Accesibilidad: `<label for>` real por campo, `autocomplete="off"`, Enter
  envía el formulario, focus visible en turquesa.
- Columna **Carpeta** añadida a la tabla del dashboard de trabajadores.

## Detección automática de la búsqueda rápida

Orden de comprobación, tal como se pidió:

1. `BGB-\d{4}-\d{4,8}` → Tracking BGB
2. `[A-Z]{4}\d{7}` → Container (ISO 6346)
3. Solo dígitos (3–8) → **ambiguo**: podría ser carpeta o un BL numérico, así que
   se muestra "Encontramos más de un tipo de referencia asociado…" en lugar de
   elegir arbitrariamente
4. Alfanumérico largo → Bill of Lading
5. Resto → otra referencia

Cuando el tipo es inequívoco se muestra "Detectado: …".

## Pendiente — requiere backend

- **Modelo de datos.** Antes de elegir entre `shipments.folder_number` y una
  tabla `folders` con `shipments.folder_id`, hay que confirmar con Boston si
  una carpeta agrupa **una** operación o **varias** (varios BL / containers /
  embarques). Si agrupa varias, la relación correcta es 1 carpeta → N embarques y
  `folder_number` **no** debe ir suelto en cada shipment. Tampoco aplicar
  `UNIQUE` sin esa confirmación.
- **Formato del número.** El placeholder usa "Ingrese número de carpeta" sin
  imponer patrón: no se inventó una máscara. Cuando Boston indique su formato real,
  aplicarlo al input y a la validación.
- **Coincidencia exacta.** La consulta debe ser exacta sobre `folder_number`
  (buscar `548` nunca devuelve la carpeta `54821`), para no permitir
  enumeración por prefijo.
- **Tracking público por carpeta** no otorga acceso adicional: mismos campos
  públicos que el resto (estado, origen, destino, ETD, ETA, último milestone
  público, última actualización).
- **Cliente autenticado:** verificar que la carpeta pertenece a su organización;
  si no, responder "No encontramos una operación disponible con esa referencia"
  sin revelar que pertenece a otra empresa.
- **Filtros del dashboard de trabajadores** por carpeta contra datos reales.
- **Creación de embarque:** decidir con Boston si el número de carpeta es manual
  o generado; no alterar su procedimiento administrativo actual.
- **Resultado encontrado:** mostrar "Referencia consultada: Carpeta Nº XXXXX"
  sobre el tracking normal.
- **Seguridad:** rate limiting, sanitización, validación server-side y detección
  de abuso equivalentes a los demás métodos.
- **Analítica:** evento `tracking_folder_search` registrando solo el método
  empleado, nunca el número de carpeta.


---

# Encuadre, idiomas y Red Global (agosto 2026)

## ENCUADRE CORREGIDO

**Causa real del desplazamiento**, encontrada revisando el código y no parcheando
con márgenes: la columna del globo en `#rutas` llevaba
`margin-left: clamp(20px,3vw,48px)` (variable `routeMapIndent`). Ese indent
manual empujaba el bloque completo hacia la derecha dentro de un grid que ya estaba
centrado. Se eliminó la variable y la declaración.

Además:

- `#rutas` usa ahora el **mismo contenedor** que el resto:
  `max-width:1280px; margin:0 auto; padding:clamp(64px,7vw,96px) clamp(20px,5vw,48px)`.
  El padding vertical bajó de `clamp(72px,9vw,128px)` a `clamp(64px,7vw,96px)`
  (72–96px en desktop) porque la sección quedaba innecesariamente alta.
- El **header** pasó de `clamp(18px,4vw,48px)` a `clamp(20px,5vw,48px)`, de modo
  que el logo comparte la línea izquierda con el contenido de las secciones.
- Grid del panel: `minmax(0,46fr) minmax(0,54fr)` con `gap: clamp(64px,6vw,96px)`
  y `align-items:center`, para compensar ópticamente el volumen visual del globo.

**Medición tras el cambio:** todas las secciones alinean su contenido a la misma
distancia de ambos bordes (46px / 46px en el ancho medido), header incluido, y
`document.documentElement.scrollWidth === clientWidth` — sin scroll horizontal.
No se usa `100vw` en ninguna parte del proyecto.

## SISTEMA DE IDIOMAS

Auditoría automática de las tablas `COPY.es` / `COPY.en`: **no falta ninguna
clave en ningún idioma** (0 claves presentes en uno y ausentes en el otro).

**Bugs reales encontrados y corregidos** — claves duplicadas dentro del mismo
objeto, donde la última definición ganaba en silencio:

| Clave | Efecto | Corrección |
| --- | --- | --- |
| `networkEyebrow` | Definida dos veces en **ambos** objetos (ES y EN juntas). La versión inglesa ganaba, así que en español la sección Red Global mostraba "Where the market is, we map the route". | Cada objeto conserva solo su idioma. |
| `fPhone` | `'Teléfono'` (registro) y `'Teléfono / WhatsApp'` (cotización). La segunda ganaba y el registro mostraba la etiqueta equivocada. | La de cotización pasó a `fPhoneWa`. |
| `fEmail` | Duplicada con el mismo valor. | Deduplicada. |

**Textos hardcodeados eliminados:**

- `USA → PERÚ | FRESH PRODUCE LOGISTICS` → `t.freshBadge` (traducido).
- `Core BGB Corridor · USA → Perú` → `t.coreCorridor` (traducido).
- Placeholders `Ej.` / `e.g.` del tracking → claves de copy.

Quedan como literales solo nombres propios verificados: "Boston Global Business",
"Evans Fruit Company", "U.S. Census Bureau", "Washington State University – Tree
Fruit", direcciones, correo, números y nombres de puertos (Seattle, Paita, Callao).
Los subtítulos comerciales de las fichas de producto ("Premium Fresh Orange",
"Granny Smith Apple", "Topred / Red Delicious Apple") son intencionadamente
bilingües: son la denominación comercial del producto.

**Metadatos:** el idioma es una única fuente de verdad (`state.lang`, persistida
en `localStorage`). Al cambiarlo se actualizan `<html lang>`, `<title>`,
`meta description` y Open Graph. Se añadieron `hreflang` es / en / x-default.

## RED GLOBAL

Dos pestañas (`role="tablist"` / `role="tab"` / `aria-selected`):

### Rutas con las que trabajamos — `netTab: 'bgb'`
Subtítulo: "Corredores operativos gestionados regularmente por Boston Global
Business." Etiqueta secundaria "Rutas BGB" conservada en la leyenda. Contenido
intacto: leyenda, distintivo Core BGB Corridor, globo con las rutas del seed,
tarjetas de origen/destino/modalidades y la tira de imágenes.

### Oportunidad de mercado — `netTab: 'opp'`
Módulo nuevo. Desktop: globo a la izquierda (46%), formulario a la derecha (54%),
ambos centrados verticalmente. Móvil: título → pestañas → globo → formulario, en
una columna. Campos con divisores, sin tarjetas ni sombras.

- **ORIGEN**: país (Estados Unidos) + puerto opcional — Seattle, Tacoma, Los
  Angeles, Long Beach, Houston, Port Everglades, Miami.
- **DESTINO**: Perú, Colombia, Ecuador, Chile, Panamá, Costa Rica, Guatemala,
  Brasil, México — cada uno con sus puertos reales.
- **TIPO DE CARGAMENTO**: fruta fresca, carga refrigerada, alimentos, carga seca,
  carga general, otro. Al elegir fruta fresca aparece **PRODUCTO**.
- **PESO APROXIMADO**: input + conmutador KG/LB con **conversión automática**
  (1 lb = 0.45359237 kg, dos decimales). Acepta `1000`, `1.000` y `1,000`;
  el número se normaliza internamente antes de calcular.
- **COTIZAR**: no calcula tarifa. Valida y traslada los datos al formulario de
  cotización (destino, puerto, origen, puerto de origen, volumen con unidad,
  producto) y desplaza hasta allí.

Coordenadas reales por puerto (`port_id`, nunca el centro del país salvo que no
se elija puerto). La línea trazada es **fina, discontinua y de menor intensidad**,
distinta de la ruta BGB (turquesa sólida más gruesa); el tooltip dice "Oportunidad
solicitada · Ruta por evaluar — no es un servicio confirmado", y los gateways se
atenúan para que el arco solicitado destaque. Anillos de pulso en origen y destino.

## RUTAS BGB — INDEPENDENCIA CONFIRMADA

Estado separado por completo: `netTab`, `oppOriginCountry`, `oppOriginPort`,
`oppDestCountry`, `oppDestPort`, `oppCargo`, `oppProduct`, `oppWeight`,
`oppUnit`, `oppError`, `quotePrefill`. Ninguna función del módulo de
oportunidad lee ni escribe los datos de corredores BGB (`trade-routes.seed.json`
→ `_bgbArcs`), que se guardan en su propio array dentro del componente: el modo
oportunidad solo cambia **lo que el globo muestra**, no los datos.

Los dos paneles permanecen montados y solo se alterna `display`. Un panel oculto
tiene tamaño cero, así que el `IntersectionObserver` de su globo no dispara y el
módulo 3D **no arranca hasta mostrarse** — y al volver a una pestaña se encuentra
tal como se dejó. Verificado: tras crear una oportunidad Seattle → Cartagena y
volver a Rutas BGB, el distintivo "Core BGB Corridor · USA → Perú" y
"Seattle · Los Angeles" siguen intactos; al regresar a Oportunidad, destino
(Colombia) y peso (10000) se conservan.

Transición entre pestañas: `opacity + translateY 6px`, 260 ms.

## TESTS

| Test | Resultado |
| --- | --- |
| 1 · Red Global en español, sin textos ingleses | **PASS** (0 coincidencias) |
| 2 · Red Global en inglés, sin textos españoles | **PASS** (0 coincidencias) |
| 3 · Ruta BGB → Oportunidad → volver, BGB intacto | **PASS** |
| 4 · Oportunidad USA → Colombia, fruta fresca, 10.000 kg dibuja arco y no toca rutas BGB | **PASS** (el globo recibe `47.61,-122.33,Seattle · Estados Unidos` → `10.4,-75.51,Cartagena · Colombia`) |
| 5 · 10.000 KG → LB | **PASS** — 22046.23 LB, y de vuelta 10000 KG |
| 6 · Márgenes izquierdo/derecho iguales | **PASS** — 46 / 46 en todas las secciones y el header |
| 7 · Sin scroll horizontal | **PASS** — `scrollWidth === clientWidth` |
| Auditoría de idioma en toda la página | **PASS** — sin fugas salvo nombres propios y los subtítulos comerciales intencionados |
| Consola | Sin errores |

Nota sobre el atributo del globo: el host serializa props kebab-case en minúsculas
(`opp-origin` → `opporigin`), así que `<trade-globe>` observa ambas
grafías. Sin eso el arco de oportunidad nunca se dibujaba.

## PENDIENTE — requiere backend

`quote_requests` con `source = 'market_opportunity'` y los campos
`origin`/`origin_port`/`destination`/`destination_port`/`cargo_type`/
`product`/`weight_value`/`weight_unit`/`weight_kg`/`status`: el objeto ya
se construye con esa forma exacta en `submitOpportunity()` y hoy se traslada al
formulario; falta persistirlo. Igualmente pendientes los eventos de analítica
(`global_network_tab_changed`, `market_opportunity_started`,
`market_origin_selected`, `market_destination_selected`,
`market_quote_clicked`) y las URLs `/es/` `/en/` que harían reales los
`hreflang` ya declarados.


## Corrección: el globo no arrancaba

Ambos globos quedaban en blanco. La causa no era el render (llamar `boot()` a mano
dibujaba correctamente), sino el **disparador**: `connectedCallback` dependía de un
único `IntersectionObserver` cuyo callback nunca entregaba entradas en el host, y
además `disconnectedCallback` desmontaba los observadores mientras
`connectedCallback` salía temprano con `if (this._init) return` — así que tras
cualquier remontaje del host el elemento quedaba permanentemente sin vigilancia.

`connectedCallback` se dividió: la inicialización de una sola vez sigue protegida
por `_init`, pero la vigilancia se re-arma en **cada** conexión. Y el arranque
tiene ahora cinco disparadores redundantes:

1. `IntersectionObserver` — scroll normal.
2. `ResizeObserver` sobre el propio elemento — capta el paso de `display:none`
   a visible cuando se cambia de pestaña (una caja de 0 a 560×520).
3. Comprobación inmediata en `requestAnimationFrame` más reintentos a 350 ms y
   1200 ms — para un globo ya visible al montarse.
4. `scroll` en fase de captura sobre `document` (el evento no burbujea y la
   página puede desplazarse desde un contenedor interno, no desde `window`).
5. Sondeo cada 500 ms que lee el rect y se autocancela al arrancar — la red de
   seguridad que funciona incluso cuando el host no entrega observadores ni eventos
   de scroll.

Además `switchNetTab()` avisa al globo del panel recién mostrado en el siguiente
frame, y `boot()` es idempotente (`_booting` / `_booted`), así que los cinco
disparadores no pueden arrancarlo dos veces.

**Verificado tras recarga limpia:** globo BGB `booted: true, canvas: true,
arcs: 5`; globo de oportunidad `booted: true, canvas: true, mode: opportunity`
tras cambiar de pestaña. Sin errores de consola.


---

# Corrección del header (agosto 2026)

## CAUSA DEL DESPLAZAMIENTO

No era un margen ni un offset heredado. El header era un flex de **dos hijos** con
`justify-content: space-between`: el logo y un único `<nav>` que contenía los
ocho enlaces **más** el selector ES/EN, "Iniciar sesión" y "Solicitar cotización".
Al ser un solo bloque, el flex lo empujaba entero contra el borde derecho: **no
existía zona central**, y el ancho de las acciones determinaba dónde acababa el
menú. De ahí el hueco a la izquierda y el CTA pegado al borde.

Comprobado además: no hay `100vw`, ni `translateX`, ni `margin-left`
negativos, ni offsets de sidebar en los padres. `body` tiene `margin: 0`.

## CAMBIOS REALIZADOS

Un solo archivo: `Boston Global Business.dc.html` (plantilla del header y
`headerBarStyle` en la clase de lógica).

- El `<nav>` se partió en dos: **navegación** (columna central) y **acciones**
  (columna derecha).
- "Iniciar sesión" pasó a **enlace de texto al final del menú**, sin borde ni
  relleno. Queda claramente secundario frente al CTA (que sí es botón turquesa) y
  libera ~120px de la columna de acciones, que era la causa del descentrado.
- Acciones = `[ES|EN]` + "Solicitar cotización", con `gap: clamp(10px,0.9vw,16px)`.
- Altura del header: 104px en desktop, 84px en móvil. Los 13
  `scroll-margin-top` y el `padding-top` del hero se ajustaron de 112px a 104px
  para que el anclaje siga siendo exacto.
- Logo: `height: clamp(54px,4.2vw,70px)`, centrado verticalmente.
- CTA: `padding: 12px 22px` (sin `width` fijo).

## SISTEMA DE LAYOUT

**CSS Grid**, tres zonas:

```
width: min(100% - 48px, 1440px); margin-inline: auto;
display: grid; align-items: center;
grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);
column-gap: clamp(14px,1.5vw,32px);
```

Logo `justify-self:start` · nav `justify-self:center` · acciones
`justify-self:end`. Como las dos columnas exteriores son ambas `1fr`, el centro
del menú **no depende** del ancho de las acciones: cambiar "Iniciar sesión" por
"Log in" o "Solicitar cotización" por "Request a quote" no lo mueve.

En móvil el mismo contenedor pasa a `1fr auto` (logo + ES/EN + hamburguesa).

## MAX-WIDTH FINAL

**1440px**, con `min(100% - 48px, …)` → 24px de aire mínimo a cada lado. Es más
ancho que el 1280px de las secciones porque las tres zonas necesitan el espacio; el
header es una banda propia y el brief pedía 1360–1480.

## BREAKPOINTS

| Ancho | Comportamiento |
| --- | --- |
| ≥ 1340px | Tres zonas completas, menú centrado |
| < 1340px | Hamburguesa; "Iniciar sesión" y "Solicitar cotización" dentro del panel |

El umbral está en 1340 y no en 1100–1200 porque las etiquetas españolas
("Cómo trabajamos", "Contáctanos", "Solicitar cotización") necesitan ese ancho para
que la columna de acciones no invada el menú. Por debajo, comprimir produciría
solapamiento — que el brief prohíbe explícitamente.

## PRUEBAS

Ancho de cada zona calculado con métricas tipográficas reales (`measureText`) en
ambos idiomas, y medición del grid renderizado:

| Ancho | Menú (ES) | Acciones (ES) | Columna lateral | Desviación del centro |
| --- | --- | --- | --- | --- |
| 1920 | 799 | 260 | 292 | **0px** |
| 1600 | 770 | 258 | 311 | **0px** |
| 1440 | 756 | 257 | 296 | **0px** |
| 1366 | 750 | 256 | 264 | **0px** |
| 1340 | 747 | 256 | 252 | 4px |

Medición del grid a 1440: `grid-template-columns: 314.75px 734.48px 314.77px` —
columnas exteriores iguales con 0.016px de diferencia; centro del menú **696px**
frente a centro de la barra **696px**. Acciones 265px y logo 189px, ambos dentro de
su columna de 314.75px: sin solapamiento.

A 906px (móvil): barra centrada con 24px a cada lado, hamburguesa a 24px del borde,
`scrollWidth === clientWidth`. 768 / 430 / 390 usan la misma rama móvil.

Consola limpia.

## Sobre la barra oscura con `evansRelationship MARKET_REF`

No forma parte del sitio. Es el panel de ajustes del editor, que solo existe
mientras se edita el diseño: no se renderiza en la página publicada y no hay nada
que eliminar del código.

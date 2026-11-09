# LA BÓVEDA

**API de secretos con quórum, autenticación JWT y persistencia en MySQL + MongoDB.**

Este README explica cómo **instalar, configurar, ejecutar y probar el proyecto en Windows, macOS o Linux**. Los comandos principales son los mismos en cualquier sistema operativo. Solo cambia la forma de instalar los programas necesarios en cada equipo.

> El proyecto es una API REST, no una aplicación con interfaz gráfica. Puedes probarla con Postman, Thunder Client u otra herramienta HTTP.

## 1. Tecnologías

- **Node.js (versión 22 o superior) y Express:** servidor de la API.
- **MySQL y Sequelize:** almacenamiento de usuarios.
- **MongoDB y Mongoose:** almacenamiento de secretos y solicitudes.
- **bcrypt:** protección de contraseñas mediante hashes.
- **JWT:** autenticación con tokens válidos durante una hora.
- **Docker Compose (recomendado):** permite iniciar MySQL y MongoDB sin instalarlos manualmente.

**Regla de apertura:** un secreto solo puede abrirse cuando **dos usuarios diferentes** lo solicitan dentro de los últimos **5 minutos**, o cuando se cumple la fecha de apertura programada. El rol `jefe` no tiene privilegios para omitir esta regla.

**Bonus incluido:** por defecto, `/abrir` devuelve un token especial de 60 segundos que puede usarse una sola vez en `/revelar`. Este modo puede desactivarse en `.env`.

## 2. Requisitos previos

Instala lo siguiente según las instrucciones oficiales para tu sistema:

| Herramienta | ¿Para qué sirve? | ¿Es necesaria? |
|---|---|---|
| Node.js 22 o superior (incluye npm) | Ejecutar el servidor y sus dependencias | Sí |
| MySQL 8.x | Base de datos de usuarios | Sí, como servicio local/remoto o contenedor |
| MongoDB 8.x | Base de datos de secretos | Sí, como servicio local/remoto o contenedor |
| Docker + Docker Compose | Levantar ambas bases de datos fácilmente | Recomendado; opcional si ya están instaladas |
| Postman o Thunder Client | Probar los endpoints | Recomendado |
| Git | Subir el proyecto al repositorio | Solo para la entrega |
| Visual Studio Code | Editar y revisar el proyecto | Opcional |

En **Windows y macOS**, Docker Desktop incluye Docker Compose. En **Linux**, puedes utilizar Docker Engine junto con el complemento Docker Compose. Para los pasos de este README, la orden utilizada es `docker compose` (con espacio).

Comprueba las herramientas abriendo una terminal (PowerShell, Terminal, Bash u otra):

```sh
node --version
npm --version
docker --version
docker compose version
```

Si no usarás Docker, los dos últimos comandos no son necesarios. Las versiones de Node y npm deben mostrarse correctamente antes de continuar.

## 3. Obtener y abrir el proyecto

Descarga o clona el repositorio, extrae los archivos si están en un ZIP y **abre la carpeta `La_Boveda_Proyecto`** en una terminal. Todos los comandos que aparecen a continuación se ejecutan **desde esa carpeta**, donde se encuentra `package.json`.

Estructura principal:

```text
La_Boveda_Proyecto/
├── .env.example
├── .gitignore
├── INICIA_AQUI.txt
├── docker-compose.yml
├── package.json
├── README.md
├── src/
│   ├── server.js
│   ├── app.js
│   ├── config/           (MySQL y MongoDB)
│   ├── models/           (Usuario, Secreto y TokenRevelacion)
│   ├── routes/           (autenticación y secretos)
│   ├── middleware/
│   ├── services/
│   └── utils/
├── postman/La_Boveda.postman_collection.json
├── scripts/probar-api.mjs
├── tests/
└── docs/
```

## 4. Configurar las variables de entorno

El proyecto incluye `.env.example`, que es una plantilla de configuración. Crea una copia con el nombre `.env`.

Para que **el mismo comando funcione en Windows, macOS y Linux**, usa Node.js:

```sh
node -e "const fs=require('node:fs'); if(fs.existsSync('.env')) console.log('.env ya existe; no se modifico'); else fs.copyFileSync('.env.example','.env')"
```

Este comando **no sobrescribe un `.env` existente**. Abre el archivo `.env` en cualquier editor de texto y configura los siguientes valores:

| Variable | Función |
|---|---|
| `PORT` | Puerto de la API; predeterminado `3000` |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | Conexión a MySQL |
| `MYSQL_ROOT_PASSWORD` | Contraseña de inicialización de MySQL en Docker |
| `MONGO_HOST`, `MONGO_PORT`, `MONGO_DATABASE`, `MONGO_USER`, `MONGO_PASSWORD` | Conexión a MongoDB |
| `JWT_SECRET` | Clave para firmar tokens de acceso |
| `JWT_REVEAL_SECRET` | Clave diferente para los tokens de revelación |
| `BONUS_TOKEN_UN_SOLO_USO` | `true` para activar el bonus o `false` para desactivarlo |

**Obligatorio:** sustituye los valores de ejemplo de las contraseñas y de las dos claves JWT. Para generar una clave JWT segura, ejecuta este comando **dos veces** y utiliza un resultado diferente en cada variable:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

**Nunca compartas ni subas `.env` al repositorio.** Solo debes incluir `.env.example`, sin credenciales reales.

## 5. Iniciar las bases de datos

### Opción A: con Docker Compose (recomendada)

Asegúrate de que Docker esté instalado y en ejecución. Desde la carpeta principal del proyecto, ejecuta:

```sh
docker compose --env-file .env up -d
```

Esto crea/inicia dos contenedores: uno para **MySQL** y otro para **MongoDB**. También crea volúmenes para conservar sus datos. En la primera ejecución, Docker descargará las imágenes necesarias.

Comprueba que estén activos:

```sh
docker compose ps
```

Para detenerlos **sin borrar los datos**:

```sh
docker compose down
```

Para iniciarlos nuevamente, repite `docker compose --env-file .env up -d`. **Evita** `docker compose down -v` si deseas conservar la información, porque elimina también los volúmenes.

**Nota:** si los puertos 3306 o 27017 ya están en uso, ajusta `MYSQL_PORT` o `MONGO_PORT` en `.env` a puertos libres. Si cambias las contraseñas después de haber inicializado los volúmenes, los usuarios de bases de datos existentes pueden conservar las contraseñas anteriores.

### Opción B: con bases de datos ya instaladas (sin Docker)

También puedes usar instalaciones locales o servicios remotos de MySQL y MongoDB. En ese caso:

1. Inicia MySQL y MongoDB mediante las herramientas de tu entorno.
2. Crea en MySQL una base de datos llamada `la_boveda` (o usa el nombre definido en `MYSQL_DATABASE`).
3. Crea o utiliza un usuario MySQL que tenga permisos para conectarse y crear la tabla de usuarios.
4. Define en `.env` los hosts, puertos, nombres de base, usuarios y contraseñas reales.
5. Asegúrate de que MongoDB permita acceder con el usuario y las credenciales configuradas. Si usas una URI de MongoDB Atlas, define `MONGO_URI` en `.env`.

**Importante:** con Docker Compose, la base de MySQL se crea automáticamente la primera vez; sin Docker, debes prepararla tú. La tabla de usuarios se crea automáticamente al iniciar la API.

## 6. Instalar las dependencias y ejecutar la API

Una vez configurado `.env` y con MySQL y MongoDB disponibles, instala las dependencias de Node.js:

```sh
npm install
```

Inicia el servidor en modo desarrollo:

```sh
npm run dev
```

También puedes usar el modo normal:

```sh
npm start
```

Ambos comandos funcionan en **Windows, macOS y Linux**. `npm run dev` reinicia automáticamente el servidor al detectar cambios en los archivos (Node.js 22+).

Cuando las conexiones funcionen, la terminal mostrará algo parecido a:

```text
MySQL conectado
MongoDB conectado
La Boveda: http://localhost:3000
Bonus token de un solo uso: true
```

Abre en un navegador:

```text
http://localhost:3000/
```

Si aparece una respuesta JSON indicando que la API está activa, **el servidor se ha iniciado correctamente**. Deja abierta esa terminal durante las pruebas. Para detener el servidor, presiona **Ctrl+C**.

## 7. Endpoints principales

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| POST | `/auth/registro` | No | Registra un agente con contraseña hasheada |
| POST | `/auth/login` | No | Inicia sesión y entrega un JWT de una hora |
| POST | `/secretos` | JWT | Crea un secreto; `creadoPor` se obtiene del token |
| GET | `/secretos` | JWT | Lista secretos **sin mostrar el contenido** |
| POST | `/secretos/:id/solicitar` | JWT | Registra una solicitud del agente autenticado |
| GET | `/secretos/:id/abrir` | JWT | Abre por quórum o fecha; devuelve token especial si bonus está activo |
| GET | `/secretos/:id/revelar` | JWT y `X-Reveal-Token` | Revela el secreto mediante un token de un solo uso |

### Ejemplo del flujo en Postman

1. Registra dos agentes diferentes mediante `POST /auth/registro`.
2. Inicia sesión con cada uno mediante `POST /auth/login` y conserva sus respectivos JWT.
3. Con el JWT de un agente, crea un secreto mediante `POST /secretos`:

   ```json
   {"titulo":"Operación Cóndor","contenido":"¡Nos robaron!"}
   ```

4. Consulta `GET /secretos` y comprueba que el campo `contenido` **no se muestre**.
5. Intenta `GET /secretos/:id/abrir`: debe responder **403** si todavía no hay quórum ni fecha cumplida.
6. Envía `POST /secretos/:id/solicitar` con el primer JWT y repite con el segundo JWT **dentro de cinco minutos**.
7. Consulta `GET /secretos/:id/abrir`. Con `BONUS_TOKEN_UN_SOLO_USO=true`, obtendrás `tokenRevelacion`.
8. Consulta `GET /secretos/:id/revelar` con las cabeceras:

   ```text
   Authorization: Bearer TOKEN_DE_ACCESO
   X-Reveal-Token: TOKEN_ESPECIAL
   ```

9. Comprueba que el primer canje devuelve el contenido y que intentar usar nuevamente ese token responde **403**.

La colección **`postman/La_Boveda.postman_collection.json`** contiene **20 peticiones ya organizadas** para demostrar el flujo y varios intentos de acceso indebido. Impórtala en Postman y ejecútala en orden. Si modificaste `PORT`, actualiza la variable `baseUrl` de la colección.

## 8. Ejecutar las pruebas

Las pruebas unitarias no requieren una conexión activa a las bases de datos:

```sh
npm test
```

Las pruebas de integración **sí requieren que la API, MySQL y MongoDB estén ejecutándose** y que el bonus esté activado (`BONUS_TOKEN_UN_SOLO_USO=true`):

```sh
npm run test:e2e
```

Ejecuta las pruebas de integración en **otra terminal**, sin cerrar la terminal donde corre `npm run dev`. Estas pruebas crean usuarios y secretos de demostración.

## 9. Reglas de seguridad implementadas

- Las solicitudes de una misma cuenta no cuentan como dos agentes diferentes.
- El creador puede solicitar el secreto, pero no obtiene autorización por el simple hecho de crearlo.
- La identidad del usuario, el creador y las fechas de solicitud se toman del servidor; no se confía en valores enviados por el cliente.
- El rol `jefe` no omite el quórum ni la apertura por fecha.
- `GET /secretos` nunca devuelve el contenido confidencial.
- Los JWT se verifican antes de acceder a las rutas protegidas.
- El token especial de revelación expira en 60 segundos y se invalida después de su primer uso.

Este es un **proyecto académico**. Antes de utilizarlo con información real, también serían necesarios controles adicionales, como HTTPS, cifrado del contenido y una estrategia de monitoreo y auditoría.

## 10. Problemas comunes

| Problema | Qué revisar |
|---|---|
| `node` o `npm` no se reconoce | Instala Node.js y asegúrate de que esté en la variable `PATH` del sistema |
| `docker compose` no funciona | Inicia Docker o instala/habilita Docker Compose |
| Error de permisos de Docker en Linux | Verifica los permisos del usuario para utilizar el servicio Docker |
| Error de conexión a MySQL/MongoDB | Revisa si los servicios están activos, los puertos y las credenciales en `.env` |
| `Access denied` en MySQL | Comprueba usuario, contraseña y permisos; recuerda que los volúmenes conservan la configuración inicial |
| Fallo por claves JWT | Reemplaza las claves de ejemplo por dos cadenas diferentes de al menos 32 caracteres |
| Puerto 3000 ocupado | Cambia `PORT` en `.env` y utiliza el nuevo puerto al probar la API |
| Respuesta `401` | Falta el JWT, es inválido o ha expirado |
| Respuesta `403` al abrir | No se ha completado el quórum ni ha llegado la fecha de apertura |
| Respuesta `403` al revelar | El token especial está vencido, ya fue usado o no corresponde al usuario/secreto |
| Respuesta `409` al registrar | El correo electrónico ya existe |

## 11. Subir el proyecto al repositorio

Instala Git y crea un repositorio **vacío** en tu cuenta de GitHub. Desde la carpeta del proyecto, ejecuta:

```sh
git init
git add .
git status
git commit -m "Implementar La Boveda"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/la-boveda.git
git push -u origin main
```

Reemplaza `TU_USUARIO` y la URL del repositorio por los datos de tu cuenta. El archivo `.gitignore` excluye `.env` y `node_modules`; verifica en `git status` que no se incluyan credenciales.

## 12. Material para la entrega y exposición

- `docs/ARQUITECTURA.md`: bases de datos, componentes y lógica de apertura.
- `docs/DIAGRAMA_ER.mmd`: diagrama de la arquitectura de datos.
- `docs/ATAQUES_Y_DEFENSA.md`: intentos de ataque permitidos y plantilla para documentar el ataque recibido.
- `docs/GUION_DEMO.md`: guía de presentación en clase.
- `docs/ENTREGA.md`: lista de entregables para verificar antes de entregar.

**Evaluación del reto:** flujo completo (40 %), quórum y casos límite (25 %), resistencia a la fase de atraco (25 %), token de un solo uso (10 %). El equipo atacante puede aspirar a un 5 % adicional según las reglas de la actividad.

---

**Resumen universal:** configura `.env` → inicia MySQL y MongoDB → ejecuta `npm install` → ejecuta `npm run dev` → prueba `http://localhost:3000/` → usa Postman. El procedimiento es el mismo independientemente del sistema operativo, siempre que las herramientas estén correctamente instaladas.

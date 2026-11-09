# Guion para la demostración de 3–5 minutos

**0:00–0:40 — Presentación**

“Esta API se llama *La Bóveda*. Está construida en Node y Express. Los usuarios viven en MySQL y los secretos y las solicitudes en MongoDB. El objetivo es que nadie abra un secreto por sí solo; ni siquiera el jefe tiene privilegios para saltarse la regla”.

**0:40–1:20 — Registro y acceso**

“Creamos dos agentes usando `/auth/registro`. Las contraseñas se guardan como hash bcrypt. Luego cada uno inicia sesión por `/auth/login` y recibe un JWT con vigencia de una hora”.

**1:20–2:00 — Crear, listar y bloquear**

“El agente uno crea un secreto. Al consultar `/secretos`, vemos el título pero no el contenido. Intentamos abrirlo inmediatamente y devuelve 403 porque no hay quórum”.

**2:00–2:45 — Demostrar quórum**

“El agente uno solicita dos veces y sigue contando como uno. Un segundo agente solicita desde otro JWT dentro de cinco minutos. Ahora sí se autoriza la apertura. El servidor toma identidad y tiempo, no los datos que el atacante pudiera enviar”.

**2:45–3:30 — Bonus**

“En el modo bonus, `/abrir` devuelve un token especial que dura 60 segundos. Lo mandamos a `/revelar` y ahora vemos el contenido. Si reutilizamos el mismo token, responde 403”.

**3:30–4:00 — Fecha y seguridad**

“También existe apertura automática por fecha. Probamos un secreto cuya fecha ya pasó. Finalmente, mostramos que sin JWT no se puede acceder y que un agente no puede convertirse en jefe durante el registro”.

**4:00–4:30 — Cierre**

“La API cubre los endpoints solicitados, diferencia datos entre MySQL y MongoDB y evita solicitudes duplicadas, falsificación del usuario y la reutilización del token especial. Para una aplicación real añadiríamos cifrado de secretos en reposo y auditoría completa”.

## Reparto de tareas (2–3 personas)

- **Persona 1:** explicar MySQL, usuarios, bcrypt, login y JWT.
- **Persona 2:** explicar MongoDB, secretos, solicitudes y quórum.
- **Persona 3 (si existe):** mostrar Postman, bonus y ataques.

## Entrega

Subir repositorio GitHub (con `.env` excluido), `.env.example`, colección Postman y nota de ataque. Abrir README en la presentación.

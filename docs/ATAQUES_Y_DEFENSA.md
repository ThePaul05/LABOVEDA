# Fase de atraco: ataques autorizados y defensas

**Ámbito:** únicamente la URL/API de prueba y una cuenta de ensayo que permita el equipo contrario, usando Postman, Thunder Client o curl. Nunca borrar datos ni hacer denegación de servicio.

| Intento | Qué haría el atacante en el entorno del ejercicio | Defensa esperada |
| --- | --- | --- |
| Abrir sin token | `GET /secretos/:id/abrir` | HTTP 401 |
| Abrir con un solo agente | Iniciar sesión y llamar `/abrir` sin segundo agente | HTTP 403 |
| Pedir dos veces | Llamar `/solicitar` dos veces con la misma cuenta | Sigue contando como una identidad |
| Enviar `userId` ajeno | Enviar `{"userId":2}` a `/solicitar` | HTTP 400, se rechaza |
| Falsificar hora | Enviar `{"fecha":"2030-..."}` | HTTP 400; solo reloj del servidor |
| Elegirse jefe | Enviar `{"rol":"jefe"}` a `/auth/registro` | HTTP 400; servidor fija `agente` |
| Incluir `creadoPor` falso | Enviar `{"creadoPor":2}` al crear secreto | HTTP 400; se fija usando JWT |
| Leer el listado | `GET /secretos` | No incluye campo `contenido` |
| Usar JWT adulterado | Cambiar claims, ID o firma en un JWT | HTTP 401 |
| Canjear dos veces | Reutilizar `X-Reveal-Token` | Primer canje 200, segundo 403 |
| Cambiar de usuario con el token especial | Agente B intenta canjear el token especial de A | HTTP 403 |

**Nota importante:** Que alguien descubra un token de acceso vigente es un incidente real. Usar HTTPS y no compartir los tokens. No publicar JWT ni contraseñas en el repositorio o en capturas.

## Nota breve de ataques recibidos (completar después de la práctica)

- **Equipo que probó nuestra API:** [anotar]
- **Fecha y entorno:** [anotar]
- **Ataques intentados realmente:** [anotar petición/ruta, parámetros y hora]
- **Código HTTP observado:** [anotar]
- **¿Pudieron leer `¡Nos robaron!` sin regla?** [sí/no, basado en prueba real]
- **Vulnerabilidad encontrada, si existió:** [anotar o indicar ninguna observada]
- **Cambios que implementaríamos:** [anotar según resultados]

No inventar un resultado del ataque antes de realizar la fase en clase.

## Prueba específica del rol jefe

Si el docente solicita demostrarlo, entra a MySQL desde un cliente administrador y modifica **una cuenta de prueba tuya**:

```sql
USE la_boveda;
UPDATE usuarios SET rol = 'jefe' WHERE email = 'ana_demo@example.com';
```

**Inicia sesión de nuevo** (el middleware rechaza tokens anteriores cuando el rol cambia), crea un secreto nuevo sin fecha y trata de abrirlo solo con el jefe: seguirá devolviendo **403**. No se debe agregar un bypass de quórum para ese rol.

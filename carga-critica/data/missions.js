/* ==========================================================
   Contenido de las tareas (solo textos: sin lógica).
   La comprobación de cada una está en js/missions.js,
   emparejada por el código DKR-xx que se asigna por posición.
   ========================================================== */
(function (global) {
  "use strict";
  var DK = global.DK = global.DK || {};

  var WEAVER = "Sigourney Weaver · Sistemas";
  var SNIPES = "Wesley Snipes · Desarrollo";

  DK.MISSION_CONTENT = [
    /* ---------------- FASE 1 · IMÁGENES ---------------- */
    {
      phase: 0, severity: "info", source: WEAVER, xp: 75,
      title: "El encargo",
      text: "La intranet funciona, pero depende de cómo esté instalado el servidor: si hay que moverla, nadie sabe reproducir el montaje. Hoy la pasamos a contenedores.",
      objective: "Lee el fichero encargo.txt de tu carpeta personal.",
      hints: [
        "Estás en /home/hamilton y el fichero está ahí mismo.",
        "La orden que vuelca un fichero de texto es cat.",
        "Escribe: cat encargo.txt"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 100,
      title: "¿Está Docker en marcha?",
      text: "Antes de nada, comprueba que el cliente habla con el demonio. Si el demonio no responde, todo lo demás falla con un error críptico.",
      objective: "Muestra la versión de Docker instalada.",
      hints: [
        "El subcomando se llama igual que lo que preguntas: version.",
        "Se escribe: docker version. Si ves el bloque «Server», el demonio responde.",
        "Escribe: docker version"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 100,
      title: "¿Qué imágenes hay?",
      text: "Una imagen es la plantilla; un contenedor es una instancia en marcha de esa plantilla. Mira qué imágenes hay descargadas en este servidor.",
      objective: "Lista las imágenes disponibles en el equipo.",
      hints: [
        "El subcomando es images (o su forma moderna: docker image ls).",
        "En un servidor recién instalado la lista estará vacía: aún no has descargado nada.",
        "Escribe: docker images"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 125,
      title: "Descarga la imagen de nginx",
      text: "Empezamos por la imagen oficial del servidor web. Fíjate en la etiqueta: sin ella, Docker asume «latest», y eso el día de mañana significa «cualquier versión».",
      objective: "Descarga la imagen nginx:1.27 del registro.",
      hints: [
        "El subcomando para descargar es pull.",
        "Se escribe: docker pull <imagen>:<etiqueta>. Verás bajar las capas una a una.",
        "Escribe: docker pull nginx:1.27"
      ]
    },
    {
      phase: 0, severity: "info", source: WEAVER, xp: 100,
      title: "Comprueba que está",
      text: "Vuelve a mirar la lista de imágenes: ahora debe aparecer nginx con su etiqueta, su identificador y su tamaño.",
      objective: "Lista otra vez las imágenes del equipo.",
      hints: [
        "El mismo subcomando de antes.",
        "El IMAGE ID es lo que identifica de verdad a la imagen: las etiquetas son solo nombres que apuntan a él.",
        "Escribe: docker images"
      ]
    },
    {
      phase: 0, severity: "high", source: WEAVER, xp: 150,
      title: "Tu primer contenedor",
      text: "Levanta el servidor web en segundo plano, con un nombre reconocible y publicando su puerto 80 en el 8080 del servidor.",
      objective: "Arranca un contenedor llamado web a partir de nginx:1.27, en segundo plano y publicando el puerto 8080 del anfitrión en el 80 del contenedor.",
      hints: [
        "El subcomando es run. Las opciones van ANTES del nombre de la imagen.",
        "-d lo lanza en segundo plano, --name le pone nombre y -p publica puertos con el formato anfitrión:contenedor.",
        "Escribe: docker run -d --name web -p 8080:80 nginx:1.27"
      ]
    },

    /* ---------------- FASE 2 · CICLO DE VIDA ---------------- */
    {
      phase: 1, severity: "info", source: WEAVER, xp: 100,
      title: "¿Qué está corriendo?",
      text: "La orden que más vas a escribir. Muestra los contenedores en marcha, con su imagen, su estado y los puertos publicados.",
      objective: "Lista los contenedores en ejecución.",
      hints: [
        "El subcomando es ps, igual que en Linux.",
        "En la columna PORTS verás la publicación 0.0.0.0:8080->80/tcp.",
        "Escribe: docker ps"
      ]
    },
    {
      phase: 1, severity: "info", source: WEAVER, xp: 125,
      title: "Mira lo que dice por dentro",
      text: "Un contenedor no tiene registro en /var/log del anfitrión: su salida estándar ES su registro, y se consulta desde fuera.",
      objective: "Muestra el registro del contenedor web.",
      hints: [
        "El subcomando es logs, seguido del nombre o del identificador del contenedor.",
        "Se escribe: docker logs <contenedor>. Con --tail 10 te quedas con las últimas líneas.",
        "Escribe: docker logs web"
      ]
    },
    {
      phase: 1, severity: "info", source: WEAVER, xp: 125,
      title: "Párale",
      text: "Ahora el ciclo de vida completo: parar, comprobar y eliminar. Empieza por detenerlo.",
      objective: "Detén el contenedor web.",
      hints: [
        "El subcomando es stop, seguido del nombre del contenedor.",
        "Parar un contenedor no lo borra: sigue existiendo con su sistema de ficheros.",
        "Escribe: docker stop web"
      ]
    },
    {
      phase: 1, severity: "info", source: WEAVER, xp: 125,
      title: "Sigue ahí",
      text: "Esta es la parte que sorprende al principio: un contenedor parado no aparece en docker ps, pero no ha desaparecido. Compruébalo.",
      objective: "Lista TODOS los contenedores, incluidos los que están parados.",
      hints: [
        "docker ps admite la opción -a (o --all) para incluir los detenidos.",
        "Verás el estado «Exited (0)»: terminó sin error. Si el código no es 0, algo falló.",
        "Escribe: docker ps -a"
      ]
    },
    {
      phase: 1, severity: "info", source: WEAVER, xp: 125,
      title: "Y ahora sí, elimínalo",
      text: "Los contenedores parados ocupan espacio y bloquean el nombre. Bórralo para dejar el servidor limpio.",
      objective: "Elimina el contenedor web.",
      hints: [
        "El subcomando es rm, seguido del nombre del contenedor.",
        "Si estuviera en marcha, Docker se negaría: primero se para, o se fuerza con -f.",
        "Escribe: docker rm web"
      ]
    },

    /* ---------------- FASE 3 · DATOS ---------------- */
    {
      phase: 2, severity: "warn", source: SNIPES, xp: 125,
      title: "La base de datos, a la primera",
      text: "La intranet necesita MariaDB. Levántala tal cual, sin más opciones, y mira qué pasa: es el error más común de todos.",
      objective: "Intenta arrancar un contenedor llamado base a partir de mariadb:11, en segundo plano y sin más opciones.",
      hints: [
        "Misma orden que con nginx: run con -d y --name.",
        "No hace falta descargar la imagen antes: si no está, docker run la baja sola.",
        "Escribe: docker run -d --name base mariadb:11"
      ]
    },
    {
      phase: 2, severity: "warn", source: SNIPES, xp: 150,
      title: "¿Por qué se ha caído?",
      text: "El contenedor arrancó y murió al instante. La respuesta está siempre en el mismo sitio: su registro.",
      objective: "Muestra el registro del contenedor base para ver el motivo del fallo.",
      hints: [
        "El mismo subcomando logs que usaste con el servidor web.",
        "El mensaje dice que la base de datos está sin inicializar y falta la contraseña de root.",
        "Escribe: docker logs base"
      ]
    },
    {
      phase: 2, severity: "info", source: SNIPES, xp: 100,
      title: "Quita el contenedor muerto",
      text: "Antes de volver a intentarlo hay que eliminarlo: el nombre «base» está ocupado por el contenedor que se cayó.",
      objective: "Elimina el contenedor base.",
      hints: [
        "El subcomando rm, igual que antes.",
        "Como está parado, no hace falta forzar nada.",
        "Escribe: docker rm base"
      ]
    },
    {
      phase: 2, severity: "high", source: WEAVER, xp: 175,
      title: "Un sitio donde guardar los datos",
      text: "Aquí está la lección grande de Docker: lo que se escribe dentro de un contenedor desaparece con él. Para que los datos sobrevivan hace falta un volumen.",
      objective: "Crea un volumen llamado datos-intranet.",
      hints: [
        "El subcomando de volúmenes es volume, y la acción, create.",
        "Se escribe: docker volume create <nombre>. Con docker volume ls puedes listarlos.",
        "Escribe: docker volume create datos-intranet"
      ]
    },
    {
      phase: 2, severity: "high", source: WEAVER, xp: 200,
      title: "La base de datos, bien puesta",
      text: "Ahora sí: con la contraseña de root en una variable de entorno y con el volumen montado donde MariaDB guarda sus datos.",
      objective: "Arranca un contenedor llamado base a partir de mariadb:11, en segundo plano, con la variable MARIADB_ROOT_PASSWORD y el volumen datos-intranet montado en /var/lib/mysql.",
      hints: [
        "-e pasa variables de entorno con el formato CLAVE=valor.",
        "-v monta un volumen con el formato volumen:ruta-dentro-del-contenedor.",
        "Escribe: docker run -d --name base -e MARIADB_ROOT_PASSWORD=Atl4nte -v datos-intranet:/var/lib/mysql mariadb:11"
      ]
    },
    {
      phase: 2, severity: "info", source: SNIPES, xp: 150,
      title: "Mira dentro del contenedor",
      text: "Comprueba que la base de datos ha escrito sus ficheros donde toca, es decir, dentro del volumen. Se puede ejecutar una orden dentro del contenedor sin entrar en él.",
      objective: "Ejecuta dentro del contenedor base la orden ls /var/lib/mysql.",
      hints: [
        "El subcomando es exec: ejecuta una orden dentro de un contenedor en marcha.",
        "Se escribe: docker exec <contenedor> <orden>. Con -it además te da una sesión interactiva.",
        "Escribe: docker exec base ls /var/lib/mysql"
      ]
    },

    /* ---------------- FASE 4 · IMAGEN PROPIA ---------------- */
    {
      phase: 3, severity: "info", source: SNIPES, xp: 125,
      title: "La receta de nuestra imagen",
      text: "En ~/intranet está el proyecto con su Dockerfile: la receta que describe cómo se construye nuestra imagen. Léelo antes de construir nada.",
      objective: "Muestra el contenido del fichero intranet/Dockerfile.",
      hints: [
        "Es un fichero de texto normal: cat intranet/Dockerfile.",
        "FROM dice de qué imagen se parte, COPY mete ficheros dentro y CMD indica qué se ejecuta al arrancar.",
        "Escribe: cat intranet/Dockerfile"
      ]
    },
    {
      phase: 3, severity: "high", source: SNIPES, xp: 175,
      title: "Construye la imagen",
      text: "Constrúyela con nuestro nombre y una versión concreta. El punto final del que todo el mundo se olvida es el contexto: la carpeta desde la que se construye.",
      objective: "Sitúate en la carpeta intranet y construye la imagen con la etiqueta tecnoatlantica/intranet:1.0.",
      hints: [
        "Primero cd intranet, para tener el Dockerfile en el directorio actual.",
        "Después: docker build -t <nombre>:<version> . — ese punto final es la ruta del contexto.",
        "Escribe: cd intranet && docker build -t tecnoatlantica/intranet:1.0 ."
      ]
    },
    {
      phase: 3, severity: "info", source: SNIPES, xp: 100,
      title: "Ahí está tu imagen",
      text: "Compruébalo en la lista: junto a las oficiales debe aparecer la tuya, con su etiqueta y su tamaño.",
      objective: "Lista las imágenes y comprueba que aparece tecnoatlantica/intranet.",
      hints: [
        "El mismo subcomando images de la primera fase.",
        "Fíjate en que es más grande que alpine y parecida a nginx: hereda todas sus capas.",
        "Escribe: docker images"
      ]
    },
    {
      phase: 3, severity: "high", source: SNIPES, xp: 175,
      title: "Levanta la intranet",
      text: "Arranca un contenedor con tu imagen, publicando el 8080 del servidor.",
      objective: "Arranca un contenedor llamado intranet a partir de tecnoatlantica/intranet:1.0, en segundo plano y publicando el puerto 8080 en el 80.",
      hints: [
        "Misma forma que con nginx, cambiando el nombre de la imagen.",
        "Recuerda el orden: docker run [opciones] imagen [orden].",
        "Escribe: docker run -d --name intranet -p 8080:80 tecnoatlantica/intranet:1.0"
      ]
    },
    {
      phase: 3, severity: "warn", source: WEAVER, xp: 150,
      title: "Dos contenedores, un puerto",
      text: "Prueba a levantar otro servidor web publicando también el 8080 y mira el error: un puerto del anfitrión solo lo puede tener un contenedor a la vez.",
      objective: "Intenta arrancar un contenedor llamado web2 con nginx:1.27 publicando también el puerto 8080.",
      hints: [
        "La misma orden de siempre, con otro nombre y el mismo -p 8080:80.",
        "Docker responderá «port is already allocated»: la solución es publicar en otro puerto del anfitrión, por ejemplo -p 8081:80.",
        "Escribe: docker run -d --name web2 -p 8080:80 nginx:1.27"
      ]
    },

    /* ---------------- FASE 5 · COMPOSE ---------------- */
    {
      phase: 4, severity: "info", source: WEAVER, xp: 125,
      title: "Toda la pila en un fichero",
      text: "Levantar tres contenedores a mano cada vez no es forma de trabajar. En ~/pila hay un compose.yaml que describe la pila entera. Léelo.",
      objective: "Sitúate en la carpeta pila y muestra el contenido de compose.yaml.",
      hints: [
        "Primero vuelve a tu carpeta personal y entra en pila: cd ~/pila",
        "Después: cat compose.yaml. Fíjate en los tres servicios y en sus puertos.",
        "Escribe: cd ~/pila && cat compose.yaml"
      ]
    },
    {
      phase: 4, severity: "high", source: WEAVER, xp: 200,
      title: "Levanta la pila",
      text: "Una sola orden y los tres servicios arrancan, con su red propia y sus volúmenes. Esto es lo que hace reproducible un despliegue.",
      objective: "Levanta toda la pila en segundo plano con Docker Compose.",
      hints: [
        "Compose es un subcomando de docker: docker compose.",
        "La acción es up, y -d la lanza en segundo plano.",
        "Escribe: docker compose up -d"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 125,
      title: "Comprueba la pila",
      text: "Compose tiene su propia vista, que muestra solo los servicios de este proyecto.",
      objective: "Muestra el estado de los servicios de la pila con Docker Compose.",
      hints: [
        "La acción es ps, igual que con los contenedores sueltos.",
        "Se escribe: docker compose ps",
        "Escribe: docker compose ps"
      ]
    },
    {
      phase: 4, severity: "info", source: WEAVER, xp: 150,
      title: "Y recógela",
      text: "Última tarea: baja la pila. Fíjate en que los volúmenes con nombre NO se borran: por eso los datos siguen ahí la próxima vez.",
      objective: "Detén y elimina los servicios de la pila con Docker Compose.",
      hints: [
        "La acción contraria a up es down.",
        "down elimina contenedores y red del proyecto; para borrar también los volúmenes habría que añadir -v, y eso sí perdería los datos.",
        "Escribe: docker compose down"
      ]
    }
  ];
})(this);

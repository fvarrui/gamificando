/* ==========================================================
   Contenido de las 30 misiones (solo textos: sin lógica).
   La lógica de cada una (check, onActivate, react, solution)
   está en js/missions.js, emparejada por el código del ticket.
   El código GIT-xx se asigna automáticamente por su posición.
   ========================================================== */
(function (global) {
  "use strict";
  var VG = global.VG = global.VG || {};

  VG.MISSION_CONTENT = [
    /* ---------------- FASE 1 · PRIMEROS PASOS ---------------- */
    {
      phase: 0, severity: "info", source: "Coordinación del Blue Team", xp: 50,
      title: "Preséntate a Git",
      text: "Cada commit lleva la firma de quien lo hace: un nombre y un correo. Así, la próxima vez que alguien cambie la configuración, sabremos quién fue.",
      objective: "Configura tu nombre y tu correo en la configuración global de Git.",
      hints: [
        "Git se configura con el subcomando config. Con --global el ajuste vale para todos tus repositorios (se guarda en ~/.gitconfig).",
        "Las claves son user.name y user.email. Si el valor tiene espacios, ponlo entre comillas.",
        "Escribe: git config --global user.name \"Tu Nombre\" y después git config --global user.email \"tu@tecnoatlantica.local\""
      ]
    },
    {
      phase: 0, severity: "info", source: "Coordinación del Blue Team", xp: 50,
      title: "Crea el repositorio",
      text: "La carpeta ~/scripts-blindaje tiene los scripts, pero Git todavía no la vigila. En TecnoAtlántica la rama principal de todos los proyectos se llama main.",
      objective: "Convierte la carpeta en un repositorio Git cuya rama principal se llame main.",
      hints: [
        "Un repositorio se crea con git init, estando dentro de la carpeta del proyecto (compruébalo con pwd).",
        "Puedes indicar el nombre de la rama inicial con la opción -b, o fijarlo para siempre con git config --global init.defaultBranch main.",
        "Escribe: git init -b main (si ya la creaste como master, renómbrala con git branch -m main)"
      ]
    },
    {
      phase: 0, severity: "info", source: "Coordinación del Blue Team", xp: 50,
      title: "¿Qué ve Git?",
      text: "Antes de guardar nada, pregunta a Git cómo ve la carpeta. Será el comando que más uses: cuando dudes, pregúntale a Git.",
      objective: "Consulta el estado del repositorio.",
      hints: [
        "El comando se llama igual que lo que quieres saber: el estado, en inglés.",
        "Fíjate en la sección «Archivos sin seguimiento»: Git ve los ficheros, pero todavía no los versiona.",
        "Escribe: git status"
      ]
    },
    {
      phase: 0, severity: "high", source: "Dirección de Seguridad", xp: 100,
      title: "Secretos fuera del repositorio",
      text: "¡Alto! En la carpeta hay un secretos.env con la contraseña de la base de datos y un debug.log que cambia cada vez que se ejecuta el script. Nada de eso debe entrar en el historial: lo que llega a un commit es muy difícil de borrar.",
      objective: "Crea un fichero .gitignore para que Git ignore secretos.env y cualquier fichero .log.",
      hints: [
        ".gitignore es un fichero de texto normal, con un patrón por línea. Git no hace seguimiento de los ficheros nuevos que coincidan.",
        "Admite comodines: *.log ignora todos los ficheros acabados en .log. Créalo con nano .gitignore, o con echo y redirección (> crea el fichero, >> añade al final).",
        "Escribe: echo \"secretos.env\" > .gitignore && echo \"*.log\" >> .gitignore y comprueba con git status"
      ]
    },
    {
      phase: 0, severity: "info", source: "Coordinación del Blue Team", xp: 100,
      title: "Al área de preparación",
      text: "Git no guarda los cambios directamente: primero eliges qué entrará en la próxima «foto» del proyecto llevándolo al área de preparación (staging).",
      objective: "Prepara para el commit README.md, firewall.sh, servicios.conf, backup_2019.sh y .gitignore (y nada más).",
      hints: [
        "El comando que lleva cambios al área de preparación es git add. Acepta ficheros concretos o un punto (.) para todo el directorio.",
        "Con el .gitignore bien hecho, git add . no incluye los ficheros ignorados. Comprueba el resultado con git status: lo preparado sale en verde.",
        "Escribe: git add . (o git add README.md firewall.sh servicios.conf backup_2019.sh .gitignore)"
      ]
    },
    {
      phase: 0, severity: "info", source: "Coordinación del Blue Team", xp: 100,
      title: "El primer commit",
      text: "Un commit es una foto del proyecto con autor, fecha y un mensaje que explica qué cambió y por qué. Ese mensaje lo leerán tus compañeros… y tú dentro de seis meses.",
      objective: "Confirma lo preparado con un commit que lleve un mensaje descriptivo.",
      hints: [
        "El comando es git commit. Sin opciones abre el editor para escribir el mensaje; con -m lo das directamente.",
        "Un buen mensaje es breve y concreto: «Versión inicial de los scripts de bastionado» dice mucho más que «cambios».",
        "Escribe: git commit -m \"Versión inicial de los scripts de bastionado\""
      ]
    },
    {
      phase: 0, severity: "info", source: "Coordinación del Blue Team", xp: 50,
      title: "Consulta el historial",
      text: "Ya hay historia. Cada commit tiene un identificador único (hash) que Git calcula a partir de su contenido: si cambia una coma, cambia el hash.",
      objective: "Muestra el historial de commits del repositorio.",
      hints: [
        "Es el «diario» del repositorio: git log.",
        "Prueba también git log --oneline, que muestra una línea por commit con el hash abreviado.",
        "Escribe: git log"
      ]
    },

    /* ---------------- FASE 2 · EL CICLO DE TRABAJO ---------------- */
    {
      phase: 1, severity: "medium", source: "Auditoría interna", xp: 100,
      title: "Cierra Telnet",
      text: "firewall.sh todavía permite Telnet (23/tcp), un protocolo que envía las contraseñas sin cifrar. Hay que quitar esa regla… y revisar qué ha cambiado antes de confirmarlo.",
      objective: "Elimina de firewall.sh la línea que permite el puerto 23 y revisa el cambio con git diff.",
      hints: [
        "Edita el fichero con nano firewall.sh (Ctrl+K corta la línea, Ctrl+O guarda, Ctrl+X sale) o borra la línea con sed -i '/allow 23/d' firewall.sh.",
        "git diff sin opciones compara el directorio de trabajo con el área de preparación: las líneas eliminadas salen en rojo, precedidas de un -.",
        "Escribe: sed -i '/allow 23/d' firewall.sh && git diff"
      ]
    },
    {
      phase: 1, severity: "info", source: "Coordinación del Blue Team", xp: 100,
      title: "Revisa y confirma",
      text: "Cambio revisado. Ahora hay que prepararlo y confirmarlo. Un buen hábito: antes de cada commit, mira exactamente qué va a entrar.",
      objective: "Prepara firewall.sh, revisa lo preparado con git diff --staged y haz commit.",
      hints: [
        "Primero git add firewall.sh. A partir de ahí git diff ya no muestra nada: el cambio ha pasado al área de preparación.",
        "git diff --staged (o su sinónimo --cached) compara el área de preparación con el último commit.",
        "Escribe: git add firewall.sh && git diff --staged && git commit -m \"Elimina la regla que permitía Telnet\""
      ]
    },
    {
      phase: 1, severity: "info", source: "Coordinación del Blue Team", xp: 100,
      title: "Adiós al script obsoleto",
      text: "backup_2019.sh no se usa desde hace años y confunde a quien llega nuevo. Hay que quitarlo del proyecto y también del seguimiento de Git.",
      objective: "Elimina backup_2019.sh con Git y confirma el borrado con un commit.",
      hints: [
        "Si lo borras con rm, Git lo verá como «borrado» y tendrás que preparar ese borrado con git add. git rm hace las dos cosas a la vez.",
        "Después de git rm, git status lo muestra en verde como borrado, listo para el commit.",
        "Escribe: git rm backup_2019.sh && git commit -m \"Elimina el script de copias obsoleto\""
      ]
    },

    /* ---------------- FASE 3 · DESHACER SIN MIEDO ---------------- */
    {
      phase: 2, severity: "high", source: "Iker (en prácticas)", xp: 100,
      title: "¡Iker ha roto servicios.conf!",
      text: "Iker ha abierto servicios.conf en tu equipo y lo ha guardado a medio escribir. No ha hecho commit, así que la versión buena sigue a salvo en el último commit.",
      objective: "Descarta los cambios de servicios.conf y recupera la versión del último commit.",
      hints: [
        "Mira git status y git diff: el cambio está en el directorio de trabajo, sin preparar.",
        "git restore <fichero> descarta los cambios del directorio de trabajo. ¡Cuidado: esos cambios no se pueden recuperar!",
        "Escribe: git restore servicios.conf"
      ]
    },
    {
      phase: 2, severity: "critical", source: "Iker (en prácticas)", xp: 100,
      title: "Un fichero que no debía estar",
      text: "Iker ha hecho un git add . «para ayudarte» y se ha colado volcado.sql en el área de preparación: un volcado de la base de datos con datos personales de clientes. No puede llegar a un commit.",
      objective: "Saca volcado.sql del área de preparación sin hacer ningún commit (y, si quieres, bórralo después).",
      hints: [
        "git status te dice cómo sacar un fichero del área de preparación. Léelo con atención.",
        "git restore --staged <fichero> lo saca del área de preparación, pero conserva el fichero en el disco.",
        "Escribe: git restore --staged volcado.sql (y luego rm volcado.sql)"
      ]
    },
    {
      phase: 2, severity: "medium", source: "Coordinación del Blue Team", xp: 100,
      title: "Corrige el último commit",
      text: "Nueva norma del equipo: el mensaje de cada commit empieza por el código del ticket entre corchetes. Tu último commit (el del script obsoleto) aún no se ha compartido con nadie, así que puedes rehacerlo.",
      objective: "Cambia el mensaje del último commit para que empiece por [GIT-10], sin crear un commit nuevo.",
      hints: [
        "git commit tiene una opción para rehacer el último commit: --amend.",
        "Con git commit --amend -m \"nuevo mensaje\" sustituyes el mensaje. El commit cambia de hash, por eso solo debe hacerse con commits que no hayas compartido.",
        "Escribe: git commit --amend -m \"[GIT-10] Elimina el script de copias obsoleto\""
      ]
    },
    {
      phase: 2, severity: "high", source: "Iker (en prácticas)", xp: 100,
      title: "Commits a medias",
      text: "Iker ha hecho dos commits con el mensaje «wip» en tu rama main. Los cambios son útiles, pero esos commits ensucian el historial. Como no se han compartido, puedes deshacerlos… sin perder su contenido.",
      objective: "Deshaz los dos últimos commits conservando sus cambios en el directorio de trabajo.",
      hints: [
        "git reset mueve la rama actual a otro commit. HEAD~2 significa «dos commits antes de HEAD». Míralo antes con git log --oneline.",
        "Por defecto (--mixed) conserva los cambios en el directorio de trabajo; --soft los deja además preparados. ¡--hard los tiraría!",
        "Escribe: git reset HEAD~2 y comprueba con git status y git log --oneline"
      ]
    },
    {
      phase: 2, severity: "info", source: "Coordinación del Blue Team", xp: 100,
      title: "Un commit limpio",
      text: "Los cambios de Iker están ahora en tu directorio de trabajo: un límite de conexiones para SSH y el registro del cortafuegos. Revísalos y guárdalos en un único commit con un mensaje que explique qué hacen.",
      objective: "Haz un único commit con los cambios de firewall.sh, con un mensaje que empiece por [GIT-15].",
      hints: [
        "Primero mira qué hay: git diff.",
        "git commit -a prepara automáticamente los ficheros modificados que ya estaban en seguimiento, y -m añade el mensaje. Se pueden juntar: -am.",
        "Escribe: git commit -am \"[GIT-15] Limita SSH y activa el registro del cortafuegos\""
      ]
    },

    /* ---------------- FASE 4 · RAMAS Y FUSIONES ---------------- */
    {
      phase: 3, severity: "info", source: "Coordinación del Blue Team", xp: 50,
      title: "Una rama para experimentar",
      text: "Vas a endurecer la configuración de SSH. Es un cambio delicado: mejor hacerlo en una rama aparte y no tocar main hasta que esté listo.",
      objective: "Crea la rama endurecer-ssh y cámbiate a ella.",
      hints: [
        "Una rama es solo un puntero móvil a un commit. git branch <nombre> la crea; git switch <nombre> te cambia a ella.",
        "git switch -c <rama> crea la rama y se cambia a ella en un solo paso (equivale al clásico git checkout -b).",
        "Escribe: git switch -c endurecer-ssh"
      ]
    },
    {
      phase: 3, severity: "info", source: "Coordinación del Blue Team", xp: 100,
      title: "Trabaja en la rama",
      text: "Ya en la rama, crea el fichero sshd_config con la directiva que impide entrar como root por SSH. Mira la pestaña 🌿 Repositorio después del commit: la rama avanza y main se queda donde estaba.",
      objective: "Crea sshd_config con la línea PermitRootLogin no y haz commit en la rama endurecer-ssh.",
      hints: [
        "Crea el fichero con nano sshd_config o con echo y redirección.",
        "Recuerda: git add y después git commit. El commit se añade a la rama en la que estás (la que marca HEAD).",
        "Escribe: echo \"PermitRootLogin no\" > sshd_config && git add sshd_config && git commit -m \"[GIT-17] Prohíbe el acceso de root por SSH\""
      ]
    },
    {
      phase: 3, severity: "critical", source: "Auditoría externa", xp: 100,
      title: "Mientras tanto, en main",
      text: "¡Urgente! Auditoría exige desactivar el FTP ya mismo, y el arreglo no puede esperar a que termines tu rama. Vuelve a main y haz allí el cambio.",
      objective: "En la rama main, cambia ftp=activo por ftp=desactivado en servicios.conf y haz commit.",
      hints: [
        "Vuelve con git switch main. Fíjate: sshd_config desaparece del directorio, porque solo existe en la otra rama.",
        "Edita con nano servicios.conf o con sed -i 's/ftp=activo/ftp=desactivado/' servicios.conf.",
        "Escribe: git switch main && sed -i 's/ftp=activo/ftp=desactivado/' servicios.conf && git commit -am \"[GIT-18] Desactiva el FTP\""
      ]
    },
    {
      phase: 3, severity: "info", source: "Coordinación del Blue Team", xp: 50,
      title: "El mapa de ramas",
      text: "main y endurecer-ssh han divergido: cada una tiene un commit que la otra no tiene. Visualízalo en la terminal y compáralo con el grafo de la pestaña 🌿 Repositorio.",
      objective: "Muestra en la terminal el grafo de todas las ramas.",
      hints: [
        "git log admite una opción que dibuja el grafo: --graph. Pero, por defecto, solo muestra la rama actual.",
        "Añade --all para ver todas las ramas y --oneline para que quepa en pantalla.",
        "Escribe: git log --oneline --graph --all"
      ]
    },
    {
      phase: 3, severity: "medium", source: "Coordinación del Blue Team", xp: 100,
      title: "Fusiona la rama",
      text: "El endurecimiento de SSH está probado. Toca integrarlo en main. Como las dos ramas han avanzado, Git creará un commit de fusión con dos padres.",
      objective: "Fusiona la rama endurecer-ssh en main.",
      hints: [
        "Colócate en la rama que recibe los cambios (main) y usa git merge <rama>.",
        "Git abrirá nano con un mensaje de fusión ya escrito: guarda (Ctrl+O) y sal (Ctrl+X). Con --no-edit aceptas el mensaje sin abrir el editor.",
        "Escribe: git switch main && git merge endurecer-ssh"
      ]
    },
    {
      phase: 3, severity: "info", source: "Coordinación del Blue Team", xp: 50,
      title: "Limpia las ramas fusionadas",
      text: "Los commits de endurecer-ssh ya forman parte de main. Mantener ramas viejas solo confunde a quien llega nuevo.",
      objective: "Borra la rama endurecer-ssh de forma segura.",
      hints: [
        "git branch -d borra una rama solo si ya está fusionada. (-D la borraría a la fuerza, aunque se perdieran commits.)",
        "No puedes borrar la rama en la que estás: comprueba con git branch que estás en main.",
        "Escribe: git branch -d endurecer-ssh"
      ]
    },
    {
      phase: 3, severity: "critical", source: "Nayra (Blue Team)", xp: 150,
      title: "Conflicto a la vista",
      text: "Nayra ha dejado su trabajo en la rama nayra/puertos. Ha tocado la misma línea de servicios.conf que tú: Git no puede decidir solo qué versión es la buena. Nayra ha desinstalado vsftpd, así que la línea correcta es ftp=eliminado.",
      objective: "Fusiona nayra/puertos en main, resuelve el conflicto de servicios.conf y confirma la fusión.",
      hints: [
        "Tras git merge nayra/puertos, git status te dirá qué fichero está en conflicto («ambos modificados»).",
        "Ábrelo con nano: entre <<<<<<< HEAD y ======= está tu versión; entre ======= y >>>>>>> la de Nayra. Deja el contenido final correcto y borra las tres líneas de marcas (Ctrl+K corta líneas).",
        "Después: git add servicios.conf && git commit --no-edit. Si te lías, git merge --abort deja todo como estaba."
      ]
    },

    /* ---------------- FASE 5 · TRABAJO EN EQUIPO ---------------- */
    {
      phase: 4, severity: "info", source: "Administración de sistemas", xp: 50,
      title: "Conecta con el servidor",
      text: "El equipo comparte el código en el servidor Git de la empresa, donde ya han creado un proyecto vacío para vosotros. Tu repositorio local todavía no sabe que existe.",
      objective: "Añade el remoto origin con la dirección git@git.tecnoatlantica.local:blueteam/scripts-blindaje.git",
      hints: [
        "Los remotos se gestionan con git remote. Por convenio, el principal se llama origin.",
        "La sintaxis es git remote add <nombre> <url>. Comprueba el resultado con git remote -v.",
        "Escribe: git remote add origin git@git.tecnoatlantica.local:blueteam/scripts-blindaje.git"
      ]
    },
    {
      phase: 4, severity: "info", source: "Administración de sistemas", xp: 100,
      title: "El primer push",
      text: "El proyecto del servidor está vacío. Sube tu rama main y déjala enlazada con la remota (upstream): así los próximos git push y git pull sabrán adónde ir sin más argumentos.",
      objective: "Sube main a origin y configúrala como rama de seguimiento.",
      hints: [
        "git push <remoto> <rama> sube los commits de esa rama al servidor.",
        "La opción -u (--set-upstream) enlaza tu rama local con la remota. Después bastará con git push a secas.",
        "Escribe: git push -u origin main"
      ]
    },
    {
      phase: 4, severity: "medium", source: "Nayra (Blue Team)", xp: 100,
      title: "Novedades en el servidor",
      text: "Nayra ha subido al servidor el informe de la auditoría. Tu repositorio no se entera solo: Git nunca descarga nada si no se lo pides.",
      objective: "Trae los cambios del servidor e intégralos en tu rama main.",
      hints: [
        "git fetch descarga los commits nuevos y actualiza origin/main, pero no toca tu rama. Después, git status te dirá que vas «detrás».",
        "git pull hace fetch y además integra los cambios en tu rama (aquí será un avance rápido).",
        "Escribe: git fetch && git status && git pull"
      ]
    },
    {
      phase: 4, severity: "high", source: "Dirección de Seguridad", xp: 150,
      title: "Push rechazado",
      text: "El escritorio remoto (3389/tcp) ya no se usa. Añade al cortafuegos una regla que lo bloquee y súbela al servidor. Ojo: Nayra está trabajando ahora mismo en el mismo repositorio…",
      objective: "Añade la línea ufw deny 3389/tcp a firewall.sh, haz commit y consigue subirlo a origin.",
      hints: [
        "Si el push es rechazado, lee el mensaje: el servidor tiene commits que tú no tienes. Hay que integrarlos antes de subir.",
        "git pull te pedirá que elijas cómo reconciliar ramas divergentes: --no-rebase (commit de fusión) o --rebase (reaplica tus commits encima de los de Nayra).",
        "Escribe: git pull --rebase (o git pull --no-rebase) y después git push"
      ]
    },
    {
      phase: 4, severity: "critical", source: "Iker (en prácticas)", xp: 150,
      title: "Revierte sin reescribir",
      text: "Iker ha vuelto a abrir Telnet «para el switch del almacén» y lo ha subido al servidor. Como ese commit ya es público, no se debe borrar de la historia: hay que crear otro commit que lo deshaga.",
      objective: "Trae el commit de Iker, deshazlo con git revert y sube la corrección a origin.",
      hints: [
        "Primero git pull para tener el commit de Iker. Localízalo con git log --oneline y míralo con git show.",
        "git revert <commit> crea un commit nuevo con los cambios inversos. No reescribe la historia, así que es seguro en ramas compartidas (al contrario que reset).",
        "Escribe: git pull && git revert HEAD --no-edit && git push"
      ]
    },
    {
      phase: 4, severity: "medium", source: "Nayra (Blue Team)", xp: 100,
      title: "Trabajo a medias",
      text: "Estás documentando el README cuando Nayra te pide que compruebes algo en la versión publicada. Tus cambios no están listos para un commit, pero tampoco quieres perderlos.",
      objective: "Modifica README.md, guarda los cambios con git stash, comprueba que el directorio queda limpio y recupéralos con git stash pop.",
      hints: [
        "git stash guarda los cambios sin confirmar en una pila y deja el directorio como en el último commit.",
        "git stash list muestra lo guardado; git stash pop lo recupera y lo quita de la pila.",
        "Escribe: echo \"Mantenido por el Blue Team.\" >> README.md && git stash && git status && git stash pop"
      ]
    },
    {
      phase: 4, severity: "info", source: "Dirección de Seguridad", xp: 100,
      title: "Versión 1.0",
      text: "La dirección quiere poder volver en cualquier momento a la configuración aprobada tras la auditoría. Para marcar versiones están las etiquetas.",
      objective: "Crea la etiqueta anotada v1.0 en el último commit y súbela al servidor.",
      hints: [
        "git tag crea etiquetas. Las anotadas (-a) guardan autor, fecha y mensaje, como un commit.",
        "Las etiquetas no viajan con un git push normal: hay que subirlas explícitamente (git push origin <etiqueta> o git push --tags).",
        "Escribe: git tag -a v1.0 -m \"Configuración aprobada tras la auditoría\" && git push origin v1.0"
      ]
    },
    {
      phase: 4, severity: "info", source: "Dirección de Seguridad", xp: 100,
      title: "Verificación final",
      text: "Antes de cerrar el ticket, la dirección quiere comprobar que todo está confirmado y subido: nada pendiente en tu equipo, nada que no esté en el servidor.",
      objective: "Deja el directorio de trabajo limpio y main sincronizada con origin/main, y compruébalo con git status.",
      hints: [
        "git status te dice si hay cambios sin confirmar, ficheros sin seguimiento y si vas por delante o por detrás de origin/main.",
        "¿Queda el cambio del README? Confírmalo (o descártalo con git restore) y haz git push. Si queda algún fichero sin seguimiento, bórralo o ignóralo.",
        "Escribe: git commit -am \"[GIT-30] Indica quién mantiene el repositorio\" && git push && git status"
      ]
    }
  ];

  VG.MISSION_CONTENT.forEach(function (m, i) { m.code = "GIT-" + (i < 9 ? "0" : "") + (i + 1); });
})(this);

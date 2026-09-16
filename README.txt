Sistema de Padron General

Como abrir
1. Abrir C:\Users\laufe\padron-general\index.html con doble clic.
2. El padron general aparece directamente, sin login.

Como publicarlo en GitHub Pages
1. Crear un repositorio nuevo en GitHub, por ejemplo padron-general.
2. Subir estos archivos de la carpeta C:\Users\laufe\padron-general:
   - index.html
   - app.js
   - styles.css
   - logopincho.jpeg
   - padron-electoral.csv
   - README.txt
3. En GitHub entrar al repositorio.
4. Ir a Settings > Pages.
5. En Source elegir Deploy from a branch.
6. En Branch elegir main y carpeta /root.
7. Guardar.
8. GitHub va a generar un link publico parecido a:
   https://TU-USUARIO.github.io/padron-general/

Funciones disponibles
- Buscar por nombres, apellidos, cedula, local, mesa, orden o barrio/compania.

Columnas visibles
- Nombres
- Apellidos
- Cedula
- Local de votacion
- Barrio/compania
- Mesa
- Orden
- Sexo
- Fecha de nacimiento

Notas
- Esta copia carga el padron desde padron-electoral.csv cuando se publica en GitHub Pages.
- No incluye login, total de votantes, filtro por barrio/compania, pagos, control, encuesta, boca de urna, exportacion ni edicion.

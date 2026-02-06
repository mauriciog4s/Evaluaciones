📘 Portal de Evaluaciones de Desempeño G4S
Este proyecto es una aplicación web progresiva (SPA) construida sobre Google Apps Script. Permite la gestión integral del ciclo de evaluación de desempeño, desde la validación de datos del empleado hasta la generación de reportes PDF y envío de correos, integrando Sheets, Forms, Docs y Drive.
1. 🏢 Lógica de Negocio
Esta sección describe cómo funciona la aplicación desde la perspectiva de los procesos de la empresa y las reglas operativas implementadas.
Roles y Permisos
El sistema valida el acceso mediante el correo electrónico del usuario activo de Google y su registro en la hoja "Usuarios":
Administrador: Acceso total (Dashboard, Evaluar, Historial Global, Gestión de Usuarios, Edición de Formularios y Plantillas).
Evaluador: Puede buscar empleados, realizar evaluaciones y ver su propio historial.
UsuarioAdministrador: Rol técnico para gestión de parametrización (Usuarios, Forms) sin necesariamente evaluar.
Usuario: Acceso de solo lectura a sus evaluaciones históricas.
Flujo de Evaluación
Búsqueda y Validación: El evaluador ingresa la cédula del colaborador. El sistema verifica:
Si el empleado existe en la base de datos maestra.
Regla de Unicidad: Si ya existe una evaluación para ese empleado en el año actual, el sistema bloquea una nueva entrada y muestra el reporte existente (Semáforo rojo).
Actualización de Datos (Habeas Data): Antes de evaluar, es obligatorio que el colaborador actualice sus datos de contacto y acepte la política de privacidad mediante un formulario secundario (UPDATE_FORM_ID).
Evaluación: Una vez completado el paso anterior, se desbloquea el formulario principal de evaluación (FORM_ID), pre-llenado con los datos del empleado.
Generación de Resultados
Cálculo Automático: Se capturan respuestas numéricas (1-5) y campos de texto (Fortalezas, Oportunidades).
Documentación: Se genera automáticamente un PDF basado en una plantilla de Google Docs, reemplazando variables dinámicas ({{NOMBRE}}, {{NOTA_GLOBAL}}, etc.).
Notificación: Se envía un correo electrónico al evaluador y al evaluado con el PDF adjunto.
Persistencia: Los datos se guardan en Google Sheets y el archivo PDF en Google Drive.
2. ⚙️ Lógica del Código
Descripción técnica de la arquitectura, tecnologías y funciones clave del sistema.
Arquitectura
Frontend: HTML5, CSS (TailwindCSS vía CDN), JavaScript (Vanilla). Funciona como una Single Page Application (SPA), ocultando/mostrando secciones (<section>) sin recargar la página.
Backend: Google Apps Script (.gs). Actúa como controlador entre el cliente y los servicios de Google.
Base de Datos: Google Sheets (Tablas: Usuarios, Empleados, Evaluaciones).
Componentes Clave (code.gs)
Configuración Central (CONFIG):
Objeto JSON que almacena todos los IDs de los recursos (Sheets, Forms, Docs, Folders). Facilita la migración a otros entornos.
Triggers (instalarDisparador):
Utiliza un trigger instalable onFormSubmit asociado al formulario de evaluación. Esto es crucial porque permite que el script se ejecute con permisos elevados (para generar PDF y enviar email) incluso si el usuario que llena el form tiene permisos limitados.
Comunicación Cliente-Servidor:
Uso de google.script.run para llamadas asíncronas.
getInitData(): Bootstrapping de la app (seguridad y carga inicial).
buscarEmpleado(): Lógica compleja que cruza datos de empleados con el historial de evaluaciones para prevenir duplicados.
Generación de Documentos (generarPDF):
Abre una copia de la plantilla Google Doc.
Realiza un Find & Replace de tokens ({{...}}) con los datos del formulario.
Exporta el blob como PDF y elimina el doc temporal.
Edición Dinámica de Forms:
Las funciones modifyFormQuestion permiten agregar/editar/borrar preguntas en el Google Form real directamente desde la interfaz web administrativa.
Frontend (index.html)
Gestión de Estado: Variables globales (currentEmployee, appData) mantienen la sesión temporal.
UI Dinámica:
initApp(): Controla el loader inicial y el renderizado según el rol.
Modales: Uso de <iframe> para incrustar los formularios de Google en modo vista previa, creando una experiencia integrada.
Gráficos: Implementación de Chart.js para visualizar la distribución de calificaciones en el Dashboard.
3. 📖 Manual de Uso
Guía rápida para la operación y mantenimiento del sistema.
A. Para el Administrador del Sistema (Despliegue)
Configuración Inicial:
Abra code.gs y actualice el objeto CONFIG con los IDs reales de sus archivos de Google (Hoja de cálculo, Formularios, Carpeta Drive, Plantilla Doc).
Activar Automatización:
Ejecute manualmente la función instalarDisparador() dentro del editor de Apps Script una sola vez. Esto conectará el formulario de Google con el script de generación de PDF.
Gestión de Usuarios:
Vaya a la sección Administración > Usuarios.
Agregue correos de Google válidos y asigne el rol correspondiente. Solo los usuarios "Activos" pueden entrar.
B. Para el Evaluador (Proceso Estándar)
Iniciar Evaluación:
Vaya a "Evaluar Talento".
Ingrese la cédula del colaborador y presione "BUSCAR".
Verificación:
Confirme que los datos (Nombre, Cargo, Sucursal) sean correctos en la tarjeta de resultado.
Paso 1: Actualización (Candado):
Haga clic en "Iniciar Formulario". Se abrirá una ventana modal.
El sistema pedirá completar primero el formulario de "Habeas Data". Una vez enviado, espere 2 segundos; el botón "Continuar a Evaluación" se activará.
Paso 2: Evaluación:
Complete el formulario de desempeño (calificación 1-5 y comentarios).
Al enviar, el sistema procesará los datos automáticamente. Recibirá un correo con el PDF en breve.
C. Mantenimiento de Formularios
Menú Formulario: Desde aquí puede agregar o eliminar preguntas de la evaluación.
Nota: Los cambios se reflejan inmediatamente en el Google Form oficial. Tenga cuidado al eliminar preguntas, ya que esto afecta la estructura de datos futura.
Plantilla PDF: Si necesita cambiar el logo o textos fijos del reporte, vaya a Administración > Plantilla y haga clic en "Editar en Docs". No modifique los textos entre llaves {{...}} o el sistema dejará de llenarlos.

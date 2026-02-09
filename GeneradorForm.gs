/**
 * GENERADOR DE FORMULARIO DE EVALUACIÓN G4S (ACTUALIZADO 2026)
 */

function crearFormularioMaestro() {
  // 1. Configuración Básica
  const form = FormApp.create('Evaluación de Desempeño G4S - Operativos');
  
  form.setDescription(
    "A continuación encontrará una serie de factores que describen el comportamiento del funcionario. " +
    "Seleccione la calificación que mejor se ajusta a su desempeño:\n\n" +
    "5 - EXCELENTE\n4 - MUY BUENO\n3 - BUENO\n2 - REGULAR\n1 - DEFICIENTE"
  )
  .setConfirmationMessage('Evaluación registrada correctamente. Se ha enviado el PDF al correo electrónico.')
  .setPublishingSummary(false)
  .setShowLinkToRespondAgain(false);

  // 2. Sección: Datos del Funcionario (PRE-LLENADO AUTOMÁTICO)
  form.addSectionHeaderItem().setTitle('1. Datos del Funcionario (Pre-llenados)');
  
  // Mantenemos estos nombres exactos para que tu sistema actual siga funcionando
  const itemNombre = form.addTextItem().setTitle('Nombre del Evaluado').setRequired(true);
  const itemCedula = form.addTextItem().setTitle('Cédula').setRequired(true);
  const itemCargo = form.addTextItem().setTitle('Cargo').setRequired(true);
  const itemEmail = form.addTextItem().setTitle('Email Evaluado')
    .setHelpText('Campo oculto para envío de reporte').setRequired(false);

  // 3. Sección: Datos del Evaluador e Información General
  form.addPageBreakItem().setTitle('2. Datos del Evaluador y Generalidades');
  
  form.addTextItem().setTitle('Nombre del Evaluador').setRequired(true);
  form.addTextItem().setTitle('Cargo del Evaluador').setRequired(true);

  // --- NUEVOS CAMPOS SOLICITADOS (Tarea 3) ---
  form.addListItem()
      .setTitle('Relación con el evaluado')
      .setChoiceValues(['Compañero', 'Cliente Interno', 'Cliente Externo'])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Antecedentes Disciplinarios (Últimos 6 meses)')
      .setChoiceValues(['SÍ', 'NO'])
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Felicitaciones (Últimos 6 meses)')
      .setChoiceValues(['SÍ', 'NO'])
      .setRequired(true);


  // 4. Sección: Evaluación de Competencias (Tarea 1 y 2)
  form.addPageBreakItem().setTitle('3. Evaluación de Competencias');
  
  // Nueva Escala Numérica
  const opcionesEscala = [
    '5 - Excelente', 
    '4 - Muy bueno', 
    '3 - Bueno', 
    '2 - Regular', 
    '1 - Deficiente'
  ];
  
  // Definición de Secciones y Preguntas
  const estructura = [
    {
      categoria: "SERVICIO (OPERACIONAL)",
      items: [
        "1. Transmite de manera efectiva y asertiva la información propia de su tarea o labor.",
        "2. Realiza tareas, actividades o procesos con minuciosidad, exactitud a los estándares previamente planteados, cumpliendo cabalmente con los procedimientos establecidos por el cliente.",
        "3. Permanece enfocado en la realización eficiente de sus labores, evitando distractores como uso de celular, redes sociales entre otros."
      ]
    },
    {
      categoria: "DISCIPLINA OPERACIONAL",
      items: [
        "4. Permanencia en el sitio de trabajo: Puntualidad en el servicio conforme la jornada laboral programada, realizando el respectivo registro en las plataformas definidas (Javelin, App).",
        "5. Asiste de manera puntual a las capacitaciones programadas por la organización, manteniendo actualizado los cursos de acreditación SVSP y Examen psicofísico.",
        "6. Mantiene una excelente presentación personal, portando de manera adecuada el uniforme (uso de marca)."
      ]
    },
    {
      categoria: "SERVICIO AL CLIENTE (Interno - Externo)",
      items: [
        "7. Trata con amabilidad cortesía, y mantiene el respeto por sus compañeros, jefes y subalternos.",
        "8. Facilita acciones para la escucha de las opiniones de los demás, el respeto por las ideas, las diferencias y la búsqueda de un objetivo común.",
        "9. Mantiene una disposición y actitud de servicio adecuada frente al servicio permitiendo el cumplimiento de los estándares pactados.",
        "10. Satisface las necesidades y demandas de los clientes, cumple con compromisos de resolver inquietudes, brindando apoyo efectivo."
      ]
    },
    {
      categoria: "SIG - SALUD Y SEGURIDAD",
      items: [
        "11. Conocimiento y aplicación de la Política Organizacional (Armas, Seguridad, Calidad, Alcohol y drogas, DDHH).",
        "12. Participación en las actividades del SIG, investigación de incidentes y aplicación de controles de impactos ambientales.",
        "13. Cumple con las responsabilidades legales en Salud y Seguridad, frente al reporte de peligros y accidentes de manera oportuna.",
        "14. Desempeño Seguro: (5) Sin accidentes/incidentes. (3) Un comportamiento inseguro única vez. (1) Accidentes con incapacidad o recurrentes."
      ]
    }
  ];

  // Generar preguntas en el formulario
  estructura.forEach(seccion => {
    form.addSectionHeaderItem().setTitle(seccion.categoria); // Separador visual
    seccion.items.forEach(pregunta => {
      form.addMultipleChoiceItem()
        .setTitle(pregunta)
        .setChoiceValues(opcionesEscala)
        .setRequired(true);
    });
  });

  // 5. Sección: Cierre y Compromisos (Tarea 3 - Nuevos Campos)
  form.addPageBreakItem().setTitle('4. Plan de Desarrollo y Cierre');
  
  // Nota: Ya no usamos la pregunta "Evaluación Global" manual, la calcularemos por promedio en el backend,
  // pero si deseas mantener una subjetiva del jefe, la dejamos:
  form.addMultipleChoiceItem()
      .setTitle('Calificación Global Subjetiva')
      .setChoiceValues(opcionesEscala)
      .setRequired(true);

  // Nuevos campos de texto
  form.addParagraphTextItem().setTitle('FORTALEZAS').setRequired(true);
  form.addParagraphTextItem().setTitle('OPORTUNIDADES').setRequired(true);
  form.addParagraphTextItem().setTitle('COMPROMISO DE LAS OPORTUNIDADES').setRequired(true);
  form.addParagraphTextItem().setTitle('¿Qué le sugerirías al evaluado para mejorar su desempeño profesional y personal?').setRequired(true);
  form.addParagraphTextItem().setTitle('CONCEPTO GENERAL DEL JEFE INMEDIATO').setRequired(true);

  // --- GENERACIÓN DE URL PRE-LLENADA ---
  const formResponse = form.createResponse();
  formResponse.withItemResponse(itemNombre.createResponse("DATA_NOMBRE"));
  formResponse.withItemResponse(itemCedula.createResponse("DATA_CEDULA"));
  formResponse.withItemResponse(itemCargo.createResponse("DATA_CARGO"));
  formResponse.withItemResponse(itemEmail.createResponse("DATA_EMAIL"));
  
  const urlPrefilled = formResponse.toPrefilledUrl();
  
  console.log("---------------------------------------------------------");
  console.log("✅ NUEVO FORMULARIO CREADO (ACTUALIZADO)");
  console.log("🔗 URL Pública: " + form.getPublishedUrl());
  console.log("---------------------------------------------------------");
  console.log("⚠️ IMPORTANTE: COPIA EL SIGUIENTE BLOQUE A TU ARCHIVO Code.gs ⚠️");
  
  const idNombre = extractEntryId(urlPrefilled, "DATA_NOMBRE");
  const idCedula = extractEntryId(urlPrefilled, "DATA_CEDULA");
  const idCargo = extractEntryId(urlPrefilled, "DATA_CARGO");
  const idEmail = extractEntryId(urlPrefilled, "DATA_EMAIL");

  const configCode = `
  URLS: {
    FORM_BASE: '${form.getPublishedUrl()}?usp=pp_url' 
               + '&entry.${idNombre}={{NOMBRE}}'
               + '&entry.${idCedula}={{CEDULA}}'
               + '&entry.${idCargo}={{CARGO}}'
               + '&entry.${idEmail}={{EMAIL}}'
  }
  `;
  
  console.log(configCode);
  console.log("---------------------------------------------------------");
}

function extractEntryId(url, placeholder) {
  const regex = new RegExp(`entry\\.(\\d+)=${placeholder}`);
  const match = url.match(regex);
  return match ? match[1] : "NO_ENCONTRADO";
}

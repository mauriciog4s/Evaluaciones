/**
 * GENERADOR DE FORMULARIO DE EVALUACIÓN G4S (ACTUALIZADO 2026 - V2)
 */

const ID_HOJA_EMPLEADOS = '1zFayNigYrkODNRhKq4IoErLELB98xyj_8ZvGADEp3s4';

function crearFormularioMaestro() {
  const form = FormApp.create('Talent Assessment Front Line - Operativos');
  form.setDescription(
    "A continuación encontrará una serie de factores que describen el comportamiento del funcionario. " +
    "Seleccione la calificación que mejor se ajusta a su desempeño:\n\n" +
    "5 - EXCELENTE\n4 - MUY BUENO\n3 - BUENO\n2 - REGULAR\n1 - DEFICIENTE"
  )
  .setConfirmationMessage('Evaluación registrada correctamente. Se ha enviado el PDF al correo electrónico.')
  .setPublishingSummary(false)
  .setShowLinkToRespondAgain(false);

  form.addSectionHeaderItem().setTitle('1. Datos del Funcionario (Pre-llenados)');
  const itemNombre = form.addTextItem().setTitle('Nombre del Evaluado').setRequired(true);
  const itemCedula = form.addTextItem().setTitle('Cédula').setRequired(true);
  const itemCargo = form.addTextItem().setTitle('Cargo').setRequired(true);
  
  const listaRegionales = obtenerOpcionesUnicas('Regional');
  const listaLineas = obtenerOpcionesUnicas('lineaNegocio');
  
  const itemRegional = form.addListItem().setTitle('Regional').setChoiceValues(listaRegionales).setRequired(true);
  const itemLinea = form.addListItem().setTitle('Línea de Negocio').setChoiceValues(listaLineas).setRequired(true);
  const itemDispositivo = form.addTextItem().setTitle('Dispositivo').setHelpText('Ingrese el nombre del puesto o dispositivo asignado.').setRequired(true);
  const itemEmail = form.addTextItem().setTitle('Email Evaluado').setHelpText('Campo oculto para envío de reporte').setRequired(false);

  form.addPageBreakItem().setTitle('2. Datos del Evaluador y Generalidades');
  form.addTextItem().setTitle('Nombre del Evaluador').setRequired(true);
  form.addTextItem().setTitle('Cargo del Evaluador').setRequired(true);

  // ACTUALIZACIÓN: Relación con el evaluado
  form.addMultipleChoiceItem()
      .setTitle('Relación con el evaluado')
      .setChoiceValues(['Supervisor', 'Jefe', 'Coordinador', 'Líder', 'Gerente', 'Ingeniero'])
      .showOtherOption(true) // Activa la opción "Otro" con campo de texto libre
      .setRequired(true);

  form.addMultipleChoiceItem()
      .setTitle('Antecedentes Disciplinarios (Últimos 6 meses)')
      .setChoiceValues(['SÍ', 'NO'])
      .setRequired(true);

  // ACTUALIZACIÓN: Felicitaciones y Descripción
  form.addMultipleChoiceItem()
      .setTitle('Felicitaciones (Últimos 6 meses)')
      .setChoiceValues(['SÍ', 'NO'])
      .setRequired(true);
  form.addParagraphTextItem()
      .setTitle('Descripción de felicitaciones (Si marcó SÍ)')
      .setRequired(false);

  form.addPageBreakItem().setTitle('3. Evaluación de Competencias');
  const opcionesEscala = ['5 - Excelente', '4 - Muy bueno', '3 - Bueno', '2 - Regular', '1 - Deficiente'];
  
  // (La estructura de preguntas se mantiene igual)
  const estructura = [
    { categoria: "SERVICIO (OPERACIONAL)", items: ["1. Transmite de manera efectiva y asertiva la información propia de su tarea o labor.", "2. Realiza tareas, actividades o procesos con minuciosidad, exactitud a los estándares previamente planteados, cumpliendo cabalmente con los procedimientos establecidos por el cliente.", "3. Permanece enfocado en la realización eficiente de sus labores, evitando distractores como uso de celular, redes sociales entre otros."] },
    { categoria: "DISCIPLINA OPERACIONAL", items: ["4. Permanencia en el sitio de trabajo: Puntualidad en el servicio conforme la jornada laboral programada, realizando el respectivo registro en las plataformas definidas (Javelin, App).", "5. Asiste de manera puntual a las capacitaciones programadas por la organización, manteniendo actualizado los cursos de acreditación SVSP y Examen psicofísico.", "6. Mantiene una excelente presentación personal, portando de manera adecuada el uniforme (uso de marca)."] },
    { categoria: "SERVICIO AL CLIENTE (Interno - Externo)", items: ["7. Trata con amabilidad cortesía, y mantiene el respeto por sus compañeros, jefes y subalternos.", "8. Facilita acciones para la escucha de las opiniones de los demás, el respeto por las ideas, las diferencias y la búsqueda de un objetivo común.", "9. Mantiene una disposición y actitud de servicio adecuada frente al servicio permitiendo el cumplimiento de los estándares pactados.", "10. Satisface las necesidades y demandas de los clientes, cumple con compromisos de resolver inquietudes, brindando apoyo efectivo."] },
    { categoria: "SIG - SALUD Y SEGURIDAD", items: ["11. Conocimiento y aplicación de la Política Organizacional (Armas, Seguridad, Calidad, Alcohol y drogas, DDHH).", "12. Participación en las actividades del SIG, investigación de incidentes y aplicación de controles de impactos ambientales.", "13. Cumple con las responsabilidades legales en Salud y Seguridad, frente al reporte de peligros y accidentes de manera oportuna.", "14. Desempeño Seguro: (5) Sin accidentes/incidentes. (3) Un comportamiento inseguro única vez. (1) Accidentes con incapacidad o recurrentes."] }
  ];

  estructura.forEach(seccion => {
    form.addSectionHeaderItem().setTitle(seccion.categoria);
    seccion.items.forEach(pregunta => { form.addMultipleChoiceItem().setTitle(pregunta).setChoiceValues(opcionesEscala).setRequired(true); });
  });

  form.addPageBreakItem().setTitle('4. Plan de Desarrollo y Cierre');
  form.addMultipleChoiceItem().setTitle('Calificación Global Subjetiva').setChoiceValues(opcionesEscala).setRequired(true);
  form.addParagraphTextItem().setTitle('FORTALEZAS').setRequired(true);
  form.addParagraphTextItem().setTitle('OPORTUNIDADES').setRequired(true);
  form.addParagraphTextItem().setTitle('COMPROMISO DE LAS OPORTUNIDADES').setRequired(true);
  form.addParagraphTextItem().setTitle('¿Qué le sugerirías al evaluado para mejorar su desempeño profesional y personal?').setRequired(true);
  form.addParagraphTextItem().setTitle('CONCEPTO GENERAL DEL JEFE INMEDIATO').setRequired(true);

  // URL PRE-LLENADA
  const formResponse = form.createResponse();
  formResponse.withItemResponse(itemNombre.createResponse("DATA_NOMBRE"));
  formResponse.withItemResponse(itemCedula.createResponse("DATA_CEDULA"));
  formResponse.withItemResponse(itemCargo.createResponse("DATA_CARGO"));
  formResponse.withItemResponse(itemEmail.createResponse("DATA_EMAIL"));
  if(listaRegionales.length > 0) formResponse.withItemResponse(itemRegional.createResponse(listaRegionales[0]));
  if(listaLineas.length > 0) formResponse.withItemResponse(itemLinea.createResponse(listaLineas[0]));
  formResponse.withItemResponse(itemDispositivo.createResponse("DATA_DISPOSITIVO"));

  const urlPrefilled = formResponse.toPrefilledUrl();
  console.log("✅ NUEVO FORMULARIO CREADO");
  console.log("🔗 URL Pública: " + form.getPublishedUrl());
  
  const idNombre = extractEntryId(urlPrefilled, "DATA_NOMBRE");
  const idCedula = extractEntryId(urlPrefilled, "DATA_CEDULA");
  const idCargo = extractEntryId(urlPrefilled, "DATA_CARGO");
  const idEmail = extractEntryId(urlPrefilled, "DATA_EMAIL");
  const idRegional = extractEntryIdRegex(urlPrefilled, listaRegionales[0]);
  const idLinea = extractEntryIdRegex(urlPrefilled, listaLineas[0]);
  const idDispositivo = extractEntryId(urlPrefilled, "DATA_DISPOSITIVO");

  console.log(`
  URLS: {
    FORM_BASE: '${form.getPublishedUrl()}?usp=pp_url' 
               + '&entry.${idNombre}={{NOMBRE}}'
               + '&entry.${idCedula}={{CEDULA}}'
               + '&entry.${idCargo}={{CARGO}}'
               + '&entry.${idEmail}={{EMAIL}}'
               + '&entry.${idRegional}={{REGIONAL}}'
               + '&entry.${idLinea}={{LINEA_NEGOCIO}}'
               + '&entry.${idDispositivo}={{DISPOSITIVO}}',
  }`);
}

function obtenerOpcionesUnicas(nombreColumna) {
  try {
    const sheet = SpreadsheetApp.openById(ID_HOJA_EMPLEADOS).getSheetByName('empleados');
    const data = sheet.getDataRange().getValues();
    const colIndex = data[0].indexOf(nombreColumna);
    if (colIndex === -1) return [];
    return [...new Set(data.slice(1).map(row => row[colIndex].toString().trim()).filter(val => val !== ''))].sort();
  } catch (e) { return ['Error cargando datos']; }
}
function extractEntryId(url, placeholder) { const match = url.match(new RegExp(`entry\\.(\\d+)=${placeholder}`)); return match ? match[1] : "NO_ENCONTRADO"; }
function extractEntryIdRegex(url, valueToFind) { const escapedValue = valueToFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\+'); const match = url.match(new RegExp(`entry\\.(\\d+)=${escapedValue}`)); return match ? match[1] : "NO_ENCONTRADO"; }

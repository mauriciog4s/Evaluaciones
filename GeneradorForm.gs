/**
 * 🛠️ GENERADOR DE FORMULARIO DE EVALUACIÓN G4S
 * Ejecuta la función 'crearFormularioMaestro' UNA SOLA VEZ para generar tu Google Form.
 * Luego, revisa el LOG (Ver -> Registros de ejecución) para obtener los IDs.
 */

function crearFormularioMaestro() {
  // 1. Configuración Básica
  const form = FormApp.create('Evaluación de Desempeño G4S - Operativos');
  
  form.setDescription(
    "A continuación encontrará una serie de factores que describen el comportamiento del funcionario en diferentes aspectos laborales. Seleccione la casilla que mejor se ajusta a su desempeño de acuerdo con la siguiente escala:\n\n" +
    "🟢 EXCELENTE: Supera significativamente los parámetros establecidos y las expectativas de G4S.\n" +
    "🟡 BUENO: Cumple con lo esperado dentro de los compromisos y exigencias para el cargo.\n" +
    "🔴 DEFICIENTE: Se encuentra por debajo de los parámetros establecidos y de las expectativas de G4S."
  )
  .setConfirmationMessage('Evaluación registrada correctamente. Se ha enviado el PDF al correo electrónico.')
  .setPublishingSummary(false)
  .setShowLinkToRespondAgain(false);

  // 2. Sección: Datos del Funcionario (PRE-LLENADO)
  // Es CRÍTICO que estos títulos coincidan para que el script pueda detectar los IDs después
  const s1 = form.addSectionHeaderItem().setTitle('1. Datos del Funcionario (Pre-llenados)');
  
  const itemNombre = form.addTextItem().setTitle('Nombre del Evaluado').setRequired(true);
  const itemCedula = form.addTextItem().setTitle('Cédula').setRequired(true);
  const itemCargo = form.addTextItem().setTitle('Cargo').setRequired(true);
  const itemEmail = form.addTextItem().setTitle('Email Evaluado')
    .setHelpText('Campo oculto para envío de reporte').setRequired(false); // No obligatorio por si no tiene

  // 3. Sección: Datos del Evaluador
  form.addPageBreakItem().setTitle('2. Datos del Evaluador');
  
  form.addTextItem().setTitle('Nombre del Evaluador').setRequired(true);
  form.addTextItem().setTitle('Cargo del Evaluador').setRequired(true);

  // 4. Sección: Evaluación de Competencias
  form.addPageBreakItem().setTitle('3. Evaluación de Desempeño');
  
  const opcionesEscala = ['EXCELENTE', 'BUENO', 'DEFICIENTE'];
  
  const preguntas = [
    "1. Desempeño de sus funciones: tiene claro los roles, funciones y responsabilidades a nivel de su cargo dentro de la organización y los ejecuta de acuerdo a lo esperado a nivel contractual.",
    "2. Elaboración de Informes y reportes: Elabora los reportes técnicos, protocolos e informes de los servicios prestados a nuestros clientes dentro de los periodos de tiempo estipulados en el área.",
    "3. Presentación y estado del uniforme: Cuenta con una excelente presentación personal en forma permanente (aseo del uniforme, cuidado, planchado, si tiene alguna costura debe ser invisible y en hilo de igual color, dobladillo pantalón, cabello).",
    "4. Identificación personal y de la compañía: En todo momento portan el carné de identificación de la compañía, credencial de la superintendencia, ARP, EPS y demás documentos de operación, cuando son requeridos en el puesto de trabajo.",
    "5. Cumplimientos de Horarios: El colaborador cumple con los horarios establecidos de acuerdo a los cronogramas de trabajo del área y a lo estipulado por el jefe inmediato. Adicionalmente el colaborador reporta oportunamente eventos o situaciones que puedan terminar en un ausentismo.",
    "6. Compromiso con el desarrollo: Asiste de manera puntual a las capacitaciones programadas por la organización virtuales y presenciales y aquellas que aporten de manera significativa a sus competencias técnicas y personales. Así mismo aplica dichos conocimientos y los comparte con los miembros del equipo.",
    "7. Innovación: Genera ideas y propuestas encaminadas a la mejora de la prestación del servicio y la optimización de los recursos de la organización.",
    "8. Comunicación: La comunicación es clara, oportuna y cierta. Reporta las novedades presentadas a los clientes, superiores y Jefes.",
    "9. Manejo de información: Es discreto , reservado y cauteloso. Igualmente conoce la información relevante de su trabajo y reporta oportunamente los incidentes, actos, condiciones inseguras que se presentan en su puesto de trabajo.",
    "10. Relaciones Compañeros de Trabajo: Trata con amabilidad cortesía, y mantiene el respeto por sus compañeros, jefes y subalternos. Facilita acciones para la escucha de las opiniones de los demás.",
    "11. Trato adecuado con clientes y jefes: Utiliza una comunicación adecuada al referirse a clientes y jefes usando un vocabulario adecuado y respetuoso.",
    "12. Desempeño Seguro en el Trabajo: Si el trabajador en el último año no ha sufrido accidentes de trabajo califique como E, Si ha tenido accidentes o comportamientos inseguros por un única vez califique con B, Si ha sufrido accidentes con incapacidad o más de dos eventos sin incapacidad califique con D."
  ];

  preguntas.forEach(p => {
    form.addMultipleChoiceItem()
      .setTitle(p)
      .setChoiceValues(opcionesEscala)
      .setRequired(true);
  });

  // 5. Sección: Cierre y Compromisos
  form.addPageBreakItem().setTitle('4. Cierre de Evaluación');
  
  form.addMultipleChoiceItem()
      .setTitle('Evaluación Global')
      .setChoiceValues(opcionesEscala)
      .setRequired(true);

  form.addParagraphTextItem()
      .setTitle('Concepto General del Jefe Inmediato')
      .setRequired(true);

  form.addParagraphTextItem()
      .setTitle('Compromisos de Mejoramiento')
      .setRequired(true);

  // --- MAGIA: GENERAR URL PRE-LLENADA PARA OBTENER LOS IDs ---
  const formResponse = form.createResponse();
  // Llenamos con datos "dummy" para identificar los campos
  formResponse.withItemResponse(itemNombre.createResponse("DATA_NOMBRE"));
  formResponse.withItemResponse(itemCedula.createResponse("DATA_CEDULA"));
  formResponse.withItemResponse(itemCargo.createResponse("DATA_CARGO"));
  formResponse.withItemResponse(itemEmail.createResponse("DATA_EMAIL"));
  
  const urlPrefilled = formResponse.toPrefilledUrl();
  
  console.log("---------------------------------------------------------");
  console.log("✅ FORMULARIO CREADO EXITOSAMENTE");
  console.log("🔗 URL de Edición: " + form.getEditUrl());
  console.log("🔗 URL Pública: " + form.getPublishedUrl());
  console.log("---------------------------------------------------------");
  console.log("⚠️ COPIA Y PEGA ESTO EN TU ARCHIVO Code.gs (Variable URLS) ⚠️");
  console.log("---------------------------------------------------------");
  
  // Extraer IDs de la URL generada
  // La URL se ve tipo: ...viewform?entry.12345=DATA_NOMBRE&entry.67890=DATA_CEDULA...
  
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

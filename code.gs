/**
 * 📘 PORTAL DE EVALUACIÓN DE DESEMPEÑO G4S - BACKEND PRO (V3.2 - Conectado a Formulario V2)
 */

const CONFIG = {
  IDS: {
    USUARIOS: '1pXCF8pwFNUSdP_-6L9ib9fcBltZqHoUW7tGyVI4zbx0',
    EMPLEADOS: '1zFayNigYrkODNRhKq4IoErLELB98xyj_8ZvGADEp3s4',
    EVALUACIONES: '1WuIyPUYGzKTlmSQ8oGUTdOu4Tm-JrpUNDYksJzHjweA',
    PLANTILLA_DOC: '1gvD5arbSG66iUMimEnvvYNI3tjzm7Al18VUJw_fA5Rk',
    CARPETA_PDF: '16U-cJ4f5tjk3WkgxOVx9FjkNTa6se-lT', 
    
    // ⚠️ IDs CON EL ID DE EDICIÓN DE FORMULARIOS ⚠️
    FORM_ID: '1_s4iIo4AgOsMPGdpHhorgY41lm4RE00TezKkZl8KDl8', // ID Edición del Formulario de Evaluación
    UPDATE_FORM_ID: '18RbSuIMAaYdTN14Sej8ssrlgCRbLuECpJkOYhksgPGQ' // ID Edición del Form de Actualización/Habeas Data
  },
  
  URLS: {
    // NUEVAS URLs DE PRE-LLENADO INYECTADAS
    FORM_BASE: 'https://docs.google.com/forms/d/e/1FAIpQLSc9bj-Md8id3AofTkxR6-NNWr72uNq38XRfaIgUfTHPl1EMmw/viewform?usp=pp_url' 
               + '&entry.822293003={{NOMBRE}}'
               + '&entry.1106767619={{CEDULA}}'
               + '&entry.1012678502={{CARGO}}'
               + '&entry.1571972692={{EMAIL}}'
               + '&entry.639878995={{REGIONAL}}'
               + '&entry.783673536={{LINEA_NEGOCIO}}'
               + '&entry.696010879={{DISPOSITIVO}}',

    UPDATE_FORM_BASE: 'https://docs.google.com/forms/d/e/1FAIpQLSfWeXGUEoLMGNQ2YlVNXsVZf1mMlG0eWp5ihify6KpXnbww8A/viewform?usp=pp_url' 
               + '&entry.321760425={{CEDULA}}'
               + '&entry.2137361364={{NOMBRE}}'
  }
};

// --- ⚠️ EJECUTA ESTA FUNCIÓN UNA VEZ PARA CONECTAR EL NUEVO FORMULARIO ---
function instalarDisparador() {
  try {
    const form = FormApp.openById(CONFIG.IDS.FORM_ID);
    
    const triggers = ScriptApp.getProjectTriggers();
    for (const t of triggers) {
      if (t.getHandlerFunction() === 'procesarFormulario') {
        ScriptApp.deleteTrigger(t);
      }
    }
    
    ScriptApp.newTrigger('procesarFormulario')
      .forForm(form)
      .onFormSubmit()
      .create();
      
    console.log("✅ DISPARADOR INSTALADO CORRECTAMENTE PARA EL NUEVO FORMULARIO.");
  } catch (e) {
    console.error("❌ ERROR INSTALANDO DISPARADOR: " + e.message);
  }
}

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('G4S | Portal de Evaluación')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl('https://www.g4s.com/favicon.ico');
}

function getInitData() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const sheet = SpreadsheetApp.openById(CONFIG.IDS.USUARIOS).getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    const headers = data[0]; 
    const idxCorreo = headers.indexOf('Correo'); 
    const idxEstado = headers.indexOf('Estado'); 
    const idxRol = headers.indexOf('Rol'); 

    if (idxCorreo === -1 || idxEstado === -1) return { error: true, message: 'Error Backend: Faltan columnas Correo/Estado.' };

    const usuario = data.slice(1).find(r => 
      r[idxCorreo] && r[idxCorreo].toString().trim().toLowerCase() === userEmail.toLowerCase() && 
      r[idxEstado] === 'Activo'
    );

    if (!usuario) return { error: true, message: 'ACCESO DENEGADO: Su usuario no tiene permisos activos.' };

    const userRole = (idxRol > -1 && usuario[idxRol]) ? usuario[idxRol] : 'Usuario';
    const isAdminUI = ['Administrador', 'UsuarioAdministrador'].includes(userRole);

    // --- NUEVO: OBTENER LISTA DE EVALUADORES SI ES ADMINISTRADOR ---
    let evaluadoresUnicos = [];
    if (isAdminUI) {
      try {
        const evSheet = SpreadsheetApp.openById(CONFIG.IDS.EVALUACIONES).getSheetByName('Evaluaciones');
        const evData = evSheet.getDataRange().getValues();
        const idxEv = evData[0].indexOf('Evaluador');
        if (idxEv > -1) {
          const lista = evData.slice(1).map(r => r[idxEv]).filter(e => e && e.toString().trim() !== '');
          evaluadoresUnicos = [...new Set(lista)].sort();
        }
      } catch (e) { console.warn("No se pudo obtener la lista de evaluadores: " + e.message); }
    }

    return { 
      success: true, 
      email: userEmail, 
      role: userRole,
      isAdmin: isAdminUI,
      evaluadores: evaluadoresUnicos, // Enviamos los evaluadores al frontend
      formUrlBase: CONFIG.URLS.FORM_BASE,
      updateUrlBase: CONFIG.URLS.UPDATE_FORM_BASE,
      templateUrl: `https://docs.google.com/document/d/${CONFIG.IDS.PLANTILLA_DOC}/edit`,
      dashboard: getDashboardStats()
    };
  } catch (err) { return { error: true, message: err.message }; }
}

function buscarEmpleado(cedula) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.IDS.EMPLEADOS).getSheetByName('empleados');
    const data = sheet.getDataRange().getValues();
    const headers = data[0]; 
    
    const map = {
      cedula: headers.indexOf('Identificacion'), 
      nombre: headers.indexOf('Nombre'),         
      cargo: headers.indexOf('Cargo'),           
      sucursal: headers.indexOf('Sucursal'),     
      fecha: headers.indexOf('FechaIngreso'),    
      email: headers.indexOf('eMail'),
      compania: headers.indexOf('Compania'),
      estado: headers.indexOf('Estado'),
      codigo: headers.indexOf('Codigo'),
      contrato: headers.indexOf('Contrato'),
      regional: headers.indexOf('Regional'),
      lineaNegocio: headers.indexOf('lineaNegocio'),
      dispositivo: headers.indexOf('Dispositivo')
    };

    const cedulaStr = cedula.toString().trim();
    const empleado = data.slice(1).find(row => row[map.cedula].toString() === cedulaStr);

    if (!empleado) return { found: false };

    let existingEvaluation = null;
    try {
      const currentYear = new Date().getFullYear();
      const sheetEval = SpreadsheetApp.openById(CONFIG.IDS.EVALUACIONES).getSheetByName('Evaluaciones');
      const dataEval = sheetEval.getDataRange().getValues();
      const headersEval = dataEval[0];
      const iCedulaEval = headersEval.indexOf('Cedula');
      const iFechaEval = headersEval.indexOf('Fecha de Creación');
      const iEvaluador = headersEval.indexOf('Evaluador');
      const iResultado = headersEval.indexOf('Evglobal');
      const iLink = headersEval.indexOf('LinkRepoteFinal');

      const evaluacionEncontrada = dataEval.slice(1).find(r => {
        const cedulaEval = r[iCedulaEval].toString().trim();
        const fechaObj = new Date(r[iFechaEval]);
        return cedulaEval === cedulaStr && fechaObj.getFullYear() === currentYear;
      });

      if (evaluacionEncontrada) {
        const originalLink = evaluacionEncontrada[iLink] || '#';
        const embedLink = originalLink.replace(/\/view.*/, '/preview').replace(/\/edit.*/, '/preview');
        existingEvaluation = {
          exists: true,
          year: currentYear,
          fecha: formatFecha(evaluacionEncontrada[iFechaEval]),
          evaluador: evaluacionEncontrada[iEvaluador] || 'Sistema',
          resultado: evaluacionEncontrada[iResultado] || '-',
          pdfLink: embedLink
        };
      }
    } catch(err) { console.warn("Error validando duplicados: " + err.message); }

    return {
      found: true,
      data: {
        cedula: empleado[map.cedula],
        nombre: empleado[map.nombre],
        cargo: empleado[map.cargo],
        sucursal: empleado[map.sucursal],
        fechaIngreso: formatFecha(empleado[map.fecha]),
        email: empleado[map.email] || '',
        compania: (map.compania > -1 && empleado[map.compania]) ? empleado[map.compania] : 'G4S Secure Solutions',
        estado: map.estado > -1 ? empleado[map.estado] : 'Activo',
        codigo: (map.codigo > -1 && empleado[map.codigo]) ? empleado[map.codigo] : '',
        contrato: (map.contrato > -1 && empleado[map.contrato]) ? empleado[map.contrato] : '',
        regional: (map.regional > -1 && empleado[map.regional]) ? empleado[map.regional] : '',
        lineaNegocio: (map.lineaNegocio > -1 && empleado[map.lineaNegocio]) ? empleado[map.lineaNegocio] : '',
        dispositivo: (map.dispositivo > -1 && empleado[map.dispositivo]) ? empleado[map.dispositivo] : ''
      },
      existingEvaluation: existingEvaluation
    };
  } catch (e) { return { error: true, message: e.message }; }
}

function procesarFormulario(e) {
  if (!e) return;
  const items = e.response.getItemResponses();
  const r = {}; 
  items.forEach(i => r[i.getItem().getTitle()] = i.getResponse());

  let felicitacionesBase = r['Felicitaciones (Últimos 6 meses)'] || 'NO';
  let descFelic = r['Descripción de felicitaciones (Si marcó SÍ)'] || '';
  let felicitacionesFinal = descFelic ? `${felicitacionesBase} - ${descFelic}` : felicitacionesBase;

  const datos = {
    nombreEvaluado: r['Nombre del Evaluado'] || '',
    cedula: r['Cédula'] || '',
    cargo: r['Cargo'] || '',
    emailEvaluado: r['Email Evaluado'] || '',
    nombreEvaluador: r['Nombre del Evaluador'] || '',
    cargoEvaluador: r['Cargo del Evaluador'] || '',
    emailEvaluador: e.response.getRespondentEmail(),
    fechaEvaluacion: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"),
    
    regional: r['Regional'] || '',
    lineaNegocio: r['Línea de Negocio'] || '',
    dispositivo: r['Dispositivo'] || '',

    antecedentes: r['Antecedentes Disciplinarios (Últimos 6 meses)'] || 'NO',
    felicitaciones: felicitacionesFinal,
    relacion: r['Relación con el evaluado'] || '-',
    evaluacionGlobal: mapScore(r['Calificación Global Subjetiva'] || r['Evaluación Global']),

    fortalezas: r['FORTALEZAS'] || '',
    oportunidades: r['OPORTUNIDADES'] || '',
    compromisos: r['COMPROMISO DE LAS OPORTUNIDADES'] || '',
    sugerencias: r['¿Qué le sugerirías al evaluado para mejorar su desempeño profesional y personal?'] || '',
    conceptoJefe: r['CONCEPTO GENERAL DEL JEFE INMEDIATO'] || ''
  };

  for (const [titulo, respuesta] of Object.entries(r)) {
    const match = titulo.match(/^(\d+)\./);
    if (match) { 
      const num = match[1]; 
      if (num >= 1 && num <= 20) datos[`p${num}`] = mapScore(respuesta); 
    }
  }

  const infoExtra = buscarEmpleado(datos.cedula);
  if (infoExtra.found) {
    datos.sucursal = infoExtra.data.sucursal;
    datos.fechaIngreso = infoExtra.data.fechaIngreso;
    datos.compania = infoExtra.data.compania; 
    datos.codigo = infoExtra.data.codigo || '';
    datos.contrato = infoExtra.data.contrato || '';
    
    if(!datos.regional) datos.regional = infoExtra.data.regional;
    if(!datos.lineaNegocio) datos.lineaNegocio = infoExtra.data.lineaNegocio;
    if(!datos.dispositivo) datos.dispositivo = infoExtra.data.dispositivo;
    if (!datos.emailEvaluado) datos.emailEvaluado = infoExtra.data.email;
  }
  
  generarPDF(datos);
}

function generarPDF(datos) {
  try {
    const template = DriveApp.getFileById(CONFIG.IDS.PLANTILLA_DOC);
    const folder = DriveApp.getFolderById(CONFIG.IDS.CARPETA_PDF);
    const copy = template.makeCopy(`EVAL_${datos.cedula}_${datos.nombreEvaluado}`, folder);
    const doc = DocumentApp.openById(copy.getId());
    const body = doc.getBody();

    const replaces = {
      '{{NOMBRE_EVALUADO}}': datos.nombreEvaluado, 
      '{{CEDULA}}': datos.cedula, 
      '{{CARGO}}': datos.cargo,
      '{{SUCURSAL}}': datos.sucursal || '', 
      '{{FECHA_INGRESO}}': datos.fechaIngreso || '',
      '{{NOMBRE_EVALUADOR}}': datos.nombreEvaluador, 
      '{{CARGO_EVALUADOR}}': datos.cargoEvaluador,
      '{{FECHA_EVALUACION}}': datos.fechaEvaluacion, 
      '{{EVALUACION_GLOBAL}}': datos.evaluacionGlobal,
      '{{COMPANIA}}': datos.compania || 'G4S',
      '{{REGIONAL}}': datos.regional || '',
      '{{LINEA_NEGOCIO}}': datos.lineaNegocio || '',
      '{{DISPOSITIVO}}': datos.dispositivo || '',
      '{{ANTECEDENTES}}': datos.antecedentes,
      '{{FELICITACIONES}}': datos.felicitaciones,
      '{{RELACION}}': datos.relacion,
      '{{FORTALEZAS}}': datos.fortalezas,
      '{{OPORTUNIDADES}}': datos.oportunidades,
      '{{COMPROMISO_OPORTUNIDADES}}': datos.compromisos,
      '{{SUGERENCIAS}}': datos.sugerencias,
      '{{CONCEPTO_JEFE}}': datos.conceptoJefe
    };

    Object.keys(replaces).forEach(k => body.replaceText(k, replaces[k].toString()));
    for (let i = 1; i <= 20; i++) body.replaceText(`{{P${i}}}`, datos[`p${i}`] || '-');
    
    doc.saveAndClose();
    const pdf = copy.getAs(MimeType.PDF);
    const pdfFile = folder.createFile(pdf);
    copy.setTrashed(true);
    
    saveToSheet(datos, pdfFile.getUrl());
    
    const to = [datos.emailEvaluador];
    if (datos.emailEvaluado && datos.emailEvaluado.includes('@')) to.push(datos.emailEvaluado);
    
    MailApp.sendEmail({
      to: to.join(','), 
      subject: `Resultado Evaluación G4S: ${datos.nombreEvaluado}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #c1272d;">Evaluación de Desempeño Finalizada</h2>
          <p>Se ha generado exitosamente el reporte para el colaborador <strong>${datos.nombreEvaluado}</strong>.</p>
          <ul>
            <li><strong>Evaluador:</strong> ${datos.nombreEvaluador}</li>
            <li><strong>Regional:</strong> ${datos.regional}</li>
            <li><strong>Línea de Negocio:</strong> ${datos.lineaNegocio}</li>
            <li><strong>Resultado Global:</strong> ${datos.evaluacionGlobal} / 5</li>
          </ul>
          <p>Adjunto encontrará el documento PDF oficial.</p>
        </div>
      `,
      attachments: [pdfFile]
    });

  } catch (e) { console.error('Error Generando PDF: ' + e.toString()); }
}

function saveToSheet(datos, urlPdf) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.IDS.EVALUACIONES).getSheetByName('Evaluaciones');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const rowData = headers.map(h => {
      const header = h.toString().trim();
      
      if (header === 'idEvaluacion') return Utilities.getUuid();
      if (header === 'Fecha de Creación') return new Date();
      if (header === 'Usuario') return datos.emailEvaluador;
      if (header === 'Codigo') return datos.codigo || ''; 
      if (header === 'Estado') return 'Finalizado';
      if (header === 'Cedula') return datos.cedula;
      if (header === 'Nombre') return datos.nombreEvaluado;
      if (header === 'Cargo') return datos.cargo;
      if (header === 'Sucursal') return datos.sucursal || '';
      if (header === 'Empresa') return datos.compania || 'G4S';
      if (header === 'Email') return datos.emailEvaluado;
      if (header === 'Fecha Ingreso') return datos.fechaIngreso || '';
      if (header === 'Contrato') return datos.contrato || '';
      if (header === 'Evaluador') return datos.nombreEvaluador;
      if (header === 'Cargo Ev') return datos.cargoEvaluador;
      
      if (header === 'Compromiso') return datos.compromisos; 
      if (header === 'Concepto') return datos.conceptoJefe;
      if (header === 'Evglobal') return datos.evaluacionGlobal;
      
      if (header === 'Antecedentes') return datos.antecedentes;
      if (header === 'Felicitaciones') return datos.felicitaciones;
      if (header === 'Relacion') return datos.relacion;
      if (header === 'Fortalezas') return datos.fortalezas;
      if (header === 'Oportunidades') return datos.oportunidades;
      if (header === 'Sugerencias') return datos.sugerencias;
      
      if (header === 'LinkRepoteFinal') return urlPdf;
      if (header === 'UsuarioActulizacion') return ''; 
      if (header === 'FechaActualizacion') return ''; 
      
      if (header === 'Regional') return datos.regional;
      if (header === 'lineaNegocio') return datos.lineaNegocio;
      if (header === 'Dispositivo') return datos.dispositivo;
      
      if (header.startsWith('Pregunta ') || (header.startsWith('P') && header.length <= 3)) {
        const num = header.replace(/\D/g, ''); 
        return datos[`p${num}`] || '';
      }
      
      return '';
    });
    
    sheet.appendRow(rowData);
    console.log("✅ DATOS GUARDADOS EN SHEET EXITOSAMENTE");
  } catch(e) {
    console.error("❌ ERROR GUARDANDO EN SHEET: " + e.message);
  }
}

function getDashboardStats() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.IDS.EVALUACIONES).getSheetByName('Evaluaciones');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idxGlobal = headers.indexOf('Evglobal');
    const total = data.length - 1; 
    let c1=0, c2=0, c3=0, c4=0, c5=0;
    if (idxGlobal > -1 && total > 0) {
      data.slice(1).forEach(r => {
        const val = parseInt(r[idxGlobal]); 
        if (val === 5) c5++; else if (val === 4) c4++; else if (val === 3) c3++; else if (val === 2) c2++; else if (val === 1) c1++;
      });
    }
    return { total: total > 0 ? total : 0, c5, c4, c3, c2, c1 };
  } catch (e) { return { total: 0, c5:0, c4:0, c3:0, c2:0, c1:0 }; }
}

function mapScore(val) {
  if (!val) return '0';
  const strVal = val.toString();
  const num = parseInt(strVal.split(' ')[0]); 
  if (!isNaN(num)) return num;
  if (strVal.includes('EXCELENTE')) return 5;
  if (strVal.includes('BUENO')) return 3;
  if (strVal.includes('DEFICIENTE')) return 1;
  return strVal;
}

// --- ACTUALIZADO: REPORTE CON FILTRO DE EVALUADOR Y CAMPO DE EVALUADOR ---
function getReportData(inicio, fin, evaluadorFiltro) {
  try {
    const userInit = getInitData();
    if (userInit.error) return [];
    const userRole = userInit.role;
    const userEmail = userInit.email;
    const sheet = SpreadsheetApp.openById(CONFIG.IDS.EVALUACIONES).getSheetByName('Evaluaciones');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const iFecha = headers.indexOf('Fecha de Creación');
    const iUser = headers.indexOf('Usuario');
    const iNombre = headers.indexOf('Nombre');
    const iCedula = headers.indexOf('Cedula');
    const iRes = headers.indexOf('Evglobal');
    const iLink = headers.indexOf('LinkRepoteFinal');
    const iEvaluador = headers.indexOf('Evaluador'); // <- Nuevo para Excel y Tabla
    
    const d1 = new Date(inicio + "T00:00:00"); 
    const d2 = new Date(fin + "T23:59:59"); 
    
    const filtrados = data.slice(1).filter(r => {
      const fechaRow = new Date(r[iFecha]);
      const userRow = (r[iUser] || "").toString().toLowerCase();
      const evalRow = iEvaluador > -1 ? (r[iEvaluador] || "").toString().trim() : "";
      const enFecha = fechaRow >= d1 && fechaRow <= d2;
      
      // Lógica de filtrado Admin vs Evaluador normal
      if (userRole === 'Administrador' || userRole === 'UsuarioAdministrador') {
        if (evaluadorFiltro && evaluadorFiltro !== 'TODOS' && evalRow !== evaluadorFiltro) {
          return false;
        }
        return enFecha;
      }
      return enFecha && userRow === userEmail.toLowerCase();
    });
    
    return filtrados.map(r => {
      const originalLink = r[iLink] || '#';
      const embedLink = originalLink.replace(/\/view.*/, '/preview').replace(/\/edit.*/, '/preview');
      return {
        fecha: formatFecha(r[iFecha]),
        evaluador: iEvaluador > -1 ? r[iEvaluador] : 'Desconocido', // <- Nuevo
        nombre: r[iNombre] || 'Desconocido',
        cedula: r[iCedula] || '-',
        resultado: r[iRes] || '-',
        link: originalLink,
        embedLink: embedLink
      };
    });
  } catch(e) { return []; }
}

function getUsersData() {
  const sheet = SpreadsheetApp.openById(CONFIG.IDS.USUARIOS).getSheetByName('Usuarios');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const iNombre = headers.indexOf('Nombre');
  const iCorreo = headers.indexOf('Correo');
  const iRol = headers.indexOf('Rol');
  const iEstado = headers.indexOf('Estado');
  return data.slice(1).map((r, i) => ({
    row: i + 2, 
    nombre: iNombre > -1 ? r[iNombre] : '',
    correo: iCorreo > -1 ? r[iCorreo] : '',
    rol: iRol > -1 ? r[iRol] : 'Usuario',
    estado: iEstado > -1 ? r[iEstado] : 'Inactivo'
  }));
}

function saveUser(action, userData) {
  const sheet = SpreadsheetApp.openById(CONFIG.IDS.USUARIOS).getSheetByName('Usuarios');
  if (action === 'CREATE') {
    const id = sheet.getLastRow(); 
    sheet.appendRow([id, userData.nombre, userData.correo, userData.rol, userData.estado]);
  } else if (action === 'UPDATE') {
    const row = parseInt(userData.row);
    sheet.getRange(row, 2).setValue(userData.nombre);
    sheet.getRange(row, 3).setValue(userData.correo);
    sheet.getRange(row, 4).setValue(userData.rol);
    sheet.getRange(row, 5).setValue(userData.estado);
  } else if (action === 'DELETE') {
    const row = parseInt(userData.row);
    sheet.deleteRow(row);
  }
  return { success: true };
}

function getFormStructure() {
  try {
    const form = FormApp.openById(CONFIG.IDS.FORM_ID);
    const items = form.getItems();
    const questions = items.filter(i => i.getType() === FormApp.ItemType.MULTIPLE_CHOICE).map(i => ({ id: i.getId(), title: i.getTitle() }));
    return questions;
  } catch (e) { return [{id: 0, title: 'Error: ' + e.message}]; }
}

function modifyFormQuestion(action, data) {
  try {
    const form = FormApp.openById(CONFIG.IDS.FORM_ID);
    if (action === 'ADD') {
      const item = form.addMultipleChoiceItem();
      item.setTitle(data.title).setChoiceValues(['5 - Excelente', '3 - Bueno', '1 - Deficiente']).setRequired(true);
      const items = form.getItems();
      let lastChoiceIndex = -1;
      for(let i=0; i<items.length; i++) { if(items[i].getType() === FormApp.ItemType.MULTIPLE_CHOICE) lastChoiceIndex = i; }
      if(lastChoiceIndex > -1) form.moveItem(item, lastChoiceIndex + 1);
    } else if (action === 'DELETE') {
      const item = form.getItemById(data.id);
      if (item) form.deleteItem(item);
    } else if (action === 'UPDATE') {
      const item = form.getItemById(data.id);
      if (item) item.asMultipleChoiceItem().setTitle(data.title);
    }
    return { success: true };
  } catch(e) { return { error: e.message }; }
}

function getUpdateFormStructure() {
  try {
    const form = FormApp.openById(CONFIG.IDS.UPDATE_FORM_ID);
    const items = form.getItems();
    const fields = items.filter(i => i.getType() === FormApp.ItemType.TEXT || i.getType() === FormApp.ItemType.PARAGRAPH_TEXT).map(i => ({ id: i.getId(), title: i.getTitle(), type: i.getType().name() }));
    return fields;
  } catch (e) { return [{id: 0, title: 'Error: Configura el UPDATE_FORM_ID en code.gs'}]; }
}

function modifyUpdateFormQuestion(action, data) {
  try {
    const form = FormApp.openById(CONFIG.IDS.UPDATE_FORM_ID);
    if (action === 'ADD') {
      const item = form.addTextItem();
      item.setTitle(data.title).setRequired(true);
    } else if (action === 'DELETE') {
      const item = form.getItemById(data.id);
      if (item) form.deleteItem(item);
    } else if (action === 'UPDATE') {
      const item = form.getItemById(data.id);
      if (item) {
        if (item.getType() === FormApp.ItemType.TEXT) item.asTextItem().setTitle(data.title);
        if (item.getType() === FormApp.ItemType.PARAGRAPH_TEXT) item.asParagraphTextItem().setTitle(data.title);
      }
    }
    return { success: true };
  } catch(e) { return { error: e.message }; }
}

function formatFecha(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

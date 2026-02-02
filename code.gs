/**
 * 📘 PORTAL DE EVALUACIÓN DE DESEMPEÑO G4S - BACKEND PRO
 * Versión: 7.4 (Ajuste Carpeta PDF + Campo Compañía + Validación Email)
 */

const CONFIG = {
  IDS: {
    USUARIOS: '1pXCF8pwFNUSdP_-6L9ib9fcBltZqHoUW7tGyVI4zbx0',
    EMPLEADOS: '1zFayNigYrkODNRhKq4IoErLELB98xyj_8ZvGADEp3s4',
    EVALUACIONES: '1WuIyPUYGzKTlmSQ8oGUTdOu4Tm-JrpUNDYksJzHjweA',
    PLANTILLA_DOC: '1gvD5arbSG66iUMimEnvvYNI3tjzm7Al18VUJw_fA5Rk',
    // ✅ NUEVO ID DE CARPETA ACTUALIZADO
    CARPETA_PDF: '16U-cJ4f5tjk3WkgxOVx9FjkNTa6se-lT', 
    FORM_ID: '1JiZqopdMJr6wwMF3PjGTCBWhtTymEKUOqGtSNQgNiz4' 
  },
  URLS: {
    FORM_BASE: 'https://docs.google.com/forms/d/e/1FAIpQLScR_G2zrIrLXXWljYsWmSF5KZn1HEyUddsGxvfLD73QF3TePQ/viewform?usp=pp_url' 
               + '&entry.728137919={{NOMBRE}}'
               + '&entry.78461664={{CEDULA}}'
               + '&entry.1528887472={{CARGO}}'
               + '&entry.38546215={{EMAIL}}'
  }
};

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('G4S | Portal de Evaluación')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl('https://www.g4s.com/favicon.ico');
}

// --- 1. LOGIN & SEGURIDAD ---
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

    if (!usuario) return { error: true, message: 'ACCESO DENEGADO: Usuario no activo.' };

    const userRole = (idxRol > -1 && usuario[idxRol]) ? usuario[idxRol] : 'Usuario';
    const isAdmin = ['Administrador', 'Admin', 'UsuarioAdministrador'].includes(userRole);

    return { 
      success: true, 
      email: userEmail, 
      role: userRole,
      isAdmin: isAdmin,
      formUrlBase: CONFIG.URLS.FORM_BASE,
      templateUrl: `https://docs.google.com/document/d/${CONFIG.IDS.PLANTILLA_DOC}/edit`,
      dashboard: getDashboardStats()
    };

  } catch (err) {
    return { error: true, message: err.message };
  }
}

// --- 2. FUNCIONES CORE ---
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
      compania: headers.indexOf('Compania'), // Columna Compañía
      estado: headers.indexOf('Estado')
    };
    const cedulaStr = cedula.toString().trim();
    const empleado = data.slice(1).find(row => row[map.cedula].toString() === cedulaStr);

    if (!empleado) return { found: false };

    return {
      found: true,
      data: {
        cedula: empleado[map.cedula],
        nombre: empleado[map.nombre],
        cargo: empleado[map.cargo],
        sucursal: empleado[map.sucursal],
        fechaIngreso: formatFecha(empleado[map.fecha]),
        email: empleado[map.email] || '',
        // ✅ Capturamos la compañía, o ponemos G4S por defecto si está vacía
        compania: (map.compania > -1 && empleado[map.compania]) ? empleado[map.compania] : 'G4S Secure Solutions',
        estado: map.estado > -1 ? empleado[map.estado] : 'Activo'
      }
    };
  } catch (e) { return { error: true, message: e.message }; }
}

function procesarFormulario(e) {
  if (!e) return;
  const items = e.response.getItemResponses();
  const r = {}; items.forEach(i => r[i.getItem().getTitle()] = i.getResponse());

  const datos = {
    nombreEvaluado: r['Nombre del Evaluado'] || '',
    cedula: r['Cédula'] || '',
    cargo: r['Cargo'] || '',
    emailEvaluado: r['Email Evaluado'] || '',
    nombreEvaluador: r['Nombre del Evaluador'] || '',
    cargoEvaluador: r['Cargo del Evaluador'] || '',
    emailEvaluador: e.response.getRespondentEmail(),
    fechaEvaluacion: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm"),
    evaluacionGlobal: mapScore(r['Evaluación Global']),
    compromisos: r['Compromisos de Mejoramiento'] || r['Compromisos'] || '',
    conceptoJefe: r['Concepto General del Jefe Inmediato'] || r['Concepto del Jefe'] || ''
  };

  for (const [titulo, respuesta] of Object.entries(r)) {
    const match = titulo.match(/^(\d+)\./);
    if (match) { const num = match[1]; if (num >= 1 && num <= 20) datos[`p${num}`] = mapScore(respuesta); }
  }

  // Buscar datos complementarios en Sheets
  const infoExtra = buscarEmpleado(datos.cedula);
  if (infoExtra.found) {
    datos.sucursal = infoExtra.data.sucursal;
    datos.fechaIngreso = infoExtra.data.fechaIngreso;
    datos.compania = infoExtra.data.compania; // ✅ Guardamos la compañía recuperada
    if (!datos.emailEvaluado) datos.emailEvaluado = infoExtra.data.email;
  }
  
  generarPDF(datos);
}

function generarPDF(datos) {
  try {
    const template = DriveApp.getFileById(CONFIG.IDS.PLANTILLA_DOC);
    const folder = DriveApp.getFolderById(CONFIG.IDS.CARPETA_PDF);
    
    // Crear copia con nombre estándar
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
      '{{COMPROMISOS}}': datos.compromisos, 
      '{{CONCEPTO_JEFE}}': datos.conceptoJefe,
      '{{COMPANIA}}': datos.compania || 'G4S', // ✅ Variable para el documento
      '{{Compania}}': datos.compania || 'G4S'  // ✅ Respaldo por si usan minusculas en doc
    };

    Object.keys(replaces).forEach(k => body.replaceText(k, replaces[k].toString()));
    for (let i = 1; i <= 20; i++) body.replaceText(`{{P${i}}}`, datos[`p${i}`] || '-');
    
    doc.saveAndClose();
    const pdf = copy.getAs(MimeType.PDF);
    const pdfFile = folder.createFile(pdf);
    copy.setTrashed(true); // Eliminar el doc temporal, dejar solo el PDF
    
    // Guardar registro en Sheet
    saveToSheet(datos, pdfFile.getUrl());
    
    // ✅ LÓGICA DE CORREOS VERIFICADA
    // Se envía copia al Evaluador (Jefe) y al Evaluado (si tiene correo)
    const to = [datos.emailEvaluador];
    if (datos.emailEvaluado && datos.emailEvaluado.includes('@')) {
      to.push(datos.emailEvaluado);
    }
    
    MailApp.sendEmail({
      to: to.join(','), 
      subject: `Resultado Evaluación G4S: ${datos.nombreEvaluado}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #c1272d;">Evaluación de Desempeño Finalizada</h2>
          <p>Se ha generado exitosamente el reporte para el colaborador <strong>${datos.nombreEvaluado}</strong>.</p>
          <ul>
            <li><strong>Evaluador:</strong> ${datos.nombreEvaluador}</li>
            <li><strong>Resultado Global:</strong> ${datos.evaluacionGlobal}</li>
            <li><strong>Compañía:</strong> ${datos.compania || 'G4S'}</li>
          </ul>
          <p>Adjunto encontrará el documento PDF oficial.</p>
          <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;">
          <small style="color: #888;">G4S Secure Solutions - Portal de Evaluaciones</small>
        </div>
      `,
      attachments: [pdfFile]
    });

  } catch (e) { console.error('Error Generando PDF: ' + e.toString()); }
}

function saveToSheet(datos, urlPdf) {
  const sheet = SpreadsheetApp.openById(CONFIG.IDS.EVALUACIONES).getSheetByName('Evaluaciones');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(h => {
    const header = h.toString().trim();
    if (header === 'idEvaluacion') return Utilities.getUuid();
    if (header === 'Fecha de Creación') return new Date();
    if (header === 'Usuario') return datos.emailEvaluador;
    if (header === 'Estado') return 'Finalizado';
    if (header === 'Cedula') return datos.cedula;
    if (header === 'Nombre') return datos.nombreEvaluado;
    if (header === 'Cargo') return datos.cargo;
    if (header === 'Sucursal') return datos.sucursal;
    if (header === 'Email') return datos.emailEvaluado;
    if (header === 'Fecha Ingreso') return datos.fechaIngreso;
    if (header === 'Evaluador') return datos.nombreEvaluador;
    if (header === 'Cargo Ev') return datos.cargoEvaluador;
    if (header === 'Compromiso') return datos.compromisos;
    if (header === 'Concepto') return datos.conceptoJefe;
    if (header === 'Evglobal') return datos.evaluacionGlobal;
    if (header === 'LinkRepoteFinal') return urlPdf;
    // Agregamos Company si existiera una columna
    if (header === 'Compania' || header === 'Empresa') return datos.compania; 
    
    if (header.startsWith('Pregunta ') || header.startsWith('P')) {
      const num = header.replace(/\D/g, ''); return datos[`p${num}`] || '';
    }
    return '';
  });
  sheet.appendRow(rowData);
}

// --- 3. MÓDULOS ---
function getDashboardStats() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.IDS.EVALUACIONES).getSheetByName('Evaluaciones');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idxGlobal = headers.indexOf('Evglobal');
    
    const total = data.length - 1; 
    let exc = 0, buenos = 0, def = 0;

    if (idxGlobal > -1 && total > 0) {
      data.slice(1).forEach(r => {
        const val = r[idxGlobal];
        if (val === 'E') exc++; else if (val === 'B') buenos++; else if (val === 'D') def++;
      });
    }
    return { total: total > 0 ? total : 0, excelentes: exc, buenos: buenos, deficientes: def };
  } catch (e) { return { total: 0, excelentes: 0, buenos: 0, deficientes: 0 }; }
}

function getReportData(inicio, fin) {
  const sheet = SpreadsheetApp.openById(CONFIG.IDS.EVALUACIONES).getSheetByName('Evaluaciones');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userEmail = Session.getActiveUser().getEmail();

  const iFecha = headers.indexOf('Fecha de Creación');
  const iUser = headers.indexOf('Usuario');
  const iNombre = headers.indexOf('Nombre');
  const iCedula = headers.indexOf('Cedula');
  const iRes = headers.indexOf('Evglobal');
  const iLink = headers.indexOf('LinkRepoteFinal');

  const d1 = new Date(inicio); d1.setHours(0,0,0,0);
  const d2 = new Date(fin); d2.setHours(23,59,59,999);

  const filtrados = data.slice(1).filter(r => {
    const fechaRow = new Date(r[iFecha]);
    const userRow = r[iUser];
    return userRow === userEmail && fechaRow >= d1 && fechaRow <= d2;
  });

  return filtrados.map(r => ({
    fecha: formatFecha(r[iFecha]),
    nombre: r[iNombre],
    cedula: r[iCedula],
    resultado: r[iRes],
    link: r[iLink]
  }));
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
    const questions = items
      .filter(i => i.getType() === FormApp.ItemType.MULTIPLE_CHOICE)
      .map(i => ({ id: i.getId(), title: i.getTitle() }));
    return questions;
  } catch (e) { return [{id: 0, title: 'Error: ' + e.message}]; }
}

function modifyFormQuestion(action, data) {
  try {
    const form = FormApp.openById(CONFIG.IDS.FORM_ID);
    if (action === 'ADD') {
      const item = form.addMultipleChoiceItem();
      item.setTitle(data.title).setChoiceValues(['EXCELENTE', 'BUENO', 'DEFICIENTE']).setRequired(true);
      const items = form.getItems();
      let lastChoiceIndex = -1;
      for(let i=0; i<items.length; i++) {
        if(items[i].getType() === FormApp.ItemType.MULTIPLE_CHOICE) lastChoiceIndex = i;
      }
      if(lastChoiceIndex > -1) form.moveItem(item, lastChoiceIndex + 1);
    } 
    else if (action === 'DELETE') {
      const item = form.getItemById(data.id);
      if (item) form.deleteItem(item);
    } 
    else if (action === 'UPDATE') {
      const item = form.getItemById(data.id);
      if (item) item.asMultipleChoiceItem().setTitle(data.title);
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
function mapScore(val) {
  if (!val) return '-'; val = val.toString().toUpperCase();
  if (val.includes('EXCELENTE')) return 'E'; if (val.includes('BUENO')) return 'B';
  if (val.includes('DEFICIENTE')) return 'D'; if (val.includes('REGULAR')) return 'R';
  return val.substring(0, 1);
}
/**
 * ⚠️ EJECUTAR ESTA FUNCIÓN UNA SOLA VEZ MANUALMENTE ⚠️
 * Esto conecta el Formulario con el Script para que envíe los correos.
 */
function instalarDisparador() {
  try {
    const form = FormApp.openById(CONFIG.IDS.FORM_ID);
    
    // Verificamos si ya existe para no duplicar
    const triggers = ScriptApp.getProjectTriggers();
    for (const t of triggers) {
      if (t.getHandlerFunction() === 'procesarFormulario') {
        console.log('✅ El activador ya estaba instalado.');
        return;
      }
    }

    // Crear el activador
    ScriptApp.newTrigger('procesarFormulario')
      .forForm(form)
      .onFormSubmit()
      .create();
      
    console.log('✅ ACTIVADOR INSTALADO CON ÉXITO. Ahora los correos llegarán.');
    
  } catch (e) {
    console.error('❌ Error instalando activador: ' + e.message);
  }
}

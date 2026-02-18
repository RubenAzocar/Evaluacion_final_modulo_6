const fs = require('fs').promises;
const path = require('path');

const RUTA_DATOS = path.join(__dirname, '..', '..', 'data', 'pets.json');

// Ayudante: leer datos
async function leerDatos() {
  try {
    const contenido = await fs.readFile(RUTA_DATOS, 'utf8');
    return JSON.parse(contenido || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Ayudante: escribir datos
async function escribirDatos(datos) {
  await fs.writeFile(RUTA_DATOS, JSON.stringify(datos, null, 2), 'utf8');
}

// Ayudante: Formatear RUT (agrega puntos y guion)
function formatearRut(rut) {
  if (!rut || typeof rut !== 'string') return rut;
  // Limpiar: dejar solo números y K
  let sRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (sRut.length < 2) return rut;

  const cuerpo = sRut.slice(0, -1);
  const dv = sRut.slice(-1);

  // Formatear cuerpo con puntos
  let formateado = '';
  for (let i = cuerpo.length - 1, j = 1; i >= 0; i--, j++) {
    formateado = cuerpo.charAt(i) + formateado;
    if (j % 3 === 0 && i !== 0) {
      formateado = '.' + formateado;
    }
  }

  return `${formateado}-${dv}`;
}

module.exports = {
  leerDatos,
  escribirDatos,
  formatearRut
};

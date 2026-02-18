// [COGNITIVE_RESET] Recordatorio de rol activo. Soy Programador Senior Fullstack. Prohibido divagar. Prohibido alucinar. Código funcional inmediato. [/COGNITIVE_RESET]
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PUERTO = process.env.PORT || 3000;

const RUTA_DATOS = path.join(__dirname, 'data', 'pets.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cabeceras de seguridad básicas
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;");
  next();
});

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

// Ayudante: Validar RUT chileno (módulo 11)
function validarRut(rut) {
  if (!rut || typeof rut !== 'string') return false;
  let sRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (sRut.length < 8) return false;

  const cuerpo = sRut.slice(0, -1);
  let dv = sRut.slice(-1);

  let suma = 0;
  let multiplo = 2;

  for (let i = 1; cuerpo.length - i >= 0; i++) {
    suma += multiplo * cuerpo.charAt(cuerpo.length - i);
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalc = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

  return dvCalc === dv;
}

// Ayudante: Clasificar especie
function clasificarEspecie(especie) {
  const conocidas = ['PERRO', 'GATO', 'CONEJO', 'HAMSTER', 'PAJARO', 'PÁJARO'];
  const s = String(especie).trim().toUpperCase();
  return conocidas.includes(s) ? s.charAt(0) + s.slice(1).toLowerCase() : 'Animal Exótico';
}

// GET /api/pets
app.get('/api/pets', async (req, res) => {
  try {
    const { nombre, rut } = req.query;
    const mascotas = await leerDatos();

    if (nombre) {
      const coincidencias = mascotas.filter(p => p.nombre.toLowerCase().includes(String(nombre).toLowerCase()));
      return res.json(coincidencias);
    }

    if (rut) {
      const coincidencias = mascotas.filter(p => p.rut === String(rut) || (p.rutTutor === String(rut)));
      return res.json(coincidencias);
    }

    return res.json(mascotas);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno', detalles: err.message });
  }
});

// POST /api/pets -> { nombre, rut, edad, especie, raza, sexo, nombreTutor, rutTutor }
app.post('/api/pets', async (req, res) => {
  try {
    const { nombre, rut, edad, especie, raza, sexo, nombreTutor, rutTutor } = req.body || {};

    // 1. Campos básicos requeridos
    if (!nombre || !rut || !edad || !especie || !sexo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, rut, edad, especie, sexo)' });
    }

    // 2. Validar RUT Propietario
    if (!validarRut(rut)) {
      return res.status(400).json({ error: 'El RUT del propietario es inválido' });
    }

    // 3. Validar Edad y Tutor
    const nEdad = parseInt(edad);
    if (nEdad < 18) {
      if (!nombreTutor || !rutTutor) {
        return res.status(400).json({ error: 'Propietario menor de edad requiere Tutor Legal (Nombre y RUT)' });
      }
      if (!validarRut(rutTutor)) {
        return res.status(400).json({ error: 'El RUT del tutor legal es inválido' });
      }
    }

    const mascotas = await leerDatos();

    // 4. Crear registro con ID automático y clasificación
    const nuevaMascota = {
      id: Date.now().toString(),
      nombre: String(nombre).trim(),
      rut: String(rut).trim(),
      edad: nEdad,
      especie: clasificarEspecie(especie),
      raza: raza ? String(raza).trim() : 'Sin especificar',
      sexo: sexo,
      nombreTutor: nEdad < 18 ? String(nombreTutor).trim() : null,
      rutTutor: nEdad < 18 ? String(rutTutor).trim() : null,
      registradoEn: new Date().toISOString()
    };

    mascotas.push(nuevaMascota);
    await escribirDatos(mascotas);
    return res.status(201).json(nuevaMascota);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno', detalles: err.message });
  }
});

// DELETE /api/pets?nombre=...  OR  /api/pets?rut=...
app.delete('/api/pets', async (req, res) => {
  try {
    const { nombre, rut } = req.query;
    if (!nombre && !rut) return res.status(400).json({ error: 'Se requiere query param nombre o rut' });

    const mascotas = await leerDatos();

    if (nombre) {
      const idx = mascotas.findIndex(p => p.nombre.toLowerCase() === String(nombre).toLowerCase());
      if (idx === -1) return res.status(404).json({ error: 'Mascota no encontrada' });
      const eliminada = mascotas.splice(idx, 1)[0];
      await escribirDatos(mascotas);
      return res.json({ eliminada });
    }

    if (rut) {
      const restantes = mascotas.filter(p => p.rut !== String(rut));
      const cantidadEliminados = mascotas.length - restantes.length;
      if (cantidadEliminados === 0) return res.status(404).json({ error: 'No se encontraron mascotas para ese rut' });
      await escribirDatos(restantes);
      return res.json({ cantidadEliminados });
    }
  } catch (err) {
    console.error('ERROR_SERVIDOR:', err);
    return res.status(500).json({ error: 'Ha ocurrido un error interno en el servidor. Por favor, intente más tarde.' });
  }
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.error('ERROR_NO_CONTROLADO:', err);
  res.status(500).json({ error: 'Error del sistema. Contacte al administrador.' });
});

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});

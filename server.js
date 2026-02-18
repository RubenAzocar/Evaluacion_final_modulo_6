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

// Ayudante: Validar RUT (solo formato básico para demostración)
function validarRut(rut) {
  if (!rut || typeof rut !== 'string') return false;
  const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  // Validar longitud mínima de 8 caracteres (7 números + 1 DV) y que termine en número o K
  return limpio.length >= 8 && limpio.length <= 9 && /^[0-9]+[0-9K]$/.test(limpio);
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
      const rutFormateado = formatearRut(rut);
      const coincidencias = mascotas.filter(p => p.rut === rutFormateado || (p.rutTutor === rutFormateado));
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
      rut: formatearRut(rut),
      edad: nEdad,
      especie: clasificarEspecie(especie),
      raza: raza ? String(raza).trim() : 'Sin especificar',
      sexo: sexo,
      nombreTutor: nEdad < 18 ? String(nombreTutor).trim() : null,
      rutTutor: nEdad < 18 ? formatearRut(rutTutor) : null,
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

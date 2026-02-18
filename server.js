// [COGNITIVE_RESET] Recordatorio de rol activo. Soy Programador Senior Fullstack. Prohibido divagar. Prohibido alucinar. Código funcional inmediato. [/COGNITIVE_RESET]
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_PATH = path.join(__dirname, 'data', 'pets.json');

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

// Helper: leer datos
async function readData() {
  try {
    const content = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Helper: escribir datos
async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Helper: Validar RUT chileno (módulo 11)
function validateRut(rut) {
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

// Helper: Clasificar especie
function classifySpecies(species) {
  const known = ['PERRO', 'GATO', 'CONEJO', 'HAMSTER', 'PAJARO', 'PÁJARO'];
  const s = String(species).trim().toUpperCase();
  return known.includes(s) ? s.charAt(0) + s.slice(1).toLowerCase() : 'Animal Exótico';
}

// GET /api/pets
app.get('/api/pets', async (req, res) => {
  try {
    const { name, rut } = req.query;
    const pets = await readData();

    if (name) {
      const matches = pets.filter(p => p.name.toLowerCase().includes(String(name).toLowerCase()));
      return res.json(matches);
    }

    if (rut) {
      const matches = pets.filter(p => p.rut === String(rut) || (p.tutorRut === String(rut)));
      return res.json(matches);
    }

    return res.json(pets);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno', details: err.message });
  }
});

// POST /api/pets -> { name, rut, age, species, breed, sex, tutorName, tutorRut }
app.post('/api/pets', async (req, res) => {
  try {
    const { name, rut, age, species, breed, sex, tutorName, tutorRut } = req.body || {};

    // 1. Campos básicos requeridos
    if (!name || !rut || !age || !species || !sex) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, rut, edad, especie, sexo)' });
    }

    // 2. Validar RUT Propietario
    if (!validateRut(rut)) {
      return res.status(400).json({ error: 'El RUT del propietario es inválido' });
    }

    // 3. Validar Edad y Tutor
    const nAge = parseInt(age);
    if (nAge < 18) {
      if (!tutorName || !tutorRut) {
        return res.status(400).json({ error: 'Propietario menor de edad requiere Tutor Legal (Nombre y RUT)' });
      }
      if (!validateRut(tutorRut)) {
        return res.status(400).json({ error: 'El RUT del tutor legal es inválido' });
      }
    }

    const pets = await readData();

    // 4. Crear registro con ID automático y clasificación
    const newPet = {
      id: Date.now().toString(),
      name: String(name).trim(),
      rut: String(rut).trim(),
      age: nAge,
      species: classifySpecies(species),
      breed: breed ? String(breed).trim() : 'Sin especificar',
      sex: sex,
      tutorName: nAge < 18 ? String(tutorName).trim() : null,
      tutorRut: nAge < 18 ? String(tutorRut).trim() : null,
      registeredAt: new Date().toISOString()
    };

    pets.push(newPet);
    await writeData(pets);
    return res.status(201).json(newPet);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno', details: err.message });
  }
});

// DELETE /api/pets?name=...  OR  /api/pets?rut=...
app.delete('/api/pets', async (req, res) => {
  try {
    const { name, rut } = req.query;
    if (!name && !rut) return res.status(400).json({ error: 'Se requiere query param name o rut' });

    const pets = await readData();

    if (name) {
      const idx = pets.findIndex(p => p.name.toLowerCase() === String(name).toLowerCase());
      if (idx === -1) return res.status(404).json({ error: 'Mascota no encontrada' });
      const removed = pets.splice(idx, 1)[0];
      await writeData(pets);
      return res.json({ deleted: removed });
    }

    if (rut) {
      const remaining = pets.filter(p => p.rut !== String(rut));
      const deletedCount = pets.length - remaining.length;
      if (deletedCount === 0) return res.status(404).json({ error: 'No se encontraron mascotas para ese rut' });
      await writeData(remaining);
      return res.json({ deletedCount });
    }
  } catch (err) {
    console.error('SERVER_ERROR:', err);
    return res.status(500).json({ error: 'Ha ocurrido un error interno en el servidor. Por favor, intente más tarde.' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('UNHANDLED_ERROR:', err);
  res.status(500).json({ error: 'Error del sistema. Contacte al administrador.' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

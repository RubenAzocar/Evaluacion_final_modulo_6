const MascotaRepository = require('../repositories/mascotas.repository');

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

const listarMascotas = async (req, res) => {
  try {
    const { nombre, rut } = req.query;
    const mascotas = await MascotaRepository.leerDatos();

    if (nombre) {
      const coincidencias = mascotas.filter(p => p.nombre.toLowerCase().includes(String(nombre).toLowerCase()));
      return res.json(coincidencias);
    }

    if (rut) {
      const rutFormateado = MascotaRepository.formatearRut(rut);
      const coincidencias = mascotas.filter(p => p.rut === rutFormateado || (p.rutTutor === rutFormateado));
      return res.json(coincidencias);
    }

    return res.json(mascotas);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno', detalles: err.message });
  }
};

const crearMascota = async (req, res) => {
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

    const mascotas = await MascotaRepository.leerDatos();

    // 4. Crear registro con ID automático y clasificación
    const nuevaMascota = {
      id: Date.now().toString(),
      nombre: String(nombre).trim(),
      rut: MascotaRepository.formatearRut(rut),
      edad: nEdad,
      especie: clasificarEspecie(especie),
      raza: raza ? String(raza).trim() : 'Sin especificar',
      sexo: sexo,
      nombreTutor: nEdad < 18 ? String(nombreTutor).trim() : null,
      rutTutor: nEdad < 18 ? MascotaRepository.formatearRut(rutTutor) : null,
      registradoEn: new Date().toISOString()
    };

    mascotas.push(nuevaMascota);
    await MascotaRepository.escribirDatos(mascotas);
    return res.status(201).json(nuevaMascota);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno', detalles: err.message });
  }
};

const eliminarMascota = async (req, res) => {
  try {
    const { nombre, rut } = req.query;
    if (!nombre && !rut) return res.status(400).json({ error: 'Se requiere query param nombre o rut' });

    const mascotas = await MascotaRepository.leerDatos();

    if (nombre) {
      const idx = mascotas.findIndex(p => p.nombre.toLowerCase() === String(nombre).toLowerCase());
      if (idx === -1) return res.status(404).json({ error: 'Mascota no encontrada' });
      const eliminada = mascotas.splice(idx, 1)[0];
      await MascotaRepository.escribirDatos(mascotas);
      return res.json({ eliminada });
    }

    if (rut) {
      const rutFormateado = MascotaRepository.formatearRut(rut);
      const restantes = mascotas.filter(p => p.rut !== rutFormateado);
      const cantidadEliminados = mascotas.length - restantes.length;
      if (cantidadEliminados === 0) return res.status(404).json({ error: 'No se encontraron mascotas para ese rut' });
      await MascotaRepository.escribirDatos(restantes);
      return res.json({ cantidadEliminados });
    }
  } catch (err) {
    console.error('ERROR_SERVIDOR:', err);
    return res.status(500).json({ error: 'Ha ocurrido un error interno en el servidor. Por favor, intente más tarde.' });
  }
};

module.exports = {
  listarMascotas,
  crearMascota,
  eliminarMascota
};

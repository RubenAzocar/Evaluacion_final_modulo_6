const express = require('express');
const router = express.Router();
const MascotasController = require('../controllers/mascotas.controller');

router.get('/', MascotasController.listarMascotas);
router.post('/', MascotasController.crearMascota);
router.delete('/', MascotasController.eliminarMascota);

module.exports = router;

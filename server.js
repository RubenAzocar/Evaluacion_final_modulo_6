// [COGNITIVE_RESET] Recordatorio de rol activo. Soy Programador Senior Fullstack. Prohibido divagar. Prohibido alucinar. Código funcional inmediato. [/COGNITIVE_RESET]
const app = require('./src/app');
const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});

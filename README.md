# Sistema de Registro Nacional de Mascotas (Mascotas.gob.cl)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Solución integral para la gestión oficial de registros de mascotas. Este sistema implementa una arquitectura desacoplada con un backend RESTful en Node.js y una interfaz institucional de alta fidelidad, integrando reglas de negocio críticas para la validación de identidad y protección legal.

## 🚀 Funcionalidades Técnicas

### 1. Validación de Identidad e Integridad

- **Motor de Verificación de RUT**: Implementación nativa del algoritmo de Módulo 11 para validación de identificadores de propietarios y tutores.
- **Control de Protección Legal**: Lógica condicional que exige obligatoriamente un tutor legal (Nombre y RUT) para propietarios menores de 18 años.

### 2. Gestión de Reglas de Negocio

- **Clasificación Automatizada de Especies**: Normalización y categorización de especies domésticas conocidas; asignación automática de categoría "Animal Exótico" para registros no tipificados.
- **Trazabilidad Nacional**: Generación de identificadores únicos (IDs) y marcas de tiempo bajo el estándar ISO 8601 para cada inscripción.

### 3. Interfaz de Usuario de Alta Fidelidad

- **Arquitectura SPA**: Interfaz de página única que consume servicios REST mediante Axios.
- **Sistema de Diseño Institucional**: Estética profesional basada en `Inter` y `Roboto Slab`, con soporte completo para visualización responsiva.
- **Buscador Inteligente**: Algoritmo predictivo que discrimina automáticamente consultas por nombre o RUT.

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express.js.
- **Frontend**: HTML5, Vanilla CSS (Modern Custom Properties), JavaScript (ES6+).
- **Comunicación**: Axios (REST Client).
- **Persistencia**: Flat-File DB (JSON Interface).

## 📋 Especificaciones de la API

### Endpoint Base: `/api/pets`

| Método   | Parámetros     | Descripción                                    |
| :------- | :------------- | :--------------------------------------------- |
| `GET`    | `name` (query) | Búsqueda por coincidencia de nombre.           |
| `GET`    | `rut` (query)  | Filtrado por RUT de propietario o tutor.       |
| `POST`   | Body (JSON)    | Registro oficial (requiere validación previa). |
| `DELETE` | `name` / `rut` | Eliminación de registros por criterio.         |

#### Esquema de Datos (POST)

```json
{
  "name": "string (req)",
  "rut": "string (req, valid-rut)",
  "age": "number (req)",
  "species": "string (req)",
  "sex": "string (req: Macho|Hembra)",
  "breed": "string (opt)",
  "tutorName": "string (req: age < 18)",
  "tutorRut": "string (req: age < 18)"
}
```

## 📦 Instalación y Uso

1. **Instalar dependencias**:

   ```bash
   npm install
   ```

2. **Ejecutar servidor**:

   ```bash
   npm start
   ```

3. **Acceso local**: [http://localhost:3000](http://localhost:3000)

---

© 2026 Registro Nacional de Mascotas — Ministerio de Salud y Medio Ambiente.
# Evaluacion_final_modulo_6

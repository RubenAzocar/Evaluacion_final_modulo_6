// [COGNITIVE_RESET] Recordatorio de rol activo. Soy Programador Senior Fullstack. Prohibido divagar. Prohibido alucinar. Código funcional inmediato. [/COGNITIVE_RESET]
(function () {
    const apiMascotas = axios.create({ baseURL: '/api/pets', timeout: 5000 });

    const $ = id => document.getElementById(id);

    function mostrarAlerta(mensaje, tipo = 'danger') {
        const contenedor = $('alerts');
        if (!contenedor) return;
        contenedor.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">${escaparHtml(mensaje)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderizarResultados(mascotas, debeHacerScroll = false) {
        const el = document.getElementById('results');
        const countEl = document.getElementById('results-count');

        if (!mascotas || mascotas.length === 0) {
            el.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-muted);">No se encontraron registros oficiales para esta consulta.</div>';
            if (countEl) countEl.innerText = '0 registros encontrados';
            return;
        }

        if (countEl) countEl.innerText = `${mascotas.length} registros encontrados en el sistema nacional`;

        const filas = mascotas.map(m => `
            <tr>
                <td>
                    <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">ID: ${escaparHtml(m.id)}</div>
                    <span class="pet-name-chip">${escaparHtml(m.nombre)}</span>
                </td>
                <td>
                    <div style="font-weight: 600;">${escaparHtml(m.especie)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${escaparHtml(m.raza)} (${escaparHtml(m.sexo)})</div>
                </td>
                <td>
                    <span class="rut-chip">${escaparHtml(m.rut)}</span>
                    ${m.nombreTutor ? `<div style="font-size: 0.75rem; color: var(--gov-accent); margin-top: 4px;">Tutor: ${escaparHtml(m.nombreTutor)}</div>` : ''}
                </td>
            </tr>
        `).join('');

        el.innerHTML = `
            <div class="results-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Mascota & ID</th>
                            <th>Especie & Detalle</th>
                            <th>Propietario / Tutor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filas}
                    </tbody>
                </table>
            </div>
        `;

        // Desplazar suavemente hasta los resultados solo si se solicita
        if (debeHacerScroll) {
            const contenedorResultados = document.querySelector('.results-wrapper');
            if (contenedorResultados) {
                contenedorResultados.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    function escaparHtml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Acciones
    async function agregarMascota(ev) {
        ev.preventDefault();
        const datos = {
            nombre: $('input-name').value.trim(),
            especie: $('input-species').value.trim(),
            raza: $('input-breed').value.trim(),
            sexo: $('input-sex').value,
            rut: $('input-rut').value.trim(),
            edad: $('input-age').value.trim(),
            nombreTutor: $('input-tutor-name').value.trim(),
            rutTutor: $('input-tutor-rut').value.trim()
        };

        if (!datos.nombre || !datos.rut || !datos.edad || !datos.especie || !datos.sexo) {
            return mostrarAlerta('Complete todos los campos obligatorios del registro oficial', 'warning');
        }

        try {
            await apiMascotas.post('/', datos);
            mostrarAlerta('Mascota inscrita exitosamente y clasificada en el sistema nacional', 'success');
            $('form-add').reset();
            $('tutor-section').style.display = 'none';
            listarTodas();
        } catch (err) {
            mostrarAlerta('ERROR DE VALIDACIÓN: ' + (err.response?.data?.error || err.message));
        }
    }

    async function listarTodas() {
        try {
            const r = await apiMascotas.get('/');
            renderizarResultados(r.data);
        } catch (err) { mostrarAlerta('Error listando mascotas: ' + (err.response?.data?.error || err.message)); }
    }

    async function buscarPorNombre() {
        const input = $('unified-search');
        const nombre = input ? input.value.trim() : '';
        if (!nombre) return mostrarAlerta('Ingrese un nombre para buscar', 'warning');
        try {
            const r = await apiMascotas.get('/', { params: { nombre } });
            renderizarResultados(r.data, true);
        } catch (err) {
            mostrarAlerta(err.response?.data?.error || 'Mascota no encontrada');
        }
    }

    async function buscarPorRut() {
        const input = $('unified-search');
        const rut = input ? input.value.trim() : '';
        if (!rut) return mostrarAlerta('Ingrese RUT para buscar', 'warning');
        try {
            const r = await apiMascotas.get('/', { params: { rut } });
            renderizarResultados(r.data, true);
        } catch (err) {
            mostrarAlerta('Error: ' + (err.response?.data?.error || err.message));
        }
    }

    async function busquedaUnificada() {
        const valor = $('unified-search').value.trim();
        if (!valor) return listarTodas();
        // Si contiene un guión o solo números, asumimos RUT
        if (/[\d-]/.test(valor) && valor.length > 3) {
            await buscarPorRut();
        } else {
            await buscarPorNombre();
        }
        // Borrar la consulta luego de realizarla
        $('unified-search').value = '';
    }

    async function eliminarPorNombre() {
        const nombre = $('del-name').value.trim();
        if (!nombre) return mostrarAlerta('Ingrese nombre para eliminar', 'warning');
        if (!confirm('¿Confirma eliminar la mascota ' + nombre + ' del sistema?')) return;
        try {
            await apiMascotas.delete('/', { params: { nombre } });
            mostrarAlerta('Mascota eliminada del registro', 'success');
            $('del-name').value = '';
            listarTodas();
        } catch (err) { mostrarAlerta('Error eliminar: ' + (err.response?.data?.error || err.message)); }
    }

    async function eliminarPorRut() {
        const rut = $('del-rut').value.trim();
        if (!rut) return mostrarAlerta('Ingrese RUT para eliminar', 'warning');
        if (!confirm('¿Confirma eliminar todas las mascotas asociadas al RUT ' + rut + '?')) return;
        try {
            const r = await apiMascotas.delete('/', { params: { rut } });
            mostrarAlerta(`Se han eliminado ${r.data.cantidadEliminados || 0} registros asociados al RUT`, 'success');
            $('del-rut').value = '';
            listarTodas();
        } catch (err) { mostrarAlerta('Error eliminar: ' + (err.response?.data?.error || err.message)); }
    }

    // Vinculación de eventos
    document.addEventListener('DOMContentLoaded', () => {
        const inputAge = $('input-age');
        const tutorSection = $('tutor-section');

        if (inputAge && tutorSection) {
            inputAge.addEventListener('input', (e) => {
                const edad = parseInt(e.target.value);
                if (!isNaN(edad) && edad < 18) {
                    tutorSection.style.display = 'block';
                    $('input-tutor-name').required = true;
                    $('input-tutor-rut').required = true;
                } else {
                    tutorSection.style.display = 'none';
                    $('input-tutor-name').required = false;
                    $('input-tutor-rut').required = false;
                }
            });
        }

        const btnListarTodas = $('btn-list-all');
        if (btnListarTodas) btnListarTodas.addEventListener('click', listarTodas);

        const btnBusquedaUnificada = $('btn-unified-search');
        if (btnBusquedaUnificada) {
            btnBusquedaUnificada.addEventListener('click', busquedaUnificada);
            $('unified-search').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') busquedaUnificada();
            });
        }

        const formularioAgregar = $('form-add');
        if (formularioAgregar) formularioAgregar.addEventListener('submit', agregarMascota);

        const btnEliminarNombre = $('btn-del-name');
        if (btnEliminarNombre) btnEliminarNombre.addEventListener('click', eliminarPorNombre);

        const btnEliminarRut = $('btn-del-rut');
        if (btnEliminarRut) btnEliminarRut.addEventListener('click', eliminarPorRut);

        // Inicializar lista
        listarTodas();
    });

})();

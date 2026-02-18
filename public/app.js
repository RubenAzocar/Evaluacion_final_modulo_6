// [COGNITIVE_RESET] Recordatorio de rol activo. Soy Programador Senior Fullstack. Prohibido divagar. Prohibido alucinar. Código funcional inmediato. [/COGNITIVE_RESET]
(function () {
    const api = axios.create({ baseURL: '/api/pets', timeout: 5000 });

    const $ = id => document.getElementById(id);

    function showAlert(message, type = 'danger') {
        const container = $('alerts');
        if (!container) return;
        container.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderResults(pets) {
        const el = document.getElementById('results');
        const countEl = document.getElementById('results-count');

        if (!pets || pets.length === 0) {
            el.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-muted);">No se encontraron registros oficiales para esta consulta.</div>';
            if (countEl) countEl.innerText = '0 registros encontrados';
            return;
        }

        if (countEl) countEl.innerText = `${pets.length} registros encontrados en el sistema nacional`;

        const rows = pets.map(p => `
            <tr>
                <td>
                    <div style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">ID: ${escapeHtml(p.id)}</div>
                    <span class="pet-name-chip">${escapeHtml(p.name)}</span>
                </td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(p.species)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(p.breed)} (${escapeHtml(p.sex)})</div>
                </td>
                <td>
                    <span class="rut-chip">${escapeHtml(p.rut)}</span>
                    ${p.tutorName ? `<div style="font-size: 0.75rem; color: var(--gov-accent); margin-top: 4px;">Tutor: ${escapeHtml(p.tutorName)}</div>` : ''}
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
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    function escapeHtml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Actions
    async function addPet(ev) {
        ev.preventDefault();
        const data = {
            name: $('input-name').value.trim(),
            species: $('input-species').value.trim(),
            breed: $('input-breed').value.trim(),
            sex: $('input-sex').value,
            rut: $('input-rut').value.trim(),
            age: $('input-age').value.trim(),
            tutorName: $('input-tutor-name').value.trim(),
            tutorRut: $('input-tutor-rut').value.trim()
        };

        if (!data.name || !data.rut || !data.age || !data.species || !data.sex) {
            return showAlert('Complete todos los campos obligatorios del registro oficial', 'warning');
        }

        try {
            await api.post('/', data);
            showAlert('Mascota inscrita exitosamente y clasificada en el sistema nacional', 'success');
            $('form-add').reset();
            $('tutor-section').style.display = 'none';
            listAll();
        } catch (err) {
            showAlert('ERROR DE VALIDACIÓN: ' + (err.response?.data?.error || err.message));
        }
    }

    async function listAll() {
        try {
            const r = await api.get('/');
            renderResults(r.data);
        } catch (err) { showAlert('Error listando mascotas: ' + (err.response?.data?.error || err.message)); }
    }

    async function searchByName() {
        const input = $('unified-search');
        const name = input ? input.value.trim() : '';
        if (!name) return showAlert('Ingrese un nombre para buscar', 'warning');
        try {
            const r = await api.get('/', { params: { name } });
            renderResults(r.data);
        } catch (err) {
            showAlert(err.response?.data?.error || 'Mascota no encontrada');
        }
    }

    async function searchByRut() {
        const input = $('unified-search');
        const rut = input ? input.value.trim() : '';
        if (!rut) return showAlert('Ingrese RUT para buscar', 'warning');
        try {
            const r = await api.get('/', { params: { rut } });
            renderResults(r.data);
        } catch (err) {
            showAlert('Error: ' + (err.response?.data?.error || err.message));
        }
    }

    async function unifiedSearch() {
        const value = $('unified-search').value.trim();
        if (!value) return listAll();
        // Si contiene un guión o solo números, asumimos RUT
        if (/[\d-]/.test(value) && value.length > 3) {
            searchByRut();
        } else {
            searchByName();
        }
    }

    async function addPet(ev) {
        ev.preventDefault();
        const name = $('input-name').value.trim();
        const rut = $('input-rut').value.trim();
        if (!name || !rut) return showAlert('Complete nombre y RUT', 'warning');
        try {
            await api.post('/', { name, rut });
            showAlert('Mascota inscrita exitosamente en el registro', 'success');
            $('form-add').reset();
            listAll();
        } catch (err) { showAlert('Error al agregar: ' + (err.response?.data?.error || err.message)); }
    }

    async function delByName() {
        const name = $('del-name').value.trim();
        if (!name) return showAlert('Ingrese nombre para eliminar', 'warning');
        if (!confirm('¿Confirma eliminar la mascota ' + name + ' del sistema?')) return;
        try {
            await api.delete('/', { params: { name } });
            showAlert('Mascota eliminada del registro', 'success');
            $('del-name').value = '';
            listAll();
        } catch (err) { showAlert('Error eliminar: ' + (err.response?.data?.error || err.message)); }
    }

    async function delByRut() {
        const rut = $('del-rut').value.trim();
        if (!rut) return showAlert('Ingrese RUT para eliminar', 'warning');
        if (!confirm('¿Confirma eliminar todas las mascotas asociadas al RUT ' + rut + '?')) return;
        try {
            const r = await api.delete('/', { params: { rut } });
            showAlert(`Se han eliminado ${r.data.deletedCount || 0} registros asociados al RUT`, 'success');
            $('del-rut').value = '';
            listAll();
        } catch (err) { showAlert('Error eliminar: ' + (err.response?.data?.error || err.message)); }
    }

    // Event bindings
    document.addEventListener('DOMContentLoaded', () => {
        const inputAge = $('input-age');
        const tutorSection = $('tutor-section');

        if (inputAge && tutorSection) {
            inputAge.addEventListener('input', (e) => {
                const age = parseInt(e.target.value);
                if (!isNaN(age) && age < 18) {
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

        const listAllBtn = $('btn-list-all');
        if (listAllBtn) listAllBtn.addEventListener('click', listAll);

        const unifiedSearchBtn = $('btn-unified-search');
        if (unifiedSearchBtn) {
            unifiedSearchBtn.addEventListener('click', unifiedSearch);
            $('unified-search').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') unifiedSearch();
            });
        }

        const formAdd = $('form-add');
        if (formAdd) formAdd.addEventListener('submit', addPet);

        const delNameBtn = $('btn-del-name');
        if (delNameBtn) delNameBtn.addEventListener('click', delByName);

        const delRutBtn = $('btn-del-rut');
        if (delRutBtn) delRutBtn.addEventListener('click', delByRut);

        // Inicializar lista
        listAll();
    });

})();

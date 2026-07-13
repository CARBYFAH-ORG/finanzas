/* =========================================================
   FINANZAS · Movimientos (lista + CRUD + paginación)
   ========================================================= */
APP.Views.movimientos = {
  title: 'Movimientos',
  render: async function(cont){
    const [cats, cuentas] = await Promise.all([APP.U.getCategorias(), APP.U.getCuentas()]);

    cont.innerHTML = `
      <div class="filters">
        <div class="f"><label>Tipo</label>
          <select id="mf-tipo"><option value="">Todos</option><option>Ingreso</option><option>Egreso</option></select>
        </div>
        <div class="f"><label>Categoría</label>
          <select id="mf-cat"><option value="">Todas</option>
            ${cats.map(c=>`<option value="${APP.U.esc(c.codigo)}">${APP.U.esc(c.nombre)}</option>`).join('')}
          </select>
        </div>
        <div class="f"><label>Desde</label><input type="date" id="mf-desde"></div>
        <div class="f"><label>Hasta</label><input type="date" id="mf-hasta"></div>
        <div class="f" style="margin-left:auto">
          <button class="btn" id="btn-nuevo-m">+ Nuevo movimiento</button>
        </div>
      </div>
      <div id="m-tbl-cont"></div>`;

    // ── Estado de paginación ──
    let _movs    = [];   // todos los movimientos del filtro actual
    let _pagina  = 1;
    let _porPag  = 10;

    document.getElementById('btn-nuevo-m').onclick = () => abrirFormMovimiento(null, cats, cuentas, cargarTabla);
    ['mf-tipo','mf-cat','mf-desde','mf-hasta'].forEach(id =>
      document.getElementById(id).addEventListener('change', () => { _pagina = 1; cargarTabla(); })
    );

    async function cargarTabla(){
      const tblCont = document.getElementById('m-tbl-cont');
      tblCont.innerHTML = '<div class="empty"><div class="spinner dark"></div><p>Cargando…</p></div>';

      const filtros = {
        tipo:      document.getElementById('mf-tipo').value,
        categoria: document.getElementById('mf-cat').value,
        desde:     document.getElementById('mf-desde').value,
        hasta:     document.getElementById('mf-hasta').value
      };
      const r = await APP.API.call('listar_movimientos', filtros);
      if (!r.ok){ tblCont.innerHTML = '<div class="empty"><p>'+APP.U.esc(r.error)+'</p></div>'; return; }

      _movs   = r.movimientos;
      _pagina = Math.min(_pagina, Math.max(1, Math.ceil(_movs.length / _porPag)));
      renderTabla(tblCont, cats, cuentas);
    }

    function renderTabla(tblCont, cats, cuentas){
      if (!_movs.length){
        tblCont.innerHTML = '<div class="empty"><p>Sin movimientos</p></div>';
        return;
      }

      const totalPags = _porPag === 0 ? 1 : Math.ceil(_movs.length / _porPag);
      const slice     = _porPag === 0 ? _movs : _movs.slice((_pagina-1)*_porPag, _pagina*_porPag);

      // ── Barra superior: total + exportar ──
      let h = `<div style="display:flex;justify-content:space-between;align-items:center;
                            margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <span style="font-size:.82rem;color:var(--text-dim)">
          ${_movs.length} registro${_movs.length!==1?'s':''}
          ${_porPag>0?' · mostrando '+slice.length:''}
        </span>
        <button class="btn sec sm" id="btn-export">Exportar Excel</button>
      </div>`;

      // ── Tabla ──
      h += `<div class="tbl-wrap"><table class="tbl">
        <thead><tr>
          <th>Fecha</th><th>Tipo</th>
          <th class="hide-mobile">Categoría</th>
          <th>Motivo</th>
          <th class="hide-mobile">Cuenta</th>
          <th style="text-align:right">Monto</th>
          <th></th>
        </tr></thead><tbody>`;

      slice.forEach(m => {
        const cls = m.tipo === 'Ingreso' ? 'reportada' : 'vencida';
        h += `<tr class="row-click" data-id="${APP.U.esc(m.id)}">
          <td>${APP.U.fmtFecha(m.fecha)}</td>
          <td><span class="badge ${cls}">${APP.U.esc(m.tipo)}</span></td>
          <td class="hide-mobile">${APP.U.esc(APP.U.catNombre(m.categoria,cats))}</td>
          <td>${APP.U.esc(m.motivo)}</td>
          <td class="hide-mobile">${APP.U.esc((cuentas.find(c=>c.codigo===m.cuenta)||{}).nombre||m.cuenta||'—')}</td>
          <td style="text-align:right;font-weight:700;color:${m.tipo==='Ingreso'?'var(--green-text)':'var(--red-text)'}">
            ${m.tipo==='Ingreso'?'+':'−'}${APP.U.fmtMoneda(m.monto)}
          </td>
          <td><button class="btn sm danger no-click" data-del="${APP.U.esc(m.id)}">Eliminar</button></td>
        </tr>`;
      });

      h += '</tbody></table></div>';

      // ── Pie: por página + paginador ──
      h += `<div style="display:flex;justify-content:space-between;align-items:center;
                         margin-top:14px;flex-wrap:wrap;gap:10px">

        <!-- Selector de registros por página -->
        <div style="display:flex;align-items:center;gap:8px;font-size:.83rem;color:var(--text-dim)">
          <span>Mostrar</span>
          <select id="pp-sel" style="background:var(--soft);border:1px solid var(--border);
            border-radius:8px;padding:6px 10px;font-size:.83rem;font-family:inherit;color:var(--text)">
            ${[5,10,25,50,100].map(n=>`<option value="${n}" ${_porPag===n?'selected':''}>${n}</option>`).join('')}
            <option value="0" ${_porPag===0?'selected':''}>Todos</option>
          </select>
          <span>por página</span>
        </div>

        <!-- Paginador -->
        ${totalPags <= 1 ? '' : `<div style="display:flex;align-items:center;gap:4px" id="paginador">
          ${paginadorHTML(_pagina, totalPags)}
        </div>`}
      </div>`;

      tblCont.innerHTML = h;

      // ── Eventos ──
      document.getElementById('pp-sel').onchange = function(){
        _porPag  = Number(this.value);
        _pagina  = 1;
        renderTabla(tblCont, cats, cuentas);
      };

      // Botones de página
      tblCont.querySelectorAll('[data-pg]').forEach(btn => {
        btn.onclick = () => {
          _pagina = Number(btn.dataset.pg);
          renderTabla(tblCont, cats, cuentas);
        };
      });

      // Click en fila → editar
      tblCont.querySelectorAll('tr.row-click').forEach(tr => {
        tr.onclick = ev => {
          if (ev.target.closest('.no-click')) return;
          const m = _movs.find(x => x.id === tr.dataset.id);
          abrirFormMovimiento(m, cats, cuentas, cargarTabla);
        };
      });

      // Eliminar
      tblCont.querySelectorAll('[data-del]').forEach(b => {
        b.onclick = async function(){
          if (!await APP.U.confirmar('¿Eliminar este movimiento? Esta acción no se puede deshacer.',
            { danger:true, confirmText:'Eliminar' })) return;
          const orig = this.innerHTML;
          this.disabled = true; this.innerHTML = '<span class="spinner"></span>';
          const r = await APP.API.call('eliminar_movimiento', { id: b.dataset.del });
          if (!r.ok){ APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=orig; return; }
          APP.U.invalidarBootstrap();
          APP.U.toast('Eliminado','warn');
          _movs = _movs.filter(x => x.id !== b.dataset.del);
          _pagina = Math.min(_pagina, Math.max(1, Math.ceil(_movs.length / (_porPag||_movs.length))));
          renderTabla(tblCont, cats, cuentas);
        };
      });

      // Exportar
      document.getElementById('btn-export').onclick = () => exportarExcel(_movs, cats, cuentas);
    }

    cargarTabla();
  }
};

// ── Genera los botones del paginador ──
function paginadorHTML(pag, total){
  const BTN = (pg, label, dis, active) =>
    `<button data-pg="${pg}"
      style="min-width:32px;height:32px;padding:0 8px;border-radius:8px;font-size:.82rem;
             font-weight:${active?'700':'500'};border:1px solid ${active?'var(--primary)':'var(--border)'};
             background:${active?'var(--primary)':'var(--card)'};
             color:${active?'#fff':'var(--text)'};
             cursor:${dis?'default':'pointer'};opacity:${dis?'.4':'1'}"
      ${dis?'disabled':''}>${label}</button>`;

  let html = BTN(pag-1, '‹', pag===1, false);

  // Ventana de páginas visible
  const rango = [];
  rango.push(1);
  for (let i = Math.max(2, pag-2); i <= Math.min(total-1, pag+2); i++) rango.push(i);
  if (total > 1) rango.push(total);

  let prev = 0;
  rango.forEach(p => {
    if (p - prev > 1) html += `<span style="padding:0 4px;color:var(--text-dim);font-size:.8rem">…</span>`;
    html += BTN(p, p, false, p===pag);
    prev = p;
  });

  html += BTN(pag+1, '›', pag===total, false);
  return html;
}

// ── Modal nuevo/editar ──
function abrirFormMovimiento(m, cats, cuentas, onSaved){
  const isNew = !m;
  const html = `<div class="modal" onclick="event.stopPropagation()">
    <div class="mh"><h3>${isNew?'Nuevo':'Editar'} movimiento</h3>
      <button class="x" onclick="APP.U.closeModal()">×</button></div>
    <div class="mb">
      <div class="row2">
        <div><label>Tipo *</label>
          <select id="mv-tipo">
            <option value="Egreso"  ${m&&m.tipo==='Egreso' ?'selected':''}>Egreso</option>
            <option value="Ingreso" ${m&&m.tipo==='Ingreso'?'selected':''}>Ingreso</option>
          </select>
        </div>
        <div><label>Fecha *</label>
          <input type="date" id="mv-fecha" value="${m?APP.U.fmtFechaInput(m.fecha):APP.U.fmtFechaInput(new Date())}">
        </div>
      </div>
      <div class="row2">
        <div><label>Categoría *</label>
          <select id="mv-cat">
            ${cats.map(c=>`<option value="${APP.U.esc(c.codigo)}" ${m&&m.categoria===c.codigo?'selected':''}>${APP.U.esc(c.nombre)}</option>`).join('')}
          </select>
        </div>
        <div><label>Cuenta</label>
          <select id="mv-cuenta">
            <option value="">—</option>
            ${cuentas.map(c=>`<option value="${APP.U.esc(c.codigo)}" ${m&&m.cuenta===c.codigo?'selected':''}>${APP.U.esc(c.nombre)}</option>`).join('')}
          </select>
        </div>
      </div>
      <label>Motivo *</label>
      <input id="mv-motivo" value="${m?APP.U.esc(m.motivo):''}" placeholder="Ej: Compra Maxidespensa">
      <label>Monto (L.) *</label>
      <input type="number" step="0.01" id="mv-monto" value="${m?Number(m.monto):''}" placeholder="0.00" inputmode="decimal">
      <label>Nota</label>
      <textarea id="mv-nota" placeholder="Detalle opcional">${m?APP.U.esc(m.nota):''}</textarea>
    </div>
    <div class="mf">
      <button class="btn sec" onclick="APP.U.closeModal()">Cancelar</button>
      <button class="btn" id="mv-save">${isNew?'Crear':'Guardar'}</button>
    </div>
  </div>`;

  APP.U.openModal(html);

  document.getElementById('mv-save').onclick = async function(){
    const data = {
      tipo:      document.getElementById('mv-tipo').value,
      fecha:     document.getElementById('mv-fecha').value,
      categoria: document.getElementById('mv-cat').value,
      cuenta:    document.getElementById('mv-cuenta').value,
      motivo:    document.getElementById('mv-motivo').value.trim(),
      monto:     document.getElementById('mv-monto').value,
      nota:      document.getElementById('mv-nota').value.trim()
    };
    if (!data.fecha || !data.categoria || !data.motivo || !data.monto){
      APP.U.toast('Faltan campos obligatorios','error'); return;
    }
    const orig = this.innerHTML;
    this.disabled = true; this.innerHTML = '<span class="spinner"></span> Guardando…';
    const r = isNew
      ? await APP.API.call('crear_movimiento', data)
      : await APP.API.call('editar_movimiento', Object.assign({ id: m.id }, data));
    if (!r.ok){ APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=orig; return; }
    APP.U.invalidarBootstrap();
    APP.U.closeModal();
    APP.U.toast('Guardado','success');
    if (onSaved) onSaved();
  };
}

// ── Exportar Excel ──
function exportarExcel(movs, cats, cuentas){
  const rows = movs.map(m => ({
    Fecha:     APP.U.fmtFecha(m.fecha),
    Tipo:      m.tipo,
    Categoria: APP.U.catNombre(m.categoria, cats),
    Motivo:    m.motivo,
    Cuenta:    (cuentas.find(c=>c.codigo===m.cuenta)||{}).nombre || m.cuenta || '',
    Monto:     Number(m.monto),
    Nota:      m.nota || ''
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:12},{wch:9},{wch:20},{wch:30},{wch:16},{wch:12},{wch:30}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  XLSX.writeFile(wb, 'movimientos_finanzas.xlsx');
}

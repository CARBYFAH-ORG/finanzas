/* =========================================================
   FINANZAS · Movimientos (lista + CRUD)
   ========================================================= */
APP.Views.movimientos = {
  title: 'Movimientos',
  render: async function(cont){
    const [cats, cuentas] = await Promise.all([APP.U.getCategorias(), APP.U.getCuentas()]);

    let html = `<div class="filters">
      <div class="f"><label>Tipo</label><select id="mf-tipo"><option value="">Todos</option><option>Ingreso</option><option>Egreso</option></select></div>
      <div class="f"><label>Categoría</label><select id="mf-cat"><option value="">Todas</option>${cats.map(c=>`<option value="${APP.U.esc(c.codigo)}">${APP.U.esc(c.nombre)}</option>`).join('')}</select></div>
      <div class="f"><label>Desde</label><input type="date" id="mf-desde"></div>
      <div class="f"><label>Hasta</label><input type="date" id="mf-hasta"></div>
      <div class="f" style="margin-left:auto"><button class="btn" id="btn-nuevo-m">+ Nuevo movimiento</button></div>
    </div>
    <div id="m-tbl-cont"></div>`;
    cont.innerHTML = html;

    document.getElementById('btn-nuevo-m').onclick = () => abrirFormMovimiento(null, cats, cuentas);
    ['mf-tipo','mf-cat','mf-desde','mf-hasta'].forEach(id => {
      document.getElementById(id).onchange = cargarTabla;
    });
    cargarTabla();

    async function cargarTabla(){
      const tblCont = document.getElementById('m-tbl-cont');
      tblCont.innerHTML = '<div class="empty"><div class="spinner dark"></div><p>Cargando…</p></div>';
      const filtros = {
        tipo: document.getElementById('mf-tipo').value,
        categoria: document.getElementById('mf-cat').value,
        desde: document.getElementById('mf-desde').value,
        hasta: document.getElementById('mf-hasta').value
      };
      const r = await APP.API.call('listar_movimientos', filtros);
      if (!r.ok) { tblCont.innerHTML = '<div class="empty"><p>'+APP.U.esc(r.error)+'</p></div>'; return; }
      const movs = r.movimientos;

      if (!movs.length) { tblCont.innerHTML = '<div class="empty"><p>Sin movimientos</p></div>'; return; }

      let h = '<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn sec sm" id="btn-export">Exportar Excel</button></div>';
      h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Motivo</th><th>Cuenta</th><th style="text-align:right">Monto</th><th></th></tr></thead><tbody>';
      movs.forEach(m => {
        const cls = m.tipo === 'Ingreso' ? 'reportada' : 'vencida';
        h += `<tr class="row-click" data-id="${APP.U.esc(m.id)}">
          <td>${APP.U.fmtFecha(m.fecha)}</td>
          <td><span class="badge ${cls}">${APP.U.esc(m.tipo)}</span></td>
          <td>${APP.U.esc(APP.U.catNombre(m.categoria,cats))}</td>
          <td>${APP.U.esc(m.motivo)}</td>
          <td>${APP.U.esc((cuentas.find(c=>c.codigo===m.cuenta)||{}).nombre || m.cuenta || '—')}</td>
          <td style="text-align:right;font-weight:700;color:${m.tipo==='Ingreso'?'var(--green-text)':'var(--red-text)'}">${m.tipo==='Ingreso'?'+':'-'}${APP.U.fmtMoneda(m.monto)}</td>
          <td><button class="btn sm danger no-click" data-del="${APP.U.esc(m.id)}">Eliminar</button></td>
        </tr>`;
      });
      h += '</tbody></table></div>';
      tblCont.innerHTML = h;

      document.querySelectorAll('tr.row-click').forEach(tr => {
        tr.onclick = (ev) => {
          if (ev.target.closest('.no-click')) return;
          const m = movs.find(x=>x.id===tr.dataset.id);
          abrirFormMovimiento(m, cats, cuentas);
        };
      });
      document.querySelectorAll('[data-del]').forEach(b => {
        b.onclick = async function(){
          if (!APP.U.confirmar('¿Eliminar este movimiento?')) return;
          const original = this.innerHTML;
          this.disabled = true; this.innerHTML = '<span class="spinner"></span>';
          const r = await APP.API.call('eliminar_movimiento', {id:b.dataset.del});
          if (!r.ok) { APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=original; return; }
          APP.U.invalidarBootstrap();
          APP.U.toast('Eliminado','warn');
          cargarTabla();
        };
      });

      document.getElementById('btn-export').onclick = () => exportarExcel(movs, cats, cuentas);
    }
  }
};

function abrirFormMovimiento(m, cats, cuentas){
  const isNew = !m;
  const html = `<div class="modal" onclick="event.stopPropagation()">
    <div class="mh"><h3>${isNew?'Nuevo':'Editar'} movimiento</h3><button class="x" onclick="APP.U.closeModal()">×</button></div>
    <div class="mb">
      <div class="row2">
        <div><label>Tipo *</label><select id="mv-tipo"><option value="Egreso" ${m&&m.tipo==='Egreso'?'selected':''}>Egreso</option><option value="Ingreso" ${m&&m.tipo==='Ingreso'?'selected':''}>Ingreso</option></select></div>
        <div><label>Fecha *</label><input type="date" id="mv-fecha" value="${m?APP.U.fmtFechaInput(m.fecha):APP.U.fmtFechaInput(new Date())}"></div>
      </div>
      <div class="row2">
        <div><label>Categoría *</label><select id="mv-cat">${cats.map(c=>`<option value="${APP.U.esc(c.codigo)}" ${m&&m.categoria===c.codigo?'selected':''}>${APP.U.esc(c.nombre)}</option>`).join('')}</select></div>
        <div><label>Cuenta</label><select id="mv-cuenta"><option value="">—</option>${cuentas.map(c=>`<option value="${APP.U.esc(c.codigo)}" ${m&&m.cuenta===c.codigo?'selected':''}>${APP.U.esc(c.nombre)}</option>`).join('')}</select></div>
      </div>
      <label>Motivo *</label>
      <input id="mv-motivo" value="${m?APP.U.esc(m.motivo):''}" placeholder="Ej: Compra Maxidespensa">
      <label>Monto (L.) *</label>
      <input type="number" step="0.01" id="mv-monto" value="${m?Number(m.monto):''}" placeholder="0.00">
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
      tipo: document.getElementById('mv-tipo').value,
      fecha: document.getElementById('mv-fecha').value,
      categoria: document.getElementById('mv-cat').value,
      cuenta: document.getElementById('mv-cuenta').value,
      motivo: document.getElementById('mv-motivo').value.trim(),
      monto: document.getElementById('mv-monto').value,
      nota: document.getElementById('mv-nota').value.trim()
    };
    if (!data.fecha || !data.categoria || !data.motivo || !data.monto) {
      APP.U.toast('Faltan campos obligatorios','error'); return;
    }
    const original = this.innerHTML;
    this.disabled = true; this.innerHTML = '<span class="spinner"></span> Guardando…';
    let r;
    if (isNew) r = await APP.API.call('crear_movimiento', data);
    else r = await APP.API.call('editar_movimiento', Object.assign({id:m.id}, data));
    if (!r.ok) { APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=original; return; }
    APP.U.invalidarBootstrap();
    APP.U.closeModal();
    APP.U.toast('Guardado','success');
    APP.Router.refresh();
  };
}

function exportarExcel(movs, cats, cuentas){
  const rows = movs.map(m => ({
    Fecha: APP.U.fmtFecha(m.fecha),
    Tipo: m.tipo,
    Categoria: APP.U.catNombre(m.categoria, cats),
    Motivo: m.motivo,
    Cuenta: (cuentas.find(c=>c.codigo===m.cuenta)||{}).nombre || m.cuenta || '',
    Monto: Number(m.monto),
    Nota: m.nota || ''
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  XLSX.writeFile(wb, 'movimientos_finanzas.xlsx');
}

/* =========================================================
   FINANZAS · Metas de ahorro
   ========================================================= */
APP.Views.metas = {
  title: 'Metas',
  render: async function(cont){
    APP.U.loader(true);
    const r = await APP.API.call('listar_metas');
    APP.U.loader(false);
    if (!r.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(r.error)+'</p></div>'; return; }
    const metas = r.metas;

    let html = '<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn" id="btn-nueva-meta">+ Nueva meta</button></div>';
    if (!metas.length) {
      html += '<div class="empty"><p>Sin metas creadas. Define una meta de ahorro con fecha límite.</p></div>';
    } else {
      html += '<div class="panel-grid">' + metas.map(m => cardMeta(m)).join('') + '</div>';
    }
    cont.innerHTML = html;

    document.getElementById('btn-nueva-meta').onclick = () => formMeta(null);
    document.querySelectorAll('[data-aportar]').forEach(b => b.onclick = () => aportar(b.dataset.aportar, metas));
    document.querySelectorAll('[data-edit-meta]').forEach(b => b.onclick = () => formMeta(metas.find(m=>m.id===b.dataset.editMeta)));
    document.querySelectorAll('[data-del-meta]').forEach(b => b.onclick = () => eliminarMeta(b.dataset.delMeta, b));
  }
};

function cardMeta(m){
  const objetivo = Number(m.monto_objetivo), actual = Number(m.monto_actual);
  const pct = Math.min(100, Math.round((actual/objetivo)*100));
  const hoy = new Date(), limite = new Date(m.fecha_limite);
  const diasRestantes = Math.max(0, Math.ceil((limite-hoy)/(1000*60*60*24)));
  const restante = Math.max(0, objetivo - actual);
  const semanasRestantes = Math.max(1, Math.ceil(diasRestantes/7));
  const porSemana = restante / semanasRestantes;
  const completada = APP.U.esc ? (m.completada) : m.completada;

  return `<div class="panel">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
      <h3 style="margin:0">${APP.U.esc(m.nombre)}</h3>
      <span class="badge ${completada?'reportada':'encurso'}">${completada?'Completada':pct+'%'}</span>
    </div>
    <div style="background:var(--soft);border-radius:99px;height:12px;overflow:hidden;margin-bottom:10px">
      <div style="width:${pct}%;height:100%;background:${completada?'var(--green)':'var(--primary)'}"></div>
    </div>
    <div class="detalle-grid" style="margin-bottom:10px">
      <div class="dg"><span class="l">Acumulado</span><span class="v">${APP.U.fmtMoneda(actual)}</span></div>
      <div class="dg"><span class="l">Objetivo</span><span class="v">${APP.U.fmtMoneda(objetivo)}</span></div>
      <div class="dg"><span class="l">Vence</span><span class="v">${APP.U.fmtFecha(m.fecha_limite)}</span></div>
      <div class="dg"><span class="l">Días restantes</span><span class="v">${diasRestantes}</span></div>
    </div>
    ${!completada ? `<div style="font-size:.8rem;color:var(--text-dim);margin-bottom:12px">
      Para llegar a tiempo necesitas ahorrar <b>${APP.U.fmtMoneda(porSemana)}</b> por semana.
    </div>` : ''}
    <div style="display:flex;gap:8px">
      ${!completada?`<button class="btn success sm" data-aportar="${APP.U.esc(m.id)}">+ Aportar</button>`:''}
      <button class="btn sec sm" data-edit-meta="${APP.U.esc(m.id)}">Editar</button>
      <button class="btn danger sm" data-del-meta="${APP.U.esc(m.id)}">Eliminar</button>
    </div>
  </div>`;
}

function formMeta(m){
  const isNew = !m;
  const html = `<div class="modal" onclick="event.stopPropagation()">
    <div class="mh"><h3>${isNew?'Nueva':'Editar'} meta de ahorro</h3><button class="x" onclick="APP.U.closeModal()">×</button></div>
    <div class="mb">
      <label>Nombre *</label>
      <input id="gm-nombre" value="${m?APP.U.esc(m.nombre):''}" placeholder="Ej: Fondo de emergencia">
      <div class="row2">
        <div><label>Monto objetivo (L.) *</label><input type="number" step="0.01" id="gm-obj" value="${m?Number(m.objetivo):''}"></div>
        <div><label>Fecha límite *</label><input type="date" id="gm-fecha" value="${m?APP.U.fmtFechaInput(m.fecha_limite):''}"></div>
      </div>
      ${isNew?'<label>Monto inicial (L.)</label><input type="number" step="0.01" id="gm-inicial" value="0">':''}
    </div>
    <div class="mf">
      <button class="btn sec" onclick="APP.U.closeModal()">Cancelar</button>
      <button class="btn" id="gm-save">${isNew?'Crear':'Guardar'}</button>
    </div>
  </div>`;
  APP.U.openModal(html);
  document.getElementById('gm-save').onclick = async function(){
    const data = {
      nombre: document.getElementById('gm-nombre').value.trim(),
      monto_objetivo: document.getElementById('gm-obj').value,
      fecha_limite: document.getElementById('gm-fecha').value
    };
    if (isNew) data.monto_actual = document.getElementById('gm-inicial').value || 0;
    if (!data.nombre || !data.monto_objetivo || !data.fecha_limite) { APP.U.toast('Faltan campos','error'); return; }
    const original = this.innerHTML;
    this.disabled = true; this.innerHTML = '<span class="spinner"></span> Guardando…';
    const r = isNew ? await APP.API.call('crear_meta', data) : await APP.API.call('editar_meta', Object.assign({id:m.id}, data));
    if (!r.ok) { APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=original; return; }
    APP.U.invalidarBootstrap();
    APP.U.closeModal();
    APP.U.toast('Guardado','success');
    APP.Router.refresh();
  };
}

async function aportar(id, metas){
  const monto = await APP.U.promptMonto('¿Cuánto quieres aportar a esta meta?');
  if (!monto) return;
  const r = await APP.API.call('aportar_meta', {id, monto});
  if (!r.ok) { APP.U.toast(r.error,'error'); return; }
  APP.U.invalidarBootstrap();
  APP.U.toast('Aporte registrado','success');
  APP.Router.refresh();
}

async function eliminarMeta(id, btn){
  if (!await APP.U.confirmar('¿Eliminar esta meta? Esta acción no se puede deshacer.', {danger:true, confirmText:'Eliminar'})) return;
  const original = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  const r = await APP.API.call('eliminar_meta', {id});
  if (!r.ok) { APP.U.toast(r.error,'error'); btn.disabled=false; btn.innerHTML=original; return; }
  APP.U.invalidarBootstrap();
  APP.U.toast('Eliminada','warn');
  APP.Router.refresh();
}

/* =========================================================
   FINANZAS · Categorías y Cuentas (administración)
   ========================================================= */
const PALETA_CATEGORIAS = ['#3b82f6','#16a34a','#f59e0b','#8b5cf6','#ef4444','#ec4899','#64748b','#06b6d4','#94a3b8','#22c55e','#0ea5e9','#f97316','#14b8a6','#a855f7'];

APP.Views.categorias = {
  title: 'Categorías y cuentas',
  render: async function(cont){
    APP.U.loader(true);
    const b = await APP.U.getBootstrap();
    APP.U.loader(false);
    if (!b.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(b.error)+'</p></div>'; return; }
    const cats = b.categorias_todas || b.categorias;
    const cuentas = b.cuentas_todas || b.cuentas;

    const catsIngreso = cats.filter(c => c.tipo === 'Ingreso');
    const catsEgreso = cats.filter(c => c.tipo === 'Egreso');

    let html = `
    <div class="panel-grid">
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="margin:0">Categorías de egreso</h3>
          <button class="btn sm" id="btn-nueva-cat-egreso">+ Nueva</button>
        </div>
        <div id="list-cat-egreso"></div>
      </div>
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="margin:0">Categorías de ingreso</h3>
          <button class="btn sm" id="btn-nueva-cat-ingreso">+ Nueva</button>
        </div>
        <div id="list-cat-ingreso"></div>
      </div>
    </div>
    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 style="margin:0">Cuentas</h3>
        <button class="btn sm" id="btn-nueva-cuenta">+ Nueva cuenta</button>
      </div>
      <div id="list-cuentas"></div>
    </div>`;
    cont.innerHTML = html;

    pintarListaCategorias('list-cat-egreso', catsEgreso);
    pintarListaCategorias('list-cat-ingreso', catsIngreso);
    pintarListaCuentas('list-cuentas', cuentas);

    document.getElementById('btn-nueva-cat-egreso').onclick = () => formCategoria(null, 'Egreso');
    document.getElementById('btn-nueva-cat-ingreso').onclick = () => formCategoria(null, 'Ingreso');
    document.getElementById('btn-nueva-cuenta').onclick = () => formCuenta(null);
  }
};

function pintarListaCategorias(contId, lista){
  const cont = document.getElementById(contId);
  if (!lista.length) { cont.innerHTML = '<div class="empty"><p>Sin categorías</p></div>'; return; }
  cont.innerHTML = lista.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
      <span style="width:12px;height:12px;border-radius:50%;background:${c.color};flex:none"></span>
      <span style="flex:1;font-size:.88rem;${!c.activo?'color:var(--text-soft);text-decoration:line-through':''}">${APP.U.esc(c.nombre)}</span>
      <span class="mono" style="font-size:.72rem;color:var(--text-soft)">${APP.U.esc(c.codigo)}</span>
      ${!c.activo?'<span class="badge cancelada">Inactiva</span>':''}
      <button class="btn sm sec" data-edit-cat="${APP.U.esc(c.codigo)}">Editar</button>
      <button class="btn sm danger" data-del-cat="${APP.U.esc(c.codigo)}">Eliminar</button>
    </div>`).join('');
  cont.querySelectorAll('[data-edit-cat]').forEach(b => b.onclick = () => formCategoria(lista.find(c=>c.codigo===b.dataset.editCat)));
  cont.querySelectorAll('[data-del-cat]').forEach(b => b.onclick = () => eliminarCategoria(b.dataset.delCat, b));
}

function pintarListaCuentas(contId, lista){
  const cont = document.getElementById(contId);
  if (!lista.length) { cont.innerHTML = '<div class="empty"><p>Sin cuentas</p></div>'; return; }
  cont.innerHTML = lista.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
      <span style="flex:1;font-size:.88rem;${!c.activo?'color:var(--text-soft);text-decoration:line-through':''}">${APP.U.esc(c.nombre)}</span>
      <span class="mono" style="font-size:.72rem;color:var(--text-soft)">${APP.U.esc(c.codigo)}</span>
      ${!c.activo?'<span class="badge cancelada">Inactiva</span>':''}
      <button class="btn sm sec" data-edit-cuenta="${APP.U.esc(c.codigo)}">Editar</button>
      <button class="btn sm danger" data-del-cuenta="${APP.U.esc(c.codigo)}">Eliminar</button>
    </div>`).join('');
  cont.querySelectorAll('[data-edit-cuenta]').forEach(b => b.onclick = () => formCuenta(lista.find(c=>c.codigo===b.dataset.editCuenta)));
  cont.querySelectorAll('[data-del-cuenta]').forEach(b => b.onclick = () => eliminarCuenta(b.dataset.delCuenta, b));
}

function formCategoria(c, tipoFijo){
  const isNew = !c;
  const tipo = c ? c.tipo : tipoFijo;
  const colorActual = c ? c.color : PALETA_CATEGORIAS[0];
  const html = `<div class="modal" onclick="event.stopPropagation()">
    <div class="mh"><h3>${isNew?'Nueva':'Editar'} categoría de ${tipo==='Egreso'?'egreso':'ingreso'}</h3><button class="x" onclick="APP.U.closeModal()">×</button></div>
    <div class="mb">
      ${isNew?`<label>Código (sin espacios, ej: GYM)</label><input id="ct-codigo" placeholder="GYM" style="text-transform:uppercase">`:''}
      <label>Nombre *</label>
      <input id="ct-nombre" value="${c?APP.U.esc(c.nombre):''}" placeholder="Ej: Gimnasio">
      <label>Color</label>
      <div id="ct-paleta" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
        ${PALETA_CATEGORIAS.map(col => `<span data-color="${col}" style="width:26px;height:26px;border-radius:50%;background:${col};cursor:pointer;border:2px solid ${col===colorActual?'var(--text)':'transparent'}"></span>`).join('')}
      </div>
      ${!isNew?`<label style="margin-top:14px">Estado</label><select id="ct-activo"><option value="true" ${c.activo?'selected':''}>Activa</option><option value="false" ${!c.activo?'selected':''}>Inactiva</option></select>`:''}
    </div>
    <div class="mf">
      <button class="btn sec" onclick="APP.U.closeModal()">Cancelar</button>
      <button class="btn" id="ct-save">${isNew?'Crear':'Guardar'}</button>
    </div>
  </div>`;
  APP.U.openModal(html);

  let colorSel = colorActual;
  document.querySelectorAll('#ct-paleta span').forEach(s => {
    s.onclick = () => {
      colorSel = s.dataset.color;
      document.querySelectorAll('#ct-paleta span').forEach(x => x.style.border = '2px solid transparent');
      s.style.border = '2px solid var(--text)';
    };
  });

  document.getElementById('ct-save').onclick = async function(){
    const nombre = document.getElementById('ct-nombre').value.trim();
    if (!nombre) { APP.U.toast('Falta el nombre','error'); return; }
    const original = this.innerHTML;
    this.disabled = true; this.innerHTML = '<span class="spinner"></span> Guardando…';
    let r;
    if (isNew) {
      const codigo = document.getElementById('ct-codigo').value.trim();
      if (!codigo) { this.disabled=false; this.innerHTML=original; APP.U.toast('Falta el código','error'); return; }
      r = await APP.API.call('crear_categoria', {codigo, nombre, tipo, color:colorSel});
    } else {
      r = await APP.API.call('editar_categoria', {
        codigo: c.codigo, nombre, color: colorSel,
        activo: document.getElementById('ct-activo').value === 'true'
      });
    }
    if (!r.ok) { APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=original; return; }
    APP.U.invalidarBootstrap();
    APP.U.closeModal();
    APP.U.toast('Guardado','success');
    APP.Router.refresh();
  };
}

async function eliminarCategoria(codigo, btn){
  if (!await APP.U.confirmar('¿Eliminar esta categoría? Solo se puede si no tiene movimientos registrados.', {danger:true, confirmText:'Eliminar'})) return;
  const original = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  const r = await APP.API.call('eliminar_categoria', {codigo});
  if (!r.ok) { APP.U.toast(r.error,'error'); btn.disabled=false; btn.innerHTML=original; return; }
  APP.U.invalidarBootstrap();
  APP.U.toast('Eliminada','warn');
  APP.Router.refresh();
}

function formCuenta(c){
  const isNew = !c;
  const html = `<div class="modal" onclick="event.stopPropagation()">
    <div class="mh"><h3>${isNew?'Nueva':'Editar'} cuenta</h3><button class="x" onclick="APP.U.closeModal()">×</button></div>
    <div class="mb">
      ${isNew?`<label>Código (sin espacios, ej: TARJ2)</label><input id="cu-codigo" placeholder="TARJ2" style="text-transform:uppercase">`:''}
      <label>Nombre *</label>
      <input id="cu-nombre" value="${c?APP.U.esc(c.nombre):''}" placeholder="Ej: Tarjeta de crédito">
      ${!isNew?`<label>Estado</label><select id="cu-activo"><option value="true" ${c.activo?'selected':''}>Activa</option><option value="false" ${!c.activo?'selected':''}>Inactiva</option></select>`:''}
    </div>
    <div class="mf">
      <button class="btn sec" onclick="APP.U.closeModal()">Cancelar</button>
      <button class="btn" id="cu-save">${isNew?'Crear':'Guardar'}</button>
    </div>
  </div>`;
  APP.U.openModal(html);

  document.getElementById('cu-save').onclick = async function(){
    const nombre = document.getElementById('cu-nombre').value.trim();
    if (!nombre) { APP.U.toast('Falta el nombre','error'); return; }
    const original = this.innerHTML;
    this.disabled = true; this.innerHTML = '<span class="spinner"></span> Guardando…';
    let r;
    if (isNew) {
      const codigo = document.getElementById('cu-codigo').value.trim();
      if (!codigo) { this.disabled=false; this.innerHTML=original; APP.U.toast('Falta el código','error'); return; }
      r = await APP.API.call('crear_cuenta', {codigo, nombre});
    } else {
      r = await APP.API.call('editar_cuenta', {
        codigo: c.codigo, nombre,
        activo: document.getElementById('cu-activo').value === 'true'
      });
    }
    if (!r.ok) { APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=original; return; }
    APP.U.invalidarBootstrap();
    APP.U.closeModal();
    APP.U.toast('Guardado','success');
    APP.Router.refresh();
  };
}

async function eliminarCuenta(codigo, btn){
  if (!await APP.U.confirmar('¿Eliminar esta cuenta? Solo se puede si no tiene movimientos registrados.', {danger:true, confirmText:'Eliminar'})) return;
  const original = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  const r = await APP.API.call('eliminar_cuenta', {codigo});
  if (!r.ok) { APP.U.toast(r.error,'error'); btn.disabled=false; btn.innerHTML=original; return; }
  APP.U.invalidarBootstrap();
  APP.U.toast('Eliminada','warn');
  APP.Router.refresh();
}

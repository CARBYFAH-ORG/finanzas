/* =========================================================
   FINANZAS · Presupuesto (% por categoría)
   ========================================================= */
APP.Views.presupuesto = {
  title: 'Presupuesto',
  render: async function(cont){
    APP.U.loader(true);
    const [pR, cats] = await Promise.all([APP.API.call('obtener_presupuesto'), APP.U.getCategorias()]);
    APP.U.loader(false);
    if (!pR.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(pR.error)+'</p></div>'; return; }
    const presup = pR.presupuesto;
    const catsEgreso = cats.filter(c => c.tipo === 'Egreso');

    let html = `<div class="panel">
      <h3>Presupuesto por categoría</h3>
      <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:16px">
        Define qué porcentaje de tu ingreso mensual destinas a cada categoría. El sistema calculará
        el límite en lempiras según tus ingresos reales del mes y te avisará si te pasas.
      </p>
      <div id="presup-list"></div>
      <div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
        <b id="presup-total" style="font-size:.95rem"></b>
        <button class="btn" id="presup-guardar">Guardar presupuesto</button>
      </div>
    </div>`;
    cont.innerHTML = html;

    const list = document.getElementById('presup-list');
    list.innerHTML = catsEgreso.map(c => {
      const p = presup.find(x => x.categoria === c.codigo);
      const val = p ? p.porcentaje : 0;
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span style="width:10px;height:10px;border-radius:50%;background:${c.color};flex:none"></span>
        <span style="flex:1;font-size:.88rem">${APP.U.esc(c.nombre)}</span>
        <input type="number" min="0" max="100" step="1" data-cat="${APP.U.esc(c.codigo)}" value="${val}" style="width:80px;text-align:right">
        <span style="font-size:.82rem;color:var(--text-dim)">%</span>
      </div>`;
    }).join('');

    function actualizarTotal(){
      let sum = 0;
      document.querySelectorAll('[data-cat]').forEach(i => sum += Number(i.value)||0);
      const el = document.getElementById('presup-total');
      el.textContent = 'Total asignado: ' + sum + '%';
      el.style.color = sum > 100 ? 'var(--red-text)' : (sum < 100 ? 'var(--amber-text)' : 'var(--green-text)');
    }
    document.querySelectorAll('[data-cat]').forEach(i => i.oninput = actualizarTotal);
    actualizarTotal();

    document.getElementById('presup-guardar').onclick = async function(){
      const items = [];
      document.querySelectorAll('[data-cat]').forEach(i => items.push({categoria: i.dataset.cat, porcentaje: Number(i.value)||0}));
      const original = this.innerHTML;
      this.disabled = true; this.innerHTML = '<span class="spinner"></span> Guardando…';
      const r = await APP.API.call('guardar_presupuesto', {items});
      this.disabled = false; this.innerHTML = original;
      if (!r.ok) { APP.U.toast(r.error,'error'); return; }
      APP.U.toast('Presupuesto actualizado','success');
    };
  }
};

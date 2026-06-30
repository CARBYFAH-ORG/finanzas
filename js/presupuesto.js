/* =========================================================
   FINANZAS · Presupuesto (% por categoría, con equivalencia en L.)
   ========================================================= */
APP.Views.presupuesto = {
  title: 'Presupuesto',
  render: async function(cont){
    APP.U.loader(true);
    const pR = await APP.API.call('obtener_presupuesto');
    const cats = await APP.U.getCategorias();
    const dashR = await APP.API.call('dashboard');
    APP.U.loader(false);
    if (!pR.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(pR.error)+'</p></div>'; return; }
    const presup = pR.presupuesto;
    const catsEgreso = cats.filter(c => c.tipo === 'Egreso');
    const ingresosMes = dashR.ok ? Number(dashR.ingresos_mes)||0 : 0;

    let html = `<div class="panel">
      <h3>Presupuesto por categoría</h3>
      <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:8px;line-height:1.5">
        Define qué porcentaje de tu ingreso mensual destinas a cada categoría. El sistema calcula
        el límite en lempiras según tus ingresos reales del mes (sueldo más cualquier ingreso extra)
        y te avisará si te pasas.
      </p>
      <div style="background:var(--soft);border:1px solid var(--border);border-radius:9px;padding:10px 14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:.8rem;color:var(--text-dim)">Ingresos de este mes (base de cálculo)</span>
        <span style="font-weight:700;font-size:1rem">${APP.U.fmtMoneda(ingresosMes)}</span>
      </div>
      <div id="presup-list"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
        <div>
          <b id="presup-total" style="font-size:.95rem;display:block"></b>
          <span id="presup-total-monto" style="font-size:.78rem;color:var(--text-dim)"></span>
        </div>
        <button class="btn" id="presup-guardar">Guardar presupuesto</button>
      </div>
    </div>`;
    cont.innerHTML = html;

    const list = document.getElementById('presup-list');
    list.innerHTML = catsEgreso.map(c => {
      const p = presup.find(x => x.categoria === c.codigo);
      const val = p ? p.porcentaje : 0;
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="width:10px;height:10px;border-radius:50%;background:${c.color};flex:none"></span>
        <span style="flex:1;font-size:.88rem">${APP.U.esc(c.nombre)}</span>
        <span class="mono" data-monto="${APP.U.esc(c.codigo)}" style="font-size:.82rem;color:var(--text-dim);min-width:110px;text-align:right">${APP.U.fmtMoneda(ingresosMes*val/100)}</span>
        <input type="number" min="0" max="100" step="1" data-cat="${APP.U.esc(c.codigo)}" value="${val}" style="width:70px;text-align:right;background:var(--soft);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px;font-size:.88rem">
        <span style="font-size:.82rem;color:var(--text-dim);width:14px">%</span>
      </div>`;
    }).join('');

    function actualizar(){
      let sumPct = 0, sumMonto = 0;
      document.querySelectorAll('[data-cat]').forEach(i => {
        const pct = Number(i.value)||0;
        const monto = ingresosMes * pct / 100;
        sumPct += pct;
        sumMonto += monto;
        const montoEl = document.querySelector('[data-monto="'+i.dataset.cat+'"]');
        if (montoEl) montoEl.textContent = APP.U.fmtMoneda(monto);
      });
      const elT = document.getElementById('presup-total');
      const elM = document.getElementById('presup-total-monto');
      elT.textContent = 'Total asignado: ' + sumPct + '%';
      elT.style.color = sumPct > 100 ? 'var(--red-text)' : (sumPct < 100 ? 'var(--amber-text)' : 'var(--green-text)');
      elM.textContent = 'Equivale a ' + APP.U.fmtMoneda(sumMonto) + ' de ' + APP.U.fmtMoneda(ingresosMes);
    }
    document.querySelectorAll('[data-cat]').forEach(i => i.oninput = actualizar);
    actualizar();

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

/* =========================================================
   FINANZAS · Dashboard
   ========================================================= */
APP.Views = APP.Views || {};
APP.Views.dashboard = {
  title: 'Dashboard',
  render: async function(cont){
    APP.U.loader(true);
    const [r, cats] = await Promise.all([APP.API.call('dashboard'), APP.U.getCategorias()]);
    APP.U.loader(false);
    if (!r.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(r.error)+'</p></div>'; return; }

    const saldoCls = r.saldo_actual >= 0 ? 'verde' : 'rojo';
    const superCls = r.superavit_mes >= 0 ? 'verde' : 'rojo';

    let html = '<div class="kpi-grid">';
    html += kpi('azul', icSaldo(), 'Saldo actual', APP.U.fmtMoneda(r.saldo_actual));
    html += kpi('verde', icIngreso(), 'Ingresos del mes', APP.U.fmtMoneda(r.ingresos_mes));
    html += kpi('rojo', icEgreso(), 'Egresos del mes', APP.U.fmtMoneda(r.egresos_mes));
    html += kpi(superCls, icBalance(), 'Superávit/Déficit mes', APP.U.fmtMoneda(r.superavit_mes));
    html += '</div>';

    html += '<div class="panel-grid">';
    html += '<div class="panel"><h3>Gasto por categoría (mes actual)</h3><canvas id="ch-cat" height="220"></canvas></div>';
    html += '<div class="panel"><h3>Ingresos vs Egresos (últimos 6 meses)</h3><canvas id="ch-evol" height="220"></canvas></div>';
    html += '</div>';

    html += '<div class="panel-grid">';
    html += '<div class="panel"><h3>Presupuesto del mes</h3>'+renderPresupuesto(r.presupuesto_estado, cats)+'</div>';
    html += '<div class="panel"><h3>Top 5 gastos del mes</h3>'+renderTopGastos(r.top_gastos, cats)+'</div>';
    html += '</div>';

    if (r.metas && r.metas.length) {
      html += '<div class="panel"><h3>Progreso de metas</h3>'+renderMetas(r.metas)+'</div>';
    }

    cont.innerHTML = html;
    pintarChartCategoria(r.por_categoria, cats);
    pintarChartEvolucion(r.evolucion);
  }
};

function kpi(cls, ic, label, value){
  return `<div class="kpi ${cls}">
    <div class="ic">${ic}</div>
    <div class="label">${label}</div>
    <div class="value">${value}</div>
  </div>`;
}
function icSaldo(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>'; }
function icIngreso(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'; }
function icEgreso(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>'; }
function icBalance(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8 13 13.7l-4-4L3 16"/></svg>'; }

function renderPresupuesto(estado, cats){
  if (!estado || !estado.length) return '<div class="empty"><p>Sin presupuesto configurado</p></div>';
  return estado.map(e => {
    const nombre = APP.U.catNombre(e.categoria, cats);
    const pct = Math.min(100, e.pct_usado);
    const cls = e.pct_usado >= 100 ? 'rojo' : (e.pct_usado >= 80 ? 'ambar' : 'verde');
    return `<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:4px">
        <span><b>${APP.U.esc(nombre)}</b></span>
        <span style="color:var(--text-dim)">${APP.U.fmtMoneda(e.gastado)} / ${APP.U.fmtMoneda(e.limite)}</span>
      </div>
      <div style="background:var(--soft);border-radius:99px;height:8px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:var(--${cls==='rojo'?'red':cls==='ambar'?'amber':'green'})"></div>
      </div>
    </div>`;
  }).join('');
}

function renderTopGastos(top, cats){
  if (!top || !top.length) return '<div class="empty"><p>Sin gastos este mes</p></div>';
  let html = '<div class="tbl-wrap" style="box-shadow:none;border:none"><table class="tbl"><tbody>';
  top.forEach(t => {
    html += `<tr>
      <td>
        <div style="font-weight:600;font-size:.86rem">${APP.U.esc(t.motivo||'—')}</div>
        <div style="font-size:.74rem;color:var(--text-dim)">${APP.U.esc(APP.U.catNombre(t.categoria,cats))} · ${APP.U.fmtFecha(t.fecha)}</div>
      </td>
      <td style="text-align:right;font-weight:700;color:var(--red-text)">${APP.U.fmtMoneda(t.monto)}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  return html;
}

function renderMetas(metas){
  return '<div class="panel-grid">'+metas.map(m => {
    const cls = m.completada ? 'verde' : (m.pct >= 70 ? 'ambar' : 'azul');
    return `<div class="dg" style="padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <b style="font-size:.88rem">${APP.U.esc(m.nombre)}</b>
        <span class="badge ${m.completada?'reportada':'encurso'}">${m.completada?'Completada':m.pct+'%'}</span>
      </div>
      <div style="background:var(--soft);border-radius:99px;height:10px;overflow:hidden;margin-bottom:6px">
        <div style="width:${m.pct}%;height:100%;background:var(--${cls==='verde'?'green':cls==='ambar'?'amber':'blue'})"></div>
      </div>
      <div style="font-size:.78rem;color:var(--text-dim)">${APP.U.fmtMoneda(m.actual)} de ${APP.U.fmtMoneda(m.objetivo)} · vence ${APP.U.fmtFecha(m.fecha_limite)}</div>
    </div>`;
  }).join('')+'</div>';
}

function pintarChartCategoria(porCat, cats){
  const el = document.getElementById('ch-cat');
  if (!el) return;
  const keys = Object.keys(porCat||{});
  if (!keys.length) { el.parentElement.innerHTML = '<h3>Gasto por categoría (mes actual)</h3><div class="empty"><p>Sin gastos registrados este mes</p></div>'; return; }
  const labels = keys.map(k => APP.U.catNombre(k, cats));
  const colors = keys.map(k => APP.U.catColor(k, cats));
  const data = keys.map(k => porCat[k]);
  new Chart(el, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 11, font: { size: 11 } } } } }
  });
}

function pintarChartEvolucion(evol){
  const el = document.getElementById('ch-evol');
  if (!el) return;
  new Chart(el, {
    type: 'bar',
    data: {
      labels: evol.map(e=>e.mes),
      datasets: [
        { label:'Ingresos', data: evol.map(e=>e.ingresos), backgroundColor:'#16a34a', borderRadius:4 },
        { label:'Egresos', data: evol.map(e=>e.egresos), backgroundColor:'#ef4444', borderRadius:4 }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position:'bottom', labels:{boxWidth:11,font:{size:11}} } },
      scales: { y: { beginAtZero:true } }
    }
  });
}

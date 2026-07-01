/* =========================================================
   FINANZAS · Dashboard dinámico con filtros
   ========================================================= */
APP.Views = APP.Views || {};

let _dashCharts = [];
function _destruirCharts(){
  _dashCharts.forEach(c => { try { c.destroy(); } catch(e){} });
  _dashCharts = [];
}

APP.Views.dashboard = {
  title: 'Dashboard',
  render: async function(cont){
    APP.U.loader(true);
    const b = await APP.U.getBootstrap(true);
    APP.U.loader(false);
    if (!b.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(b.error)+'</p></div>'; return; }
    const cats = b.categorias;

    // Calcular rango por defecto: mes actual
    const hoy = new Date();
    const defDesde = hoy.getFullYear()+'-'+String(hoy.getMonth()+1).padStart(2,'0')+'-01';
    const defHasta = APP.U.fmtFechaInput(new Date(hoy.getFullYear(), hoy.getMonth()+1, 0));

    const catsEgreso = cats.filter(c => c.tipo === 'Egreso');
    const catsIngreso = cats.filter(c => c.tipo === 'Ingreso');

    cont.innerHTML = `
    <!-- FILTROS -->
    <div class="dash-filtros">
      <div class="df-group">
        <label>Desde</label>
        <input type="date" id="df-desde" value="${defDesde}">
      </div>
      <div class="df-group">
        <label>Hasta</label>
        <input type="date" id="df-hasta" value="${defHasta}">
      </div>
      <div class="df-group">
        <label>Tipo</label>
        <select id="df-tipo">
          <option value="">Todos</option>
          <option value="Ingreso">Solo ingresos</option>
          <option value="Egreso">Solo egresos</option>
        </select>
      </div>
      <div class="df-group">
        <label>Categoría</label>
        <select id="df-cat">
          <option value="">Todas</option>
          <optgroup label="Egresos">${catsEgreso.map(c=>`<option value="${APP.U.esc(c.codigo)}">${APP.U.esc(c.nombre)}</option>`).join('')}</optgroup>
          <optgroup label="Ingresos">${catsIngreso.map(c=>`<option value="${APP.U.esc(c.codigo)}">${APP.U.esc(c.nombre)}</option>`).join('')}</optgroup>
        </select>
      </div>
      <div class="df-group df-btns">
        <button class="btn" id="df-aplicar">Aplicar</button>
        <button class="btn sec" id="df-reset">Este mes</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid" id="dash-kpis"></div>

    <!-- GRAFICAS -->
    <div class="panel-grid">
      <div class="panel" id="panel-cat"><h3>Gasto por categoría</h3><canvas id="ch-cat" height="220"></canvas></div>
      <div class="panel"><h3 id="evol-titulo">Evolución por mes</h3><canvas id="ch-evol" height="220"></canvas></div>
    </div>

    <!-- PRESUPUESTO + TOP -->
    <div class="panel-grid">
      <div class="panel"><h3>Presupuesto del mes</h3><div id="dash-presup"></div></div>
      <div class="panel"><h3 id="top-titulo">Top 10 gastos</h3><div id="dash-top"></div></div>
    </div>

    <!-- METAS -->
    ${b.dashboard.metas && b.dashboard.metas.length ? '<div class="panel"><h3>Progreso de metas</h3><div id="dash-metas">'+renderMetas(b.dashboard.metas)+'</div></div>' : ''}
    `;

    async function aplicar(){
      const filtros = {
        desde: document.getElementById('df-desde').value,
        hasta: document.getElementById('df-hasta').value,
        tipo: document.getElementById('df-tipo').value,
        categoria: document.getElementById('df-cat').value
      };
      const btn = document.getElementById('df-aplicar');
      const orig = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
      const r = await APP.API.call('dashboard_filtrado', filtros);
      btn.disabled = false; btn.innerHTML = orig;
      if (!r.ok) { APP.U.toast(r.error,'error'); return; }
      renderDash(r, cats, filtros);
    }

    document.getElementById('df-aplicar').onclick = aplicar;
    document.getElementById('df-reset').onclick = () => {
      document.getElementById('df-desde').value = defDesde;
      document.getElementById('df-hasta').value = defHasta;
      document.getElementById('df-tipo').value = '';
      document.getElementById('df-cat').value = '';
      aplicar();
    };

    // Aplicar con datos del periodo actual al cargar
    const r0 = await APP.API.call('dashboard_filtrado', {desde: defDesde, hasta: defHasta});
    if (r0.ok) renderDash(r0, cats, {desde: defDesde, hasta: defHasta, tipo:'', categoria:''});
    else {
      // fallback: usar datos del bootstrap
      const r = b.dashboard;
      document.getElementById('dash-kpis').innerHTML =
        kpi('azul', icSaldo(), 'Saldo total', APP.U.fmtMoneda(r.saldo_actual)) +
        kpi('verde', icIngreso(), 'Ingresos', APP.U.fmtMoneda(r.ingresos_mes)) +
        kpi('rojo', icEgreso(), 'Egresos', APP.U.fmtMoneda(r.egresos_mes)) +
        kpi(r.superavit_mes>=0?'verde':'rojo', icBalance(), 'Superávit/Déficit', APP.U.fmtMoneda(r.superavit_mes));
    }
  }
};

function renderDash(r, cats, filtros){
  _destruirCharts();

  // KPIs
  const superCls = r.superavit >= 0 ? 'verde' : 'rojo';
  const tieneFiltro = filtros.tipo || filtros.categoria;
  document.getElementById('dash-kpis').innerHTML =
    kpi('verde', icIngreso(), 'Ingresos', APP.U.fmtMoneda(r.ingresos)) +
    kpi('rojo', icEgreso(), 'Egresos', APP.U.fmtMoneda(r.egresos)) +
    kpi(superCls, icBalance(), 'Superávit/Déficit', APP.U.fmtMoneda(r.superavit)) +
    kpi('azul', icMovs(), 'Movimientos', String(r.total_movimientos));

  // Gráfica categorías
  const panelCat = document.getElementById('panel-cat');
  const keys = Object.keys(r.por_categoria||{});
  if (!keys.length) {
    panelCat.innerHTML = '<h3>Gasto por categoría</h3><div class="empty"><p>Sin egresos en el período</p></div>';
  } else {
    panelCat.innerHTML = '<h3>Gasto por categoría</h3><canvas id="ch-cat" height="220"></canvas>';
    const ctx = document.getElementById('ch-cat');
    const labels = keys.map(k => APP.U.catNombre(k, cats));
    const colors = keys.map(k => APP.U.catColor(k, cats));
    const data = keys.map(k => r.por_categoria[k]);
    _dashCharts.push(new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: { maintainAspectRatio: false, plugins: { legend: { position:'bottom', labels:{boxWidth:11,font:{size:11}} } } }
    }));
  }

  // Gráfica evolución
  const evolEl = document.getElementById('ch-evol');
  if (evolEl && r.evolucion && r.evolucion.length) {
    _dashCharts.push(new Chart(evolEl, {
      type: 'bar',
      data: {
        labels: r.evolucion.map(e=>e.mes),
        datasets: [
          { label:'Ingresos', data: r.evolucion.map(e=>e.ingresos), backgroundColor:'#16a34a', borderRadius:4 },
          { label:'Egresos', data: r.evolucion.map(e=>e.egresos), backgroundColor:'#ef4444', borderRadius:4 }
        ]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend:{ position:'bottom', labels:{boxWidth:11,font:{size:11}} } },
        scales: { y:{ beginAtZero:true, ticks:{ callback: v => 'L.'+v.toLocaleString('es-HN') } } }
      }
    }));
  }

  // Presupuesto
  const presupEl = document.getElementById('dash-presup');
  if (presupEl) presupEl.innerHTML = r.presupuesto_estado && r.presupuesto_estado.length && !tieneFiltro
    ? renderPresupuesto(r.presupuesto_estado, cats)
    : '<div style="font-size:.84rem;color:var(--text-soft);padding:10px 0">El presupuesto aplica cuando no hay filtro de tipo o categoría.</div>';

  // Top gastos
  const topEl = document.getElementById('dash-top');
  if (topEl) topEl.innerHTML = renderTopGastos(r.top_gastos, cats);
}

function kpi(cls, ic, label, value){
  return `<div class="kpi ${cls}"><div class="ic">${ic}</div><div class="label">${label}</div><div class="value" style="font-size:1.5rem">${value}</div></div>`;
}
function icSaldo(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>'; }
function icIngreso(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'; }
function icEgreso(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>'; }
function icBalance(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8 13 13.7l-4-4L3 16"/></svg>'; }
function icMovs(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>'; }

function renderPresupuesto(estado, cats){
  if (!estado || !estado.length) return '<div class="empty"><p>Sin presupuesto configurado</p></div>';
  return estado.map(e => {
    const nombre = APP.U.catNombre(e.categoria, cats);
    const pct = Math.min(100, e.pct_usado);
    const cls = e.pct_usado >= 100 ? 'red' : (e.pct_usado >= 80 ? 'amber' : 'green');
    return `<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:4px">
        <span><b>${APP.U.esc(nombre)}</b></span>
        <span style="color:var(--text-dim)">${APP.U.fmtMoneda(e.gastado)} / ${APP.U.fmtMoneda(e.limite)}</span>
      </div>
      <div style="background:var(--soft);border-radius:99px;height:8px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:var(--${cls})"></div>
      </div>
    </div>`;
  }).join('');
}

function renderTopGastos(top, cats){
  if (!top || !top.length) return '<div class="empty"><p>Sin gastos en el período</p></div>';
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

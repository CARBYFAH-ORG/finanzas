/* =========================================================
   FINANZAS · Dashboard — rediseño estético v2
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
    if (!b.ok){ cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(b.error)+'</p></div>'; return; }
    const cats = b.categorias;

    const hoy      = new Date();
    const defDesde = hoy.getFullYear()+'-'+String(hoy.getMonth()+1).padStart(2,'0')+'-01';
    const defHasta = APP.U.fmtFechaInput(new Date(hoy.getFullYear(), hoy.getMonth()+1, 0));

    const catsEgreso  = cats.filter(c => c.tipo === 'Egreso');
    const catsIngreso = cats.filter(c => c.tipo === 'Ingreso');

    cont.innerHTML = `
    <style>
      .df-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;
              background:var(--card);border:1px solid var(--border);border-radius:14px;
              padding:14px 16px;margin-bottom:22px;box-shadow:var(--shadow)}
      .df-bar label{display:block;font-size:.72rem;font-weight:600;text-transform:uppercase;
                    letter-spacing:.05em;color:var(--text-dim);margin-bottom:5px}
      .df-bar input,.df-bar select{background:var(--soft);border:1px solid var(--border);
        border-radius:9px;padding:9px 12px;font-size:.86rem;color:var(--text);
        font-family:inherit;transition:.13s;width:100%}
      .df-bar input:focus,.df-bar select:focus{outline:none;border-color:var(--primary);
        box-shadow:0 0 0 3px var(--primary-soft)}
      .df-bar .df-g{flex:1;min-width:130px}
      .df-bar .df-btns{display:flex;gap:8px;align-items:flex-end}

      .kpi2-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
                 gap:14px;margin-bottom:20px}
      .kpi2{background:var(--card);border:1px solid var(--border);border-radius:14px;
            padding:18px 20px;box-shadow:var(--shadow);display:flex;align-items:center;
            gap:14px;transition:.18s}
      .kpi2:hover{box-shadow:var(--shadow-md);transform:translateY(-2px)}
      .kpi2 .k-ic{width:48px;height:48px;border-radius:13px;display:grid;
                  place-items:center;flex:none}
      .kpi2 .k-ic svg{width:22px;height:22px}
      .kpi2 .k-label{font-size:.71rem;font-weight:600;text-transform:uppercase;
                     letter-spacing:.05em;color:var(--text-dim);margin-bottom:3px}
      .kpi2 .k-val{font-size:1.42rem;font-weight:700;letter-spacing:-.02em;line-height:1.1}
      .kpi2 .k-sub{font-size:.72rem;color:var(--text-soft);margin-top:3px}

      .pg2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
      @media(max-width:760px){.pg2{grid-template-columns:1fr}}
      .p2{background:var(--card);border:1px solid var(--border);border-radius:14px;
          box-shadow:var(--shadow);overflow:hidden}
      .p2-head{display:flex;align-items:center;justify-content:space-between;
               padding:16px 18px 12px}
      .p2-head h3{font-size:.95rem;font-weight:700;margin:0}
      .p2-sub{font-size:.73rem;color:var(--text-soft)}
      .p2-body{padding:0 18px 16px}

      .presup-item{margin-bottom:13px}
      .presup-top{display:flex;justify-content:space-between;align-items:baseline;
                  margin-bottom:5px;gap:8px}
      .presup-name{font-size:.84rem;font-weight:600;white-space:nowrap;
                   overflow:hidden;text-overflow:ellipsis}
      .presup-montos{font-size:.74rem;color:var(--text-dim);white-space:nowrap;flex:none}
      .presup-bar-bg{background:var(--soft);border-radius:99px;height:8px;overflow:hidden}
      .presup-bar-fill{height:100%;border-radius:99px;transition:width .6s cubic-bezier(.4,0,.2,1)}
      .presup-footer{display:flex;justify-content:flex-end;margin-top:3px}
      .presup-pct{font-size:.7rem;font-weight:700}

      .top-item{display:flex;align-items:center;gap:11px;padding:8px 0;
                border-bottom:1px solid var(--border)}
      .top-item:last-child{border-bottom:none}
      .top-rank{width:24px;height:24px;border-radius:7px;background:var(--soft);
                display:grid;place-items:center;font-size:.71rem;font-weight:700;
                color:var(--text-dim);flex:none}
      .top-rank.r1{background:#fef3c7;color:#b45309}
      .top-rank.r2{background:#f1f5f9;color:#334155}
      .top-rank.r3{background:#fce7f3;color:#be185d}
      .top-info{flex:1;min-width:0}
      .top-motivo{font-size:.84rem;font-weight:600;white-space:nowrap;
                  overflow:hidden;text-overflow:ellipsis}
      .top-cat{font-size:.71rem;color:var(--text-dim);margin-top:1px}
      .top-monto{font-size:.9rem;font-weight:700;color:var(--red-text);white-space:nowrap}

      .metas-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
      .meta-card{background:var(--soft);border:1px solid var(--border);border-radius:12px;
                 padding:14px 16px}
      .meta-head{display:flex;justify-content:space-between;align-items:flex-start;
                 gap:8px;margin-bottom:10px}
      .meta-nombre{font-size:.87rem;font-weight:700;line-height:1.3}
      .meta-bdg{font-size:.68rem;font-weight:700;padding:3px 9px;border-radius:99px;
                white-space:nowrap;flex:none}
      .meta-bdg.ok{background:var(--green-soft);color:var(--green-text)}
      .meta-bdg.en{background:var(--primary-soft);color:var(--primary)}
      .meta-bar-bg{background:var(--border);border-radius:99px;height:8px;
                   overflow:hidden;margin-bottom:7px}
      .meta-bar-fill{height:100%;border-radius:99px;transition:width .6s cubic-bezier(.4,0,.2,1)}
      .meta-nums{display:flex;justify-content:space-between;font-size:.75rem;color:var(--text-dim)}
      .meta-vence{font-size:.71rem;color:var(--text-soft);margin-top:5px}
    </style>

    <!-- FILTROS -->
    <div class="df-bar">
      <div class="df-g"><label>Desde</label><input type="date" id="df-desde" value="${defDesde}"></div>
      <div class="df-g"><label>Hasta</label><input type="date" id="df-hasta" value="${defHasta}"></div>
      <div class="df-g"><label>Tipo</label>
        <select id="df-tipo">
          <option value="">Todos</option>
          <option value="Ingreso">Ingresos</option>
          <option value="Egreso">Egresos</option>
        </select>
      </div>
      <div class="df-g"><label>Categoría</label>
        <select id="df-cat">
          <option value="">Todas</option>
          <optgroup label="Egresos">${catsEgreso.map(c=>`<option value="${APP.U.esc(c.codigo)}">${APP.U.esc(c.nombre)}</option>`).join('')}</optgroup>
          <optgroup label="Ingresos">${catsIngreso.map(c=>`<option value="${APP.U.esc(c.codigo)}">${APP.U.esc(c.nombre)}</option>`).join('')}</optgroup>
        </select>
      </div>
      <div class="df-btns">
        <button class="btn btn-primary" id="df-aplicar">Aplicar</button>
        <button class="btn" id="df-reset">Este mes</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi2-grid" id="dash-kpis"></div>

    <!-- Gráficas -->
    <div class="pg2">
      <div class="p2" id="panel-cat">
        <div class="p2-head"><h3>Gasto por categoría</h3></div>
        <div class="p2-body"><canvas id="ch-cat" height="240"></canvas></div>
      </div>
      <div class="p2">
        <div class="p2-head"><h3>Evolución mensual</h3></div>
        <div class="p2-body"><canvas id="ch-evol" height="240"></canvas></div>
      </div>
    </div>

    <!-- Presupuesto + Top -->
    <div class="pg2">
      <div class="p2">
        <div class="p2-head">
          <h3>Presupuesto del mes</h3>
          <span class="p2-sub">por categoría con gasto</span>
        </div>
        <div class="p2-body" id="dash-presup"></div>
      </div>
      <div class="p2">
        <div class="p2-head"><h3>Top gastos del período</h3></div>
        <div class="p2-body" id="dash-top"></div>
      </div>
    </div>

    <!-- Metas -->
    <div id="dash-metas-wrap"></div>`;

    if (b.dashboard.metas && b.dashboard.metas.length){
      document.getElementById('dash-metas-wrap').innerHTML =
        `<div class="p2" style="margin-bottom:16px">
           <div class="p2-head"><h3>Metas de ahorro</h3></div>
           <div class="p2-body">${renderMetas(b.dashboard.metas)}</div>
         </div>`;
    }

    async function aplicar(){
      const filtros = {
        desde:     document.getElementById('df-desde').value,
        hasta:     document.getElementById('df-hasta').value,
        tipo:      document.getElementById('df-tipo').value,
        categoria: document.getElementById('df-cat').value
      };
      const btn  = document.getElementById('df-aplicar');
      const orig = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Cargando…';
      const r = await APP.API.call('dashboard_filtrado', filtros);
      btn.disabled = false; btn.innerHTML = orig;
      if (!r.ok){ APP.U.toast(r.error, 'error'); return; }
      renderDash(r, cats, filtros);
    }

    document.getElementById('df-aplicar').onclick = aplicar;
    document.getElementById('df-reset').onclick = () => {
      document.getElementById('df-desde').value = defDesde;
      document.getElementById('df-hasta').value = defHasta;
      document.getElementById('df-tipo').value  = '';
      document.getElementById('df-cat').value   = '';
      aplicar();
    };

    const r0 = await APP.API.call('dashboard_filtrado', { desde: defDesde, hasta: defHasta });
    if (r0.ok) renderDash(r0, cats, { desde: defDesde, hasta: defHasta, tipo:'', categoria:'' });
  }
};

// ═══════════════════════════════════════════════════════════
function renderDash(r, cats, filtros){
  _destruirCharts();
  const tieneFiltro = filtros.tipo || filtros.categoria;
  const sup         = r.superavit;

  // ── KPIs ──
  const kpis = [
    { label:'Ingresos',          val: APP.U.fmtMoneda(r.ingresos),  sub:'período seleccionado',
      bg:'#dcfce7', ic:'#16a34a', svg: svgIngreso() },
    { label:'Egresos',           val: APP.U.fmtMoneda(r.egresos),   sub:'período seleccionado',
      bg:'#fee2e2', ic:'#ef4444', svg: svgEgreso() },
    { label:'Superávit / Déficit', val: APP.U.fmtMoneda(sup),       sub: sup>=0?'Balance positivo':'Balance negativo',
      bg: sup>=0?'#dcfce7':'#fee2e2', ic: sup>=0?'#16a34a':'#ef4444', svg: svgBalance() },
    { label:'Movimientos',       val: String(r.total_movimientos),  sub:'en el período',
      bg:'#eef1ff', ic:'#465fff', svg: svgMovs() }
  ];
  document.getElementById('dash-kpis').innerHTML = kpis.map(k=>`
    <div class="kpi2">
      <div class="k-ic" style="background:${k.bg};color:${k.ic}">${k.svg}</div>
      <div>
        <div class="k-label">${k.label}</div>
        <div class="k-val" style="color:${k.ic}">${k.val}</div>
        <div class="k-sub">${k.sub}</div>
      </div>
    </div>`).join('');

  // ── Categorías (donut) ──
  const panelCat = document.getElementById('panel-cat');
  const keys = Object.keys(r.por_categoria||{}).sort((a,b)=>r.por_categoria[b]-r.por_categoria[a]);
  if (!keys.length){
    panelCat.innerHTML = `<div class="p2-head"><h3>Gasto por categoría</h3></div>
      <div class="p2-body"><div class="empty"><p>Sin egresos en el período</p></div></div>`;
  } else {
    panelCat.innerHTML = `<div class="p2-head"><h3>Gasto por categoría</h3></div>
      <div class="p2-body"><canvas id="ch-cat" height="240"></canvas></div>`;
    _dashCharts.push(new Chart(document.getElementById('ch-cat'), {
      type:'doughnut',
      data:{ labels: keys.map(k=>APP.U.catNombre(k,cats)),
             datasets:[{ data: keys.map(k=>r.por_categoria[k]),
               backgroundColor: keys.map(k=>APP.U.catColor(k,cats)),
               borderWidth:3, borderColor:'#fff', hoverOffset:10 }] },
      options:{ maintainAspectRatio:false, cutout:'65%',
        plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, padding:12, font:{size:11} } },
          tooltip:{ callbacks:{ label: c=>' '+APP.U.fmtMoneda(c.raw) } } } }
    }));
  }

  // ── Evolución (barras) ──
  const evolEl = document.getElementById('ch-evol');
  if (evolEl && r.evolucion && r.evolucion.length){
    _dashCharts.push(new Chart(evolEl, {
      type:'bar',
      data:{ labels: r.evolucion.map(e=>e.mes),
        datasets:[
          { label:'Ingresos', data: r.evolucion.map(e=>e.ingresos),
            backgroundColor:'rgba(22,163,74,.8)', borderRadius:5, borderSkipped:false },
          { label:'Egresos',  data: r.evolucion.map(e=>e.egresos),
            backgroundColor:'rgba(239,68,68,.8)',  borderRadius:5, borderSkipped:false }
        ] },
      options:{ maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom', labels:{ boxWidth:11, padding:14, font:{size:11} } },
          tooltip:{ callbacks:{ label: c=>' '+APP.U.fmtMoneda(c.raw) } } },
        scales:{
          x:{ grid:{display:false}, ticks:{font:{size:11}} },
          y:{ beginAtZero:true, grid:{color:'rgba(0,0,0,.04)'},
              ticks:{ callback: v=>'L.'+Number(v).toLocaleString('es-HN'), font:{size:11} } }
        } }
    }));
  }

  // ── Presupuesto ──
  const presupEl = document.getElementById('dash-presup');
  if (presupEl) presupEl.innerHTML = (r.presupuesto_estado && r.presupuesto_estado.length && !tieneFiltro)
    ? renderPresupuesto(r.presupuesto_estado, cats)
    : '<p style="font-size:.82rem;color:var(--text-soft);padding:4px 0">Disponible sin filtro de tipo o categoría.</p>';

  // ── Top ──
  const topEl = document.getElementById('dash-top');
  if (topEl) topEl.innerHTML = renderTopGastos(r.top_gastos, cats);
}

// ── Presupuesto — solo con gasto, ordenado por % usado desc ──
function renderPresupuesto(estado, cats){
  if (!estado || !estado.length) return '<p style="font-size:.84rem;color:var(--text-soft)">Sin presupuesto configurado.</p>';
  const activos = estado.filter(e=>e.gastado>0).sort((a,b)=>b.pct_usado-a.pct_usado);
  if (!activos.length) return '<p style="font-size:.84rem;color:var(--text-soft)">Sin gastos registrados este mes.</p>';
  return activos.map(e=>{
    const pct   = Math.min(100, e.pct_usado);
    const color = e.pct_usado>=100?'var(--red)':e.pct_usado>=80?'var(--amber)':'var(--green)';
    const tcolor= e.pct_usado>=100?'var(--red-text)':e.pct_usado>=80?'var(--amber-text)':'var(--green-text)';
    return `<div class="presup-item">
      <div class="presup-top">
        <span class="presup-name">${APP.U.esc(APP.U.catNombre(e.categoria,cats))}</span>
        <span class="presup-montos">${APP.U.fmtMoneda(e.gastado)} <span style="color:var(--text-soft)">/ ${APP.U.fmtMoneda(e.limite)}</span></span>
      </div>
      <div class="presup-bar-bg"><div class="presup-bar-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="presup-footer"><span class="presup-pct" style="color:${tcolor}">${e.pct_usado}%${e.pct_usado>=100?' · LÍMITE SUPERADO':''}</span></div>
    </div>`;
  }).join('');
}

// ── Top gastos con medallas ──
function renderTopGastos(top, cats){
  if (!top || !top.length) return '<div class="empty"><p>Sin gastos en el período</p></div>';
  return top.slice(0,10).map((t,i)=>`
    <div class="top-item">
      <div class="top-rank ${i===0?'r1':i===1?'r2':i===2?'r3':''}">${i+1}</div>
      <div class="top-info">
        <div class="top-motivo">${APP.U.esc(t.motivo||'—')}</div>
        <div class="top-cat">${APP.U.esc(APP.U.catNombre(t.categoria,cats))} · ${APP.U.fmtFecha(t.fecha)}</div>
      </div>
      <div class="top-monto">${APP.U.fmtMoneda(t.monto)}</div>
    </div>`).join('');
}

// ── Metas ──
function renderMetas(metas){
  return '<div class="metas-grid">'+metas.map(m=>{
    const color = m.completada?'#16a34a':m.pct>=70?'#f59e0b':'#465fff';
    return `<div class="meta-card">
      <div class="meta-head">
        <div class="meta-nombre">${APP.U.esc(m.nombre)}</div>
        <span class="meta-bdg ${m.completada?'ok':'en'}">${m.completada?'Completada':m.pct+'%'}</span>
      </div>
      <div class="meta-bar-bg">
        <div class="meta-bar-fill" style="width:${Math.min(100,m.pct)}%;background:${color}"></div>
      </div>
      <div class="meta-nums">
        <span>${APP.U.fmtMoneda(m.actual)}</span>
        <span>${APP.U.fmtMoneda(m.objetivo)}</span>
      </div>
      <div class="meta-vence">vence ${APP.U.fmtFecha(m.fecha_limite)}</div>
    </div>`;
  }).join('')+'</div>';
}

// ── Íconos ──
function svgIngreso(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'; }
function svgEgreso() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>'; }
function svgBalance(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 3v18h18"/><path d="M18.7 8 13 13.7l-4-4L3 16"/></svg>'; }
function svgMovs()   { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor"/></svg>'; }

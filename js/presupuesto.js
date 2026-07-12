/* =========================================================
   FINANZAS · Presupuesto (% ↔ L. conversión bidireccional)
   ========================================================= */
APP.Views.presupuesto = {
  title: 'Presupuesto',
  render: async function(cont){
    APP.U.loader(true);
    const b = await APP.U.getBootstrap();
    APP.U.loader(false);
    if (!b.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(b.error)+'</p></div>'; return; }

    const presup      = b.presupuesto;
    const cats        = b.categorias;
    const catsEgreso  = cats.filter(c => c.tipo === 'Egreso');
    const ingresosMes = Number(b.dashboard.ingresos_mes) || 0;

    cont.innerHTML = `
      <div class="panel">
        <h3>Presupuesto por categoría</h3>
        <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:8px;line-height:1.5">
          Ingresa el porcentaje <strong>o</strong> el monto en lempiras — el sistema convierte
          automáticamente. Base de cálculo: ingresos reales del mes.
        </p>
        <div style="background:var(--soft);border:1px solid var(--border);border-radius:9px;
                    padding:10px 14px;margin-bottom:18px;display:flex;
                    justify-content:space-between;align-items:center">
          <span style="font-size:.8rem;color:var(--text-dim)">Ingresos de este mes</span>
          <span style="font-weight:700;font-size:1rem">${APP.U.fmtMoneda(ingresosMes)}</span>
        </div>

        <!-- cabecera columnas -->
        <div style="display:grid;grid-template-columns:16px 1fr 110px 90px 90px;
                    gap:10px;align-items:center;padding:0 2px 6px;
                    border-bottom:1px solid var(--border);margin-bottom:10px">
          <span></span>
          <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim)">Categoría</span>
          <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim);text-align:right">Monto (L.)</span>
          <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim);text-align:right">%</span>
          <span></span>
        </div>

        <div id="presup-list"></div>

        <div style="display:flex;justify-content:space-between;align-items:center;
                    margin-top:14px;padding-top:14px;border-top:2px solid var(--border)">
          <div style="display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;gap:20px;align-items:baseline;flex-wrap:wrap">
              <b id="presup-total" style="font-size:.95rem"></b>
              <span id="presup-libre-pct" style="font-size:.88rem;color:var(--text-dim)"></span>
            </div>
            <div style="display:flex;gap:20px;align-items:baseline;flex-wrap:wrap">
              <span id="presup-total-monto" style="font-size:.78rem;color:var(--text-dim)"></span>
              <span id="presup-libre-mon"   style="font-size:.78rem;color:var(--text-dim)"></span>
            </div>
          </div>
          <button class="btn" id="presup-guardar">Guardar presupuesto</button>
        </div>
      </div>`;

    // ── Filas ──────────────────────────────────────────────
    const list = document.getElementById('presup-list');
    list.innerHTML = catsEgreso.map(c => {
      const p   = presup.find(x => x.categoria === c.codigo);
      const pct = p ? Number(p.porcentaje) : 0;
      const mon = ingresosMes > 0 ? ingresosMes * pct / 100 : 0;
      return `
        <div style="display:grid;grid-template-columns:16px 1fr 110px 90px 14px;
                    gap:10px;align-items:center;padding:9px 2px;
                    border-bottom:1px solid var(--border)">
          <span style="width:10px;height:10px;border-radius:50%;
                       background:${APP.U.esc(c.color)};display:block"></span>
          <span style="font-size:.88rem">${APP.U.esc(c.nombre)}</span>

          <!-- Monto L. -->
          <input type="number" min="0" step="0.01" inputmode="decimal"
                 data-cat="${APP.U.esc(c.codigo)}" data-role="monto"
                 value="${mon > 0 ? mon.toFixed(2) : ''}"
                 placeholder="0.00"
                 style="text-align:right;background:var(--soft);border:1px solid var(--border);
                        border-radius:var(--radius-sm);padding:8px 10px;font-size:.88rem;width:100%">

          <!-- Porcentaje % -->
          <input type="number" min="0" max="100" step="0.1" inputmode="decimal"
                 data-cat="${APP.U.esc(c.codigo)}" data-role="pct"
                 value="${pct > 0 ? pct : ''}"
                 placeholder="0"
                 style="text-align:right;background:var(--soft);border:1px solid var(--border);
                        border-radius:var(--radius-sm);padding:8px 10px;font-size:.88rem;width:100%">

          <span style="font-size:.82rem;color:var(--text-dim)">%</span>
        </div>`;
    }).join('');

    // Agrega borde superior al contenedor de filas
    list.style.borderTop = '1px solid var(--border)';

    // ── Conversión bidireccional ───────────────────────────
    function pctToMonto(pct){ return ingresosMes > 0 ? ingresosMes * pct / 100 : 0; }
    function montoToPct(mon){ return ingresosMes > 0 ? mon / ingresosMes * 100  : 0; }

    function fmtPct(v){
      const n = Number(v);
      if (!n) return '';
      // 6 decimales para que la vuelta monto→%→monto no derive
      return parseFloat(n.toFixed(6)).toString();
    }
    function fmtMon(v){
      const n = Number(v);
      return n > 0 ? n.toFixed(2) : '';
    }

    // Actualiza totales en el pie
    function actualizarTotales(){
      let sumPct = 0, sumMon = 0;
      document.querySelectorAll('[data-role="pct"]').forEach(i => {
        sumPct += Number(i.value) || 0;
        sumMon += pctToMonto(Number(i.value) || 0);
      });
      const librePct = Math.max(0, 100 - sumPct);
      const libreMon = Math.max(0, ingresosMes - sumMon);

      const elT  = document.getElementById('presup-total');
      const elM  = document.getElementById('presup-total-monto');
      const elLP = document.getElementById('presup-libre-pct');
      const elLM = document.getElementById('presup-libre-mon');

      elT.textContent = 'Total asignado: ' + sumPct.toFixed(2) + '%';
      elT.style.color  = sumPct > 100 ? 'var(--red-text)'
                       : sumPct < 100 ? 'var(--amber-text)'
                       : 'var(--green-text)';

      elM.textContent = 'Equivale a ' + APP.U.fmtMoneda(sumMon)
                      + ' de ' + APP.U.fmtMoneda(ingresosMes);

      elLP.textContent = '· Libres: ' + librePct.toFixed(2) + '%';
      elLP.style.color  = librePct > 0 ? 'var(--green-text)' : 'var(--text-dim)';

      elLM.textContent = libreMon > 0
        ? '· Libres: ' + APP.U.fmtMoneda(libreMon)
        : '';
    }

    // Cuando cambia el campo de MONTO → actualiza %
    list.querySelectorAll('[data-role="monto"]').forEach(inputMon => {
      inputMon.addEventListener('input', () => {
        const cat    = inputMon.dataset.cat;
        const inputP = list.querySelector(`[data-cat="${cat}"][data-role="pct"]`);
        const mon    = parseFloat(inputMon.value);
        if (!isNaN(mon) && mon >= 0) {
          inputP._fromSibling = true;
          inputP.value = fmtPct(montoToPct(mon));
          delete inputP._fromSibling;
        }
        actualizarTotales();
      });
    });

    // Cuando cambia el campo de % → actualiza monto
    list.querySelectorAll('[data-role="pct"]').forEach(inputP => {
      inputP.addEventListener('input', () => {
        if (inputP._fromSibling) return;
        const cat      = inputP.dataset.cat;
        const inputMon = list.querySelector(`[data-cat="${cat}"][data-role="monto"]`);
        const pct      = parseFloat(inputP.value);
        if (!isNaN(pct) && pct >= 0) {
          inputMon.value = fmtMon(pctToMonto(pct));
        }
        actualizarTotales();
      });
    });

    actualizarTotales();

    // ── Guardar ────────────────────────────────────────────
    document.getElementById('presup-guardar').onclick = async function(){
      // Usamos el % como valor canónico (es lo que ya guardaba el backend)
      const items = [];
      list.querySelectorAll('[data-role="pct"]').forEach(i => {
        items.push({ categoria: i.dataset.cat, porcentaje: Number(i.value) || 0 });
      });
      const orig = this.innerHTML;
      this.disabled = true;
      this.innerHTML = '<span class="spinner"></span> Guardando…';
      const r = await APP.API.call('guardar_presupuesto', { items });
      this.disabled = false;
      this.innerHTML = orig;
      if (!r.ok){ APP.U.toast(r.error, 'error'); return; }
      APP.U.invalidarBootstrap();
      APP.U.toast('Presupuesto actualizado', 'success');
    };
  }
};

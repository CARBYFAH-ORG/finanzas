/* =========================================================
   FINANZAS · Sueldo (config deducciones + registrar pago)
   ========================================================= */
APP.Views.sueldo = {
  title: 'Sueldo',
  render: async function(cont){
    APP.U.loader(true);
    const [cfgR, calcR, cuentas] = await Promise.all([
      APP.API.call('obtener_config_sueldo'),
      APP.API.call('calcular_sueldo_neto'),
      APP.U.getCuentas()
    ]);
    APP.U.loader(false);
    if (!cfgR.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(cfgR.error)+'</p></div>'; return; }
    const cfg = cfgR.config;
    const calc = calcR.calculo;

    let html = `
    <div class="panel-grid">
      <div class="panel">
        <h3>Configuración de deducciones</h3>
        <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:14px">
          Configura una vez tu sueldo nominal y los porcentajes/montos de deducción fijos.
          El sistema calcula tu sueldo neto automáticamente cada vez.
        </p>
        <label>Sueldo nominal (L.)</label>
        <input type="number" step="0.01" id="cf-nominal" value="${cfg.sueldo_nominal||0}">
        <div class="row2">
          <div><label>Hospital Militar (%)</label><input type="number" step="0.01" id="cf-hosp" value="${cfg.pct_hospital_militar||0}"></div>
          <div><label>IPM Cotización (%)</label><input type="number" step="0.01" id="cf-ipm" value="${cfg.pct_ipm||0}"></div>
        </div>
        <div class="row2">
          <div><label>FHEMA (L.)</label><input type="number" step="0.01" id="cf-fhema" value="${cfg.fhema||0}"></div>
          <div><label>Préstamo IPM (L.)</label><input type="number" step="0.01" id="cf-prest" value="${cfg.prestamo_ipm||0}"></div>
        </div>
        <label>ISR del mes (L.) <span style="font-weight:400;color:var(--text-soft)">— este suele variar, ajústalo cada mes</span></label>
        <input type="number" step="0.01" id="cf-isr" value="${cfg.isr||0}">
        <button class="btn" id="cf-guardar" style="margin-top:14px">Guardar configuración</button>
      </div>

      <div class="panel">
        <h3>Cálculo del sueldo neto</h3>
        <div id="calc-result"></div>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
          <label>Cuenta de depósito</label>
          <select id="pg-cuenta">${cuentas.map(c=>`<option value="${APP.U.esc(c.codigo)}">${APP.U.esc(c.nombre)}</option>`).join('')}</select>
          <label>Mes (referencia)</label>
          <input id="pg-mes" placeholder="Ej: Julio 2026">
          <button class="btn success" id="pg-registrar" style="margin-top:10px;width:100%">Registrar pago de planilla de este mes</button>
        </div>
      </div>
    </div>`;
    cont.innerHTML = html;
    pintarCalculo(calc);

    document.getElementById('cf-guardar').onclick = async function(){
      const data = {
        sueldo_nominal: document.getElementById('cf-nominal').value,
        pct_hospital_militar: document.getElementById('cf-hosp').value,
        pct_ipm: document.getElementById('cf-ipm').value,
        fhema: document.getElementById('cf-fhema').value,
        prestamo_ipm: document.getElementById('cf-prest').value,
        isr: document.getElementById('cf-isr').value
      };
      const original = this.innerHTML;
      this.disabled = true; this.innerHTML = '<span class="spinner"></span> Guardando…';
      const r = await APP.API.call('guardar_config_sueldo', data);
      if (!r.ok) { APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=original; return; }
      this.disabled = false; this.innerHTML = original;
      APP.U.toast('Configuración guardada','success');
      const c2 = await APP.API.call('calcular_sueldo_neto');
      if (c2.ok) pintarCalculo(c2.calculo);
    };

    document.getElementById('pg-registrar').onclick = async function(){
      if (!APP.U.confirmar('¿Registrar el ingreso de planilla de este mes por '+APP.U.fmtMoneda(calc.neto)+'?')) return;
      const original = this.innerHTML;
      this.disabled = true; this.innerHTML = '<span class="spinner"></span> Registrando…';
      const r = await APP.API.call('registrar_pago_planilla', {
        cuenta: document.getElementById('pg-cuenta').value,
        mes: document.getElementById('pg-mes').value.trim()
      });
      if (!r.ok) { APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=original; return; }
      this.disabled = false; this.innerHTML = original;
      APP.U.toast('Pago de planilla registrado: '+APP.U.fmtMoneda(r.calculo.neto),'success');
    };
  }
};

function pintarCalculo(calc){
  const el = document.getElementById('calc-result');
  if (!el || !calc) return;
  el.innerHTML = `
    <div class="dg" style="margin-bottom:6px"><span class="l">Sueldo nominal</span><span class="v">${APP.U.fmtMoneda(calc.nominal)}</span></div>
    <div style="font-size:.82rem;color:var(--text-dim);margin:10px 0 4px;font-weight:600">Deducciones</div>
    <table style="width:100%;font-size:.86rem;border-collapse:collapse">
      <tr><td style="padding:4px 0">Hospital Militar</td><td style="text-align:right;color:var(--red-text)">-${APP.U.fmtMoneda(calc.dHospital)}</td></tr>
      <tr><td style="padding:4px 0">IPM Cotización</td><td style="text-align:right;color:var(--red-text)">-${APP.U.fmtMoneda(calc.dIPM)}</td></tr>
      <tr><td style="padding:4px 0">FHEMA</td><td style="text-align:right;color:var(--red-text)">-${APP.U.fmtMoneda(calc.dFhema)}</td></tr>
      <tr><td style="padding:4px 0">Préstamo IPM</td><td style="text-align:right;color:var(--red-text)">-${APP.U.fmtMoneda(calc.dPrestamo)}</td></tr>
      <tr><td style="padding:4px 0">ISR</td><td style="text-align:right;color:var(--red-text)">-${APP.U.fmtMoneda(calc.dIsr)}</td></tr>
      <tr style="border-top:1px solid var(--border)"><td style="padding:8px 0;font-weight:700">Total deducciones</td><td style="text-align:right;font-weight:700;color:var(--red-text)">-${APP.U.fmtMoneda(calc.totalDeducciones)}</td></tr>
    </table>
    <div style="background:var(--green-soft);border:1px solid #86efac;border-radius:9px;padding:14px;margin-top:12px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:600;color:var(--green-text)">Sueldo neto</span>
      <span style="font-size:1.3rem;font-weight:700;color:var(--green-text)">${APP.U.fmtMoneda(calc.neto)}</span>
    </div>
  `;
}

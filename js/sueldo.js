/* =========================================================
   FINANZAS · Sueldo (config deducciones + registrar pago)
   ========================================================= */
APP.Views.sueldo = {
  title: 'Sueldo',
  render: async function(cont){
    APP.U.loader(true);
    const cfgR = await APP.API.call('obtener_config_sueldo');
    const calcR = await APP.API.call('calcular_sueldo_neto');
    const cuentas = await APP.U.getCuentas();
    APP.U.loader(false);
    if (!cfgR.ok) { cont.innerHTML = '<div class="empty"><p>'+APP.U.esc(cfgR.error)+'</p></div>'; return; }
    const cfg = cfgR.config;
    const calc = calcR.calculo;

    let html = `
    <div class="panel-grid">
      <div class="panel form">
        <h3>Configuración de deducciones</h3>
        <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:18px;line-height:1.5">
          Configura una vez tu sueldo nominal y los porcentajes o montos de deducción.
          El sistema calcula tu sueldo neto automáticamente cada vez.
        </p>

        <div class="fgroup">
          <label>Sueldo nominal</label>
          <input type="number" step="0.01" id="cf-nominal" value="${cfg.sueldo_nominal||0}">
        </div>

        <div class="fgroup row2">
          <div>
            <label>Hospital Militar (%)</label>
            <input type="number" step="0.01" id="cf-hosp" value="${cfg.pct_hospital_militar||0}">
          </div>
          <div>
            <label>IPM cotización (%)</label>
            <input type="number" step="0.01" id="cf-ipm" value="${cfg.pct_ipm||0}">
          </div>
        </div>

        <div class="fgroup row2">
          <div>
            <label>FHEMA (L.)</label>
            <input type="number" step="0.01" id="cf-fhema" value="${cfg.fhema||0}">
          </div>
          <div>
            <label>Préstamo IPM (L.)</label>
            <input type="number" step="0.01" id="cf-prest" value="${cfg.prestamo_ipm||0}">
          </div>
        </div>

        <div class="fgroup">
          <label>ISR del mes<span class="hint" style="text-transform:none;display:inline;font-weight:400;margin-left:6px;letter-spacing:0">— suele variar, ajústalo cada mes</span></label>
          <input type="number" step="0.01" id="cf-isr" value="${cfg.isr||0}">
        </div>

        <button class="btn" id="cf-guardar" style="width:100%;justify-content:center">Guardar configuración</button>
      </div>

      <div class="panel">
        <h3>Recibo de sueldo</h3>
        <div id="calc-result"></div>

        <div class="form" style="margin-top:20px;padding-top:18px;border-top:1px solid var(--border)">
          <div class="fgroup row2">
            <div>
              <label>Cuenta de depósito</label>
              <select id="pg-cuenta">${cuentas.map(c=>`<option value="${APP.U.esc(c.codigo)}">${APP.U.esc(c.nombre)}</option>`).join('')}</select>
            </div>
            <div>
              <label>Mes (referencia)</label>
              <input id="pg-mes" placeholder="Julio 2026">
            </div>
          </div>
          <button class="btn success" id="pg-registrar" style="width:100%;justify-content:center">Registrar pago de planilla de este mes</button>
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

  const deducciones = [
    {label:'Hospital Militar', monto:calc.dHospital},
    {label:'IPM cotización', monto:calc.dIPM},
    {label:'FHEMA', monto:calc.dFhema},
    {label:'Préstamo IPM', monto:calc.dPrestamo},
    {label:'ISR', monto:calc.dIsr}
  ];
  const maxDeduccion = Math.max(...deducciones.map(d=>d.monto), 1);

  el.innerHTML = `
    <div class="payslip-line">
      <span class="pl-label" style="font-weight:600;color:var(--text)">Sueldo nominal</span>
      <span class="pl-amount" style="color:var(--text)">${APP.U.fmtMoneda(calc.nominal)}</span>
    </div>
    ${deducciones.map(d => `
      <div class="payslip-line">
        <span class="pl-label">
          <span class="pl-bar"><i style="width:${Math.round((d.monto/maxDeduccion)*100)}%"></i></span>
          ${APP.U.esc(d.label)}
        </span>
        <span class="pl-amount">-${APP.U.fmtMoneda(d.monto)}</span>
      </div>`).join('')}
    <div class="payslip-total">
      <span>Total deducciones</span>
      <span style="color:var(--red-text)">-${APP.U.fmtMoneda(calc.totalDeducciones)}</span>
    </div>
    <div class="payslip-net">
      <span class="pn-label">Sueldo neto</span>
      <span class="pn-amount">${APP.U.fmtMoneda(calc.neto)}</span>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
    const calcDataJSON = localStorage.getItem("anchorCalcData");
    if (!calcDataJSON) {
        document.getElementById("detailed-calcs-content").innerHTML = `<p class="note">No calculation data found. Please run a calculation on the main page first.</p>`;
        return;
    }

    try {
        const { inputs, results } = JSON.parse(calcDataJSON);
        const reportHTML = renderDetailedCalculations(inputs, results);
        document.getElementById("detailed-calcs-content").innerHTML = reportHTML;
    } catch (e) {
        console.error("Failed to parse or render calculation data:", e);
        document.getElementById("detailed-calcs-content").innerHTML = `<p class="note" style="color:var(--red);">Error: Could not load calculation data. It may be corrupt.</p>`;
    }
});

function renderDetailedCalculations(inputs, results) {
    const bd = results.breakdown;
    const f = (val, dec = 1) => (isFinite(val) ? val.toFixed(dec) : "N/A");

    if (Object.keys(bd).length === 0) {
        return `<p class="note" style="text-align: center; margin-top: 40px;">No calculations to display.</p>`;
    }

    const step = ({ title, ref, formula, vars, result }) => `
        <div class="calc-step ${result.final ? 'final-calc' : ''}">
            <div class="title">${title}<span class="ref">${ref || ''}</span></div>
            <div class="formula">${formula}</div>
            <div class="vars">${vars}</div>
            <div class="result">${result.text}: <span class="val ${result.passFail}">${result.val}</span> ${result.unit || ''}</div>
        </div>
    `;

    // TENSION
    let tensionHTML = '<h3>Tension Capacity (&phi;N<sub>n</sub>)</h3>';
    if (inputs.n_tension > 0) {
        tensionHTML += step({
            title: '1. Steel Strength of Anchor', ref: '17.6.1.2',
            formula: 'N<sub>sa</sub> = n &times; A<sub>se,N</sub> &times; f<sub>uta</sub>',
            vars: `n=${bd.Nsa.n_tension}, A_se,N=${bd.Nsa.ase.toFixed(3)} in², f_uta=${bd.Nsa.futa} ksi`,
            result: { text: '&phi;N<sub>sa</sub> = &phi; &times; N<sub>sa</sub>', val: f(bd.Nsa.phi_Nsa), unit: 'kips' }
        });
        tensionHTML += step({
            title: '2. Concrete Breakout Strength', ref: '17.6.2.1',
            formula: 'N<sub>cb</sub> = (A<sub>Nc</sub>/A<sub>Nco</sub>) &Psi;<sub>ec,N</sub>&Psi;<sub>ed,N</sub>&Psi;<sub>c,N</sub>&Psi;<sub>cp,N</sub>N<sub>b</sub>',
            vars: `A_Nc=${f(bd.Ncb.anc_value,0)} in², A_Nco=${f(bd.Ncb.Anco,0)} in², &Psi;ec,N=${f(bd.Ncb.psi_ec_N,2)}, &Psi;ed,N=${f(bd.Ncb.psi_ed_N,2)}, N_b=${f(bd.Ncb.Nb,1)} kips`,
            result: { text: '&phi;N<sub>cb</sub> = &phi; &times; N<sub>cb</sub> &times; F<sub>seismic</sub>', val: f(bd.Ncb.phi_Ncb), unit: 'kips' }
        });
        let pulloutVars = `A_brg=${f(bd.Npn.abrg,2)} in², f'c=${f(inputs.f_c,0)} psi, n=${bd.Npn.n_tension}`;
        if (inputs.consider_plate === 'Yes') {
            pulloutVars += `<br>(Plate A_brg: d_gross=${f(bd.Npn.plate_calcs.d_plate_gross,2)}")`
        } else { pulloutVars += `<br>(Standard A_brg)` }
        tensionHTML += step({
            title: '3. Pullout Strength', ref: '17.6.3.1',
            formula: 'N<sub>pn</sub> = n &times; &Psi;<sub>c,P</sub> &times; 8 &times; A<sub>brg</sub> &times; f\'<sub>c</sub>',
            vars: pulloutVars,
            result: { text: '&phi;N<sub>pn</sub> = &phi; &times; N<sub>pn</sub> &times; F<sub>seismic</sub>', val: f(bd.Npn.phi_Npn), unit: 'kips' }
        });
        if (bd.Nsb.Nsb_applies) {
             tensionHTML += step({
                title: '4. Side-Face Blowout Strength', ref: '17.6.4.1',
                formula: 'N<sub>sb</sub> = n &times; 160c<sub>a1</sub> &radic;(A<sub>brg</sub>) &radic;(f\'<sub>c</sub>)',
                vars: `c_a1=${f(bd.Nsb.ca1_t, 2)} in, A_brg=${f(bd.Nsb.abrg,2)} in²`,
                result: { text: '&phi;N<sub>sb</sub> = &phi; &times; N<sub>sb</sub> &times; F<sub>seismic</sub>', val: f(bd.Nsb.phi_Nsb), unit: 'kips' }
            });
        } else {
             tensionHTML += `<div class="calc-step"><div class="title">4. Side-Face Blowout Strength</div><div class="result">N/A (h<sub>ef</sub> &le; 2.5c<sub>a1</sub>)</div></div>`;
        }
        tensionHTML += step({
            title: 'Governing Tension Capacity',
            formula: '&phi;N<sub>n</sub> = min(&phi;N<sub>sa</sub>, &phi;N<sub>cb</sub>, &phi;N<sub>pn</sub>, &phi;N<sub>sb</sub>)',
            vars: `Governing failure mode: ${bd.gov_N.gov_conc_mode_N}`,
            result: { final: true, text: '&phi;N<sub>n</sub>', val: f(bd.gov_N.phiNn), unit: 'kips' }
        });
    } else { tensionHTML += `<p class="note">No anchors in tension.</p>`; }

    // SHEAR
    let shearHTML = '<h3>Shear Capacity (&phi;V<sub>n</sub>)</h3>';
     if (inputs.n_shear > 0) {
        shearHTML += step({
            title: '1. Steel Strength of Anchor', ref: '17.7.1.2',
            formula: 'V<sub>sa</sub> = n &times; 0.6 &times; A<sub>se,N</sub> &times; f<sub>uta</sub> &times; F<sub>grout</sub>',
            vars: `n=${bd.Vsa.n_shear}, A_se,N=${bd.Vsa.ase.toFixed(3)} in², f_uta=${bd.Vsa.futa} ksi, F_grout=${bd.Vsa.grout_factor}`,
            result: { text: '&phi;V<sub>sa</sub> = &phi; &times; V<sub>sa</sub>', val: f(bd.Vsa.phi_Vsa), unit: 'kips' }
        });
        shearHTML += step({
            title: '2. Concrete Breakout Strength', ref: '17.7.2.1',
            formula: 'V<sub>cb</sub> = (A<sub>Vc</sub>/A<sub>Vco</sub>) &Psi;<sub>ec,V</sub>&Psi;<sub>ed,V</sub>&Psi;<sub>c,V</sub>&Psi;<sub>h,V</sub>V<sub>b</sub>',
            vars: `A_Vc=${f(bd.Vcb.avc_value,0)} in², A_Vco=${f(bd.Vcb.Avco,0)} in², &Psi;ec,V=${f(bd.Vcb.psi_ec_V,2)}, &Psi;ed,V=${f(bd.Vcb.psi_ed_V,2)}, V_b=${f(bd.Vcb.Vb,1)} kips`,
            result: { text: '&phi;V<sub>cb</sub> = &phi; &times; V<sub>cb</sub>', val: f(bd.Vcb.phi_Vcb), unit: 'kips' }
        });
        shearHTML += step({
            title: '3. Concrete Pryout Strength', ref: '17.7.3.1',
            formula: 'V<sub>cp</sub> = k<sub>cp</sub> &times; N<sub>cb</sub>',
            vars: `k_cp=${f(bd.Vcp.kcp,1)}, N_cb=${f(bd.Vcp.Ncb_val,1)} kips`,
            result: { text: '&phi;V<sub>cp</sub> = &phi; &times; V<sub>cp</sub>', val: f(bd.Vcp.phi_Vcp), unit: 'kips' }
        });
        shearHTML += step({
            title: 'Governing Shear Capacity',
            formula: '&phi;V<sub>n</sub> = min(&phi;V<sub>sa</sub>, &phi;V<sub>cb</sub>, &phi;V<sub>cp</sub>)',
            vars: `Governing failure mode: ${bd.gov_V.gov_conc_mode_V}`,
            result: { final: true, text: '&phi;V<sub>n</sub>', val: f(bd.gov_V.phiVn), unit: 'kips' }
        });
    } else { shearHTML += `<p class="note">No anchors in shear.</p>`; }
    
    // INTERACTION
    let interactionHTML = '<h3>Interaction Check</h3>';
    const i = bd.interaction;
    const passFailText = i.pass ? 'PASS' : 'FAIL';
    const passFailClass = i.pass ? 'pass' : 'fail';
    interactionHTML += step({
        title: 'Combined Loading', ref: i.isCombined ? '17.8' : '',
        formula: i.eqUsed,
        vars: `N<sub>ua</sub>/&phi;N<sub>n</sub> = ${f(i.ratioN, 2)}, V<sub>ua</sub>/&phi;V<sub>n</sub> = ${f(i.ratioV, 2)}`,
        result: { final: true, text: 'Interaction Ratio', val: `${f(i.interaction, 2)} &le; ${f(i.limit, 2)} &nbsp;&nbsp; ${passFailText}`, passFail: passFailClass }
    });

    return `<div class="calc-section">${tensionHTML}</div><div class="calc-section">${shearHTML}</div><div class="calc-section">${interactionHTML}</div>`;
}

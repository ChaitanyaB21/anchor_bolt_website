document.addEventListener("DOMContentLoaded", () => {
    const calcDataJSON = localStorage.getItem("anchorCalcData");
    if (!calcDataJSON) {
        document.getElementById("detailed-calcs-content").innerHTML = `<p class="note">No calculation data found. Please run a calculation on the main page first.</p>`;
        return;
    }

    try {
        const { inputs, results } = JSON.parse(calcDataJSON);
        applyAciLabels(inputs.code_edition);
        const reportHTML = renderDetailedCalculations(inputs, results);
        document.getElementById("detailed-calcs-content").innerHTML = reportHTML;
    } catch (e) {
        console.error("Failed to parse or render calculation data:", e);
        document.getElementById("detailed-calcs-content").innerHTML = `<p class="note" style="color:var(--red);">Error: Could not load calculation data. It may be corrupt. Go back to the calculator and change any input to refresh it.</p>`;
    }
});

function renderDetailedCalculations(inputs, results) {
    const bd = results.breakdown || {};
    const code = getAciCode(inputs.code_edition);
    // Infinity is stored as null in localStorage JSON, so test with Number.isFinite.
    const f = (val, dec = 1) => (Number.isFinite(val) ? val.toFixed(dec) : "N/A");

    if (!bd.phi || !bd.gov_N) {
        return `<p class="note" style="text-align: center; margin-top: 40px;">No calculations to display. Go back to the calculator and change any input to refresh the report.</p>`;
    }

    const step = ({ title, ref, formula, vars, result }) => `
        <div class="calc-step ${result.final ? 'final-calc' : ''}">
            <div class="title">${title}<span class="ref">${ref || ''}</span></div>
            ${formula ? `<div class="formula">${formula}</div>` : ''}
            ${vars ? `<div class="vars">${vars}</div>` : ''}
            <div class="result">${result.text}: <span class="val ${result.passFail || ''}">${result.val}</span> ${result.unit || ''}</div>
        </div>
    `;
    const F = bd.factors, P = bd.phi;
    const seis = (sf) => (sf < 1 ? ` &times; 0.75 (seismic, ${code.seismicN})` : '');

    // BASIS OF DESIGN
    let basisHTML = `<h3>Basis of Design &mdash; ${code.chapter}</h3>`;
    basisHTML += step({
        title: 'Strength reduction factors', ref: code.phi,
        formula: `Steel: &phi; = ${f(P.phi_steel_N, 2)} (tension), ${f(P.phi_steel_V, 2)} (shear) &mdash; ${P.ductile_steel ? 'ductile' : 'brittle'} steel element (${code.phiSteel})`,
        vars: `Concrete breakout / side-face blowout: tension &phi; = ${f(P.phi_conc_N, 2)} (Condition ${P.condA_N ? 'A' : 'B'}), shear &phi; = ${f(P.phi_conc_V, 2)} (Condition ${P.condA_V ? 'A' : 'B'}) (${code.phiConc})<br>` +
              `Pullout &phi; = ${f(P.phi_pullout, 2)}, pryout &phi; = ${f(P.phi_pryout, 2)} &mdash; Condition B always applies (${code.phiPullout})`,
        result: { text: 'Concrete', val: F.uncracked ? 'Uncracked' : 'Cracked' }
    });
    basisHTML += step({
        title: 'Modification factors',
        formula: `&Psi;<sub>c,N</sub> = ${f(F.psi_c_N, 2)} (${code.psi_c_N}), &Psi;<sub>c,P</sub> = ${f(F.psi_c_P, 2)} (${code.psi_c_P}), &Psi;<sub>c,V</sub> = ${f(F.psi_c_V, 2)} (${code.psi_c_V_ref}), &Psi;<sub>cp,N</sub> = 1.0 cast-in (${code.psi_cp_N}), &lambda;<sub>a</sub> = ${f(F.lambda_a, 1)}`,
        vars: F.isSeismic ? `Seismic: concrete-governed tension strengths multiplied by 0.75 (${code.seismicN})` : 'Seismic tension reduction not applied (SDC A, B and tension ductility not required)',
        result: { text: 'Seismic factor on concrete tension', val: f(F.seismic_factor_N, 2) }
    });

    // TENSION
    let tensionHTML = '<h3>Tension Capacity (&phi;N<sub>n</sub>)</h3>';
    if (inputs.n_tension > 0) {
        const nsa = bd.Nsa;
        tensionHTML += step({
            title: '1. Steel Strength of Anchor', ref: code.Nsa,
            formula: 'N<sub>sa</sub> = n &times; A<sub>se,N</sub> &times; f<sub>uta</sub>, &nbsp; f<sub>uta</sub> &le; min(1.9f<sub>ya</sub>, 125 ksi)',
            vars: `n=${nsa.n_tension}, A_se,N=${f(nsa.ase, 3)} in², f_uta=${f(nsa.futa, 1)} ksi (listed ${f(nsa.futa_listed, 0)}, f_ya=${f(nsa.fya, 0)}) &rarr; N_sa=${f(nsa.Nsa_tot, 1)} kips`,
            result: { text: `&phi;N<sub>sa</sub> = ${f(nsa.phi, 2)} &times; N<sub>sa</sub>`, val: f(nsa.phi_Nsa), unit: 'kips' }
        });
        const ncb = bd.Ncb;
        tensionHTML += step({
            title: '2. Concrete Breakout Strength', ref: code.Ncb,
            formula: 'N<sub>cbg</sub> = (A<sub>Nc</sub>/A<sub>Nco</sub>) &Psi;<sub>ec,N</sub>&Psi;<sub>ed,N</sub>&Psi;<sub>c,N</sub>&Psi;<sub>cp,N</sub>&Psi;<sub>m,N</sub>N<sub>b</sub>, &nbsp; N<sub>b</sub> = 24&lambda;<sub>a</sub>&radic;f\'<sub>c</sub> h<sub>ef</sub><sup>1.5</sup>',
            vars: `A_Nc=${f(ncb.anc_used, 0)} in²${ncb.anc_used < ncb.anc_value ? ` (input ${f(ncb.anc_value, 0)} limited to n&middot;A_Nco)` : ''}, A_Nco=9h_ef²=${f(ncb.Anco, 0)} in²<br>` +
                  `&Psi;ec,N=${f(ncb.psi_ec_N, 3)} (${code.psi_ec_N}), c_a,min=${f(ncb.ca_min, 2)} in &rarr; &Psi;ed,N=${f(ncb.psi_ed_N, 3)} (${code.psi_ed_N}), &Psi;c,N=${f(ncb.psi_c_N, 2)}, &Psi;cp,N=${f(ncb.psi_cp_N, 2)}, &Psi;m,N=${f(ncb.psi_m_n, 2)}<br>` +
                  `N_b=${f(ncb.Nb, 1)} kips (${code.Nb}) &rarr; N_cbg=${f(ncb.Ncb_tot, 1)} kips` +
                  (bd.gov_N.breakout_excluded ? '<br><strong>Not considered: anchor reinforcement provided for tension.</strong>' : ''),
            result: { text: `&phi;N<sub>cbg</sub> = ${f(ncb.phi, 2)} &times; N<sub>cbg</sub>${seis(ncb.seismic_factor_N)}`, val: f(ncb.phi_Ncb), unit: 'kips' }
        });
        const npn = bd.Npn;
        let pulloutVars = `A_brg=${f(npn.abrg, 2)} in², f'c=${f(inputs.f_c, 0)} psi, &Psi;c,P=${f(npn.psi_c_P, 2)} (${code.psi_c_P}), n=${npn.n_tension}, N_p=${f(npn.Np, 1)} kips/anchor`;
        pulloutVars += inputs.consider_plate === 'Yes' ? `<br>(Plate A_brg: d_gross=${f(npn.plate_calcs.d_plate_gross, 2)}")` : `<br>(Standard heavy-hex head A_brg)`;
        tensionHTML += step({
            title: '3. Pullout Strength', ref: `${code.Npn}, ${code.Np}`,
            formula: 'N<sub>pn</sub> = n &times; &Psi;<sub>c,P</sub> &times; 8 A<sub>brg</sub> f\'<sub>c</sub>',
            vars: pulloutVars,
            result: { text: `&phi;N<sub>pn</sub> = ${f(npn.phi, 2)} &times; N<sub>pn</sub>${seis(npn.seismic_factor_N)}`, val: f(npn.phi_Npn), unit: 'kips' }
        });
        const nsb = bd.Nsb;
        if (nsb.Nsb_applies) {
            let sbVars = `c_a1=${f(nsb.ca1_t, 2)} in, c_a2=${f(nsb.ca2_sb, 2)} in, A_brg=${f(nsb.abrg, 2)} in², corner factor (1+c_a2/c_a1)/4 = ${f(nsb.corner_factor, 3)} &rarr; N_sb=${f(nsb.Nsb_single, 1)} kips/anchor`;
            if (nsb.rowCount > 1) sbVars += `<br>Edge row of 2 at s=${f(nsb.s_row, 2)} in: N_sbg=(1+s/6c_a1)N_sb=${f(nsb.Nsbg_row, 1)} kips (${code.Nsbg})`;
            sbVars += `<br>Group (equal tension per anchor): ${f(nsb.Nsb_tot, 1)} kips`;
            tensionHTML += step({
                title: '4. Side-Face Blowout Strength', ref: code.Nsb,
                formula: 'N<sub>sb</sub> = 160 c<sub>a1</sub> &radic;A<sub>brg</sub> &lambda;<sub>a</sub>&radic;f\'<sub>c</sub> &times; (1 + c<sub>a2</sub>/c<sub>a1</sub>)/4 when c<sub>a2</sub> &lt; 3c<sub>a1</sub>',
                vars: sbVars,
                result: { text: `&phi;N<sub>sb</sub> = ${f(nsb.phi, 2)} &times; N<sub>sb</sub>${seis(nsb.seismic_factor_N)}`, val: f(nsb.phi_Nsb), unit: 'kips' }
            });
        } else {
            tensionHTML += `<div class="calc-step"><div class="title">4. Side-Face Blowout Strength<span class="ref">${code.Nsb}</span></div><div class="result">Not applicable (h<sub>ef</sub> &le; 2.5c<sub>a1</sub>)</div></div>`;
        }
        tensionHTML += step({
            title: 'Governing Tension Capacity',
            formula: '&phi;N<sub>n</sub> = min(&phi;N<sub>sa</sub>, &phi;N<sub>cbg</sub>, &phi;N<sub>pn</sub>, &phi;N<sub>sb</sub>)',
            vars: `Governing failure mode: ${bd.gov_N.gov_conc_mode_N}`,
            result: { final: true, text: '&phi;N<sub>n</sub>', val: f(bd.gov_N.phiNn), unit: 'kips' }
        });
    } else { tensionHTML += `<p class="note">No anchors in tension.</p>`; }

    // SHEAR
    let shearHTML = '<h3>Shear Capacity (&phi;V<sub>n</sub>)</h3>';
    if (inputs.n_shear > 0) {
        const vsa = bd.Vsa;
        shearHTML += step({
            title: '1. Steel Strength of Anchor', ref: `${code.Vsa}, ${code.grout}`,
            formula: 'V<sub>sa</sub> = n &times; 0.6 A<sub>se,V</sub> f<sub>uta</sub> &times; 0.8 (if built-up grout pad)',
            vars: `n=${vsa.n_shear}, A_se,V=${f(vsa.ase, 3)} in², f_uta=${f(vsa.futa, 1)} ksi, grout factor=${vsa.grout_factor} &rarr; V_sa=${f(vsa.Vsa_tot, 1)} kips`,
            result: { text: `&phi;V<sub>sa</sub> = ${f(vsa.phi, 2)} &times; V<sub>sa</sub>`, val: f(vsa.phi_Vsa), unit: 'kips' }
        });
        const vcb = bd.Vcb;
        shearHTML += step({
            title: '2. Concrete Breakout Strength', ref: vcb.parallel ? `${code.Vcb}, ${code.parallel}` : code.Vcb,
            formula: `V<sub>cbg</sub> = ${vcb.parallel ? '2 &times; ' : ''}(A<sub>Vc</sub>/A<sub>Vco</sub>) &Psi;<sub>ec,V</sub>&Psi;<sub>ed,V</sub>&Psi;<sub>c,V</sub>&Psi;<sub>h,V</sub>V<sub>b</sub>, &nbsp; V<sub>b</sub> = min[7(l<sub>e</sub>/d<sub>a</sub>)<sup>0.2</sup>&radic;d<sub>a</sub>, 9] &lambda;<sub>a</sub>&radic;f'<sub>c</sub> c<sub>a1</sub><sup>1.5</sup>`,
            vars: `A_Vc=${f(vcb.avc_used, 0)} in²${vcb.avc_used < vcb.avc_value ? ` (input ${f(vcb.avc_value, 0)} limited to n&middot;A_Vco)` : ''}, A_Vco=4.5c_a1²=${f(vcb.Avco, 0)} in²<br>` +
                  `&Psi;ec,V=${f(vcb.psi_ec_V, 3)} (${code.psi_ec_V}), &Psi;ed,V=${f(vcb.psi_ed_V, 3)} (${code.psi_ed_V}${vcb.parallel ? '; 1.0 for shear parallel to edge' : ''}), &Psi;c,V=${f(vcb.psi_c_V_val, 2)}, &Psi;h,V=${f(vcb.psi_h_V, 3)} (${code.psi_h_V})<br>` +
                  `l_e=${f(vcb.le, 2)} in, V_b,a=${f(vcb.Vb_a, 1)}, V_b,b=${f(vcb.Vb_b, 1)} &rarr; V_b=${f(vcb.Vb, 1)} kips (${code.Vb}) &rarr; V_cbg=${f(vcb.Vcb_tot, 1)} kips` +
                  (bd.gov_V.breakout_excluded ? '<br><strong>Not considered: anchor reinforcement provided for shear.</strong>' : ''),
            result: { text: `&phi;V<sub>cbg</sub> = ${f(vcb.phi, 2)} &times; V<sub>cbg</sub>`, val: f(vcb.phi_Vcb), unit: 'kips' }
        });
        const vcp = bd.Vcp;
        shearHTML += step({
            title: '3. Concrete Pryout Strength', ref: code.Vcp,
            formula: 'V<sub>cpg</sub> = k<sub>cp</sub> N<sub>cpg</sub>, &nbsp; N<sub>cpg</sub> = N<sub>cbg</sub> (cast-in)',
            vars: `k_cp=${f(vcp.kcp, 1)}, N_cbg=${f(vcp.Ncb_val, 1)} kips &rarr; V_cpg=${f(vcp.Vcp_tot, 1)} kips`,
            result: { text: `&phi;V<sub>cpg</sub> = ${f(vcp.phi, 2)} &times; V<sub>cpg</sub>`, val: f(vcp.phi_Vcp), unit: 'kips' }
        });
        shearHTML += step({
            title: 'Governing Shear Capacity',
            formula: '&phi;V<sub>n</sub> = min(&phi;V<sub>sa</sub>, &phi;V<sub>cbg</sub>, &phi;V<sub>cpg</sub>)',
            vars: `Governing failure mode: ${bd.gov_V.gov_conc_mode_V}`,
            result: { final: true, text: '&phi;V<sub>n</sub>', val: f(bd.gov_V.phiVn), unit: 'kips' }
        });
    } else { shearHTML += `<p class="note">No anchors in shear.</p>`; }

    // INTERACTION
    let interactionHTML = '<h3>Interaction Check</h3>';
    const i = bd.interaction;
    const ratioText = (r) => (Number.isFinite(r) ? r.toFixed(2) : 'no capacity');
    interactionHTML += step({
        title: 'Tension and Shear Interaction', ref: code.interaction,
        formula: i.eqUsed,
        vars: `N<sub>ua</sub>/&phi;N<sub>n</sub> = ${f(inputs.n_ua, 1)}/${f(bd.gov_N.phiNn, 1)} = ${ratioText(i.ratioN)}, &nbsp; V<sub>ua</sub>/&phi;V<sub>n</sub> = ${f(inputs.v_ua, 1)}/${f(bd.gov_V.phiVn, 1)} = ${ratioText(i.ratioV)}` +
              (i.isCombined ? '<br>Each ratio must also be &le; 1.0.' : ''),
        result: { final: true, text: 'Interaction Ratio', val: `${ratioText(i.interaction)} &le; ${f(i.limit, 2)} &nbsp;&nbsp; ${i.pass ? 'PASS' : 'FAIL'}`, passFail: i.pass ? 'pass' : 'fail' }
    });

    return `<div class="calc-section">${basisHTML}</div><div class="calc-section">${tensionHTML}</div><div class="calc-section">${shearHTML}</div><div class="calc-section">${interactionHTML}</div>`;
}

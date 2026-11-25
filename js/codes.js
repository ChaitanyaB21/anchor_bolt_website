/**
 * ACI 318 code editions: names and clause references, one entry per edition.
 * Shared by index.html and calcs.html; load it before app.js / calcs.js.
 *
 * For cast-in headed anchors the design equations and factors of ACI 318-14
 * Chapter 17 and ACI 318-19 Chapter 17 are the same; 318-19 renumbered the
 * chapter. The calculation engine (app.js) therefore uses one set of
 * equations, and the edition selects the clause references reported here.
 */
const ACI_CODES = {
  "318-19": {
    name: "ACI 318-19",
    chapter: "ACI 318-19 Chapter 17",
    seismic: "ACI 318-19 Sec. 17.10",
    seismicN: "17.10.5.4",
    ductility: "17.10.5.3",
    psi_c_V: "ACI 318-19 Section 17.7.2.5 / PIP Table",
    phi: "ACI 318-19 Table 17.5.3(a), (b), (c)",
    phiSteel: "Table 17.5.3(a)",
    phiConc: "Table 17.5.3(b)",
    phiPullout: "Table 17.5.3(c)",
    futa: "17.6.1.2",
    Nsa: "17.6.1.2", Ncb: "17.6.2.1", Nb: "17.6.2.2.1",
    psi_ec_N: "17.6.2.3", psi_ed_N: "17.6.2.4", psi_c_N: "17.6.2.5", psi_cp_N: "17.6.2.6",
    Npn: "17.6.3.1", Np: "17.6.3.2.2", psi_c_P: "17.6.3.3",
    Nsb: "17.6.4.1", Nsbg: "17.6.4.2",
    Vsa: "17.7.1.2", grout: "17.7.1.2.1",
    Vcb: "17.7.2.1", Vb: "17.7.2.2.1", parallel: "17.7.2.1(c)",
    psi_ec_V: "17.7.2.3", psi_ed_V: "17.7.2.4", psi_c_V_ref: "17.7.2.5", psi_h_V: "17.7.2.6",
    Vcp: "17.7.3.1",
    interaction: "17.8", interactionN: "17.8.1", interactionV: "17.8.2", eqInteraction: "17.8.3"
  },
  "318-14": {
    name: "ACI 318-14",
    chapter: "ACI 318-14 Chapter 17",
    seismic: "ACI 318-14 Sec. 17.2.3",
    seismicN: "17.2.3.4.4",
    ductility: "17.2.3.4.3",
    psi_c_V: "ACI 318-14 Section 17.5.2.7 / PIP Table",
    phi: "ACI 318-14 Section 17.3.3",
    phiSteel: "17.3.3(a), (b)",
    phiConc: "17.3.3(c)",
    phiPullout: "17.3.3(c)",
    futa: "17.4.1.2",
    Nsa: "17.4.1.2", Ncb: "17.4.2.1", Nb: "17.4.2.2",
    psi_ec_N: "17.4.2.4", psi_ed_N: "17.4.2.5", psi_c_N: "17.4.2.6", psi_cp_N: "17.4.2.7",
    Npn: "17.4.3.1", Np: "17.4.3.4", psi_c_P: "17.4.3.6",
    Nsb: "17.4.4.1", Nsbg: "17.4.4.2",
    Vsa: "17.5.1.2", grout: "17.5.1.3",
    Vcb: "17.5.2.1", Vb: "17.5.2.2", parallel: "17.5.2.1(c)",
    psi_ec_V: "17.5.2.5", psi_ed_V: "17.5.2.6", psi_c_V_ref: "17.5.2.7", psi_h_V: "17.5.2.8",
    Vcp: "17.5.3.1",
    interaction: "17.6", interactionN: "17.6.1", interactionV: "17.6.2", eqInteraction: "17.6.3"
  }
};
const DEFAULT_ACI_CODE = "318-19";

// Falls back to the default for missing or unknown editions (e.g. data saved
// before the edition dropdown existed).
function getAciCode(edition) {
  return Object.prototype.hasOwnProperty.call(ACI_CODES, edition) ? ACI_CODES[edition] : ACI_CODES[DEFAULT_ACI_CODE];
}

// Fills every <... data-aci="key"> element with that edition's text, and
// keeps the browser tab title in step.
function applyAciLabels(edition) {
  const code = getAciCode(edition);
  document.querySelectorAll("[data-aci]").forEach((el) => {
    el.textContent = code[el.dataset.aci];
  });
  if (document.body && document.body.dataset.titlePrefix) {
    document.title = `${document.body.dataset.titlePrefix} — ${code.chapter}`;
  }
}

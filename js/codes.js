/**
 * ACI 318 code editions: names and clause references, one entry per edition.
 * Shared by index.html and calcs.html; load it before app.js / calcs.js.
 *
 * Labels only: nothing here feeds the capacity calculations in app.js.
 */
const ACI_CODES = {
  "318-19": {
    name: "ACI 318-19",
    seismic: "ACI 318-19 Sec. 17.10",
    psi_c_V: "ACI 318-19 Section 17.7.2.5 / PIP Table",
    phi: "ACI 318-19 Table 17.5.3(b)",
    Nsa: "17.6.1.2", Ncb: "17.6.2.1", Npn: "17.6.3.1", Nsb: "17.6.4.1",
    Vsa: "17.7.1.2", Vcb: "17.7.2.1", Vcp: "17.7.3.1",
    interaction: "17.8", eqInteraction: "17.8.3", eqInteractionSteel: "17.8.2"
  },
  "318-14": {
    name: "ACI 318-14",
    seismic: "ACI 318-14 Sec. 17.2.3",
    psi_c_V: "ACI 318-14 Section 17.5.2.7 / PIP Table",
    phi: "ACI 318-14 Section 17.3.3",
    Nsa: "17.4.1.2", Ncb: "17.4.2.1", Npn: "17.4.3.1", Nsb: "17.4.4.1",
    Vsa: "17.5.1.2", Vcb: "17.5.2.1", Vcp: "17.5.3.1",
    interaction: "17.6", eqInteraction: "17.6.3", eqInteractionSteel: "17.6.3"
  }
};
const DEFAULT_ACI_CODE = "318-19";

// Falls back to the default for missing or unknown editions (e.g. data saved
// before the edition dropdown existed).
function getAciCode(edition) {
  return Object.prototype.hasOwnProperty.call(ACI_CODES, edition) ? ACI_CODES[edition] : ACI_CODES[DEFAULT_ACI_CODE];
}

// Fills every <... data-aci="key"> element with that edition's text.
function applyAciLabels(edition) {
  const code = getAciCode(edition);
  document.querySelectorAll("[data-aci]").forEach((el) => {
    el.textContent = code[el.dataset.aci];
  });
}

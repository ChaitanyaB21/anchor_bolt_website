/**
 * Anchor Bolt Design (ACI 318-19 Chapter 17 & PIP STE05121)
 */

function tag(name, attrs, inner) {
  const a = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ");
  return `<${name} ${a}>${inner || ""}</${name}>`;
}
function line(x1, y1, x2, y2, extra) {
  return tag("line", { x1, y1, x2, y2, stroke: "#000", "stroke-width": 1, ...extra });
}
function text(x, y, str, extra) {
  return tag("text", { x, y, "font-size": 11, "font-family": "Consolas, monospace", fill: "#000", "text-anchor": "middle", ...extra }, str);
}

// PIP STE05121 Table: Standard Bolt Mechanical and Geometrical Properties
const BOLT_PROPS = {
  "0.5":   { da: 0.500, ase: 0.142, abrg: 0.467,  hef_min: 6.0 },
  "0.625": { da: 0.625, ase: 0.226, abrg: 0.671,  hef_min: 7.5 },
  "0.75":  { da: 0.750, ase: 0.334, abrg: 0.911,  hef_min: 9.0 },
  "0.875": { da: 0.875, ase: 0.462, abrg: 1.188,  hef_min: 10.5 },
  "1":     { da: 1.000, ase: 0.606, abrg: 1.501,  hef_min: 12.0 },
  "1.125": { da: 1.125, ase: 0.763, abrg: 1.851,  hef_min: 13.5 },
  "1.25":  { da: 1.250, ase: 0.969, abrg: 2.237,  hef_min: 15.0 },
  "1.375": { da: 1.375, ase: 1.160, abrg: 2.659,  hef_min: 16.5 },
  "1.5":   { da: 1.500, ase: 1.410, abrg: 3.118,  hef_min: 18.0 },
  "1.75":  { da: 1.750, ase: 1.900, abrg: 4.144,  hef_min: 21.0 },
  "2":     { da: 2.000, ase: 2.500, abrg: 5.316,  hef_min: 24.0 },
  "2.25":  { da: 2.250, ase: 3.250, abrg: 6.633,  hef_min: 27.0 },
  "2.5":   { da: 2.500, ase: 4.000, abrg: 8.095,  hef_min: 30.0 },
  "2.75":  { da: 2.750, ase: 4.930, abrg: 9.703,  hef_min: 33.0 },
  "3":     { da: 3.000, ase: 5.970, abrg: 11.456, hef_min: 36.0 },
  "4":     { da: 4.000, ase: 11.080,abrg: 19.923, hef_min: 48.0 }
};

// PIP STE05121 Table: Anchor Material Properties & Diameter Rules
function getMaterialProperties(materialName, diameterVal) {
  const d = parseFloat(diameterVal);
  switch (materialName) {
    case "A307-Type A, Fu=60":
      return { fya: 0, futa: 60, ductile: true };
    case "A36":
      return { fya: 36, futa: 58, ductile: true };
    case "F1554 Gr 36":
      return { fya: 36, futa: 58, ductile: true };
    case "F1554 Gr 55":
      if (d <= 2.0) return { fya: 55, futa: 75, ductile: true };
      else return { fya: 55, futa: 75, ductile: false };
    case "F1554 Gr 105":
      return { fya: 105, futa: 125, ductile: true };
    case "A193 Gr B7":
      if (d <= 2.5) return { fya: 105, futa: 125, ductile: true };
      else if (d <= 4.0) return { fya: 95, futa: 115, ductile: true };
      else return { fya: 75, futa: 100, ductile: true };
    case "A354 Gr BC":
      if (d <= 2.5) return { fya: 109, futa: 125, ductile: true };
      else return { fya: 99, futa: 115, ductile: true };
    case "A354 Gr BD":
      if (d <= 2.5) return { fya: 130, futa: 150, ductile: true };
      else return { fya: 115, futa: 140, ductile: true };
    case "A449":
      if (d <= 1.0) return { fya: 92, futa: 120, ductile: true };
      else if (d <= 1.5) return { fya: 81, futa: 105, ductile: true };
      else return { fya: 58, futa: 90, ductile: true };
    case "A320 Gr L7":
      return { fya: 105, futa: 125, ductile: true };
    default:
      return { fya: 105, futa: 125, ductile: true };
  }
}

function readInputs() {
  const num = (id, fallback = 0) => {
    const v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? fallback : v;
  };
  const val = (id) => document.getElementById(id).value;

  return {
    n_ua: num("n_ua", 0),
    v_ua: num("v_ua", 0),
    shear_dir: val("shear_dir"),
    grout_pad: val("grout_pad"),
    ductility_req: val("ductility_req"),
    seismic_cat: val("seismic_cat"),
    f_c: num("f_c", 4500),
    cracking_factor: val("cracking_factor"),
    psi_m_n: num("psi_m_n", 1),
    reinf_tension: val("reinf_tension"),
    reinf_shear: val("reinf_shear"),
    supp_reinf_tension: val("supp_reinf_tension"),
    supp_reinf_shear: val("supp_reinf_shear"),
    anchor_material: val("anchor_material"),
    diameter: val("diameter"),
    hef: Math.max(num("hef", 1), 0.1),
    ha: Math.max(num("ha", 1), 0.1),
    n_tension: Math.max(parseInt(document.getElementById("n_tension").value, 10) || 1, 1),
    n_shear: Math.max(parseInt(document.getElementById("n_shear").value, 10) || 1, 1),
    manual_anc: val("manual_anc"),
    anc_value: num("anc_value", 0),
    manual_avc: val("manual_avc"),
    avc_value: num("avc_value", 0),
    e_n: num("e_n", 0),
    s_direction: val("s_direction"),
    e_v: num("e_v", 0),
    ca1_t: Math.max(num("ca1_t", 0.1), 0.1),
    ca2_t: Math.max(num("ca2_t", 0.1), 0.1),
    ca3_t: Math.max(num("ca3_t", 0.1), 0.1),
    ca4_t: Math.max(num("ca4_t", 0.1), 0.1),
    s1_t: Math.max(num("s1_t", 0), 0),
    s2_t: Math.max(num("s2_t", 0), 0),
    ca1_v: Math.max(num("ca1_v", 0.1), 0.1),
    ca2_v: Math.max(num("ca2_v", 0.1), 0.1),
    s1_v: Math.max(num("s1_v", 0), 0),
    s2_v: Math.max(num("s2_v", 0), 0),
  };
}

function updateSpacingInputs(inputs) {
  const s1_t_el = document.getElementById("s1_t");
  const s2_t_el = document.getElementById("s2_t");
  const tensionDisabled = inputs.n_tension <= 1;

  s1_t_el.disabled = tensionDisabled;
  s2_t_el.disabled = tensionDisabled;
  if (tensionDisabled) {
    s1_t_el.value = "0.00";
    s2_t_el.value = "0.00";
    inputs.s1_t = 0;
    inputs.s2_t = 0;
  }

  const s1_v_el = document.getElementById("s1_v");
  const s2_v_el = document.getElementById("s2_v");
  const shearDisabled = inputs.n_shear <= 1;

  s1_v_el.disabled = shearDisabled;
  s2_v_el.disabled = shearDisabled;
  if (shearDisabled) {
    s1_v_el.value = "0.00";
    s2_v_el.value = "0.00";
    inputs.s1_v = 0;
    inputs.s2_v = 0;
  }

  const bolt = BOLT_PROPS[inputs.diameter] || BOLT_PROPS["2"];
  const noteEl = document.getElementById("hef_min_note");
  if (noteEl) {
    noteEl.textContent = `Minimum h_ef,min = ${bolt.hef_min.toFixed(1)} in.`;
  }
}

function calculateAnc(inputs) {
  const { hef, ca1_t, ca2_t, ca3_t, ca4_t, s1_t, s2_t, n_tension, s_direction } = inputs;
  
  const c1_eff = Math.min(ca1_t, 1.5 * hef);
  const c3_eff = Math.min(ca3_t, 1.5 * hef);
  const c2_eff = Math.min(ca2_t, 1.5 * hef);
  const c4_eff = Math.min(ca4_t, 1.5 * hef);

  const spanX = (n_tension > 1 && s_direction === "1") ? s1_t : 0;
  const spanY = (n_tension > 1 && s_direction === "2") ? s2_t : 0;

  const totalX = c1_eff + c3_eff + spanX;
  const totalY = c2_eff + c4_eff + spanY;

  return totalX * totalY;
}

function calculateAvc(inputs) {
  const { ca1_v, ca2_v, ha, s1_v, s2_v, n_shear, shear_dir } = inputs;
  
  const c_a1 = ca1_v;
  const h_eff = Math.min(ha, 1.5 * c_a1);
  const c_a2_eff = Math.min(ca2_v, 1.5 * c_a1);

  if (shear_dir === "perpendicular to edge") {
    const span2 = n_shear > 1 ? s2_v : 0;
    const totalWidth = 1.5 * c_a1 + c_a2_eff + span2;
    return totalWidth * h_eff;
  } else {
    const span1 = n_shear > 1 ? s1_v : 0;
    const totalWidth = 2 * (1.5 * c_a1) + span1;
    return totalWidth * h_eff;
  }
}

function updateAreaInputs(inputs) {
  const ancInput = document.getElementById("anc_value");
  const avcInput = document.getElementById("avc_value");

  if (inputs.manual_anc === "No") {
    ancInput.readOnly = true;
    const calcAnc = calculateAnc(inputs);
    ancInput.value = calcAnc.toFixed(2);
    inputs.anc_value = calcAnc;
  } else {
    ancInput.readOnly = false;
  }

  if (inputs.manual_avc === "No") {
    avcInput.readOnly = true;
    const calcAvc = calculateAvc(inputs);
    avcInput.value = calcAvc.toFixed(2);
    inputs.avc_value = calcAvc;
  } else {
    avcInput.readOnly = false;
  }
}

function drawSideView(inputs) {
  const { hef, ha, ca1_t: ca1, ca3_t: ca3, n_tension, s_direction, s1_t } = inputs;
  const W = 640, H = 380, margin = 70;

  const breakout = 1.5 * hef;
  const numBolts = n_tension;
  const span = (numBolts > 1) ? (numBolts - 1) * (s_direction === "1" ? s1_t : 0) : 0;
  const memberW = ca1 + span + ca3;

  const scale = Math.min((W - 2 * margin) / memberW, (H - 2 * margin) / Math.max(ha, hef + 10));
  const px = (x) => margin + x * scale;
  const py = (y) => margin + y * scale;

  const parts = [];

  const clipId = "concrete-clip-side";
  const clipPathSvg = tag("clipPath", { id: clipId }, 
    tag("rect", { x: px(0), y: py(0), width: memberW * scale, height: ha * scale })
  );

  parts.push(tag("defs", {}, clipPathSvg));

  parts.push(tag("rect", { x: px(0), y: py(0), width: memberW * scale, height: ha * scale, fill: "#e6e6e6", stroke: "#000", "stroke-width": 1.5 }));
  parts.push(line(px(0), py(0), px(0), py(ha), { "stroke-width": 3 }));

  const anchorXs = [];
  if (numBolts === 1) {
    anchorXs.push(ca1);
  } else {
    const spacing = s_direction === "1" ? s1_t : 0;
    for (let i = 0; i < numBolts; i++) {
      anchorXs.push(ca1 + i * spacing);
    }
  }

  const coneGroupParts = [];
  anchorXs.forEach((ax) => {
    const left = ax - breakout, right = ax + breakout;
    coneGroupParts.push(tag("polygon", {
      points: `${px(ax)},${py(hef)} ${px(left)},${py(0)} ${px(right)},${py(0)}`,
      fill: "#bfbfbf", "fill-opacity": 0.6, stroke: "#000", "stroke-width": 1, "stroke-dasharray": "4,3",
    }));
  });

  parts.push(tag("g", { "clip-path": `url(#${clipId})` }, coneGroupParts.join("")));

  anchorXs.forEach((ax) => {
    parts.push(line(px(ax), py(0), px(ax), py(hef), { "stroke-width": 4 }));
    parts.push(tag("rect", { x: px(ax) - 6, y: py(0) - 3, width: 12, height: 3, fill: "#000" }));

    const topY = py(0) - 26;
    parts.push(line(px(ax), py(0) - 2, px(ax), topY, { "stroke-width": 1.5 }));
    parts.push(tag("polygon", { points: `${px(ax) - 4},${topY + 8} ${px(ax) + 4},${topY + 8} ${px(ax)},${topY}`, fill: "#000" }));
    parts.push(text(px(ax), topY - 6, "Nu"));

    parts.push(text(px(ax) - 18, py(hef) - 10, "35\u00B0", { "font-size": 9 }));
    parts.push(text(px(ax) + 18, py(hef) - 10, "35\u00B0", { "font-size": 9 }));
  });

  const dimX1 = px(memberW) + 20;
  parts.push(line(dimX1, py(0), dimX1, py(hef), { stroke: "#000", "stroke-dasharray": "2,2" }));
  parts.push(line(dimX1 - 4, py(0), dimX1 + 4, py(0), { stroke: "#000" }));
  parts.push(line(dimX1 - 4, py(hef), dimX1 + 4, py(hef), { stroke: "#000" }));
  parts.push(text(dimX1 + 16, (py(0) + py(hef)) / 2, `hef=${hef.toFixed(1)}"`, { "text-anchor": "middle", transform: `rotate(90 ${dimX1 + 16} ${(py(0) + py(hef)) / 2})` }));

  const dimX2 = px(memberW) + 55;
  parts.push(line(dimX2, py(0), dimX2, py(ha), { stroke: "#000" }));
  parts.push(line(dimX2 - 4, py(0), dimX2 + 4, py(0), { stroke: "#000" }));
  parts.push(line(dimX2 - 4, py(ha), dimX2 + 4, py(ha), { stroke: "#000" }));
  parts.push(text(dimX2 + 16, (py(0) + py(ha)) / 2, `ha=${ha.toFixed(1)}"`, { "text-anchor": "middle", transform: `rotate(90 ${dimX2 + 16} ${(py(0) + py(ha)) / 2})` }));

  const dimY = py(0) - 46;
  parts.push(line(px(0), dimY, px(ca1), dimY));
  parts.push(text((px(0) + px(ca1)) / 2, dimY - 5, `ca1=${ca1.toFixed(1)}"`));

  if (numBolts > 1 && s_direction === "1" && s1_t > 0) {
    const dimY2 = py(0) - 60;
    parts.push(line(px(ca1), dimY2, px(ca1 + s1_t), dimY2));
    parts.push(text((px(ca1) + px(ca1 + s1_t)) / 2, dimY2 - 5, `s1=${s1_t.toFixed(1)}"`));
  }

  return { svg: tag("svg", { viewBox: `0 0 ${W + 40} ${H}`, xmlns: "http://www.w3.org/2000/svg" }, parts.join("")) };
}

function drawTopView(inputs) {
  const { ca1_t: ca1, ca2_t: ca2, ca3_t: ca3, ca4_t: ca4, s1_t, s2_t, n_tension, s_direction, shear_dir, ca1_v } = inputs;
  const W = 640, H = 380, margin = 70;

  const numBolts = n_tension;
  const alongX = numBolts > 1 && s_direction === "1";
  const alongY = numBolts > 1 && s_direction === "2";

  const memberW = ca1 + ca3 + (alongX ? (numBolts - 1) * s1_t : 0);
  const memberD = ca2 + ca4 + (alongY ? (numBolts - 1) * s2_t : 0);

  const scale = Math.min((W - 2 * margin) / memberW, (H - 2 * margin) / memberD);

  const renderW = memberW * scale;
  const renderH = memberD * scale;
  const offsetX = margin + (W - 2 * margin - renderW) / 2;
  const offsetY = margin + (H - 2 * margin - renderH) / 2;

  const px = (x) => offsetX + x * scale;
  const py = (y) => offsetY + y * scale;

  const parts = [];

  parts.push(tag("rect", { x: px(0), y: py(0), width: renderW, height: renderH, fill: "#e6e6e6", stroke: "#000", "stroke-width": 1.5 }));

  const anchorPos = [];
  if (numBolts === 1) {
    anchorPos.push([ca1, ca2]);
  } else if (alongX) {
    for (let i = 0; i < numBolts; i++) {
      anchorPos.push([ca1 + i * s1_t, ca2]);
    }
  } else if (alongY) {
    for (let i = 0; i < numBolts; i++) {
      anchorPos.push([ca1, ca2 + i * s2_t]);
    }
  }

  const breakoutR = 1.5 * ca1_v;

  anchorPos.forEach(([ax, ay]) => {
    parts.push(tag("circle", { cx: px(ax), cy: py(ay), r: breakoutR * scale, fill: "none", stroke: "#999", "stroke-dasharray": "4,3" }));
    parts.push(tag("circle", { cx: px(ax), cy: py(ay), r: 7, fill: "none", stroke: "#000", "stroke-width": 1.5 }));
    parts.push(tag("circle", { cx: px(ax), cy: py(ay), r: 2.2, fill: "#000" }));
  });

  const [ax0, ay0] = anchorPos[0];
  if (shear_dir === "perpendicular to edge") {
    const y = py(ay0);
    parts.push(line(px(0) - 24, y, px(ax0) - 9, y, { "stroke-width": 1.5 }));
    parts.push(tag("polygon", { points: `${px(ax0) - 18},${y - 4} ${px(ax0) - 18},${y + 4} ${px(ax0) - 8},${y}`, fill: "#000" }));
    parts.push(text(px(0) - 24, y - 8, "Vu", { "text-anchor": "start" }));
  } else {
    const x = px(ax0);
    parts.push(line(x, py(0) - 24, x, py(ay0) - 9, { "stroke-width": 1.5 }));
    parts.push(tag("polygon", { points: `${x - 4},${py(ay0) - 18} ${x + 4},${py(ay0) - 18} ${x},${py(ay0) - 8}`, fill: "#000" }));
    parts.push(text(x + 12, py(0) - 24, "Vu", { "text-anchor": "start" }));
  }

  const dimTopY = py(0) - 14;
  parts.push(line(px(0), dimTopY, px(ax0), dimTopY));
  parts.push(text((px(0) + px(ax0)) / 2, dimTopY - 5, `ca1=${ca1.toFixed(1)}"`));

  const lastAx = anchorPos[anchorPos.length - 1][0];
  const dimBotY = py(memberD) + 22;
  parts.push(line(px(lastAx), dimBotY, px(memberW), dimBotY));
  parts.push(text((px(lastAx) + px(memberW)) / 2, dimBotY + 12, `ca3=${ca3.toFixed(1)}"`));

  const dimLeftX = px(0) - 14;
  parts.push(line(dimLeftX, py(0), dimLeftX, py(ay0)));
  parts.push(text(dimLeftX - 20, (py(0) + py(ay0)) / 2, `ca2=${ca2.toFixed(1)}"`, { transform: `rotate(-90 ${dimLeftX - 20} ${(py(0) + py(ay0)) / 2})` }));

  const lastAy = anchorPos[anchorPos.length - 1][1];
  const dimRightX = px(memberW) + 22;
  parts.push(line(dimRightX, py(lastAy), dimRightX, py(memberD)));
  parts.push(text(dimRightX + 20, (py(lastAy) + py(memberD)) / 2, `ca4=${ca4.toFixed(1)}"`, { transform: `rotate(-90 ${dimRightX + 20} ${(py(lastAy) + py(memberD)) / 2})` }));

  if (alongX && s1_t > 0) {
    const y = py(ay0) + 22;
    parts.push(line(px(ca1), y, px(ca1 + s1_t), y));
    parts.push(text((px(ca1) + px(ca1 + s1_t)) / 2, y + 12, `s1=${s1_t.toFixed(1)}"`));
  }
  if (alongY && s2_t > 0) {
    const x = px(ax0) - 26;
    parts.push(line(x, py(ca2), x, py(ca2 + s2_t)));
    parts.push(text(x - 16, (py(ca2) + py(ca2 + s2_t)) / 2, `s2=${s2_t.toFixed(1)}"`, { transform: `rotate(-90 ${x - 16} ${(py(ca2) + py(ca2 + s2_t)) / 2})` }));
  }

  return { svg: tag("svg", { viewBox: `0 0 ${W + 40} ${H}`, xmlns: "http://www.w3.org/2000/svg" }, parts.join("")) };
}

// ---------------------------------------------------------------
// Full ACI 318-19 & PIP STE05121 Engineering Calculation Engine
// ---------------------------------------------------------------
function calculateResults(inputs) {
  const {
    n_ua, v_ua, shear_dir, grout_pad, ductility_req, seismic_cat, f_c,
    cracking_factor, psi_m_n, reinf_tension, reinf_shear, supp_reinf_tension, supp_reinf_shear,
    anchor_material, diameter, hef, ha, n_tension, n_shear,
    anc_value, avc_value, e_n, e_v, ca1_t, ca2_t, ca3_t, ca4_t, s1_t, s2_t, ca1_v, ca2_v, s1_v, s2_v
  } = inputs;

  const bolt = BOLT_PROPS[diameter] || BOLT_PROPS["2"];
  const mat = getMaterialProperties(anchor_material, diameter);

  const ase = bolt.ase;
  const abrg = bolt.abrg;
  const da = bolt.da;
  const fya = mat.fya;
  const futa = Math.min(mat.futa, 125, 1.9 * fya);

  // Strength Reduction Factors (phi) per PIP Table / ACI 318-19 17.5.3
  const phi_steel_N = 0.75;
  const phi_steel_V = 0.65;
  const phi_conc_N = (supp_reinf_tension === "Yes") ? 0.75 : 0.70; 
  const phi_conc_V = (supp_reinf_shear === "Yes") ? 0.75 : 0.70;

  // ---------------- TENSION CALCULATIONS ----------------
  // 1. Steel Strength in Tension (17.6.1.2)
  const Nsa_single = ase * futa;
  let Nsa_tot = Nsa_single * n_tension;
  if (e_n > 0 && n_tension > 1) {
    const s_perp = (inputs.s_direction === "1") ? s1_t : s2_t;
    if (s_perp > 0) {
      Nsa_tot = (2 * s_perp / (s_perp + 2 * e_n)) * Nsa_tot;
    }
  }

  // 2. Concrete Breakout Strength in Tension (17.6.2)
  const Anco = 9 * hef * hef;
  const psi_ec_N = Math.min(1.0 / (1.0 + e_n / (1.5 * hef)), 1.0);
  const ca_min = Math.min(ca1_t, ca2_t, ca3_t, ca4_t);
  const psi_ed_N = (ca_min >= 1.5 * hef) ? 1.0 : Math.min(0.7 + 0.3 * (ca_min / (1.5 * hef)), 1.0);
  const psi_c_N = 1.0; 
  const psi_cp_N = 1.0;
  const Nb = 24 * Math.sqrt(f_c) * Math.pow(hef, 1.5) / 1000.0; // kips
  const Ncb_tot = (anc_value / Math.max(Anco, 0.1)) * psi_ec_N * psi_ed_N * psi_c_N * psi_cp_N * psi_m_n * Nb;

  // 3. Pullout Strength in Tension (17.6.3)
  const Np = 8 * abrg * f_c / 1000.0; // kips
  const psi_c_P = 1.0;
  const Npn_tot = psi_c_P * Np * n_tension;

  // 4. Side-Face Blowout Strength in Tension (17.6.4)
  let Nsb_tot = Infinity;
  if (hef > 2.5 * ca_min) {
    const Nsb_single = 160 * ca1_t * Math.sqrt(abrg) * Math.sqrt(f_c) / 1000.0;
    const ratio_c = Math.min(ca2_t / ca1_t, 3.0);
    const Nsb_mod = Nsb_single * (1 + ratio_c) / 4.0;
    const s_perp = (inputs.s_direction === "1") ? s1_t : s2_t;
    Nsb_tot = (s_perp > 0) ? (1 + s_perp / (6 * ca1_t)) * Nsb_mod : Nsb_mod;
  }

  // Seismic Reduction Factor
  const isSeismic = (seismic_cat === "C, D, E, or F") || (ductility_req === "Yes");
  const seismic_factor = isSeismic ? 0.75 : 1.0;

  // Factored Design Capacities
  const phi_Nsa = phi_steel_N * Nsa_tot;
  const phi_Ncb = phi_conc_N * Ncb_tot * seismic_factor;
  const phi_Npn = phi_conc_N * Npn_tot * seismic_factor;
  const phi_Nsb = (Nsb_tot !== Infinity) ? phi_conc_N * Nsb_tot * seismic_factor : Infinity;

  // Determine governing tension capacity (phiNn)
  let phiNn;
  let gov_conc_mode_N = "N/A";

  const concrete_capacities = [
    { mode: "Pullout Strength", value: phi_Npn }
  ];
  if (phi_Nsb !== Infinity) {
    concrete_capacities.push({ mode: "Side-Face Blowout", value: phi_Nsb });
  }

  if (reinf_tension === "Yes") {
    const min_remaining_conc = concrete_capacities.reduce((min, current) => {
      return current.value < min.value ? current : min;
    });
    gov_conc_mode_N = min_remaining_conc.mode + " (Breakout Replaced by Reinf)";
    phiNn = Math.min(phi_Nsa, min_remaining_conc.value);
  } else {
    concrete_capacities.push({ mode: "Concrete Breakout", value: phi_Ncb });
    const min_concrete_capacity = concrete_capacities.reduce((min, current) => {
      return current.value < min.value ? current : min;
    });
    gov_conc_mode_N = min_concrete_capacity.mode;
    phiNn = Math.min(phi_Nsa, min_concrete_capacity.value);
  }

  // PIP Ductile Tension Check Calculation
  const steel_ductility_cap = 1.2 * Nsa_tot;
  const is_mat_ductile = mat.ductile;
  const breakout_pass = Ncb_tot >= steel_ductility_cap;
  const pullout_pass = Npn_tot >= steel_ductility_cap;
  const blowout_pass = (Nsb_tot === Infinity) || (Nsb_tot >= steel_ductility_cap);
  const reinf_tension_provided = (reinf_tension === "Yes");

  let is_ductile_system = is_mat_ductile && (
    reinf_tension_provided || (breakout_pass && pullout_pass && blowout_pass)
  );

  let ductility_reasons = [];
  if (!is_mat_ductile) ductility_reasons.push("Material is non-ductile");
  if (!reinf_tension_provided) {
    if (!breakout_pass) ductility_reasons.push("Breakout strength < 1.2 Nsa");
    if (!pullout_pass) ductility_reasons.push("Pullout strength < 1.2 Nsa");
    if (Nsb_tot !== Infinity && !blowout_pass) ductility_reasons.push("Side-face blowout < 1.2 Nsa");
  }

  // ---------------- SHEAR CALCULATIONS ----------------
  // 1. Steel Strength in Shear (17.7.1)
  const grout_reduction = (grout_pad === "Yes") ? 0.8 : 1.0;
  const Vsa_single = 0.6 * ase * futa * grout_reduction;
  let Vsa_tot = Vsa_single * n_shear;
  if (e_v > 0 && n_shear > 1 && s2_v > 0) {
    Vsa_tot = (2 * s2_v / (s2_v + 2 * e_v)) * (Vsa_tot / 2.0);
  }

  // 2. Concrete Breakout Strength in Shear (17.7.2)
  const ca1_max = Math.max(ca2_v / 1.5, ha / 1.5, s2_v / 3.0);
  const ca1_used = Math.min(ca1_v, ca1_max);

  const Avco = 4.5 * ca1_used * ca1_used;
  const le = Math.min(8 * da, hef);
  const Vb = Math.min(
    7 * Math.pow(le / da, 0.2) * Math.sqrt(da) * Math.sqrt(f_c) * Math.pow(ca1_used, 1.5) / 1000.0,
    9 * Math.sqrt(f_c) * Math.pow(ca1_used, 1.5) / 1000.0
  );

  const psi_ec_V = Math.min(1.0 / (1.0 + e_v / (1.5 * ca1_used)), 1.0);
  const psi_ed_V = (shear_dir === "parallel to edge" || ca2_v >= 1.5 * ca1_used) ? 1.0 : (0.7 + 0.3 * (ca2_v / (1.5 * ca1_used)));
  
  let psi_c_V_val = 1.2;
  if (cracking_factor.startsWith("1.0")) psi_c_V_val = 1.0;
  else if (cracking_factor.startsWith("1.2")) psi_c_V_val = 1.2;
  else if (cracking_factor.startsWith("1.4")) psi_c_V_val = 1.4;

  const psi_h_V = Math.max(Math.sqrt(1.5 * ca1_used / ha), 1.0);
  let Vcb_tot = (avc_value / Math.max(Avco, 0.1)) * psi_ec_V * psi_ed_V * psi_c_V_val * psi_h_V * Vb;
  if (shear_dir === "parallel to edge") Vcb_tot *= 2.0;

  // 3. Concrete Pryout Strength in Shear (17.7.3)
  const kcp = (hef < 2.5) ? 1.0 : 2.0;
  const Vcp_tot = kcp * Ncb_tot;

  // Factored Shear Capacities
  const phi_Vsa = phi_steel_V * Vsa_tot;
  const phi_Vcb = phi_conc_V * Vcb_tot;
  const phi_Vcp = phi_conc_V * Vcp_tot;

  // Determine governing shear capacity (phiVn)
  let phiVn;
  let gov_conc_mode_V = "N/A";
  
  if (reinf_shear === "Yes") {
    // Breakout replaced by shear reinforcement, but Concrete Pryout MUST be checked
    gov_conc_mode_V = "Concrete Pryout (Breakout Replaced by Reinf)";
    phiVn = Math.min(phi_Vsa, phi_Vcp);
  } else {
    // Normal Check: Compare Breakout and Pryout
    const min_concrete_shear = Math.min(phi_Vcb, phi_Vcp);
    gov_conc_mode_V = (phi_Vcb <= phi_Vcp) ? "Concrete Breakout" : "Concrete Pryout";
    phiVn = Math.min(phi_Vsa, min_concrete_shear);
  }

  // ---------------- ACI 318-19 SEC 17.8 INTERACTION ----------------
  // const ratioN = n_ua / Math.max(phiNn, 0.001);
  // const ratioV = v_ua / Math.max(phiVn, 0.001);

  // let interaction = 0;
  // let eqUsed = "";
  // let pass = false;

  // if (v_ua <= 0 && n_ua > 0) { 
  //   interaction = ratioN;
  //   eqUsed = "Eq. 1 (Nua / phiNn <= 1.0)";
  //   pass = ratioN <= 1.0;
  // } else if (n_ua <= 0 && v_ua > 0) { 
  //   interaction = ratioV;
  //   eqUsed = "Eq. 2 (Vua / phiVn <= 1.0)";
  //   pass = ratioV <= 1.0;
  // } else if (n_ua > 0 && v_ua > 0) { 
  //   if (ratioN > 1.0 || ratioV > 1.0) {
  //     interaction = Math.max(ratioN, ratioV);
  //     eqUsed = "Overstressed in single direction";
  //     pass = false;
  //   } else if (n_ua <= 0.2 * phiNn) {
  //     interaction = ratioV;
  //     eqUsed = "Eq. 2 (Vua / phiVn <= 1.0)";
  //     pass = ratioV <= 1.0;
  //   } else if (v_ua <= 0.2 * phiVn) {
  //     interaction = ratioN;
  //     eqUsed = "Eq. 1 (Nua / phiNn <= 1.0)";
  //     pass = ratioN <= 1.0;
  //   } else {
  //     interaction = ratioN + ratioV;
  //     eqUsed = "Eq. 3 (Nua/phiNn + Vua/phiVn <= 1.2)";
  //     pass = interaction <= 1.2;
  //   }
  // } else { 
  //   interaction = 0;
  //   eqUsed = "No load";
  //   pass = true;
  // }

    // ---------------- DIRECT SUM INTERACTION ----------------
  const ratioN = n_ua / Math.max(phiNn, 0.001);
  const ratioV = v_ua / Math.max(phiVn, 0.001);

  let interaction = 0;
  let eqUsed = "";
  let pass = false;

  if (v_ua <= 0 && n_ua > 0) { 
    interaction = ratioN;
    eqUsed = "Tension Ratio (Nua / phiNn <= 1.0)";
    pass = ratioN <= 1.0;
  } else if (n_ua <= 0 && v_ua > 0) { 
    interaction = ratioV;
    eqUsed = "Shear Ratio (Vua / phiVn <= 1.0)";
    pass = ratioV <= 1.0;
  } else if (n_ua > 0 && v_ua > 0) { 
    // Always sum the utilization ratios directly when both loads exist
    interaction = ratioN + ratioV;
    eqUsed = "Combined (Nua/phiNn + Vua/phiVn <= 1.0)";
    pass = interaction <= 1.0; // Standard unity check limit
  } else { 
    interaction = 0;
    eqUsed = "No load";
    pass = true;
  }


  return {
    ductilityText: is_ductile_system ? "Ductile" : `Non-Ductile (${ductility_reasons.join("; ") || "Failed"})`,
    phiNn: isNaN(phiNn) ? 0 : phiNn,
    phiVn: isNaN(phiVn) ? 0 : phiVn,
    interaction: isNaN(interaction) ? 0 : interaction,
    eqUsed,
    pass,
    breakdown: {
      phi_Nsa, phi_Ncb, phi_Npn, phi_Nsb,
      phi_Vsa, phi_Vcb, phi_Vcp,
      Nsa_tot, Ncb_tot, Npn_tot, Nsb_tot,
      Vsa_tot, Vcb_tot, Vcp_tot,
      phi_steel_N, phi_conc_N, seismic_factor,
      phi_steel_V, phi_conc_V,
      gov_conc_mode_N, gov_conc_mode_V
    }
  };
}

// ---------------------------------------------------------------
// Local Storage Handling
// ---------------------------------------------------------------
function loadSavedInputs() {
  const savedData = localStorage.getItem("anchorAppInputs");
  if (savedData) {
    try {
      const inputs = JSON.parse(savedData);
      Object.keys(inputs).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.value = inputs[id];
        }
      });
    } catch (e) {
      console.error("Failed to load saved inputs:", e);
    }
  }
}

function saveCurrentInputs() {
  const inputs = {};
  document.querySelectorAll("input, select").forEach(el => {
    if (el.id) {
      inputs[el.id] = el.value;
    }
  });
  localStorage.setItem("anchorAppInputs", JSON.stringify(inputs));
}

// ---------------------------------------------------------------
// App Controller
// ---------------------------------------------------------------
function refresh() {
  const inputs = readInputs();
  
  updateSpacingInputs(inputs);
  updateAreaInputs(inputs);

  const side = drawSideView(inputs);
  document.getElementById("side-view").innerHTML = side.svg;

  const top = drawTopView(inputs);
  document.getElementById("top-view").innerHTML = top.svg;

  const results = calculateResults(inputs);

  document.getElementById("res-ductility").textContent = results.ductilityText;
  document.getElementById("res-nn").textContent = `${results.phiNn.toFixed(1)} kips`;
  document.getElementById("res-nua").textContent = `${inputs.n_ua.toFixed(1)} kips`;
  document.getElementById("res-vn").textContent = `${results.phiVn.toFixed(1)} kips`;
  document.getElementById("res-vua").textContent = `${inputs.v_ua.toFixed(1)} kips`;
  document.getElementById("res-interaction").textContent = `${results.interaction.toFixed(2)} (${results.eqUsed})`;

  const statusBox = document.getElementById("status-box");
  const statusText = document.getElementById("status-text");
  statusBox.className = `status-box ${results.pass ? "good" : "bad"}`;
  statusText.textContent = results.pass ? "PASS" : "FAIL / OVERLOAD";

  // Render Detailed Capacity Breakdown showing factors
  const bd = results.breakdown;
  const breakdownEl = document.getElementById("capacity-breakdown");
  if (breakdownEl) {
    const seismicStr = bd.seismic_factor !== 1.0 ? ` &times; Seismic (${bd.seismic_factor})` : "";
    
    breakdownEl.innerHTML = `
      <div class="bd-group">
        <strong>Tension Capacities (&phi;N<sub>n</sub>):</strong>
        <ul style="line-height: 1.6;">
          <li>Steel Capacity: N<sub>sa</sub> = ${bd.Nsa_tot.toFixed(1)} kips &times; &phi; (${bd.phi_steel_N}) = <strong>${bd.phi_Nsa.toFixed(1)} kips</strong></li>
          <li>Concrete Breakout: N<sub>cb</sub> = ${bd.Ncb_tot.toFixed(1)} kips &times; &phi; (${bd.phi_conc_N})${seismicStr} = <strong>${bd.phi_Ncb.toFixed(1)} kips</strong></li>
          <li>Pullout Strength: N<sub>pn</sub> = ${bd.Npn_tot.toFixed(1)} kips &times; &phi; (${bd.phi_conc_N})${seismicStr} = <strong>${bd.phi_Npn.toFixed(1)} kips</strong></li>
          ${bd.Nsb_tot !== Infinity ? `<li>Side-Face Blowout: N<sub>sb</sub> = ${bd.Nsb_tot.toFixed(1)} kips &times; &phi; (${bd.phi_conc_N})${seismicStr} = <strong>${bd.phi_Nsb.toFixed(1)} kips</strong></li>` : ''}
        </ul>
        <div style="font-size: 0.9em; color: #444; margin-top: 5px;"><em>Governing Concrete Mode: ${bd.gov_conc_mode_N}</em></div>
      </div>
      <div class="bd-group" style="margin-top: 15px;">
        <strong>Shear Capacities (&phi;V<sub>n</sub>):</strong>
        <ul style="line-height: 1.6;">
          <li>Steel Capacity: V<sub>sa</sub> = ${bd.Vsa_tot.toFixed(1)} kips &times; &phi; (${bd.phi_steel_V}) = <strong>${bd.phi_Vsa.toFixed(1)} kips</strong></li>
          <li>Concrete Breakout: V<sub>cb</sub> = ${bd.Vcb_tot.toFixed(1)} kips &times; &phi; (${bd.phi_conc_V}) = <strong>${bd.phi_Vcb.toFixed(1)} kips</strong></li>
          <li>Concrete Pryout: V<sub>cp</sub> = ${bd.Vcp_tot.toFixed(1)} kips &times; &phi; (${bd.phi_conc_V}) = <strong>${bd.phi_Vcp.toFixed(1)} kips</strong></li>
        </ul>
        <div style="font-size: 0.9em; color: #444; margin-top: 5px;"><em>Governing Concrete Mode: ${bd.gov_conc_mode_V}</em></div>
      </div>
    `;
  }
}

// Load inputs before attaching listeners so the loaded data isn't overwritten immediately
loadSavedInputs();

document.querySelectorAll("input, select").forEach((el) => {
  el.addEventListener("input", () => {
    refresh();
    saveCurrentInputs();
  });
  el.addEventListener("change", () => {
    refresh();
    saveCurrentInputs();
  });
});

// Run initial calculation with the loaded or default data
refresh();

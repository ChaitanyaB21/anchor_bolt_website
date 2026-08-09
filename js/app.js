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

function getMaterialProperties(materialName, diameterVal) {
  const d = parseFloat(diameterVal);
  switch (materialName) {
    case "A307-Type A, Fu=60": return { fya: 0, futa: 60, ductile: true };
    case "A36": return { fya: 36, futa: 58, ductile: true };
    case "F1554 Gr 36": return { fya: 36, futa: 58, ductile: true };
    case "F1554 Gr 55":
      if (d <= 2.0) return { fya: 55, futa: 75, ductile: true };
      else return { fya: 55, futa: 75, ductile: false };
    case "F1554 Gr 105": return { fya: 105, futa: 125, ductile: true };
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
    case "A320 Gr L7": return { fya: 105, futa: 125, ductile: true };
    default: return { fya: 105, futa: 125, ductile: true };
  }
}

function readInputs() {
  const num = (id, fallback = 0) => {
    const v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? fallback : v;
  };
  const val = (id) => document.getElementById(id).value;

  return {
    n_ua: num("n_ua", 0), v_ua: num("v_ua", 0), shear_dir: val("shear_dir"), grout_pad: val("grout_pad"),
    ductility_req: val("ductility_req"), seismic_cat: val("seismic_cat"), f_c: num("f_c", 4500), cracking_factor: val("cracking_factor"),
    psi_m_n: num("psi_m_n", 1), reinf_tension: val("reinf_tension"), reinf_shear: val("reinf_shear"),
    supp_reinf_tension: val("supp_reinf_tension"), supp_reinf_shear: val("supp_reinf_shear"),
    anchor_material: val("anchor_material"), diameter: val("diameter"), hef: Math.max(num("hef", 1), 0.1), ha: Math.max(num("ha", 1), 0.1),
    n_tension: parseInt(val("n_tension"), 10), n_shear: parseInt(val("n_shear"), 10),
    manual_anc: val("manual_anc"), anc_value: num("anc_value", 0), manual_avc: val("manual_avc"), avc_value: num("avc_value", 0),
    e_n: num("e_n", 0), s_direction: val("s_direction"), e_v: num("e_v", 0),
    ca1_t: Math.max(num("ca1_t", 0.1), 0.1), ca2_t: Math.max(num("ca2_t", 0.1), 0.1), ca3_t: Math.max(num("ca3_t", 0.1), 0.1), ca4_t: Math.max(num("ca4_t", 0.1), 0.1),
    s1_t: Math.max(num("s1_t", 0), 0), s2_t: Math.max(num("s2_t", 0), 0),
    ca1_v: Math.max(num("ca1_v", 0.1), 0.1), ca2_v: Math.max(num("ca2_v", 0.1), 0.1),
    s1_v: Math.max(num("s1_v", 0), 0), s2_v: Math.max(num("s2_v", 0), 0),
    consider_plate: val("consider_plate"), nut_dia: num("nut_dia"), plate_dia: num("plate_dia"), plate_thick: num("plate_thick"),
  };
}

function updateSpacingInputs(inputs) {
  const s_dir_el = document.getElementById("s_direction");
  const s1_t_el = document.getElementById("s1_t");
  const s2_t_el = document.getElementById("s2_t");
  const s1_v_el = document.getElementById("s1_v");
  const s2_v_el = document.getElementById("s2_v");
  
  switch (inputs.n_tension) {
    case 4:
      s_dir_el.disabled = true; s1_t_el.disabled = false; s2_t_el.disabled = false;
      break;
    case 2:
      s_dir_el.disabled = false;
      if (inputs.s_direction === "s1") {
        s1_t_el.disabled = false; s2_t_el.disabled = true; s2_t_el.value = "0.00"; inputs.s2_t = 0;
      } else {
        s1_t_el.disabled = true; s2_t_el.disabled = false; s1_t_el.value = "0.00"; inputs.s1_t = 0;
      }
      break;
    default:
      s_dir_el.disabled = true; s1_t_el.disabled = true; s2_t_el.disabled = true;
      s1_t_el.value = "0.00"; s2_t_el.value = "0.00"; inputs.s1_t = 0; inputs.s2_t = 0;
      break;
  }
  
  if (inputs.n_shear <= 1) {
    s1_v_el.disabled = true; s2_v_el.disabled = true; s1_v_el.value = "0.00"; s2_v_el.value = "0.00"; inputs.s1_v = 0; inputs.s2_v = 0;
  } else if (inputs.n_shear === 2) {
    s1_v_el.disabled = false; s2_v_el.disabled = true; s2_v_el.value = "0.00"; inputs.s2_v = 0;
  } else {
    s1_v_el.disabled = false; s2_v_el.disabled = false;
  }

  const hefNoteEl = document.getElementById("hef_min_note");
  if (hefNoteEl) {
      hefNoteEl.style.display = (inputs.ductility_req === 'Yes') ? 'block' : 'none';
      const bolt = BOLT_PROPS[inputs.diameter] || BOLT_PROPS["2"];
      hefNoteEl.textContent = `Minimum h_ef,min = ${bolt.hef_min.toFixed(1)} in.`;
  }

  const plateInputsGroup = document.getElementById("plate-inputs-group");
  if(plateInputsGroup) {
      plateInputsGroup.style.display = (inputs.consider_plate === 'Yes') ? 'block' : 'none';
  }
}

function getAnchorPositions(n, s_dir, s1, s2, c1, c2) {
    const positions = [];
    switch (n) {
        case 1: positions.push([c1, c2]); break;
        case 2:
            if (s_dir === "s1") { positions.push([c1, c2], [c1 + s1, c2]); } 
            else { positions.push([c1, c2], [c1, c2 + s2]); }
            break;
        case 4:
            positions.push([c1, c2], [c1 + s1, c2], [c1, c2 + s2], [c1 + s1, c2 + s2]);
            break;
    }
    return positions;
}

function calculateAnc(inputs) {
  const { hef, ca1_t, ca2_t, ca3_t, ca4_t, s1_t, s2_t, n_tension } = inputs;
  const spanX = (n_tension === 2 && inputs.s_direction === 's1') || n_tension === 4 ? s1_t : 0;
  const spanY = (n_tension === 2 && inputs.s_direction === 's2') || n_tension === 4 ? s2_t : 0;
  const c1_eff = Math.min(ca1_t, 1.5 * hef);
  const c3_eff = Math.min(ca3_t, 1.5 * hef);
  const c2_eff = Math.min(ca2_t, 1.5 * hef);
  const c4_eff = Math.min(ca4_t, 1.5 * hef);
  const totalX = c1_eff + c3_eff + spanX;
  const totalY = c2_eff + c4_eff + spanY;
  return totalX * totalY;
}

function calculateAvc(inputs) {
  const { ca1_v, ca2_v, ha, s1_v, s2_v, n_shear, shear_dir } = inputs;
  if (n_shear === 0) return 0;
  const c_a1 = ca1_v;
  const h_eff = Math.min(ha, 1.5 * c_a1);
  const c_a2_eff = Math.min(ca2_v, 1.5 * c_a1);
  if (shear_dir === "perpendicular to edge") {
    const span2 = (n_shear > 1) ? s2_v : 0; 
    const totalWidth = 1.5 * c_a1 + c_a2_eff + span2;
    return totalWidth * h_eff;
  } else {
    const span1 = (n_shear > 1) ? s1_v : 0;
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
  } else { ancInput.readOnly = false; }
  if (inputs.manual_avc === "No") {
    avcInput.readOnly = true;
    const calcAvc = calculateAvc(inputs);
    avcInput.value = calcAvc.toFixed(2);
    inputs.avc_value = calcAvc;
  } else { avcInput.readOnly = false; }
}

// =================================================================
//                 --- DRAWING FUNCTIONS ---
// =================================================================

function drawSideView(inputs, scale) {
  const { hef, ha, ca1_t, ca3_t, n_tension, s_direction, s1_t, reinf_tension } = inputs;
  const W = 640, margin = 70;
  const parts = [];
  
  const numBoltsInRow = (n_tension === 1) ? 1 : (n_tension === 2 && s_direction === 's1') ? 2 : (n_tension === 4) ? 2 : 1;
  const span = (numBoltsInRow > 1) ? s1_t : 0;
  const memberW = ca1_t + span + ca3_t;
  
  const px = (x) => margin + x * scale;
  const py = (y) => margin + y * scale;
  
  // Dynamic scaling height ensuring enough space for deep break cones
  const maxDepth = Math.max(ha, hef + 5);
  const H = margin * 2 + maxDepth * scale;
  
  const clipId = "concrete-clip-side";
  parts.push(tag("defs", {}, tag("clipPath", { id: clipId }, tag("rect", { x: px(0), y: py(0), width: memberW * scale, height: ha * scale }))));
  parts.push(tag("rect", { x: px(0), y: py(0), width: memberW * scale, height: ha * scale, fill: "#e6e6e6", stroke: "#000", "stroke-width": 1.5 }));
  
  if (n_tension > 0) {
    const breakout = 1.5 * hef;
    const anchorXs = (numBoltsInRow === 1) ? [ca1_t] : Array.from({ length: numBoltsInRow }, (_, i) => ca1_t + i * s1_t);
    
    // Tension reinforcement straight vertical bars
    if (reinf_tension === 'Yes' && anchorXs.length > 0) {
        const rebarX1 = px(anchorXs[0]) - 20;
        const rebarX2 = px(anchorXs[anchorXs.length - 1]) + 20;
        const rebarY1 = py(0) + 20;
        const rebarY2 = py(ha) - 20;
        parts.push(line(rebarX1, rebarY1, rebarX1, rebarY2, { stroke: "black", "stroke-width": 2 }));
        parts.push(line(rebarX2, rebarY1, rebarX2, rebarY2, { stroke: "black", "stroke-width": 2 }));
    }

    const coneGroupParts = anchorXs.map(ax => tag("polygon", {
        points: `${px(ax)},${py(hef)} ${px(ax - breakout)},${py(0)} ${px(ax + breakout)},${py(0)}`,
        class: 'breakout-cone-tension'
    })).join("");
    parts.push(tag("g", { "clip-path": `url(#${clipId})` }, coneGroupParts));

    anchorXs.forEach(ax => {
        parts.push(line(px(ax), py(0), px(ax), py(hef), { "stroke-width": 4 }));
        parts.push(tag("rect", { x: px(ax) - 6, y: py(0) - 3, width: 12, height: 3, fill: "#000" }));
        const topY = py(0) - 26;
        parts.push(line(px(ax), py(0) - 2, px(ax), topY, { "stroke-width": 1.5 }));
        parts.push(tag("polygon", { points: `${px(ax) - 4},${topY + 8} ${px(ax) + 4},${topY + 8} ${px(ax)},${topY}`, fill: "#000" }));
        parts.push(text(px(ax), topY - 6, "Nu"));
    });

    const dimY = py(0) - 46;
    parts.push(line(px(0), dimY, px(ca1_t), dimY));
    parts.push(text(px(ca1_t) / 2, dimY - 5, `ca1=${ca1_t.toFixed(1)}"`));
    if (span > 0) {
        const dimY2 = py(0) - 60;
        parts.push(line(px(ca1_t), dimY2, px(ca1_t + span), dimY2));
        parts.push(text(px(ca1_t + span/2), dimY2 - 5, `s1=${span.toFixed(1)}"`));
    }
  }

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
  
  // Height Auto scaling injected here
  return { svg: tag("svg", { viewBox: `0 0 680 ${H}`, style: "max-height: none; height: auto;", xmlns: "http://www.w3.org/2000/svg" }, parts.join("")) };
}

function drawTopView(inputs, scale) {
  const { ca1_t, ca2_t, ca3_t, ca4_t, s1_t, s2_t, n_tension, s_direction, shear_dir, reinf_shear, ca1_v } = inputs;
  const W = 640, margin = 70;
  const anchorPos = getAnchorPositions(n_tension, s_direction, s1_t, s2_t, ca1_t, ca2_t);
  const spanX = (n_tension === 2 && s_direction === 's1') || n_tension === 4 ? s1_t : 0;
  const spanY = (n_tension === 2 && s_direction === 's2') || n_tension === 4 ? s2_t : 0;
  const memberW = ca1_t + ca3_t + spanX;
  const memberD = ca2_t + ca4_t + spanY;
  
  const renderW = memberW * scale;
  const renderH = memberD * scale;
  const px = (x) => margin + x * scale;
  const py = (y) => margin + y * scale;
  const H = margin * 2 + memberD * scale;
  
  const parts = [];
  
  parts.push(tag("rect", { x: px(0), y: py(0), width: renderW, height: renderH, fill: "var(--grey-light)", stroke: "#000", "stroke-width": 1.5 }));
  
  if (anchorPos.length > 0 && inputs.n_shear > 0) {
      if (shear_dir === 'perpendicular to edge') {
        const backY = py(ca2_t + spanY + 1.5 * ca1_v);
        const backLeftX = px(ca1_t - 1.5 * ca1_v);
        const backRightX = px(ca1_t + spanX + 1.5 * ca1_v);
        
      }
  }

  // Shear rebar hook - wrapping the anchors 
  if (reinf_shear === 'Yes' && anchorPos.length > 0) {
      const hookOffset = 15;
      const legLength = 100;
      const bendRadius = 8;
      
      if (shear_dir === 'perpendicular to edge') {
          // Wrapped around the left side (front), legs extending right
          const leftX = px(ca1_t) - hookOffset;
          const rightX = px(ca1_t + spanX) + legLength;
          const topY = py(ca2_t) - hookOffset;
          const botY = py(ca2_t + spanY) + hookOffset;
          
          const pathData = `M ${rightX},${topY} 
                            L ${leftX + bendRadius},${topY}
                            A ${bendRadius},${bendRadius} 0 0 0 ${leftX},${topY + bendRadius}
                            L ${leftX},${botY - bendRadius}
                            A ${bendRadius},${bendRadius} 0 0 0 ${leftX + bendRadius},${botY}
                            L ${rightX},${botY}`;
          parts.push(tag('path', { d: pathData, stroke: "black", "stroke-width": 2, fill: "none" }));
      } else {
          // Wrapped around the top side, legs extending down
          const topY = py(ca2_t) - hookOffset;
          const botY = py(ca2_t + spanY) + legLength;
          const leftX = px(ca1_t) - hookOffset;
          const rightX = px(ca1_t + spanX) + hookOffset;
          
          const pathData = `M ${leftX},${botY}
                            L ${leftX},${topY + bendRadius}
                            A ${bendRadius},${bendRadius} 0 0 1 ${leftX + bendRadius},${topY}
                            L ${rightX - bendRadius},${topY}
                            A ${bendRadius},${bendRadius} 0 0 1 ${rightX},${topY + bendRadius}
                            L ${rightX},${botY}`;
          parts.push(tag('path', { d: pathData, stroke: "black", "stroke-width": 2, fill: "none" }));
      }
  }

  anchorPos.forEach(([ax, ay]) => {
    parts.push(tag("circle", { cx: px(ax), cy: py(ay), r: 7, fill: "none", stroke: "#000", "stroke-width": 1.5 }));
    parts.push(tag("circle", { cx: px(ax), cy: py(ay), r: 2.2, fill: "#000" }));
  });

  if (anchorPos.length > 0) {
      const [ax0, ay0] = anchorPos[0];
      if (inputs.n_shear > 0) {
          if (shear_dir === "perpendicular to edge") {
              const y = py(ay0);
              parts.push(line(px(ax0) - 9, y, px(0) - 24, y, { "stroke-width": 2, stroke: 'var(--black)' }));
              parts.push(tag("polygon", { points: `${px(0) - 15},${y - 4} ${px(0) - 15},${y + 4} ${px(0) - 25},${y}`, fill: 'var(--black)' }));
              parts.push(text(px(0) - 32, y - 8, "Vu", { "text-anchor": "end", fill: 'var(--black)' }));
          } else { 
              const x = px(ax0);
              parts.push(line(x, py(ay0) - 9, x, py(0) - 24, { "stroke-width": 2, stroke: 'var(--black)' }));
              parts.push(tag("polygon", { points: `${x-4},${py(0)-15} ${x+4},${py(0)-15} ${x},${py(0)-25}`, fill: 'var(--black)' }));
              parts.push(text(x + 8, py(0) - 24, "Vu", { "text-anchor": "start", fill: 'var(--black)' }));
          }
      }
      const dimTopY = py(0) - 14;
      parts.push(line(px(0), dimTopY, px(ax0), dimTopY));
      parts.push(text(px(ax0 / 2), dimTopY - 5, `ca1=${ca1_t.toFixed(1)}"`));
      const lastAx = px(ca1_t + spanX);
      const dimBotY = py(memberD) + 22;
      parts.push(line(lastAx, dimBotY, px(memberW), dimBotY));
      parts.push(text((lastAx + px(memberW)) / 2, dimBotY + 12, `ca3=${ca3_t.toFixed(1)}"`));
      const dimLeftX = px(0) - 14;
      parts.push(line(dimLeftX, py(0), dimLeftX, py(ay0)));
      parts.push(text(dimLeftX - 20, py(ay0 / 2), `ca2=${ca2_t.toFixed(1)}"`, { transform: `rotate(-90 ${dimLeftX - 20} ${py(ay0/2)})` }));
      const lastAy = py(ca2_t + spanY);
      const dimRightX = px(memberW) + 22;
      parts.push(line(dimRightX, lastAy, dimRightX, py(memberD)));
      parts.push(text(dimRightX + 20, (lastAy + py(memberD)) / 2, `ca4=${ca4_t.toFixed(1)}"`, { transform: `rotate(-90 ${dimRightX + 20} ${(lastAy + py(memberD)) / 2})` }));
      if (spanX > 0) {
        const y = py(ca2_t + spanY) + 22;
        parts.push(line(px(ca1_t), y, px(ca1_t + spanX), y));
        parts.push(text(px(ca1_t + spanX / 2), y + 12, `s1=${spanX.toFixed(1)}"`));
      }
      if (spanY > 0) {
        const x = px(ca1_t + spanX) + 26;
        parts.push(line(x, py(ca2_t), x, py(ca2_t + spanY)));
        parts.push(text(x - 16, py(ca2_t + spanY / 2), `s2=${spanY.toFixed(1)}"`, { transform: `rotate(-90 ${x - 16} ${py(ca2_t + spanY / 2)})` }));
      }
  }
  
  // Height Auto scaling injected here
  return { svg: tag("svg", { viewBox: `0 0 680 ${H}`, style: "max-height: none; height: auto;", xmlns: "http://www.w3.org/2000/svg" }, parts.join("")) };
}


// =================================================================
//                 --- CALCULATION ENGINE ---
// =================================================================

function calculateResults(inputs) {
  const { n_ua, v_ua, shear_dir, grout_pad, ductility_req, seismic_cat, f_c, cracking_factor, psi_m_n, reinf_tension, reinf_shear, supp_reinf_tension, supp_reinf_shear, anchor_material, diameter, hef, ha, n_tension, n_shear, anc_value, avc_value, e_n, e_v, ca1_t, ca2_t, ca3_t, ca4_t, s1_t, s2_t, ca1_v, ca2_v, s1_v, s2_v, consider_plate, nut_dia, plate_dia, plate_thick } = inputs;
  const breakdown = {}; 
  const isSeismic = (seismic_cat !== "A, B") || (ductility_req === "Yes");
  const bolt = BOLT_PROPS[diameter] || BOLT_PROPS["2"];
  const mat = getMaterialProperties(anchor_material, diameter);
  const { ase, da } = bolt;
  const fya = mat.fya;
  const futa = Math.min(mat.futa, 125, 1.9 * fya);
  let abrg = bolt.abrg;

  const phi_steel_N = 0.75, phi_steel_V = 0.65;
  const phi_conc_N = (reinf_tension === "Yes" || supp_reinf_tension === "Yes") ? 0.75 : 0.70;
  const phi_conc_V = (reinf_shear === "Yes" || supp_reinf_shear === "Yes") ? 0.75 : 0.70;
  breakdown.phi = { phi_steel_N, phi_steel_V, phi_conc_N, phi_conc_V };
  
  let phiNn = Infinity;
  if (n_tension > 0) {
      const Nsa_tot = (ase * futa) * n_tension;
      breakdown.Nsa = { ase, futa, n_tension, Nsa_tot, phi_Nsa: phi_steel_N * Nsa_tot };
      const Anco = 9 * hef * hef;
      const psi_ec_N = 1 / (1 + e_n / (1.5 * hef));
      const ca_min = Math.min(ca1_t, ca2_t, ca3_t, ca4_t);
      const psi_ed_N = (ca_min < 1.5 * hef) ? 0.7 + 0.3 * (ca_min / (1.5 * hef)) : 1.0;
      const Nb = 24 * 1.0 * Math.sqrt(f_c) * hef ** 1.5 / 1000.0;
      const Ncb_tot = (anc_value / Anco) * psi_ec_N * psi_ed_N * 1.0 * ((ca_min < 1.5 * hef) ? Math.max(ca_min / (1.5 * hef), 1 / n_tension) : 1.0) * psi_m_n * Nb;
      const seismic_factor_N = isSeismic ? 0.75 : 1.0;
      breakdown.Ncb = { anc_value, Anco, psi_ec_N, psi_ed_N, psi_m_n, Nb, Ncb_tot, phi_Ncb: phi_conc_N * Ncb_tot * seismic_factor_N, e_n, hef, ca_min, f_c, seismic_factor_N };
      let plate_calcs = {};
      if (consider_plate === "Yes") {
          const abolt = (Math.PI / 4) * (da ** 2), d_plate_gross = Math.min(nut_dia + 2 * plate_thick, plate_dia), a_plate_gross = (Math.PI / 4) * (d_plate_gross ** 2);
          abrg = a_plate_gross - abolt;
          plate_calcs = { abolt, d_plate_gross, a_plate_gross };
      }
      const Npn_tot = (8 * abrg * f_c / 1000.0) * n_tension * 1.0;
      breakdown.Npn = { abrg, f_c, Np: Npn_tot/n_tension, n_tension, Npn_tot, phi_Npn: phi_conc_N * Npn_tot * seismic_factor_N, abrg_orig: bolt.abrg, plate_calcs };
      let Nsb_tot = 1e9; 
      const Nsb_applies = hef > 2.5 * ca1_t;
      if (Nsb_applies) {
          Nsb_tot = (160 * ca1_t * Math.sqrt(abrg) * Math.sqrt(f_c) / 1000.0) * n_tension;
      }
      const phi_Nsb = Nsb_applies ? phi_conc_N * Nsb_tot * seismic_factor_N : 1e9;
      breakdown.Nsb = { Nsb_applies, ca1_t, hef, abrg, f_c, Nsb_tot, phi_Nsb, seismic_factor_N };

      phiNn = Math.min(breakdown.Nsa.phi_Nsa, breakdown.Ncb.phi_Ncb, breakdown.Npn.phi_Npn, phi_Nsb);
      let gov_conc_mode_N = (phiNn === breakdown.Nsa.phi_Nsa) ? "Steel" : (phiNn === breakdown.Ncb.phi_Ncb) ? "Concrete Breakout" : (phiNn === breakdown.Npn.phi_Npn) ? "Pullout" : "Side-Face Blowout";
      if (reinf_tension === "Yes") { 
          phiNn = Math.min(breakdown.Nsa.phi_Nsa, breakdown.Npn.phi_Npn, phi_Nsb); 
          gov_conc_mode_N = (phiNn === breakdown.Nsa.phi_Nsa) ? "Steel" : (phiNn === breakdown.Npn.phi_Npn) ? "Pullout" : "Side-Face Blowout"; 
      }
      breakdown.gov_N = { phiNn, gov_conc_mode_N };

      const steel_ductility_cap = 1.2 * Nsa_tot;
      let ductility_reasons = [];
      if (!mat.ductile) ductility_reasons.push("Material is non-ductile");
      if (reinf_tension !== "Yes") {
          if (Ncb_tot < steel_ductility_cap) ductility_reasons.push("Concrete breakout is non-ductile");
          if (Npn_tot < steel_ductility_cap) ductility_reasons.push("Pullout is non-ductile");
          if (Nsb_applies && Nsb_tot < steel_ductility_cap) ductility_reasons.push("Side-face blowout is non-ductile");
      }
      breakdown.ductility = { is_ductile_system: mat.ductile && (reinf_tension === "Yes" || ductility_reasons.length === 0), ductility_reasons, steel_ductility_cap };
  } else { 
      breakdown.gov_N = { phiNn: 0, gov_conc_mode_N: 'N/A'};
      breakdown.ductility = { is_ductile_system: true, ductility_reasons: [] };
  }

  let phiVn = Infinity;
  if (n_shear > 0) {
      const Vsa_tot = (0.6 * ase * futa * (grout_pad === "Yes" ? 0.8 : 1.0)) * n_shear;
      breakdown.Vsa = { ase, futa, n_shear, grout_factor: (grout_pad === "Yes" ? 0.8 : 1.0), Vsa_tot, phi_Vsa: phi_steel_V * Vsa_tot };
      const le = Math.min(8 * da, hef);
      const Vb = (7 * (le / da)**0.2 * Math.sqrt(da) * Math.sqrt(f_c) * ca1_v**1.5) / 1000;
      const Avco = 4.5 * ca1_v**2;
      const psi_ec_V = 1 / (1 + e_v / (1.5 * ca1_v));
      const psi_ed_V = (ca2_v < 1.5 * ca1_v) ? 0.7 + 0.3 * (ca2_v / (1.5 * ca1_v)) : 1.0;
      const psi_c_V_val = parseFloat(cracking_factor.split('_')[0]) || 1.0;
      const psi_h_V = Math.sqrt(1.5 * ca1_v / ha);
      const Vcb_tot = (avc_value / Avco) * psi_ec_V * psi_ed_V * psi_c_V_val * psi_h_V * Vb * (shear_dir === "parallel to edge" ? 2 : 1);
      breakdown.Vcb = { avc_value, Avco, psi_ec_V, psi_ed_V, psi_c_V_val, psi_h_V, Vb, Vcb_tot, phi_Vcb: phi_conc_V * Vcb_tot, le, da, f_c, ca1_v, ca2_v, e_v, ha };
      const kcp = (hef < 2.5) ? 1.0 : 2.0;
      const Vcp_tot = kcp * (breakdown.Ncb?.Ncb_tot || 0);
      breakdown.Vcp = { kcp, Ncb_val: breakdown.Ncb?.Ncb_tot || 0, Vcp_tot, phi_Vcp: phi_conc_V * Vcp_tot };
      phiVn = Math.min(breakdown.Vsa.phi_Vsa, breakdown.Vcb.phi_Vcb, breakdown.Vcp.phi_Vcp);
      let gov_conc_mode_V = (phiVn === breakdown.Vsa.phi_Vsa) ? "Steel" : (phiVn === breakdown.Vcb.phi_Vcb) ? "Concrete Breakout" : "Concrete Pryout";
      if (reinf_shear === "Yes") { phiVn = Math.min(breakdown.Vsa.phi_Vsa, breakdown.Vcp.phi_Vcp); gov_conc_mode_V = (phiVn === breakdown.Vsa.phi_Vsa) ? "Steel" : "Concrete Pryout"; }
      breakdown.gov_V = { phiVn, gov_conc_mode_V };
  } else {
      breakdown.gov_V = { phiVn: 0, gov_conc_mode_V: 'N/A' };
  }
  
  const ratioN = (n_ua > 0 && isFinite(phiNn) && phiNn > 0) ? n_ua / phiNn : 0;
  const ratioV = (v_ua > 0 && isFinite(phiVn) && phiVn > 0) ? v_ua / phiVn : 0;
  const isCombined = n_ua > 0 && v_ua > 0;
  let interaction = ratioN + ratioV, eqUsed = "N/A", limit = 1.0;
  if(isCombined) {
      limit = 1.2;
      eqUsed = "Eq. 17.8.3: (N/phiNn + V/phiVn)";
      if (breakdown.gov_N.gov_conc_mode_N === 'Steel' || breakdown.gov_V.gov_conc_mode_V === 'Steel') {
        eqUsed = "Eq. 17.8.2: (N/phiNn + V/phiVn)";
        limit = 1.2;
      }
  }
  const pass = interaction <= limit;
  breakdown.interaction = { ratioN, ratioV, interaction, eqUsed, pass, isCombined, limit };
  
  const ductilityText = breakdown.ductility.is_ductile_system ? "Ductile" : `Non-Ductile (${breakdown.ductility.ductility_reasons.length > 0 ? breakdown.ductility.ductility_reasons[0].slice(0,25) : '...'})`;
  return { ductilityText, plateEffectText: consider_plate === "Yes" ? "Considered" : "Not Considered", phiNn: isFinite(phiNn) ? phiNn : 0, phiVn: isFinite(phiVn) ? phiVn : 0, interaction: isNaN(interaction) ? 0 : interaction, eqUsed, pass, breakdown };
}

function refresh() {
  const inputs = readInputs();
  updateSpacingInputs(inputs);
  updateAreaInputs(inputs);
  
  // -- Unified Scale based exclusively on standard physical member width --
  const W = 450, margin = 70;
  const numBoltsInRow = (inputs.n_tension === 1) ? 1 : (inputs.n_tension === 2 && inputs.s_direction === 's1') ? 2 : (inputs.n_tension === 4) ? 2 : 1;
  const spanT = (numBoltsInRow > 1) ? inputs.s1_t : 0;
  const memberW = inputs.ca1_t + spanT + inputs.ca3_t;
  
  const scale = (W - 2 * margin) / (memberW || 1); 
  
  const side = drawSideView(inputs, scale);
  document.getElementById("side-view").innerHTML = side.svg;
  const top = drawTopView(inputs, scale);
  document.getElementById("top-view").innerHTML = top.svg;
  
  const results = calculateResults(inputs);
  
  localStorage.setItem("anchorCalcData", JSON.stringify({ inputs, results }));
  
  document.getElementById("res-ductility").textContent = results.ductilityText;
  document.getElementById("res-plate-effect").textContent = results.plateEffectText;
  document.getElementById("res-nn").textContent = `${results.phiNn.toFixed(1)} kips`;
  document.getElementById("res-nua").textContent = `${inputs.n_ua.toFixed(1)} kips`;
  document.getElementById("res-vn").textContent = `${results.phiVn.toFixed(1)} kips`;
  document.getElementById("res-vua").textContent = `${inputs.v_ua.toFixed(1)} kips`;
  document.getElementById("res-interaction").textContent = `${results.interaction.toFixed(2)}`;
  const statusBox = document.getElementById("status-box");
  statusBox.className = `status-box ${results.pass ? "good" : "bad"}`;
  document.getElementById("status-text").textContent = results.pass ? "PASS" : "FAIL / OVERLOAD";
  
  const bd = results.breakdown;
  const breakdownEl = document.getElementById("capacity-breakdown");
  if (breakdownEl && bd.gov_N && bd.gov_V) {
      let tHTML = `<strong>Tension (&phi;N<sub>n</sub>):</strong><ul>`;
      if(inputs.n_tension>0) tHTML += `<li>Steel: <strong>${bd.Nsa.phi_Nsa.toFixed(1)} kips</strong></li><li>Breakout: <strong>${bd.Ncb.phi_Ncb.toFixed(1)} kips</strong></li><li>Pullout: <strong>${bd.Npn.phi_Npn.toFixed(1)} kips</strong></li>` + (bd.Nsb.Nsb_applies ? `<li>Side-Face: <strong>${bd.Nsb.phi_Nsb.toFixed(1)} kips</strong></li>` : '');
      else tHTML += `<li>N/A</li>`;
      tHTML += `</ul><em>Gov: ${bd.gov_N.gov_conc_mode_N||'N/A'}</em>`;
      let sHTML = `<strong>Shear (&phi;V<sub>n</sub>):</strong><ul>`;
      if(inputs.n_shear>0) sHTML += `<li>Steel: <strong>${bd.Vsa.phi_Vsa.toFixed(1)} kips</strong></li><li>Breakout: <strong>${bd.Vcb.phi_Vcb.toFixed(1)} kips</strong></li><li>Pryout: <strong>${bd.Vcp.phi_Vcp.toFixed(1)} kips</strong></li>`;
      else sHTML += `<li>N/A</li>`;
      sHTML += `</ul><em>Gov: ${bd.gov_V.gov_conc_mode_V||'N/A'}</em>`;
      breakdownEl.innerHTML = `<div class="bd-group">${tHTML}</div><div class="bd-group">${sHTML}</div>`;
  }
}

function loadSavedInputs() {
  const savedData = localStorage.getItem("anchorAppInputs");
  if (savedData) { try { const d = JSON.parse(savedData); Object.keys(d).forEach(id => { const el = document.getElementById(id); if (el) el.value = d[id]; }); } catch (e) { console.error(e); } }
}
function saveCurrentInputs() {
  const d = {};
  document.querySelectorAll("input, select").forEach(el => { if (el.id) d[el.id] = el.value; });
  localStorage.setItem("anchorAppInputs", JSON.stringify(d));
}

document.addEventListener("DOMContentLoaded", () => {
  loadSavedInputs();
  document.querySelectorAll("input, select").forEach((el) => {
      const h = () => { refresh(); saveCurrentInputs(); };
      el.addEventListener("input", h); el.addEventListener("change", h);
  });
  refresh();

  document.getElementById("show-calcs-btn").addEventListener("click", () => {
    window.open('calcs.html', '_blank');
  });
  
  const root = document.documentElement;
  const rL = document.getElementById("resizer-left");
  const rR = document.getElementById("resizer-right");
  const sIW = localStorage.getItem("inputPanelWidth");
  const sRW = localStorage.getItem("resultsPanelWidth");
  if (sIW) root.style.setProperty("--input-panel-width", sIW);
  if (sRW) root.style.setProperty("--results-panel-width", sRW);
  const cR = (r, p) => {
      if (!r) return;
      let isR = false;
      r.addEventListener("mousedown", (e) => { isR = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; e.preventDefault(); });
      document.addEventListener("mousemove", (e) => {
          if (!isR) return;
          const sP = p === "--input-panel-width" ? r.previousElementSibling : r.nextElementSibling;
          const nW = p === "--input-panel-width" ? e.clientX - sP.getBoundingClientRect().left : sP.getBoundingClientRect().right - e.clientX;
          if (nW > 150) root.style.setProperty(p, `${nW}px`);
      });
      document.addEventListener("mouseup", () => {
          if (isR) { isR = false; document.body.style.cursor = "default"; document.body.style.userSelect = "auto"; localStorage.setItem(p.replace("--", ""), root.style.getPropertyValue(p)); }
      });
  };
  if (rL && rR) { cR(rL, "--input-panel-width"); cR(rR, "--results-panel-width"); }
  const mN = document.querySelector(".mobile-nav"), pns = document.querySelectorAll(".panel");
  const sP = (pId) => {
      pns.forEach(p => p.classList.remove("active"));
      document.querySelectorAll(".mobile-tab-btn").forEach(b => b.classList.remove("active"));
      const pS = document.getElementById(pId), tA = document.querySelector(`.mobile-tab-btn[data-panel="${pId}"]`);
      if (pS) pS.classList.add("active");
      if (tA) tA.classList.add("active");
  };
  if (mN) { mN.addEventListener("click", (e) => { if (e.target.matches(".mobile-tab-btn")) sP(e.target.dataset.panel); }); }
  if (window.innerWidth <= 860) { sP("input-panel"); } else { pns.forEach(p => p.classList.add("active")); }
});

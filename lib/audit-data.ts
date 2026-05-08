// Source of truth: parsed from 17 official audit PDFs (Q1 2026).
// DO NOT mutate. Only derive metrics.

export type AreaKey = "salon" | "cocina" | "calidad";
export type RiskLevel = "bajo" | "moderado" | "alto";
export type Tier = "EXCELENTE" | "ÓPTIMO" | "SATISFACTORIO" | "EN DESARROLLO" | "CRÍTICO";

export interface Location {
  id: string;
  name: string;
  file: string; // pdf filename in /informes/
  pdfUrl?: string; // full URL to download PDF
  fecha: string;
  auditores: string[];
  global: number;
  salon: number;
  cocina: number;
  calidad: number;
  fortalezas: number;
  noCumple: number;
  observaciones: number;
  riesgo: RiskLevel;
  accionRequerida: string;
}

export const locations: Location[] = [
  { id: "belgrano", name: "Belgrano", file: "Belgrano.pdf", pdfUrl: "/informes/Informe_Auditoria_Belgrano_Q1_2026.pdf", fecha: "1 de mayo de 2026", auditores: ["Diego", "Christian"], global: 80, salon: 79, cocina: 80, calidad: 81, fortalezas: 9, noCumple: 1, observaciones: 0, riesgo: "bajo", accionRequerida: "Corregir desvío de orden operativo en salón" },
  { id: "caballito", name: "Caballito", file: "Caballito.pdf", pdfUrl: "/informes/Informe_Auditoria_Caballito_Q1_2026.pdf", fecha: "2 de mayo de 2026", auditores: ["Diego", "Christian"], global: 89, salon: 91, cocina: 81, calidad: 86, fortalezas: 8, noCumple: 0, observaciones: 3, riesgo: "bajo", accionRequerida: "Sostener nivel y reforzar consistencia" },
  { id: "colegiales", name: "Colegiales", file: "Colegiales.pdf", pdfUrl: "/informes/Informe_Auditoria_Colegiales_Q1_2026.pdf", fecha: "1 de mayo de 2026", auditores: ["Gabriel", "Carlos"], global: 82, salon: 91, cocina: 80, calidad: 74, fortalezas: 18, noCumple: 4, observaciones: 3, riesgo: "moderado", accionRequerida: "Corregir desvíos en Calidad (producto frío) y reauditar" },
  { id: "dardo-rocha", name: "Dardo Rocha", file: "Dardo_Rocha.pdf", pdfUrl: "/informes/Informe_Auditoria_Dardo_Rocha_Q1_2026.pdf", fecha: "30 de abril de 2026", auditores: ["Carlos", "Gabriel"], global: 81, salon: 89, cocina: 69, calidad: 85, fortalezas: 21, noCumple: 2, observaciones: 1, riesgo: "moderado", accionRequerida: "Intervención en Cocina: BPM y equipamiento" },
  { id: "devoto", name: "Devoto", file: "Devoto.pdf", pdfUrl: "/informes/Informe_Auditoria_Devoto_Q1_2026.pdf", fecha: "29 de abril de 2026", auditores: ["Diego", "Christian"], global: 94, salon: 94, cocina: 97, calidad: 92, fortalezas: 38, noCumple: 0, observaciones: 1, riesgo: "bajo", accionRequerida: "Replicar prácticas a la red" },
  { id: "euskal", name: "Euskal", file: "Euskal.pdf", pdfUrl: "/informes/Informe_Auditoria_Euskal_Q1_2026.pdf", fecha: "27 de abril de 2026", auditores: ["Carlos"], global: 90, salon: 93, cocina: 83, calidad: 94, fortalezas: 46, noCumple: 1, observaciones: 2, riesgo: "bajo", accionRequerida: "Sostener excelencia, foco menor en Cocina" },
  { id: "las-canitas", name: "Las Cañitas", file: "Las_Canitas.pdf", pdfUrl: "/informes/Informe_Auditoria_Las_Canitas_Q1_2026.pdf", fecha: "1 de mayo de 2026", auditores: ["Gabriel", "Carlos"], global: 75, salon: 74, cocina: 77, calidad: 74, fortalezas: 1, noCumple: 0, observaciones: 4, riesgo: "bajo", accionRequerida: "Plan de acción transversal con responsable y fecha" },
  { id: "maschwitz", name: "Maschwitz", file: "Maschwitz.pdf", pdfUrl: "/informes/Informe_Auditoria_Maschwitz_Q1_2026.pdf", fecha: "28 de abril de 2026", auditores: ["Gabriel", "Carlos"], global: 82, salon: 84, cocina: 75, calidad: 88, fortalezas: 16, noCumple: 2, observaciones: 2, riesgo: "moderado", accionRequerida: "Reforzar Cocina: control de equipamiento y BPM" },
  { id: "nordelta", name: "Nordelta", file: "Nordelta.pdf", pdfUrl: "/informes/Informe_Auditoria_Nordelta_Q1_2026.pdf", fecha: "27 de abril de 2026", auditores: ["Carlos"], global: 79, salon: 73, cocina: 74, calidad: 90, fortalezas: 0, noCumple: 8, observaciones: 0, riesgo: "alto", accionRequerida: "Plan de acción inmediato en Salón y Cocina" },
  { id: "nunez", name: "Núñez", file: "Nunez.pdf", pdfUrl: "/informes/Informe_Auditoria_Nunez_Q1_2026.pdf", fecha: "27 de abril de 2026", auditores: ["Diego"], global: 96, salon: 97, cocina: 95, calidad: 96, fortalezas: 42, noCumple: 0, observaciones: 1, riesgo: "bajo", accionRequerida: "Benchmark de la red — replicar SOPs" },
  { id: "olivos", name: "Olivos", file: "Olivos.pdf", pdfUrl: "/informes/Informe_Auditoria_Olivos_Q1_2026.pdf", fecha: "27 de abril de 2026", auditores: ["Carlos"], global: 82, salon: 78, cocina: 87, calidad: 82, fortalezas: 28, noCumple: 6, observaciones: 5, riesgo: "moderado", accionRequerida: "Atender desvíos en Salón (experiencia y orden)" },
  { id: "palermo", name: "Palermo", file: "Palermo.pdf", pdfUrl: "/informes/Informe_Auditoria_Palermo_Q1_2026.pdf", fecha: "27 de abril de 2026", auditores: ["Diego"], global: 91, salon: 86, cocina: 89, calidad: 98, fortalezas: 41, noCumple: 0, observaciones: 1, riesgo: "bajo", accionRequerida: "Sostener excelencia; pulir Salón" },
  { id: "pilar", name: "Pilar", file: "Pilar.pdf", pdfUrl: "/informes/Informe_Auditoria_Pilar_Q1_2026.pdf", fecha: "28 de abril de 2026", auditores: ["Gabriel", "Carlos"], global: 74, salon: 71, cocina: 72, calidad: 78, fortalezas: 4, noCumple: 3, observaciones: 5, riesgo: "moderado", accionRequerida: "Plan transversal: Salón y Cocina" },
  { id: "tigre", name: "Tigre", file: "Tigre.pdf", pdfUrl: "/informes/Informe_Auditoria_Tigre_Q1_2026.pdf", fecha: "30 de abril de 2026", auditores: ["Carlos", "Gabriel"], global: 78, salon: 92, cocina: 90, calidad: 51, fortalezas: 30, noCumple: 5, observaciones: 3, riesgo: "alto", accionRequerida: "CRÍTICO en Calidad: revisión de ejecución de producto" },
  { id: "villa-crespo", name: "Villa Crespo", file: "Villa_Crespo.pdf", pdfUrl: "/informes/Informe_Auditoria_Villa_Crespo_Q1_2026.pdf", fecha: "27 de abril de 2026", auditores: ["Diego"], global: 87, salon: 85, cocina: 89, calidad: 88, fortalezas: 26, noCumple: 2, observaciones: 2, riesgo: "moderado", accionRequerida: "Reforzar consistencia en Salón" },
  { id: "villa-urquiza", name: "Villa Urquiza", file: "Villa_Urquiza.pdf", pdfUrl: "/informes/Informe_Auditoria_Villa_Urquiza_Q1_2026.pdf", fecha: "29 de abril de 2026", auditores: ["Diego", "Christian"], global: 79, salon: 89, cocina: 73, calidad: 76, fortalezas: 22, noCumple: 4, observaciones: 1, riesgo: "moderado", accionRequerida: "Intervenir en Cocina y Calidad" },
  { id: "villa-del-parque", name: "Villa del Parque", file: "Villa_del_Parque.pdf", pdfUrl: "/informes/Informe_Auditoria_Villa_del_Parque_Q1_2026.pdf", fecha: "1 de mayo de 2026", auditores: ["Gabriel", "Carlos"], global: 78, salon: 81, cocina: 88, calidad: 65, fortalezas: 14, noCumple: 5, observaciones: 3, riesgo: "alto", accionRequerida: "Corregir desvíos en Calidad y reauditar" },
];

export const AREAS: { key: AreaKey; label: string }[] = [
  { key: "salon", label: "Salón" },
  { key: "cocina", label: "Cocina" },
  { key: "calidad", label: "Calidad" },
];

export type Balance = "Equilibrado" | "Leve desbalance" | "Desbalance crítico";

export interface Derived {
  loc: Location;
  tier: Tier;
  balance: Balance;
  spread: number; // max-min between areas
  weakest: AreaKey;
  strongest: AreaKey;
  alert: "critical" | "warning" | "excellent" | "ok";
  alertReasons: string[];
  insight: string;
  focus: string;
  rank: number;
  deviation: number; // global - networkAvg
}

function tierFor(g: number): Tier {
  if (g >= 95) return "EXCELENTE";
  if (g >= 88) return "ÓPTIMO";
  if (g >= 80) return "SATISFACTORIO";
  if (g >= 70) return "EN DESARROLLO";
  return "CRÍTICO";
}

function balanceFor(spread: number): Balance {
  if (spread <= 8) return "Equilibrado";
  if (spread <= 20) return "Leve desbalance";
  return "Desbalance crítico";
}

export interface NetworkStats {
  avgGlobal: number;
  avgSalon: number;
  avgCocina: number;
  avgCalidad: number;
  totalFortalezas: number;
  totalNoCumple: number;
  totalObservaciones: number;
  count: number;
}

export function computeNetwork(locs: Location[]): NetworkStats {
  const n = locs.length || 1;
  const sum = (k: keyof Location) => locs.reduce((a, l) => a + (l[k] as number), 0);
  return {
    avgGlobal: +(sum("global") / n).toFixed(1),
    avgSalon: +(sum("salon") / n).toFixed(1),
    avgCocina: +(sum("cocina") / n).toFixed(1),
    avgCalidad: +(sum("calidad") / n).toFixed(1),
    totalFortalezas: sum("fortalezas"),
    totalNoCumple: sum("noCumple"),
    totalObservaciones: sum("observaciones"),
    count: locs.length,
  };
}

const AREA_LABEL: Record<AreaKey, string> = { salon: "Salón", cocina: "Cocina", calidad: "Calidad" };

export function computeDerived(locs: Location[], net: NetworkStats): Derived[] {
  const ranked = [...locs].sort((a, b) => b.global - a.global);
  const rankMap = new Map(ranked.map((l, i) => [l.id, i + 1]));

  return locs.map((loc) => {
    const areas: [AreaKey, number][] = [["salon", loc.salon], ["cocina", loc.cocina], ["calidad", loc.calidad]];
    const sorted = [...areas].sort((a, b) => a[1] - b[1]);
    const weakest = sorted[0][0];
    const strongest = sorted[2][0];
    const spread = sorted[2][1] - sorted[0][1];
    const tier = tierFor(loc.global);
    const balance = balanceFor(spread);

    let alert: Derived["alert"] = "ok";
    const reasons: string[] = [];
    const minArea = sorted[0][1];
    if (loc.global < 75 || minArea < 65 || spread > 20) {
      alert = "critical";
      if (loc.global < 75) reasons.push(`Global ${loc.global} < 75`);
      if (minArea < 65) reasons.push(`${AREA_LABEL[weakest]} ${minArea} < 65`);
      if (spread > 20) reasons.push(`Desbalance ${spread} pts entre áreas`);
    } else if (loc.global < 80 || minArea < 75) {
      alert = "warning";
      if (loc.global < 80) reasons.push(`Global ${loc.global} bajo 80`);
      if (minArea < 75) reasons.push(`${AREA_LABEL[weakest]} ${minArea} bajo 75`);
    } else if (loc.global > 90 && balance === "Equilibrado") {
      alert = "excellent";
      reasons.push("Performance equilibrada > 90");
    }

    const insight =
      balance === "Desbalance crítico"
        ? `Ejecución dispar: ${AREA_LABEL[strongest]} alto pero ${AREA_LABEL[weakest]} arrastra. Foco quirúrgico.`
        : alert === "excellent"
        ? `Caso de éxito. Documentar SOPs y replicar a la red.`
        : alert === "critical"
        ? `Intervención urgente. Plan de acción con responsable y fecha.`
        : alert === "warning"
        ? `En zona de riesgo. Reforzar controles antes del próximo trimestre.`
        : `Operación estable. Sostener consistencia.`;

    const focus = `Reforzar ${AREA_LABEL[weakest]} (${minArea}/100). Capitalizar ${AREA_LABEL[strongest]} (${sorted[2][1]}/100).`;

    return {
      loc,
      tier,
      balance,
      spread,
      weakest,
      strongest,
      alert,
      alertReasons: reasons,
      insight,
      focus,
      rank: rankMap.get(loc.id)!,
      deviation: +(loc.global - net.avgGlobal).toFixed(1),
    };
  });
}

export const TIER_COLORS: Record<Tier, string> = {
  EXCELENTE: "var(--excellent)",
  "ÓPTIMO": "var(--optimal)",
  SATISFACTORIO: "var(--satisfactory)",
  "EN DESARROLLO": "var(--developing)",
  "CRÍTICO": "var(--critical)",
};

export const ALL_AUDITORS = Array.from(
  new Set(locations.flatMap((l) => l.auditores)),
).sort();

export const TIERS: Tier[] = ["EXCELENTE", "ÓPTIMO", "SATISFACTORIO", "EN DESARROLLO", "CRÍTICO"];

export { AREA_LABEL };

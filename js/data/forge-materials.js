/* ============================================================
   data/forge-materials.js - 炼器材料（5 种，带品级）
   ------------------------------------------------------------
   注意：这些材料**注册到 ITEMS**，跟灵草等一样。
   ============================================================ */

const FORGE_MATERIALS_BASE = [
  { id: "玄铁", name: "玄铁", maxGrade: 7, basePrice: 20,  isForgeMat: true, icon: "⚒️" },
  { id: "寒铁", name: "寒铁", maxGrade: 7, basePrice: 40,  isForgeMat: true, icon: "⚒️" },
  { id: "赤铜", name: "赤铜", maxGrade: 7, basePrice: 60,  isForgeMat: true, icon: "⚒️" },
  { id: "秘银", name: "秘银", maxGrade: 7, basePrice: 150, isForgeMat: true, icon: "⚒️" },
  { id: "天金", name: "天金", maxGrade: 7, basePrice: 400, isForgeMat: true, icon: "⚒️" },
];

const FORGE_MATERIALS = [];

if (typeof ITEMS !== "undefined") {
  FORGE_MATERIALS_BASE.forEach(m => {
    for (let g = 1; g <= m.maxGrade; g++) {
      const itemId = m.id + "_" + g;
      if (!ITEMS[itemId]) {
        ITEMS[itemId] = {
          id: itemId,
          type: "mat",
          name: m.name,
          baseId: m.id,
          icon: m.icon || "⚒️",
          isForgeMat: true,
          grade: g,
          maxGrade: m.maxGrade,
          price: m.basePrice * g,
          desc: `${g} 品炼器灵材，可用于天机器室锻造护道法器。`,
        };
      } else {
        ITEMS[itemId].icon = m.icon || "⚒️";
        ITEMS[itemId].isForgeMat = true;
      }
      FORGE_MATERIALS.push(ITEMS[itemId]);
    }
  });
}

/* 兼容旧 id（无品级）→ 1 品 */
if (typeof ITEMS !== "undefined") {
  ["玄铁", "寒铁", "赤铜", "秘银", "天金"].forEach(id => {
    if (!ITEMS[id]) {
      ITEMS[id] = ITEMS[id + "_1"];
    }
  });
}
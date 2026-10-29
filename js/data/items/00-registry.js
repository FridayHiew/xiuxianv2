/* ============================================================
   data/items/00-registry.js - 物品注册表 + 工具函数
   ------------------------------------------------------------
   所有物品都存进全局 ITEMS 对象。
   其他文件往 ITEMS 里塞数据，本文件只定义容器和操作函数。
   ============================================================ */

const ITEMS = {};

/* ============================================================
   基础查询与动态物品解析 (Universal Item Registry & Dynamic Resolver)
   ============================================================ */

function getItemIcon(item, fallbackId) {
  if (!item && fallbackId) {
    item = (typeof ITEMS !== "undefined" ? ITEMS[fallbackId] : null);
  }
  if (!item) return "📦";

  const n = String(item.name || fallbackId || "");
  const baseId = String(item.baseId || "");

  /* 妖丹 / 内丹 / 灵兽丹：统一使用圆润内丹/圆珠图标 🔮 */
  if (n.includes("妖丹") || n.includes("内丹") || baseId === "妖丹" || baseId === "水系妖丹" || item.type === "petBreak" || n.includes("灵兽丹")) {
    return "🔮";
  }

  /* 炼器材料（玄铁、寒铁、赤铜、秘银、天金）：对齐 Debug 添加材料图标 ⚒️ */
  const forgeMatNames = ["玄铁", "寒铁", "赤铜", "秘银", "天金"];
  if (item.isForgeMat || forgeMatNames.some(fm => n.includes(fm) || baseId === fm)) {
    return "⚒️";
  }

  if (item.icon) return item.icon;

  /* 功法秘籍与心法残卷优先于名称关键字（避免“火剑秘籍”等被识别为武器图标） */
  if (item.type === "heartFragment" || item.type === "summonbook") return "📜";
  if (item.type === "spellbook" || item.type === "skillbook") return "📖";

  // 衣服、防具、道袍：统一使用衣服图标 🥋（绝不混为武器 ⚔️）
  const slot = item.slot || "";
  if (slot === "body" || slot === "armor" || slot === "cloth") return "🥋";
  if (slot === "head") return "👑";
  if (slot === "shoes") return "👢";
  if (slot === "leftHand" || slot === "shield") return "🛡️";
  if (slot === "rightHand" || slot === "weapon") return "⚔️";
  if (slot === "accessory" || slot === "ring") return "📿";
  if (slot === "artifact" || item.type === "artifact") return "🔮";
  if (slot === "pet" || item.type === "pet") return "🐾";
  if (slot === "heavenDefying" || item.type === "heavenDefying") return "☯️";

  if (n.includes("衣") || n.includes("袍") || n.includes("甲") || n.includes("衫") || n.includes("服") || n.includes("胄")) {
    return "🥋";
  }
  if (n.includes("剑") || n.includes("刀") || n.includes("枪") || n.includes("棍") || n.includes("刃") || n.includes("戟") || n.includes("斧") || n.includes("匕") || n.includes("扇") || n.includes("笔")) {
    return "⚔️";
  }
  if (n.includes("盾")) return "🛡️";
  if (n.includes("靴") || n.includes("鞋") || n.includes("履")) return "👢";
  if (n.includes("冠") || n.includes("巾") || n.includes("帽") || n.includes("盔")) return "👑";
  if (n.includes("戒") || n.includes("佩") || n.includes("链") || n.includes("符") || n.includes("镜") || n.includes("印") || n.includes("铃") || n.includes("珠") || n.includes("坠")) {
    return "📿";
  }
  if (n.includes("丹") || n.includes("丸") || n.includes("膏") || item.type === "pill" || item.type === "pillTemplate") {
    return "💊";
  }
  if (item.type === "food") return "🍖";
  if (item.type === "mat") return "🌿";
  if (item.type === "quest") return "🏷️";
  if (item.type && typeof ITEM_TYPE_ICONS !== "undefined" && ITEM_TYPE_ICONS[item.type]) {
    return ITEM_TYPE_ICONS[item.type];
  }
  return "📦";
}

function getItem(id) {
  if (!id || id === "undefined" || id === "null") return null;
  if (ITEMS[id]) {
    if (!ITEMS[id].id) ITEMS[id].id = id;
    return ITEMS[id];
  }

  // 1. 尝试从 S.forgedItems 持久化装备恢复
  if (typeof S !== "undefined" && S && S.forgedItems && S.forgedItems[id]) {
    ITEMS[id] = S.forgedItems[id];
    if (!ITEMS[id].id) ITEMS[id].id = id;
    if (typeof registerItemToBucket === "function") registerItemToBucket(id);
    return ITEMS[id];
  }

  // 2. 尝试从 findEquipById 查找
  if (typeof findEquipById === "function") {
    const eq = findEquipById(id);
    if (eq) {
      if (!eq.id) eq.id = id;
      ITEMS[id] = eq;
      return eq;
    }
  }

  // 3. 动态解析品级丹药 (如 "回春丹_1阶_2品", "聚气丹_1阶_1品", "回春丹_1阶_0品", "饲灵丸_1阶_基础", "聚气丹_3品", "筑基丹_3品")
  if (typeof getOrCreatePillItem === "function") {
    const mPill = String(id).match(/^(.*?)_(\d+)品$/);
    if (mPill) {
      const p = getOrCreatePillItem(mPill[1], parseInt(mPill[2], 10));
      if (p) {
        ITEMS[id] = p;
        return p;
      }
    }
    const mBase = String(id).match(/^(.*?)_基础$/);
    if (mBase) {
      const p = getOrCreatePillItem(mBase[1], 1);
      if (p) {
        ITEMS[id] = p;
        return p;
      }
    }
  }

  // 4. 藏经丹阁与旧版数字后缀丹药（如 "回血丹_1"~"回血丹_5", "破境丹_1"~"破境丹_7", "凝神丹_1", "淬体丹_1"）
  const mLegacyPill = String(id).match(/^(回血丹|回灵丹|解毒丹|聚气丹|破境丹|凝神丹|淬体丹)_(\d+)$/);
  if (mLegacyPill) {
    const bName = mLegacyPill[1];
    const g = Math.max(1, parseInt(mLegacyPill[2], 10) || 1);
    let eff = { type: "heal", value: 80 * g };
    let desc = `回复气血 +${80 * g}`;
    let basePrice = 15 * g;
    if (bName === "回灵丹") {
      eff = { type: "healMp", value: 80 * g };
      desc = `回复灵力 +${80 * g}`;
      basePrice = 15 * g;
    } else if (bName === "解毒丹") {
      eff = { type: "cureAllNonDot" };
      desc = `解除中毒与负面状态（${g}品）`;
      basePrice = 20 * g;
    } else if (bName === "聚气丹") {
      eff = { type: "exp", value: 60 * g };
      desc = `修为 +${60 * g}`;
      basePrice = 30 * g;
    } else if (bName === "破境丹") {
      const bonus = +(0.05 * g).toFixed(2);
      eff = { type: "breakBonus", value: bonus };
      desc = `破境成功率 +${Math.round(bonus * 100)}%`;
      basePrice = 80 * g;
    } else if (bName === "凝神丹") {
      eff = { type: "healMp", value: 120 * g };
      desc = `凝神聚气，回复灵力 +${120 * g}`;
      basePrice = 40 * g;
    } else if (bName === "淬体丹") {
      eff = { type: "heal", value: 150 * g };
      desc = `淬炼肉身气血，回复气血 +${150 * g}`;
      basePrice = 45 * g;
    }
    ITEMS[id] = {
      id: id,
      type: "pill",
      name: `${bName}（${g}品）`,
      baseId: bName,
      tier: Math.min(3, Math.ceil(g / 3)),
      grade: Math.min(5, g),
      price: basePrice,
      desc: desc,
      usableIn: "field",
      effect: eff,
      danDu: +(0.05 * Math.max(0, 5 - g)).toFixed(2),
    };
    if (typeof registerItemToBucket === "function") registerItemToBucket(id);
    return ITEMS[id];
  }

  // 5. 常见丹药与材料别名自动适配
  const pillAliases = {
    "回血丹": "回春丹_1阶_1品",
    "回灵丹": "回元丹_1阶_1品",
    "聚气丹": "聚气丹_1阶_1品",
    "聚灵丹": "聚灵丹_2阶_1品",
    "聚凝丹": "聚凝丹_3阶_1品",
    "辟谷丹": "辟谷丹_2阶_1品",
    "饲灵丸": "饲灵丸_1阶_基础",
    "洗髓丹": "洗髓丹_1阶",
    "降尘丹": "降尘丹_3阶_1品",
    "筑基丹": "筑基丹_2阶_1品",
    "结金丹": "降尘丹_3阶_1品",
    "定颜丹": "定颜丹_3阶_1品",
  };

  const matAliases = {
    "灵草": "洗骨花_1",
    "灵草_1": "洗骨花_1",
    "灵草_1阶": "洗骨花_1",
    "泉水": "清泉水_1",
    "泉水_1": "清泉水_1",
    "妖丹": "妖丹_1",
    "妖丹_1": "妖丹_1",
    "寒泉": "清泉水_2",
    "千年灵芝": "千年降压草_1",
  };

  if (pillAliases[id]) {
    const target = pillAliases[id];
    if (ITEMS[target]) {
      ITEMS[id] = ITEMS[target];
      return ITEMS[id];
    }
    if (typeof getOrCreatePillItem === "function") {
      const p = getOrCreatePillItem(target, 1);
      if (p) {
        ITEMS[id] = p;
        return p;
      }
    }
  }

  if (matAliases[id]) {
    const target = matAliases[id];
    if (ITEMS[target]) {
      ITEMS[id] = ITEMS[target];
      return ITEMS[id];
    }
  }

  // 6. 格式如 "材料名_阶数"（如 "赤血草_1阶" 或 "清泉水_1阶"）
  const mMat = String(id).match(/^(.*?)_(\d+)阶$/);
  if (mMat) {
    const altMatId = mMat[1] + "_" + mMat[2];
    if (ITEMS[altMatId]) {
      ITEMS[id] = ITEMS[altMatId];
      return ITEMS[id];
    }
  }

  // 7. 洗髓丹等特殊丹药补全
  if (String(id).startsWith("洗髓丹")) {
    const mGrade = String(id).match(/_(\d+)/);
    const g = mGrade ? parseInt(mGrade[1], 10) : 1;
    ITEMS[id] = {
      id: id,
      type: "pill",
      name: `洗髓丹${g > 1 ? `（${g}品）` : ''}`,
      baseId: "洗髓丹",
      tier: 1,
      grade: g,
      price: 150 * g,
      desc: "洗炼全身骨髓与灵根窍穴，纯化道体根基（永久微调提升灵根潜质）。",
      effect: { type: "root", value: 1 },
      usableIn: "field",
      danDu: 0.1,
    };
    if (typeof registerItemToBucket === "function") registerItemToBucket(id);
    return ITEMS[id];
  }

  // 8. 兜底容错：确保绝不返回 undefined，自动推导优雅名称与分类
  const cleanName = String(id).replace(/_\d+品$/, "").replace(/_\d+阶$/, "").replace(/_\d+$/, "");
  let inferredType = "other";
  let inferredDesc = "修真游历所获之随身灵物。";
  let inferredEffect = undefined;
  if (id.includes("丹") || id.includes("丸") || id.includes("药") || id.includes("散") || id.includes("膏")) {
    inferredType = "pill";
    inferredDesc = "聚灵纳气之仙家灵丹（服用回复气血 +100）。";
    inferredEffect = { type: "heal", value: 100 };
  } else if (id.includes("草") || id.includes("花") || id.includes("芝") || id.includes("矿") || id.includes("水") || id.includes("石") || id.includes("木") || id.includes("果") || id.includes("血")) {
    inferredType = "mat";
    inferredDesc = "采撷自灵山大川之天材地宝。";
  } else if (id.includes("剑") || id.includes("甲") || id.includes("袍") || id.includes("衣") || id.includes("佩") || id.includes("戒") || id.includes("履")) {
    inferredType = "equip";
    inferredDesc = "修士防身御敌之随身器物。";
  }

  const fallbackItem = {
    id: id,
    name: cleanName || id,
    type: inferredType,
    desc: inferredDesc,
    price: 10,
    usableIn: inferredType === "pill" ? "field" : undefined,
    effect: inferredEffect,
  };
  ITEMS[id] = fallbackItem;
  if (typeof registerItemToBucket === "function") registerItemToBucket(id);
  return fallbackItem;
}

/* ============================================================
   按类型查询（走桶，见 99-buckets.js）
   ============================================================ */

function getItemsByType(type) {
  return (typeof ITEMS_BY_TYPE !== "undefined" && ITEMS_BY_TYPE[type]) ? ITEMS_BY_TYPE[type].slice() : [];
}

function getAllItemsByType(type) {
  const ids = (typeof ITEMS_BY_TYPE !== "undefined" && ITEMS_BY_TYPE[type]) ? ITEMS_BY_TYPE[type] : [];
  return ids.map(k => Object.assign({ id: k }, getItem(k) || ITEMS[k]));
}

/* ============================================================
   增删查（增加对合法 id 与自动解析的保护）
   ============================================================ */

function addItem(id, count) {
  if (!id || id === "undefined" || id === "null") return;
  count = count || 1;
  if (!S.inventory) S.inventory = {};
  
  // 确保 ITEMS 预解析注册
  if (typeof getItem === "function") getItem(id);
  
  S.inventory[id] = (S.inventory[id] || 0) + count;
}

function removeItem(id, count) {
  if (!id || id === "undefined" || id === "null") return false;
  count = count || 1;
  if (!S.inventory || !S.inventory[id]) return false;
  if (S.inventory[id] < count) return false;
  S.inventory[id] -= count;
  if (S.inventory[id] <= 0) delete S.inventory[id];
  return true;
}

function hasItem(id, count) {
  if (!id || id === "undefined" || id === "null") return false;
  count = count || 1;
  return (S.inventory && S.inventory[id] || 0) >= count;
}
/* ============================================================
   systems/sect-chronicles.js - 宗门历史编年志系统
   记录历代身陨或坐化先贤的道号、年份、修为与死因，并在新世拜入宗门后授书
   ============================================================ */

const SECT_CHRONICLE_ITEM_ID = "sect_chronicle_scroll";
const SECT_CHRONICLES_STORAGE_KEY = "xiuxian_sect_chronicles";

/* 注册传世宗门青史物品 */
function registerSectChronicleItem() {
  if (typeof ITEMS === "undefined") return;

  ITEMS[SECT_CHRONICLE_ITEM_ID] = {
    id: SECT_CHRONICLE_ITEM_ID,
    name: "《宗门先祖青史策》",
    type: "special",
    grade: 5,
    tier: 3,
    icon: "📜",
    pinned: true,
    price: 99999,
    usableIn: "field",
    desc: "本门代代相传的青史古卷，详细记录了历代先祖先贤的道号、年份岁数、身前修为与陨落因由。研读可洞察因果沉浮。",
    effect: {
      type: "read_chronicle",
    },
  };
}

/* 读取历史记录 */
function getSectChronicles() {
  try {
    const raw = localStorage.getItem(SECT_CHRONICLES_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {
    console.warn("[SectChronicles] Failed to read chronicles:", e);
  }
  return [];
}

/* 记录身陨或大限坐化先贤的青史卷目 */
function recordSectChronicleEntry(rawReason) {
  if (!S) return null;

  try {
    const info = typeof getPlayerRealmInfo === "function"
      ? getPlayerRealmInfo()
      : { realm: S.realm || 0, lvl: S.sub || 1 };

    let realmName = "凡胎未引气";
    if (info.realm > 0 && typeof REALMS !== "undefined" && REALMS[info.realm]) {
      const subLabel = typeof subName === "function" ? subName(info.lvl) : "";
      realmName = `${REALMS[info.realm].name} · ${subLabel}${info.lvl}重`;
    }

    const sectObj = (typeof SECTS !== "undefined" && Array.isArray(SECTS) && S.sect)
      ? SECTS.find(s => s.id === S.sect)
      : null;
    const sectName = sectObj ? sectObj.name : "太源仙门";

    const daysLived = Math.max(1, S.day || 1);
    const yearsLived = Math.max(1, Math.floor((daysLived - 1) / 360) + 1);
    const age = Math.floor(S.life || 16);

    let cleanReason = String(rawReason || "身死道消，因果归寂。")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanReason || cleanReason === "战斗失利，身死道消。") {
      if (S.flags && S.flags.adventureCombat && S.flags.adventureCombat.killedBy) {
        cleanReason = `历练探险中血战遭遇【${S.flags.adventureCombat.killedBy}】重创，力竭阵亡。`;
      } else {
        cleanReason = "外出历练凶险莫测，喋血战死于强敌之手。";
      }
    }

    const chronicles = getSectChronicles();
    const generation = chronicles.length + 1;

    const entry = {
      id: "chronicle_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      gen: generation,
      name: S.name || "无名道友",
      sectId: S.sect || "taiyuan",
      sectName: sectName,
      sectRank: (S.flags && S.flags.rank) || "外门杂务",
      year: yearsLived,
      day: daysLived,
      age: age,
      realm: info.realm || 0,
      sub: info.lvl || 1,
      realmName: realmName,
      deathReason: cleanReason,
      petName: (S.equipped && S.equipped.pet && S.pets && Array.isArray(S.pets.list))
        ? (S.pets.list.find(p => p.uid === S.equipped.pet) || {}).name || null
        : null,
      stone: S.stone || 0,
      recordDate: new Date().toLocaleDateString("zh-CN"),
    };

    chronicles.unshift(entry); // 最新一世置顶排在最前
    localStorage.setItem(SECT_CHRONICLES_STORAGE_KEY, JSON.stringify(chronicles));
    return entry;
  } catch (err) {
    console.error("[SectChronicles] Failed to record chronicle:", err);
    return null;
  }
}

/* 当玩家拜入宗门时，由宗门赐予先祖青史卷册 */
function giveSectChronicleItem() {
  if (!S) return;
  if (!S.inventory) S.inventory = {};
  registerSectChronicleItem();

  S.inventory[SECT_CHRONICLE_ITEM_ID] = 1;

  if (typeof log === "function") {
    log(`【宗门传承】执事赠予你本门代代相传之《宗门先祖青史策》（已收纳至【背包 > 特别】置顶），可随时翻阅列祖生平与因果！`, "c-gold");
  }
}

/* 兼容保障：若已有宗门但背包暂未有该卷，自动补充 */
function ensureSectChronicleItem() {
  if (!S || !S.sect) return;
  registerSectChronicleItem();
  if (!S.inventory) S.inventory = {};
  if (!S.inventory[SECT_CHRONICLE_ITEM_ID] || S.inventory[SECT_CHRONICLE_ITEM_ID] <= 0) {
    S.inventory[SECT_CHRONICLE_ITEM_ID] = 1;
  }
}

// 自动初始化
registerSectChronicleItem();

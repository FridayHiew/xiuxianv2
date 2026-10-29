/* ============================================================
   data/fight-enemies.js - 故事主线、历练与秘境敌人数据
   ------------------------------------------------------------
   按修仙大境界与特定历练/秘境生态划分（约90+种特定怪物）：
   - 规则：只有【炼气1重】且为兽类（isBeast）的怪物可能被收服，其余必定失败。
   ============================================================ */

const FIGHT_ENEMIES = {

  /* ============================================================
     1. NORMAL：凡人期 ~ 炼气期前期（云雾山麓·迷雾外围 & 匪巢深谷）
     【仅炼气1重幼兽具有 tameRate > 0，可缔结契约收服】
     ============================================================ */
  normal: [
    /* ----- 云雾山麓·外围【炼气1重·可收服灵宠幼兽】 ----- */
    { id: "e_wolf", name: "野狼幼崽", realm: 1, sub: 1,
      hp: 70, mp: 0, atk: 9, def: 2, speed: 13,
      skills: [], spells: [], items: {}, resistances: { burn: -20 },
      ai: "simple", isBeast: true, tameRate: 0.30, canFlee: true, fleeRate: 0.4, exp: 35, stone: 12 },

    { id: "e_cloud_spider", name: "云雾幼蛛", realm: 1, sub: 1,
      hp: 65, mp: 15, atk: 8, def: 3, speed: 12,
      skills: [], spells: [], attackInflict: { poison: 0.25 },
      resistances: { poison: 40 }, ai: "simple", isBeast: true, tameRate: 0.28, canFlee: true, fleeRate: 0.35, exp: 35, stone: 12 },

    { id: "e_rabbit_spirit", name: "草灵稚兔", realm: 1, sub: 1,
      hp: 55, mp: 20, atk: 6, def: 1, speed: 16,
      skills: [], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: true, tameRate: 0.38, canFlee: true, fleeRate: 0.5, exp: 30, stone: 10 },

    { id: "e_white_snake_tiny", name: "白鳞幼蛇", realm: 1, sub: 1,
      hp: 60, mp: 20, atk: 9, def: 2, speed: 14,
      skills: [], spells: [], attackInflict: { poison: 0.2 },
      resistances: { poison: 50 }, ai: "simple", isBeast: true, tameRate: 0.30, canFlee: true, fleeRate: 0.4, exp: 35, stone: 15 },

    { id: "e_sparrow_spirit", name: "斑斓雏雀", realm: 1, sub: 1,
      hp: 50, mp: 25, atk: 7, def: 1, speed: 18,
      skills: [], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: true, tameRate: 0.35, canFlee: true, fleeRate: 0.5, exp: 30, stone: 10 },

    { id: "e_pangolin_tiny", name: "碎石幼穿山甲", realm: 1, sub: 1,
      hp: 85, mp: 10, atk: 7, def: 5, speed: 9,
      skills: [], spells: [], items: {}, resistances: { stun: 20 },
      ai: "simple", isBeast: true, tameRate: 0.28, canFlee: true, fleeRate: 0.3, exp: 38, stone: 15 },

    { id: "e_fox_tiny", name: "灵溪赤狐幼兽", realm: 1, sub: 1,
      hp: 62, mp: 25, atk: 8, def: 2, speed: 15,
      skills: [], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: true, tameRate: 0.26, canFlee: true, fleeRate: 0.4, exp: 36, stone: 16 },

    { id: "e_white_fox", name: "雪灵白狐幼兽", realm: 1, sub: 1,
      hp: 65, mp: 30, atk: 8, def: 2, speed: 16,
      skills: ["sk_fist1"], spells: ["lingqi_bo"], items: {}, resistances: { freeze: 30 },
      ai: "simple", isBeast: true, tameRate: 0.35, canFlee: true, fleeRate: 0.45, exp: 38, stone: 18 },

    { id: "e_toad_tiny", name: "凝露小灵蟾", realm: 1, sub: 1,
      hp: 75, mp: 30, atk: 7, def: 3, speed: 10,
      skills: [], spells: [], attackInflict: { poison: 0.15 },
      resistances: { poison: 30 }, ai: "simple", isBeast: true, tameRate: 0.30, canFlee: true, fleeRate: 0.3, exp: 36, stone: 14 },

    { id: "e_butterfly_tiny", name: "幻彩幼蝶", realm: 1, sub: 1,
      hp: 45, mp: 35, atk: 6, def: 1, speed: 17,
      skills: [], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: true, tameRate: 0.35, canFlee: true, fleeRate: 0.5, exp: 32, stone: 12 },

    { id: "e_hedgehog_tiny", name: "青针幼猬", realm: 1, sub: 1,
      hp: 70, mp: 15, atk: 8, def: 4, speed: 11,
      skills: [], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: true, tameRate: 0.30, canFlee: true, fleeRate: 0.35, exp: 35, stone: 14 },

    /* ----- 云雾山麓·外围【凡人/修士型·不可收服】 ----- */
    { id: "e_bandit_scout", name: "云雾山匪斥候", realm: 1, sub: 1,
      hp: 80, mp: 15, atk: 12, def: 3, speed: 11,
      skills: ["sk_fist1"], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.3, exp: 45, stone: 20 },

    { id: "e_wild_cultivator", name: "采药狂乱散修", realm: 1, sub: 1,
      hp: 95, mp: 25, atk: 14, def: 4, speed: 12,
      skills: ["sk_blade1"], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.25, exp: 50, stone: 25 },

    /* ----- 云雾山麓·深谷匪巢【炼气2~4层·不可收服】 ----- */
    { id: "e_bandit", name: "云雾流寇", realm: 1, sub: 2,
      hp: 130, mp: 25, atk: 18, def: 6, speed: 12,
      skills: ["sk_fist1"], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 80, stone: 35 },

    { id: "e_wolf_alpha", name: "疾风成年青狼", realm: 1, sub: 2,
      hp: 140, mp: 0, atk: 20, def: 5, speed: 16,
      skills: [], spells: [], items: {}, resistances: { burn: -20 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 85, stone: 35 },

    { id: "e_cloud_spider_adult", name: "斑纹巨毒蛛", realm: 1, sub: 2,
      hp: 150, mp: 30, atk: 19, def: 7, speed: 13,
      skills: [], spells: [], attackInflict: { poison: 0.4 },
      resistances: { poison: 60 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 90, stone: 40 },

    { id: "e_boar_iron", name: "钢鬃黑野猪", realm: 1, sub: 3,
      hp: 190, mp: 0, atk: 22, def: 10, speed: 11,
      skills: [], spells: [], items: {}, resistances: { stun: 30 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.15, exp: 110, stone: 45 },

    { id: "e_bear_black", name: "撼树暴熊", realm: 1, sub: 3,
      hp: 220, mp: 0, atk: 26, def: 12, speed: 10,
      skills: ["sk_fist1"], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.15, exp: 120, stone: 50 },

    { id: "e_monkey_stone", name: "深涧啼血猢狲", realm: 1, sub: 3,
      hp: 160, mp: 20, atk: 21, def: 6, speed: 17,
      skills: [], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.3, exp: 105, stone: 45 },

    { id: "e_viper_green", name: "断肠青竹标", realm: 1, sub: 4,
      hp: 170, mp: 35, atk: 24, def: 7, speed: 18,
      skills: [], spells: [], attackInflict: { poison: 0.5 },
      resistances: { poison: 70 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 130, stone: 55 },

    { id: "e_bandit_blade", name: "黑风寨滚刀手", realm: 1, sub: 3,
      hp: 180, mp: 30, atk: 25, def: 9, speed: 13,
      skills: ["sk_blade1"], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.15, exp: 115, stone: 50 },

    { id: "e_bandit_archer", name: "黑风寨引弦暗哨", realm: 1, sub: 3,
      hp: 150, mp: 40, atk: 27, def: 6, speed: 16,
      skills: ["sk_blade1"], spells: [], items: {}, resistances: {},
      ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 120, stone: 55 },

    { id: "e_bandit_chief", name: "黑风寨大当家·座山雕", realm: 1, sub: 4,
      hp: 280, mp: 60, atk: 34, def: 14, speed: 14,
      skills: ["sk_blade1", "sk_fist1"], spells: [], items: { "回春丹_1阶_1品": 2 },
      resistances: { stun: 30 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 200, stone: 100 }
  ],

  /* ============================================================
     2. ELITE：炼气中期 ~ 炼气大圆满（寒潭幽谷 & 丹霞秘境）
     【道基已固，全不可收服】
     ============================================================ */
  elite: [
    /* ----- 寒潭幽谷·冰封剑径（炼气 4 ~ 6 层） ----- */
    { id: "e_frost_sword", name: "寒潭剑傀", realm: 1, sub: 4,
      hp: 310, mp: 50, atk: 40, def: 16, speed: 17,
      skills: ["sk_sword1"], spells: ["lingqi_bo"], items: {},
      resistances: { freeze: 80 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 190, stone: 110 },

    { id: "e_ice_wolf", name: "寒原玄霜狼", realm: 1, sub: 4,
      hp: 290, mp: 30, atk: 38, def: 14, speed: 19,
      skills: [], spells: [], attackInflict: { freeze: 0.2 },
      resistances: { freeze: 70, burn: -30 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 180, stone: 100 },

    { id: "e_frost_spider", name: "霜华凝晶蛛", realm: 1, sub: 5,
      hp: 320, mp: 60, atk: 41, def: 18, speed: 15,
      skills: [], spells: [], attackInflict: { freeze: 0.3, poison: 0.3 },
      resistances: { freeze: 80, poison: 50 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.15, exp: 210, stone: 125 },

    { id: "e_ice_leopard", name: "霜齿雪岭豹", realm: 1, sub: 5,
      hp: 340, mp: 40, atk: 45, def: 15, speed: 21,
      skills: ["sk_fist1"], spells: [], resistances: { freeze: 75 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 230, stone: 135 },

    { id: "e_frost_snake", name: "千年凝霜冰蚺", realm: 1, sub: 5,
      hp: 370, mp: 65, atk: 43, def: 19, speed: 16,
      skills: [], spells: [], attackInflict: { freeze: 0.4 },
      resistances: { freeze: 85, burn: -40 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.15, exp: 240, stone: 140 },

    { id: "e_ice_beetle", name: "冻土玄冰铁甲虫", realm: 1, sub: 6,
      hp: 430, mp: 20, atk: 36, def: 26, speed: 12,
      skills: [], spells: [], resistances: { freeze: 90, stun: 40 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 250, stone: 150 },

    { id: "e_sword_slave", name: "幽谷弃徒剑奴", realm: 1, sub: 5,
      hp: 350, mp: 70, atk: 46, def: 17, speed: 18,
      skills: ["sk_sword1"], spells: [], resistances: { freeze: 40 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 230, stone: 130 },

    { id: "e_frost_corpse", name: "巡谷冰封古尸", realm: 1, sub: 6,
      hp: 420, mp: 30, atk: 48, def: 22, speed: 13,
      skills: ["sk_fist1"], spells: [], resistances: { freeze: 100, bleed: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.15, exp: 260, stone: 160 },

    /* ----- 寒潭幽谷·封魔碑底（炼气 7 ~ 9 层） ----- */
    { id: "e_ice_beast", name: "冰原狂兽", realm: 1, sub: 7,
      hp: 520, mp: 80, atk: 62, def: 25, speed: 16,
      skills: ["sk_fist2"], spells: [], resistances: { freeze: 90, burn: -30 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.15, exp: 350, stone: 200 },

    { id: "e_ice_bear_giant", name: "冰魄千钧巨熊", realm: 1, sub: 7,
      hp: 600, mp: 50, atk: 68, def: 28, speed: 14,
      skills: ["sk_fist2"], spells: [], resistances: { freeze: 90, stun: 50 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 380, stone: 220 },

    { id: "e_frost_dragonette", name: "极渊霜鳞小蛟螭", realm: 1, sub: 8,
      hp: 660, mp: 120, atk: 72, def: 30, speed: 19,
      skills: ["sk_blade1"], spells: ["lingqi_bo"], resistances: { freeze: 95 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 420, stone: 260 },

    { id: "e_frost_wraith", name: "玄冰万载冤魂", realm: 1, sub: 8,
      hp: 550, mp: 150, atk: 75, def: 20, speed: 21,
      skills: [], spells: ["lingqi_bo"], attackInflict: { freeze: 0.4 },
      resistances: { freeze: 100, poison: 100 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 430, stone: 270 },

    { id: "e_broken_sword_puppet", name: "残剑血炼战傀", realm: 1, sub: 8,
      hp: 620, mp: 80, atk: 78, def: 29, speed: 17,
      skills: ["sk_sword2"], spells: [], resistances: { stun: 40, bleed: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 450, stone: 290 },

    { id: "e_monument_guard", name: "古碑封魔狂卫", realm: 1, sub: 9,
      hp: 750, mp: 100, atk: 82, def: 34, speed: 18,
      skills: ["sk_blade2"], spells: ["lingqi_bo"], resistances: { stun: 50 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 480, stone: 320 },

    { id: "e_ice_serpent_ancient", name: "寒幽蚀骨九节蟒", realm: 1, sub: 9,
      hp: 720, mp: 110, atk: 80, def: 32, speed: 20,
      skills: [], spells: [], attackInflict: { poison: 0.4, freeze: 0.3 },
      resistances: { freeze: 90, poison: 80 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 490, stone: 330 },

    { id: "e_monument_spirit", name: "太古守碑剑灵(小领主)", realm: 1, sub: 9,
      hp: 880, mp: 180, atk: 90, def: 36, speed: 22,
      skills: ["sk_sword2"], spells: ["lingqi_bo"], items: { "回春丹_1阶_3品": 2 },
      resistances: { freeze: 100, stun: 60 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 580, stone: 400 },

    /* ----- 丹霞秘境·百草灵田（炼气 8 ~ 9 层 & 假基） ----- */
    { id: "e_danxia_beast", name: "丹霞守药兽", realm: 1, sub: 9,
      hp: 820, mp: 120, atk: 85, def: 35, speed: 20,
      skills: ["sk_blade1"], spells: ["huojian"], resistances: { burn: 80 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 500, stone: 350 },

    { id: "e_herb_hound", name: "赤血嗅灵犬", realm: 1, sub: 8,
      hp: 580, mp: 70, atk: 69, def: 27, speed: 21,
      skills: ["sk_fist1"], spells: [], resistances: { burn: 50 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.15, exp: 410, stone: 260 },

    { id: "e_blood_scorpion", name: "地脉赤炎晶蝎", realm: 1, sub: 8,
      hp: 640, mp: 80, atk: 74, def: 33, speed: 16,
      skills: [], spells: [], attackInflict: { burn: 0.4, poison: 0.3 },
      resistances: { burn: 90, poison: 60 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 430, stone: 280 },

    { id: "e_spirit_deer", name: "紫芝噬灵鹿", realm: 1, sub: 8,
      hp: 590, mp: 130, atk: 65, def: 26, speed: 23,
      skills: [], spells: ["lingqi_bo"], resistances: {},
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.3, exp: 420, stone: 270 },

    { id: "e_fire_bee", name: "丹霞烈火魔蜂群", realm: 1, sub: 9,
      hp: 530, mp: 100, atk: 84, def: 20, speed: 25,
      skills: [], spells: ["huojian"], attackInflict: { burn: 0.5 },
      resistances: { burn: 80 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 460, stone: 300 },

    { id: "e_jade_gecko", name: "碧血七星守宫", realm: 1, sub: 9,
      hp: 680, mp: 90, atk: 76, def: 32, speed: 19,
      skills: [], spells: [], attackInflict: { poison: 0.5 },
      resistances: { poison: 90 }, ai: "simple", isBeast: true, tameRate: 0.0, canFlee: true, fleeRate: 0.15, exp: 470, stone: 310 },

    { id: "e_sunflower_spirit", name: "千年紫阳花妖", realm: 1, sub: 9,
      hp: 760, mp: 160, atk: 82, def: 28, speed: 17,
      skills: [], spells: ["huojian", "lingqi_bo"], resistances: { burn: 60 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 510, stone: 360 },

    { id: "e_renegade_alchemist", name: "叛宗夺药丹徒", realm: 1, sub: 9,
      hp: 710, mp: 140, atk: 86, def: 29, speed: 18,
      skills: ["sk_blade1"], spells: ["huojian"], items: { "聚气丹_3品": 1 },
      resistances: {}, ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 520, stone: 380 }
  ],

  /* ============================================================
     3. BOSS：筑基期 ~ 金丹期（丹霞丹殿、沉星古陵、天渊道窟、秘境领主）
     【大能遗骸与凶神异种，全不可收服】
     ============================================================ */
  boss: [
    /* ----- 丹霞秘境·紫阳丹殿（筑基 1 ~ 3 层） ----- */
    { id: "e_dan_puppet", name: "紫阳金甲丹傀", realm: 2, sub: 1,
      hp: 1100, mp: 120, atk: 105, def: 48, speed: 18,
      skills: ["sk_sword2"], spells: ["huojian"], resistances: { burn: 90, stun: 50 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 800, stone: 550 },

    { id: "e_fire_cauldron_spirit", name: "三昧火灵药鼎精", realm: 2, sub: 1,
      hp: 1250, mp: 200, atk: 110, def: 52, speed: 16,
      skills: [], spells: ["huojian"], resistances: { burn: 100 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 850, stone: 600 },

    { id: "e_fire_crow", name: "九天赤霄火鸦", realm: 2, sub: 2,
      hp: 1150, mp: 160, atk: 118, def: 44, speed: 24,
      skills: [], spells: ["huojian"], attackInflict: { burn: 0.5 },
      resistances: { burn: 95 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 900, stone: 650 },

    { id: "e_magma_lizard", name: "地火熔岩赤蜥", realm: 2, sub: 2,
      hp: 1350, mp: 100, atk: 115, def: 58, speed: 17,
      skills: ["sk_fist2"], spells: [], resistances: { burn: 90, poison: 50 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 950, stone: 700 },

    { id: "e_flame_fiend", name: "焚天药灰尸魅", realm: 2, sub: 3,
      hp: 1400, mp: 180, atk: 125, def: 50, speed: 21,
      skills: ["sk_blade2"], spells: ["huojian"], attackInflict: { burn: 0.4 },
      resistances: { burn: 80, bleed: 100 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1050, stone: 750 },

    { id: "e_cauldron_elder_ghost", name: "丹霞护鼎长老残魂(大领主)", realm: 2, sub: 3,
      hp: 1650, mp: 300, atk: 135, def: 55, speed: 22,
      skills: ["sk_sword2"], spells: ["huojian", "lingqi_bo"], items: { "回春丹_2阶_2品": 2 },
      resistances: { burn: 100, stun: 60 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1200, stone: 900 },

    { id: "e_blaze_hound_beast", name: "赤火金睛兽", realm: 2, sub: 3,
      hp: 1550, mp: 150, atk: 130, def: 54, speed: 23,
      skills: ["sk_fist2"], spells: ["huojian"], resistances: { burn: 90 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1150, stone: 850 },

    /* ----- 沉星古陵·镇魔石廊（筑基 4 ~ 6 层） ----- */
    { id: "e_blood_corpse", name: "沉星尸煞", realm: 2, sub: 4,
      hp: 1600, mp: 200, atk: 135, def: 62, speed: 22,
      skills: ["sk_blade2"], spells: [], resistances: { poison: 100, bleed: 100 },
      attackInflict: { poison: 0.5 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 1200, stone: 800 },

    { id: "e_tomb_iron_guard", name: "先祖镇陵铁卫", realm: 2, sub: 4,
      hp: 1800, mp: 120, atk: 130, def: 72, speed: 16,
      skills: ["sk_sword2"], spells: [], resistances: { stun: 50, bleed: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1250, stone: 850 },

    { id: "e_nether_stone_golem", name: "幽冥重力巨俑", realm: 2, sub: 5,
      hp: 2100, mp: 80, atk: 140, def: 80, speed: 14,
      skills: ["sk_fist2"], spells: [], resistances: { stun: 70, poison: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1350, stone: 900 },

    { id: "e_bone_bat", name: "嗜骨嗜血魔蝠群", realm: 2, sub: 5,
      hp: 1500, mp: 180, atk: 145, def: 52, speed: 26,
      skills: [], spells: [], attackInflict: { bleed: 0.5 },
      resistances: { poison: 70 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.15, exp: 1300, stone: 900 },

    { id: "e_corpse_centipede", name: "九棺赤足尸蜈", realm: 2, sub: 5,
      hp: 1750, mp: 150, atk: 150, def: 68, speed: 20,
      skills: [], spells: [], attackInflict: { poison: 0.6 },
      resistances: { poison: 100 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1400, stone: 950 },

    { id: "e_nether_ghoul", name: "古陵玄冥腐尸鬼", realm: 2, sub: 6,
      hp: 1900, mp: 160, atk: 155, def: 65, speed: 19,
      skills: ["sk_fist2"], spells: [], attackInflict: { poison: 0.5 },
      resistances: { bleed: 100, poison: 100 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1500, stone: 1000 },

    { id: "e_tomb_raider_boss", name: "北荒盗墓老怪", realm: 2, sub: 6,
      hp: 1700, mp: 240, atk: 160, def: 60, speed: 23,
      skills: ["sk_blade2", "sk_sword2"], spells: ["huojian"], items: { "聚灵丹_2品": 1 },
      resistances: {}, ai: "simple", isBeast: false, tameRate: 0, canFlee: true, fleeRate: 0.1, exp: 1550, stone: 1100 },

    { id: "e_bronze_spear_puppet", name: "镇殿青铜长矛傀", realm: 2, sub: 6,
      hp: 2000, mp: 100, atk: 165, def: 75, speed: 18,
      skills: ["sk_blade2"], spells: [], resistances: { stun: 60 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1600, stone: 1150 },

    /* ----- 沉星古陵·血煞祭坛（筑基 7 ~ 9 层） ----- */
    { id: "e_corpse_king", name: "血煞尸王(主墓室霸主)", realm: 2, sub: 8,
      hp: 3200, mp: 400, atk: 220, def: 95, speed: 25,
      skills: ["sk_sword2", "sk_blade2"], spells: ["huojian"], items: { "回春丹_2阶_3品": 2 },
      resistances: { poison: 100, burn: 50, bleed: 100, stun: 80 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 2600, stone: 2000 },

    { id: "e_nine_nether_python", name: "九幽冥血古蟒", realm: 2, sub: 7,
      hp: 2400, mp: 200, atk: 180, def: 78, speed: 22,
      skills: [], spells: [], attackInflict: { poison: 0.6, bleed: 0.4 },
      resistances: { poison: 100, freeze: 50 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1900, stone: 1400 },

    { id: "e_blood_bone_demon", name: "万骨血煞天魔", realm: 2, sub: 7,
      hp: 2550, mp: 260, atk: 190, def: 75, speed: 23,
      skills: ["sk_blade2"], spells: ["lingqi_bo"], resistances: { bleed: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 2050, stone: 1550 },

    { id: "e_constellation_ghost", name: "守陵星宿凶灵", realm: 2, sub: 7,
      hp: 2300, mp: 320, atk: 195, def: 70, speed: 26,
      skills: [], spells: ["lingqi_bo"], attackInflict: { freeze: 0.4 },
      resistances: { stun: 50 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 2100, stone: 1600 },

    { id: "e_tomb_high_priest", name: "上古大祭司残魂", realm: 2, sub: 8,
      hp: 2600, mp: 400, atk: 205, def: 76, speed: 24,
      skills: ["sk_sword2"], spells: ["huojian", "lingqi_bo"], resistances: { stun: 60 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 2300, stone: 1750 },

    { id: "e_crimson_fiend", name: "九劫赤血凶煞", realm: 2, sub: 8,
      hp: 2800, mp: 280, atk: 215, def: 88, speed: 22,
      skills: ["sk_fist2"], spells: [], resistances: { poison: 100, bleed: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 2450, stone: 1850 },

    { id: "e_nether_general", name: "幽冥镇关大将军", realm: 2, sub: 9,
      hp: 3400, mp: 300, atk: 235, def: 102, speed: 21,
      skills: ["sk_blade3", "sk_sword2"], spells: [], resistances: { stun: 70, bleed: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 2800, stone: 2200 },

    { id: "e_coffin_guardian_beast", name: "守棺镇狱神犼", realm: 2, sub: 9,
      hp: 3600, mp: 350, atk: 245, def: 108, speed: 24,
      skills: ["sk_fist3"], spells: ["huojian"], resistances: { stun: 80, burn: 80 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 3000, stone: 2400 },

    /* ----- 天渊道窟·裂隙魔渊（筑基 9 层 ~ 金丹 1 层） ----- */
    { id: "e_abyss_bat", name: "渊底暗夜魔蝠皇", realm: 2, sub: 9,
      hp: 3100, mp: 300, atk: 230, def: 90, speed: 28,
      skills: [], spells: ["lingqi_bo"], attackInflict: { bleed: 0.6 },
      resistances: { poison: 80 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 2700, stone: 2100 },

    { id: "e_nether_wolf", name: "九幽冥火狂狼", realm: 2, sub: 9,
      hp: 3300, mp: 250, atk: 240, def: 92, speed: 27,
      skills: ["sk_fist2"], spells: ["huojian"], attackInflict: { burn: 0.5 },
      resistances: { burn: 80 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 2850, stone: 2250 },

    { id: "e_abyss_vine", name: "深渊噬血魔藤精", realm: 2, sub: 9,
      hp: 3800, mp: 350, atk: 235, def: 105, speed: 18,
      skills: [], spells: [], attackInflict: { poison: 0.6, bleed: 0.5 },
      resistances: { bleed: 100, stun: 80 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 3100, stone: 2500 },

    { id: "e_thunder_roc", name: "天渊魔煞雷鹏", realm: 3, sub: 1,
      hp: 4200, mp: 500, atk: 280, def: 115, speed: 32,
      skills: [], spells: ["lingqi_bo"], attackInflict: { stun: 0.3 },
      resistances: { stun: 80 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 3800, stone: 3000 },

    { id: "e_soul_eater_spider", name: "九幽噬魂天蛛", realm: 3, sub: 1,
      hp: 4400, mp: 450, atk: 275, def: 122, speed: 26,
      skills: [], spells: [], attackInflict: { poison: 0.7, stun: 0.3 },
      resistances: { poison: 100 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 3900, stone: 3100 },

    { id: "e_asura_scout", name: "天渊阿修罗魔卫", realm: 3, sub: 1,
      hp: 4600, mp: 400, atk: 295, def: 128, speed: 28,
      skills: ["sk_blade3"], spells: ["huojian"], resistances: { stun: 70 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 4100, stone: 3300 },

    { id: "e_abyss_lizard", name: "裂隙黑鳞狂蜥", realm: 3, sub: 1,
      hp: 4800, mp: 300, atk: 290, def: 136, speed: 22,
      skills: ["sk_fist3"], spells: [], resistances: { poison: 80, stun: 80 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 4200, stone: 3400 },

    { id: "e_blood_ape", name: "太古血煞狂暴猿", realm: 3, sub: 1,
      hp: 5100, mp: 350, atk: 310, def: 130, speed: 25,
      skills: ["sk_fist3"], spells: [], resistances: { stun: 85, bleed: 80 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 4500, stone: 3600 },

    /* ----- 天渊道窟·道图尽头（金丹 2 ~ 3 层 & 终极决战） ----- */
    { id: "e_taiyuan_shade", name: "太渊魔尊遗念(终极Boss)", realm: 3, sub: 3,
      hp: 7500, mp: 1000, atk: 420, def: 180, speed: 33,
      skills: ["sk_sword3", "sk_blade3"], spells: ["huojian", "lingqi_bo"], items: { "回春丹_3阶_3品": 3 },
      resistances: { poison: 100, burn: 100, bleed: 100, stun: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 8000, stone: 6000 },

    { id: "e_taiyuan_commander", name: "太渊魔军第一战将", realm: 3, sub: 2,
      hp: 5800, mp: 600, atk: 350, def: 155, speed: 29,
      skills: ["sk_blade3"], spells: ["huojian"], resistances: { stun: 90, bleed: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 5500, stone: 4500 },

    { id: "e_heaven_thunder_demon", name: "灭世九天劫雷魔君", realm: 3, sub: 2,
      hp: 6000, mp: 800, atk: 370, def: 150, speed: 31,
      skills: [], spells: ["lingqi_bo"], attackInflict: { stun: 0.4 },
      resistances: { stun: 100 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 6000, stone: 4800 },

    { id: "e_void_stalker", name: "太古虚空遁影兽", realm: 3, sub: 2,
      hp: 5500, mp: 700, atk: 385, def: 140, speed: 36,
      skills: [], spells: ["lingqi_bo"], attackInflict: { poison: 0.5 },
      resistances: { freeze: 90 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 5800, stone: 4600 },

    { id: "e_golden_crow_shadow", name: "焚天大日金乌残魄", realm: 3, sub: 3,
      hp: 6500, mp: 900, atk: 400, def: 160, speed: 34,
      skills: [], spells: ["huojian"], attackInflict: { burn: 0.7 },
      resistances: { burn: 100 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 6800, stone: 5200 },

    { id: "e_black_dragon_aspect", name: "太渊灭世真龙相", realm: 3, sub: 3,
      hp: 7000, mp: 850, atk: 410, def: 175, speed: 30,
      skills: ["sk_blade3"], spells: ["lingqi_bo"], resistances: { stun: 95, bleed: 100 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 7200, stone: 5500 },

    { id: "e_order_puppet", name: "天道秩序终极铁卫", realm: 3, sub: 3,
      hp: 7200, mp: 600, atk: 395, def: 190, speed: 27,
      skills: ["sk_sword3"], spells: [], resistances: { stun: 100, poison: 100, bleed: 100 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 7400, stone: 5600 },

    /* ----- 特殊秘境专属异兽与魔灵（不可收服） ----- */
    { id: "e_qingyun_sword_eagle", name: "蜀山青云剑翎天鹰", realm: 1, sub: 5,
      hp: 360, mp: 80, atk: 48, def: 17, speed: 22,
      skills: ["sk_sword1"], spells: [], resistances: {},
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.2, exp: 240, stone: 150 },

    { id: "e_qingyun_sword_soul", name: "万剑归宗纯阳剑魄", realm: 2, sub: 2,
      hp: 1200, mp: 250, atk: 125, def: 45, speed: 25,
      skills: ["sk_sword2"], spells: ["lingqi_bo"], resistances: { stun: 70 },
      ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 950, stone: 700 },

    { id: "e_wanshou_flood_dragon", name: "万兽渊洪荒吞天蟒", realm: 2, sub: 5,
      hp: 2100, mp: 220, atk: 155, def: 75, speed: 22,
      skills: [], spells: [], attackInflict: { poison: 0.6 },
      resistances: { poison: 100 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1450, stone: 1050 },

    { id: "e_wanshou_iron_rhino", name: "崩山撼地碎岩巨犀", realm: 2, sub: 4,
      hp: 1950, mp: 100, atk: 140, def: 85, speed: 15,
      skills: ["sk_fist2"], spells: [], resistances: { stun: 80 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1300, stone: 900 },

    { id: "e_wanshou_divine_ape", name: "通天混元神魔金刚猿", realm: 3, sub: 1,
      hp: 4900, mp: 400, atk: 300, def: 135, speed: 26,
      skills: ["sk_fist3"], spells: [], resistances: { stun: 90 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 4300, stone: 3500 },

    { id: "e_yaowang_mushroom_fairy", name: "千年紫芝通灵草妖", realm: 1, sub: 6,
      hp: 410, mp: 160, atk: 42, def: 20, speed: 18,
      skills: [], spells: ["lingqi_bo"], resistances: { poison: 70 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: true, fleeRate: 0.3, exp: 270, stone: 180 },

    { id: "e_yaowang_mandrake", name: "迷幻曼陀罗七绝妖花", realm: 2, sub: 1,
      hp: 1100, mp: 240, atk: 100, def: 42, speed: 17,
      skills: [], spells: ["lingqi_bo"], attackInflict: { poison: 0.5 },
      resistances: { poison: 90 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 820, stone: 580 },

    { id: "e_tianji_iron_tiger", name: "天机破军玄铁机关狂虎", realm: 2, sub: 2,
      hp: 1300, mp: 120, atk: 120, def: 60, speed: 20,
      skills: ["sk_blade2"], spells: [], resistances: { stun: 70, bleed: 100 },
      ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 950, stone: 700 },

    { id: "e_tianji_flying_wheel", name: "天工千机绞杀飞刃", realm: 2, sub: 3,
      hp: 1200, mp: 180, atk: 132, def: 46, speed: 27,
      skills: ["sk_sword2"], spells: [], attackInflict: { bleed: 0.5 },
      resistances: { stun: 50, bleed: 100 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1050, stone: 800 },

    { id: "e_ghost_ferryman", name: "罗酆九泉黄泉摆渡鬼", realm: 2, sub: 4,
      hp: 1650, mp: 260, atk: 140, def: 58, speed: 21,
      skills: ["sk_blade2"], spells: ["lingqi_bo"], attackInflict: { freeze: 0.4 },
      resistances: { freeze: 80, bleed: 100 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1250, stone: 850 },

    { id: "e_ghost_judge", name: "森罗地府断魂勾命判官", realm: 3, sub: 1,
      hp: 4700, mp: 600, atk: 305, def: 125, speed: 27,
      skills: ["sk_sword3"], spells: ["lingqi_bo"], attackInflict: { freeze: 0.5 },
      resistances: { freeze: 100, bleed: 100, poison: 100 }, ai: "simple", isBeast: false, tameRate: 0, canFlee: false, fleeRate: 0, exp: 4200, stone: 3400 },

    { id: "e_volcano_fire_elemental", name: "八荒地心极炎地火精", realm: 2, sub: 5,
      hp: 1950, mp: 300, atk: 160, def: 64, speed: 22,
      skills: [], spells: ["huojian"], attackInflict: { burn: 0.6 },
      resistances: { burn: 100 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1450, stone: 1000 },

    { id: "e_leize_thunder_beast", name: "天劫雷泽紫霄奔雷兽", realm: 2, sub: 6,
      hp: 2150, mp: 350, atk: 172, def: 70, speed: 26,
      skills: ["sk_fist2"], spells: ["lingqi_bo"], attackInflict: { stun: 0.4 },
      resistances: { stun: 90 }, ai: "simple", isBeast: true, tameRate: 0, canFlee: false, fleeRate: 0, exp: 1600, stone: 1150 }
  ]
};

const LEGACY_ENEMY_ID_MAP = {
  e_snake: "e_white_snake_tiny",
  e_boar: "e_boar_iron",
  e_tiger: "e_tianji_iron_tiger",
  e_chaos: "e_asura_scout",
  e_spider: "e_cloud_spider",
  e_bear: "e_bear_black",
};

function getEnemyById(id) {
  const targetId = LEGACY_ENEMY_ID_MAP[id] || id;
  for (const tier in FIGHT_ENEMIES) {
    const found = FIGHT_ENEMIES[tier].find(e => e.id === targetId || e.id === id);
    if (found) return found;
  }
  return null;
}

if (typeof window !== "undefined") {
  window.FIGHT_ENEMIES = FIGHT_ENEMIES;
  window.getEnemyById = getEnemyById;
}
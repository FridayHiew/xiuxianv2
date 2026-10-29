/* ============================================================
   data/adventure-zones.js - 故事主线历练与秘境地图数据
   (与五章主线剧情紧密联动，掉落真实丹药/材料/心法残卷，最高至金丹初期)
   ============================================================ */

const ADVENTURE_ZONES = [
  {
    id: "realm_cloud",
    name: "云雾山麓",
    icon: "🌲",
    desc: "第一章历练地：山林间云雾缭绕，山贼流寇与云纹妖蛛潜伏其中，亦藏有练气灵草与古井奇遇。",
    realmMin: 0,
    realmMax: 2,
    actionCost: 1,
    layers: [
      {
        layer: 1,
        title: "云雾山麓 · 迷雾外围",
        depth: 5,
        finalType: "portal",
        finalCount: 2,
        escapeRate: 0.55,
        enemies: [
          "e_wolf", "e_white_fox", "e_cloud_spider", "e_rabbit_spirit", "e_white_snake_tiny",
          "e_sparrow_spirit", "e_pangolin_tiny", "e_fox_tiny", "e_toad_tiny",
          "e_butterfly_tiny", "e_hedgehog_tiny", "e_bandit_scout", "e_wild_cultivator"
        ],
        storageCount: [1, 2],
        storage: [
          { type: "stone", amount: [40, 90] },
          { type: "mat", baseId: "洗骨花", gradeRange: [1, 2], count: 3 },
          { type: "item", id: "回春丹_1阶_2品", count: 2 }
        ],
        events: [
          { text: "你在林间灵溪旁采得几株带着晨露的洗骨花与赤血草。", effect: { mat: { 洗骨花: 2, 赤血草: 2 }, gradeRange: [1, 2] } },
          { text: "你在枯井青苔下发现前人遗落的灵石袋。", effect: { stone: 55 } },
          { text: "胸前【太渊道玉】微微发热，引山间灵气入体，心法运转大有精进！", effect: { exp: 60 } }
        ]
      },
      {
        layer: 2,
        title: "云雾山麓 · 匪巢深谷",
        depth: 6,
        finalType: "exit",
        finalCount: 1,
        escapeRate: 0.45,
        enemies: [
          "e_bandit", "e_wolf_alpha", "e_cloud_spider_adult", "e_boar_iron",
          "e_bear_black", "e_monkey_stone", "e_viper_green", "e_bandit_blade",
          "e_bandit_archer", "e_bandit_chief"
        ],
        storageCount: [2, 3],
        storage: [
          { type: "stone", amount: [100, 220] },
          { type: "mat", baseId: "清泉水", gradeRange: [1, 2], count: 4 },
          { type: "item", id: "e_sword1", count: 1 },
          { type: "item", id: "聚气丹_2品", count: 2 }
        ],
        events: [
          { text: "击退黑风山贼哨探后，你在其营帐搜刮得一批灵石与物资。", effect: { stone: 110 } },
          { text: "你在山崖石壁上观摩前辈剑痕，吐纳之间修为精进。", effect: { exp: 85 } }
        ]
      }
    ]
  },
  {
    id: "realm_frost",
    name: "寒潭幽谷",
    icon: "❄️",
    desc: "第二章秘境：终年冰封的后山禁谷，封魔古碑裂开缝隙，寒潭剑傀与冰魄妖兽游荡其间。",
    realmMin: 1,
    realmMax: 2,
    actionCost: 1,
    layers: [
      {
        layer: 1,
        title: "寒潭幽谷 · 冰封剑径",
        depth: 6,
        finalType: "portal",
        finalCount: 2,
        escapeRate: 0.4,
        enemies: [
          "e_frost_sword", "e_ice_wolf", "e_frost_spider", "e_ice_leopard",
          "e_frost_snake", "e_ice_beetle", "e_sword_slave", "e_frost_corpse"
        ],
        storageCount: [2, 3],
        storage: [
          { type: "stone", amount: [180, 380] },
          { type: "mat", baseId: "寒血果", gradeRange: [1, 2], count: 3 },
          { type: "item", id: "回春丹_2阶_2品", count: 2 }
        ],
        events: [
          { text: "你在冰封断剑旁拾获几枚寒血果，寒气淬炼经脉。", effect: { mat: { 寒血果: 2, 紫芝草: 2 }, gradeRange: [1, 2] } },
          { text: "陆雪涵师姐留下的剑气印记为你指引了安全路径，并震落灵石。", effect: { stone: 160 } }
        ]
      },
      {
        layer: 2,
        title: "寒潭幽谷 · 封魔碑底",
        depth: 7,
        finalType: "exit",
        finalCount: 1,
        escapeRate: 0.35,
        enemies: [
          "e_ice_beast", "e_ice_bear_giant", "e_frost_dragonette", "e_frost_wraith",
          "e_broken_sword_puppet", "e_monument_guard", "e_ice_serpent_ancient", "e_monument_spirit"
        ],
        storageCount: [2, 3],
        storage: [
          { type: "stone", amount: [260, 520] },
          { type: "mat", baseId: "玉髓芝", gradeRange: [2, 3], count: 3 },
          { type: "item", id: "shop_sword2", count: 1 }
        ],
        events: [
          { text: "你在封魔石碑旁参悟太古剑纹，【太渊道玉】吸纳碑中残存仙气反哺自身！", effect: { exp: 160 } },
          { text: "你在寒潭深处采得珍稀的玉髓芝与清泉水。", effect: { mat: { 玉髓芝: 2, 清泉水: 3 }, gradeRange: [2, 3] } }
        ]
      }
    ]
  },
  {
    id: "realm_danxia",
    name: "丹霞秘境",
    icon: "🔥",
    desc: "第三章秘境：十年一开的古仙炼丹洞天，遍地紫猴花与千年灵药，乃冲击筑基大道的必争之地。",
    realmMin: 1,
    realmMax: 3,
    actionCost: 1,
    layers: [
      {
        layer: 1,
        title: "丹霞秘境 · 百草灵田",
        depth: 6,
        finalType: "portal",
        finalCount: 2,
        escapeRate: 0.35,
        enemies: [
          "e_danxia_beast", "e_herb_hound", "e_blood_scorpion", "e_spirit_deer",
          "e_fire_bee", "e_jade_gecko", "e_sunflower_spirit", "e_renegade_alchemist"
        ],
        storageCount: [2, 3],
        storage: [
          { type: "stone", amount: [400, 750] },
          { type: "mat", baseId: "紫猴花", gradeRange: [2, 3], count: 3 },
          { type: "item", id: "聚气丹_4品", count: 2 }
        ],
        events: [
          { text: "你在古仙药田摘得数株紫猴花与玉髓芝，药香扑鼻！", effect: { mat: { 紫猴花: 2, 玉髓芝: 2 }, gradeRange: [2, 3] } },
          { text: "丹炉遗迹中残存的丹气被你吸入丹田，修为大进！", effect: { exp: 260 } }
        ]
      },
      {
        layer: 2,
        title: "丹霞秘境 · 紫阳丹殿",
        depth: 8,
        finalType: "exit",
        finalCount: 1,
        escapeRate: 0.3,
        enemies: [
          "e_dan_puppet", "e_fire_cauldron_spirit", "e_fire_crow", "e_magma_lizard",
          "e_flame_fiend", "e_cauldron_elder_ghost", "e_blaze_hound_beast"
        ],
        storageCount: [3, 4],
        storage: [
          { type: "stone", amount: [600, 1200] },
          { type: "mat", baseId: "千年降压草", gradeRange: [2, 3], count: 2 },
          { type: "item", id: "筑基丹_3品", count: 1 }
        ],
        events: [
          { text: "你在紫阳丹殿梁柱间寻得前代丹师封存的灵石匣！", effect: { stone: 650 } },
          { text: "吸纳丹霞核心纯净紫气，全身百脉轰鸣，修为猛增！", effect: { exp: 380 } }
        ]
      }
    ]
  },
  {
    id: "realm_tomb",
    name: "沉星古陵",
    icon: "🏛️",
    desc: "第四章秘境：北荒沉眠万载的守陵古墓，壁画镌刻着云渊林氏先祖的秘辛，血煞尸王盘踞祭坛。",
    realmMin: 2,
    realmMax: 3,
    actionCost: 1,
    layers: [
      {
        layer: 1,
        title: "沉星古陵 · 镇魔石廊",
        depth: 7,
        finalType: "portal",
        finalCount: 2,
        escapeRate: 0.25,
        enemies: [
          "e_blood_corpse", "e_tomb_iron_guard", "e_nether_stone_golem", "e_bone_bat",
          "e_corpse_centipede", "e_nether_ghoul", "e_tomb_raider_boss", "e_bronze_spear_puppet"
        ],
        storageCount: [2, 3],
        storage: [
          { type: "stone", amount: [1000, 1800] },
          { type: "mat", baseId: "火精枣", gradeRange: [2, 3], count: 3 },
          { type: "item", id: "聚灵丹_3品", count: 2 }
        ],
        events: [
          { text: "你抚摸古陵石廊上的林氏族徽，血脉共鸣令你修为暴涨！", effect: { exp: 520 } },
          { text: "你在守陵石室中寻得先祖封存的灵石与灵果。", effect: { stone: 900, mat: { 火精枣: 2 }, gradeRange: [2, 3] } }
        ]
      },
      {
        layer: 2,
        title: "沉星古陵 · 血煞祭坛",
        depth: 8,
        finalType: "exit",
        finalCount: 1,
        escapeRate: 0.2,
        enemies: [
          "e_corpse_king", "e_nine_nether_python", "e_blood_bone_demon", "e_constellation_ghost",
          "e_tomb_high_priest", "e_crimson_fiend", "e_nether_general", "e_coffin_guardian_beast"
        ],
        storageCount: [3, 4],
        storage: [
          { type: "stone", amount: [1600, 3000] },
          { type: "item", id: "降尘丹_3品", count: 1 },
          { type: "item", id: "e_taiyuan_jade", count: 1 }
        ],
        events: [
          { text: "你在古陵主棺旁搜得上古守陵人的遗宝！", effect: { stone: 1500 } },
          { text: "太渊道玉吸收古陵镇魔大阵的星辰之力，修为大幅精进！", effect: { exp: 680 } }
        ]
      }
    ]
  },
  {
    id: "realm_abyss",
    name: "天渊道窟",
    icon: "🌌",
    desc: "第五章终极秘境：极北裂开的万丈洪荒道窟，太渊魔尊遗念在此苏醒，乃金丹大道宿命决战之地！",
    realmMin: 2,
    realmMax: 3,
    actionCost: 1,
    layers: [
      {
        layer: 1,
        title: "天渊道窟 · 裂隙魔渊",
        depth: 8,
        finalType: "portal",
        finalCount: 2,
        escapeRate: 0.15,
        enemies: [
          "e_abyss_bat", "e_nether_wolf", "e_abyss_vine", "e_thunder_roc",
          "e_soul_eater_spider", "e_asura_scout", "e_abyss_lizard", "e_blood_ape"
        ],
        storageCount: [3, 4],
        storage: [
          { type: "stone", amount: [2500, 4500] },
          { type: "mat", baseId: "天地灵乳", gradeRange: [3, 3], count: 2 },
          { type: "item", id: "回春丹_3阶_4品", count: 2 }
        ],
        events: [
          { text: "你在天渊石壁采得洪荒凝聚的天地灵乳！", effect: { mat: { 天地灵乳: 2, 妖兽精血: 2 }, gradeRange: [3, 3] } },
          { text: "顶着浩瀚魔威砥砺金丹道心，修为一日千里！", effect: { exp: 900 } }
        ]
      },
      {
        layer: 2,
        title: "天渊道窟 · 道图尽头",
        depth: 9,
        finalType: "exit",
        finalCount: 1,
        escapeRate: 0.1,
        enemies: [
          "e_taiyuan_shade", "e_taiyuan_commander", "e_heaven_thunder_demon",
          "e_void_stalker", "e_golden_crow_shadow", "e_black_dragon_aspect", "e_order_puppet"
        ],
        storageCount: [4, 5],
        storage: [
          { type: "stone", amount: [5000, 9000] },
          { type: "item", id: "聚凝丹_4品", count: 2 },
          { type: "item", id: "e_taiyuan_sword", count: 1 }
        ],
        events: [
          { text: "在太源道图尽头感悟天地至理，凝结无上金丹奥义！", effect: { exp: 1200 } },
          { text: "太渊魔尊遗留的本源晶石散落四周，被你尽数收入囊中！", effect: { stone: 4000 } }
        ]
      }
    ]
  }
];

function getAdventureZone(id) {
  return ADVENTURE_ZONES.find(z => z.id === id) || null;
}

function listAvailableAdventureZones() {
  const info = typeof getPlayerRealmInfo === "function" ? getPlayerRealmInfo() : { realm: 0, lvl: 0 };
  return ADVENTURE_ZONES.filter(z => info.realm >= z.realmMin && info.realm <= z.realmMax);
}

if (typeof window !== "undefined") {
  window.ADVENTURE_ZONES = ADVENTURE_ZONES;
  window.getAdventureZone = getAdventureZone;
  window.listAvailableAdventureZones = listAvailableAdventureZones;
}
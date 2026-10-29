/* ============================================================
   data/secret-events.js - 秘境数据
   ------------------------------------------------------------
   三组：
   - A：随机秘境（每月第 5 天检查）
   - B：条件秘境（剧情/关系触发）
   - C：故事秘境（剧情代码点名抽取）
   
   每个秘境：
   {
     id, name,
     validDays: 3,              // 有效期（A 组用）
     realmMin / realmMax,       // 境界范围
     unlockCond: { ... },       // B 组解锁条件（可选）
     start: "s1",
     scenes: {
       s1: {
         title, visual,
         text: [ "段落1", "段落2" ],
         choices: [
           { label, next: "s2", reward: {...}, special: true },
           { label, next: "END" },
         ],
       },
       ...
     },
   }
   ============================================================ */

const SECRET_EVENTS = {

  /* ============================================================
     A 组：随机秘境（每月第 5 天 30% 几率）
     ============================================================ */
  A: [
    {
      id: "A1_qingyun_ruins",
      name: "青云秘境",
      validDays: 3,
      realmMin: 0,
      realmMax: 5,
      start: "s1",
      scenes: {
        s1: {
          title: "秘境入口",
          visual: "🌫️",
          text: [
            "浓雾弥漫，前方出现一座<span class='gold'>古老的石门</span>。",
            "石门上刻满了你看不懂的符文，微微泛着幽光。",
            "<span class='dim'>你隐约感到，门后藏着某种机缘。</span>",
          ],
          choices: [
            { label: "推开石门", next: "s2a" },
            { label: "绕道而行", next: "s2b" },
          ],
        },
        s2a: {
          title: "石门之后",
          visual: "🏛️",
          text: [
            "石门缓缓推开，你走进一间<span class='gold'>空旷的石室</span>。",
            "石室中央有一方石台，石台上放着一枚<span class='purple'>古朴的玉简</span>。",
          ],
          choices: [
            { label: "拿起玉简", next: "s3a", reward: { exp: 100, note: "古玉简（心法残页）" } },
            { label: "直接离开", next: "END" },
          ],
        },
        s2b: {
          title: "绕道而行",
          visual: "🌿",
          text: [
            "你绕过石门，沿着一条<span class='dim'>杂草丛生</span>的小径往前走。",
            "小径尽头有一棵<span class='good'>古树</span>，树下似乎埋着什么。",
          ],
          choices: [
            { label: "挖开看看", next: "s3b", reward: { stone: 30, note: "灵石 ×30" } },
            { label: "不打扰古树", next: "END" },
          ],
        },
        s3a: {
          title: "玉简的秘密",
          visual: "📜",
          text: [
            "你拾起玉简，一股清凉的气息涌入识海。",
            "<span class='good'>你感觉修为有所精进。</span>",
          ],
          choices: [
            { label: "离开秘境", next: "END" },
          ],
        },
        s3b: {
          title: "古树之下",
          visual: "🌳",
          text: [
            "你挖开泥土，露出一个<span class='gold'>破旧的木匣</span>。",
            "打开木匣，里面是几块散发微光的<span class='gold'>灵石</span>。",
          ],
          choices: [
            { label: "离开秘境", next: "END" },
          ],
        },
      },
    },

    {
      id: "A2_ancient_well",
      name: "上古枯井",
      validDays: 5,
      realmMin: 1,
      realmMax: 5,
      start: "s1",
      scenes: {
        s1: {
          title: "枯井旁",
          visual: "🕳️",
          text: [
            "荒原上，一口<span class='gold'>枯井</span>静静地立在风中。",
            "井口黑黢黢的，看不见底。",
          ],
          choices: [
            { label: "下去看看", next: "s2a" },
            { label: "不去，绕开", next: "END" },
          ],
        },
        s2a: {
          title: "井底",
          visual: "🕯️",
          text: [
            "你沿井壁缓缓下到井底。",
            "井底有一面<span class='purple'>铜镜</span>，镜面映出你自己的脸。",
            "镜中影像微微一笑——",
            "<span class='bad'>你感到一阵寒意。</span>",
          ],
          choices: [
            { label: "拿起铜镜", next: "s3a" },
            { label: "砸碎铜镜", next: "s3b" },
          ],
        },
        s3a: {
          title: "镜中世界",
          visual: "🪞",
          text: [
            "铜镜入手冰凉。你被吸入镜中，",
            "在幻境中历练了一番。",
            "<span class='good'>修为大涨！</span>",
          ],
          choices: [
            { label: "退出秘境", next: "END", reward: { exp: 200, note: "镜中历练" } },
          ],
        },
        s3b: {
          title: "镜碎",
          visual: "💥",
          text: [
            "你奋力一砸，铜镜碎片四散。",
            "碎片中掉落几枚<span class='gold'>妖丹</span>。",
            "<span class='dim'>秘境在迅速消散……</span>",
          ],
          choices: [
            { label: "退出秘境", next: "END", reward: { mat: "水系妖丹", gradeRange: [1, 3], count: 2, note: "妖丹 ×2" } },
          ],
        },
      },
    },

    {
      id: "A3_ghost_market",
      name: "幽市秘境",
      validDays: 3,
      realmMin: 2,
      realmMax: 6,
      start: "s1",
      scenes: {
        s1: {
          title: "幽市入口",
          visual: "🏮",
          text: [
            "夜色中，一座<span class='gold'>灯火通明的坊市</span>出现在你面前。",
            "坊市里人影幢幢，但都面目模糊。",
            "<span class='dim'>你感到一丝不对劲。</span>",
          ],
          choices: [
            { label: "进入坊市", next: "s2" },
            { label: "转身离开", next: "END" },
          ],
        },
        s2: {
          title: "坊市之中",
          visual: "🛒",
          text: [
            "一个摊主招呼你过去，摊上摆着各色奇物。",
            "<span class='purple'>「客人，看看这个？」</span>",
            "他指着一枚<span class='gold'>青色玉佩</span>。",
          ],
          choices: [
            { label: "买下玉佩（花费 50 灵石）", next: "s3a" },
            { label: "不理会，离开坊市", next: "s3b" },
          ],
        },
        s3a: {
          title: "玉佩",
          visual: "🟢",
          text: [
            "你把灵石递给摊主，抓起玉佩就走。",
            "回到宗门，你发现玉佩中<span class='good'>藏着一门心法</span>。",
          ],
          choices: [
            { label: "离开秘境", next: "END", reward: { exp: 300, stone: -50, note: "神秘玉佩" } },
          ],
        },
        s3b: {
          title: "空手而归",
          visual: "🌫️",
          text: [
            "你摇了摇头，走出坊市。",
            "回过头，坊市已经消失，只余一片荒野。",
          ],
          choices: [
            { label: "离开", next: "END" },
          ],
        },
      },
    },

    {
      id: "A4_broken_cave",
      name: "崩裂洞窟",
      validDays: 4,
      realmMin: 1,
      realmMax: 4,
      start: "s1",
      scenes: {
        s1: {
          title: "洞窟入口",
          visual: "🪨",
          text: [
            "山壁上裂开一个洞口，里面传来<span class='dim'>微弱的灵光</span>。",
            "洞口有坍塌的痕迹，看起来随时可能继续崩落。",
          ],
          choices: [
            { label: "小心进入", next: "s2a" },
            { label: "不进，离开", next: "END" },
          ],
        },
        s2a: {
          title: "洞窟深处",
          visual: "✨",
          text: [
            "你小心翼翼向里走，洞壁上嵌着<span class='gold'>发光的矿石</span>。",
            "再往里，是一个小石室，",
            "石室中央有一枚<span class='purple'>灵兽蛋</span>。",
          ],
          choices: [
            { label: "拿蛋", next: "s3a" },
            { label: "只采矿石", next: "s3b" },
          ],
        },
        s3a: {
          title: "灵兽蛋",
          visual: "🥚",
          text: [
            "你把蛋抱在怀里，蛋壳微微温热。",
            "<span class='good'>这或许是一只灵兽的幼崽。</span>",
            "<span class='dim'>洞窟开始剧烈震动……</span>",
          ],
          choices: [
            { label: "赶紧离开", next: "END", reward: { item: "灵兽丹·凡", count: 1, note: "灵兽蛋" } },
          ],
        },
        s3b: {
          title: "矿石",
          visual: "💎",
          text: [
            "你采下几块矿石，装进储物袋，",
            "快步走出洞窟。",
          ],
          choices: [
            { label: "离开", next: "END", reward: { mat: "玉髓芝", gradeRange: [1, 2], count: 3, note: "灵矿" } },
          ],
        },
      },
    },
  ],

  /* ============================================================
     B 组：条件秘境（剧情/关系触发）
     ============================================================ */
  B: [
    {
      id: "B1_elder_secret",
      name: "长老秘境",
      icon: "🏔️",
      desc: "宗门长老手札记载的隐秘山谷，古墓前残剑蕴藏前辈剑意。",
      unlockHint: "修为达炼气期且为门外及以上弟子（或获长老手札指引）",
      unlockCond: { minRealm: 1, minRankIdx: 1 },
      realmMin: 1,
      realmMax: 6,
      start: "s1",
      scenes: {
        s1: {
          title: "长老手札",
          visual: "📜",
          text: [
            "长老留下的手札中，夹着一张<span class='gold'>残破的地图</span>。",
            "地图标注了一处群峰环绕的隐秘古谷。",
          ],
          choices: [
            { label: "按图索骥深入山谷", next: "s2" },
            { label: "暂不前往", next: "END" },
          ],
        },
        s2: {
          title: "古谷残碑",
          visual: "🏔️",
          text: [
            "你依照地图，来到一处幽静山谷。",
            "谷中有一座<span class='purple'>无名的墓碑</span>，墓碑前斜插着一柄<span class='gold'>古铜锈剑</span>。",
          ],
          choices: [
            { label: "拔起锈剑感悟剑意", next: "s3a", reward: { exp: 300, stone: 80, note: "古剑残意" } },
            { label: "虔诚拜祭后离开", next: "s3b" },
          ],
        },
        s3a: {
          title: "锈剑入手",
          visual: "⚔️",
          text: [
            "你握住锈剑，斑驳锈迹纷纷剥落，露出<span class='gold'>古铜色的剑身</span>。",
            "<span class='good'>剑中残存的一缕凌厉剑意涌入经脉，修为大进！</span>",
          ],
          choices: [
            { label: "收剑离开秘境", next: "END" },
          ],
        },
        s3b: {
          title: "敬重古人",
          visual: "🙏",
          text: [
            "你躬身拜了三拜，石碑下忽然露出一枚<span class='gold'>静心丹与灵石</span>。",
            "<span class='dim'>心中一片澄澈清明。</span>",
          ],
          choices: [
            { label: "拜谢离开秘境", next: "END", reward: { exp: 160, stone: 120, item: "静心丹", count: 1, note: "前辈馈赠" } },
          ],
        },
      },
    },
    {
      id: "B2_alchemy_ruins",
      name: "丹阳古洞",
      icon: "🔥",
      desc: "昔日丹阳真人坐化遗留的炼丹洞天，药圃余温尚存，丹炉内似有残丹。",
      unlockHint: "炼丹造诣达 Lv.1 或修为达炼气 3 重",
      unlockCond: { minRealm: 1, minSub: 3, orSkill: { name: "炼丹", lvl: 1 } },
      realmMin: 1,
      realmMax: 6,
      start: "s1",
      scenes: {
        s1: {
          title: "丹洞石门",
          visual: "🔥",
          text: [
            "循着山间若有若无的异香，你在断崖藤蔓后发现一座<span class='gold'>赤铜石门</span>。",
            "门楣上刻着「丹阳洞天」四字，缝隙间溢出一缕醇厚药香。",
          ],
          choices: [
            { label: "运起灵力推门而入", next: "s2a" },
            { label: "先在门外古药圃采摘", next: "s2b", reward: { mat: "紫猴花", gradeRange: [1, 2], count: 2, note: "古圃灵草" } },
          ],
        },
        s2a: {
          title: "八卦紫金炉",
          visual: "⚗️",
          text: [
            "洞内中央立着一尊半人高的<span class='purple'>八卦丹炉</span>，炉底地火尚未完全熄灭。",
            "炉盖微颤，似有成丹即将出炉，四周石壁上还刻着丹道心得。",
          ],
          choices: [
            { label: "开炉收取灵丹", next: "s3a", reward: { item: "聚气丹", count: 2, stone: 150, note: "古炉遗丹" } },
            { label: "静坐参悟石壁丹诀", next: "s3b", reward: { exp: 320, note: "丹道真解" } },
          ],
        },
        s2b: {
          title: "洞外灵泉",
          visual: "💧",
          text: [
            "你小心采下药圃中的灵草，又发现岩壁下有一汪<span class='blue'>温润灵泉</span>。",
            "泉底闪烁着晶莹的灵石光泽。",
          ],
          choices: [
            { label: "掬水饮用并收取灵石", next: "END", reward: { exp: 180, stone: 140, note: "灵泉洗髓" } },
          ],
        },
        s3a: {
          title: "丹香满室",
          visual: "💊",
          text: [
            "炉盖开启，数枚圆润灵丹飞入掌中，炉底更散落着不少上品灵石。",
            "<span class='good'>此次丹洞之行收获颇丰！</span>",
          ],
          choices: [
            { label: "心满意足离开", next: "END" },
          ],
        },
        s3b: {
          title: "大道同参",
          visual: "✨",
          text: [
            "你将石壁上的控火吐纳之术尽数记下，体内真元随之运转周天。",
            "<span class='good'>修为与心境皆大有长进！</span>",
          ],
          choices: [
            { label: "稽首礼敬后离开", next: "END" },
          ],
        },
      },
    },
    {
      id: "B3_sword_tomb",
      name: "万剑荒冢",
      icon: "🗡️",
      desc: "上古剑修宗门遗留的试剑荒冢，万千残剑共鸣，唯有心志坚定者可得剑魄机缘。",
      unlockHint: "修为达筑基期 或 剑法造诣达 Lv.2",
      unlockCond: { minRealm: 2, orSkill: { name: "剑法", lvl: 2 } },
      realmMin: 1,
      realmMax: 7,
      start: "s1",
      scenes: {
        s1: {
          title: "剑气峡谷",
          visual: "🗡️",
          text: [
            "踏入荒冢外围，凛冽剑风迎面扑来，满地皆是历代剑修遗留的<span class='gold'>断剑残锋</span>。",
            "峡谷深处传来阵阵清越剑鸣，似在考验来客。",
          ],
          choices: [
            { label: "顶着剑压直趋剑冢核心", next: "s2a", special: true },
            { label: "在外围搜寻残存遗物", next: "s2b", reward: { stone: 220, note: "古修遗物" } },
          ],
        },
        s2a: {
          title: "剑魄石台",
          visual: "⚡",
          text: [
            "你顶住凌厉剑意登上石台，台心悬浮着一团耀眼的<span class='purple'>太白剑魄</span>。",
            "石台下还压着一卷古旧秘册。",
          ],
          choices: [
            { label: "炼化剑魄淬炼修为", next: "END", reward: { exp: 550, stone: 180, note: "太白剑魄" } },
            { label: "收取石台下的灵材与灵石", next: "END", reward: { stone: 380, mat: "玉髓芝", gradeRange: [2, 3], count: 2, note: "剑台秘藏" } },
          ],
        },
        s2b: {
          title: "外围收获",
          visual: "💎",
          text: [
            "你在几处古修遗骸旁寻得储物残袋，内有不少灵石与疗伤丹药。",
            "剑冢深处剑气愈发狂暴，你决定见好就收。",
          ],
          choices: [
            { label: "稳妥退离荒冢", next: "END", reward: { exp: 180, item: "回血丹", count: 2, note: "稳妥收获" } },
          ],
        },
      },
    },
  ],

  /* ============================================================
     C 组：故事秘境（1003 年剧情，随机抽 1 个）
     ============================================================ */
  C: [
    {
      id: "C1_mixed_orb",
      name: "混元秘境",
      realmMin: 1,
      realmMax: 9,
      start: "s1",
      scenes: {
        s1: {
          title: "混元之地",
          visual: "🌀",
          text: [
            "天地骤暗，你置身一片<span class='gold'>荒芜平原</span>。",
            "远方有一座巨大的<span class='purple'>圆形祭坛</span>。",
            "祭坛上似乎有东西在发光。",
          ],
          choices: [
            { label: "走向祭坛", next: "s2" },
            { label: "远远观望", next: "s3" },
          ],
        },
        s2: {
          title: "祭坛",
          visual: "🏛️",
          text: [
            "祭坛中央悬浮着一颗<span class='purple'>灰蒙蒙的珠子</span>。",
            "珠子缓缓旋转，散发着<span class='gold'>混沌的气息</span>。",
            "<span class='dim'>「这就是混元珠……」</span>",
          ],
          choices: [
            { label: "伸手去取", next: "s4a", special: true },
            { label: "退后观察", next: "s4b" },
          ],
        },
        s3: {
          title: "观望",
          visual: "👁️",
          text: [
            "你远远站着，只见祭坛上光芒一闪，",
            "一道身影掠过，抢走了珠子。",
            "<span class='bad'>「呵呵，多谢引路。」</span>",
            "来者大笑离去。",
          ],
          choices: [
            { label: "追！", next: "s4c" },
            { label: "放弃，离开", next: "END" },
          ],
        },
        s4a: {
          title: "混元珠入手",
          visual: "🔮",
          text: [
            "你握住混元珠，一股磅礴的力量涌入体内——",
            "但随之而来的是一阵<span class='bad'>剧烈反噬</span>。",
            "<span class='dim'>你隐约看到，这颗珠子，来日将引发一场大劫……</span>",
          ],
          choices: [
            { label: "带着珠子离开", next: "END", reward: { exp: 1000, note: "混元珠（伏笔）", flag: "gotMixedOrb" } },
          ],
        },
        s4b: {
          title: "放弃",
          visual: "🚶",
          text: [
            "你退后几步，祭坛上的珠子突然凭空消失。",
            "<span class='dim'>或许，它不该属于你。</span>",
          ],
          choices: [
            { label: "离开", next: "END" },
          ],
        },
        s4c: {
          title: "追击",
          visual: "💨",
          text: [
            "你循着气息追出很远，",
            "却在一处山崖前失去了踪迹。",
            "<span class='bad'>「混元珠，落入他人之手……」</span>",
          ],
          choices: [
            { label: "返回宗门", next: "END", reward: { exp: 200, note: "追踪未果" } },
          ],
        },
      },
    },

    {
      id: "C2_ancient_battlefield",
      name: "上古战场",
      realmMin: 1,
      realmMax: 9,
      start: "s1",
      scenes: {
        s1: {
          title: "战场遗迹",
          visual: "⚔️",
          text: [
            "你踏入一片荒凉的战场，",
            "断兵残甲散落一地，阴风阵阵。",
          ],
          choices: [
            { label: "深入战场", next: "s2" },
            { label: "绕道离开", next: "END" },
          ],
        },
        s2: {
          title: "亡魂",
          visual: "👻",
          text: [
            "前方突然出现一个<span class='purple'>半透明的身影</span>，",
            "那是一具上古修士的亡魂。",
            "<span class='purple'>「生者……为何来此？」</span>",
          ],
          choices: [
            { label: "行礼致敬", next: "s3a" },
            { label: "拔剑相对", next: "s3b", special: true },
          ],
        },
        s3a: {
          title: "传承",
          visual: "✨",
          text: [
            "亡魂点了点头：",
            "<span class='purple'>「我等战死于此，只为守一物。」</span>",
            "<span class='purple'>「你既有缘，便与你了。」</span>",
          ],
          choices: [
            { label: "接下传承", next: "END", reward: { exp: 500, note: "上古传承" } },
          ],
        },
        s3b: {
          title: "激战",
          visual: "💀",
          text: [
            "亡魂沉默片刻，化作一道幽光扑来。",
            "你与它激战一场，最终将它击散。",
            "<span class='dim'>战后，你感到一丝怅然。</span>",
          ],
          choices: [
            { label: "离开", next: "END", reward: { exp: 300, note: "战利品" } },
          ],
        },
      },
    },

    {
      id: "C3_star_ruins",
      name: "星陨遗迹",
      realmMin: 2,
      realmMax: 9,
      start: "s1",
      scenes: {
        s1: {
          title: "陨坑",
          visual: "☄️",
          text: [
            "天空划过一道流星，坠落在不远处的山谷。",
            "你赶到时，山谷中出现了一个<span class='gold'>巨大的陨坑</span>。",
            "坑底有一块<span class='purple'>星辉石</span>。",
          ],
          choices: [
            { label: "下坑取石", next: "s2" },
            { label: "远远看一眼", next: "END" },
          ],
        },
        s2: {
          title: "星辉石",
          visual: "🌟",
          text: [
            "你小心接近星辉石，石上刻着<span class='gold'>奇异的符文</span>。",
            "指尖刚触到石面，",
            "一道光芒射入你的识海——",
          ],
          choices: [
            { label: "接受这道光", next: "s3a" },
            { label: "抗拒，抽手", next: "s3b" },
          ],
        },
        s3a: {
          title: "星辉入体",
          visual: "✨",
          text: [
            "光芒没入识海，你感到神魂一震。",
            "<span class='good'>似乎，悟到了什么。</span>",
          ],
          choices: [
            { label: "离开", next: "END", reward: { exp: 400, note: "星辉感悟" } },
          ],
        },
        s3b: {
          title: "抽手",
          visual: "🚶",
          text: [
            "你猛地抽手，星辉石光芒渐暗。",
            "<span class='dim'>机缘错过，但也没受损伤。</span>",
          ],
          choices: [
            { label: "离开", next: "END" },
          ],
        },
      },
    },

    {
      id: "C4_spirit_valley",
      name: "灵兽谷",
      realmMin: 1,
      realmMax: 9,
      start: "s1",
      scenes: {
        s1: {
          title: "灵兽谷口",
          visual: "🐾",
          text: [
            "你来到一处山谷，谷口有<span class='gold'>灵兽的爪印</span>。",
            "谷中隐约传来幼兽的叫声。",
          ],
          choices: [
            { label: "进入山谷", next: "s2" },
            { label: "原地观察", next: "END" },
          ],
        },
        s2: {
          title: "灵兽幼崽",
          visual: "🐺",
          text: [
            "你在谷中看到一只<span class='gold'>灵兽幼崽</span>，蜷缩在岩石后。",
            "它似乎受伤了，怯生生地看着你。",
          ],
          choices: [
            { label: "上前安抚", next: "s3a" },
            { label: "默默离开", next: "s3b" },
          ],
        },
        s3a: {
          title: "结缘",
          visual: "💛",
          text: [
            "灵兽幼崽伸出爪子，轻轻搭在你掌心。",
            "<span class='good'>它认你为主了。</span>",
          ],
          choices: [
            { label: "带它离开", next: "END", reward: { item: "灵兽丹·凡", count: 1, note: "灵兽幼崽" } },
          ],
        },
        s3b: {
          title: "离开",
          visual: "🚶",
          text: [
            "你悄悄退出山谷，没打扰它。",
            "<span class='dim'>心中一片安宁。</span>",
          ],
          choices: [
            { label: "离开", next: "END", reward: { exp: 100, note: "心境" } },
          ],
        },
      },
    },
  ],
};

/* ============================================================
   工具
   ============================================================ */
function getSecretEventById(id) {
  for (const group of ["A", "B", "C"]) {
    const found = SECRET_EVENTS[group].find(e => e.id === id);
    if (found) return found;
  }
  return null;
}

/* 抽一个随机秘境（按境界过滤） */
function pickSecretEventFromGroup(group) {
  const pool = SECRET_EVENTS[group] || [];
  const info = getPlayerRealmInfo();
  const realm = info.realm;
  const candidates = pool.filter(e => {
    if (e.realmMin !== undefined && realm < e.realmMin) return false;
    if (e.realmMax !== undefined && realm > e.realmMax) return false;
    return true;
  });
  if (candidates.length === 0) return null;
  return pick(candidates);
}

/* B 组解锁判定（支持显式解锁 + 满足条件自动解锁） */
function isSecretEventUnlocked(id) {
  if (!S || !S.flags) return false;
  if (!S.flags.secretUnlocked) S.flags.secretUnlocked = {};
  if (S.flags.secretUnlocked[id]) return true;

  const ev = (SECRET_EVENTS.B || []).find(e => e.id === id);
  if (!ev || !ev.unlockCond) return false;

  const cond = ev.unlockCond;
  const info = typeof getPlayerRealmInfo === "function" ? getPlayerRealmInfo() : { realm: 0, lvl: 0 };
  const rank = (S.flags && S.flags.rank) || "杂务";
  const rankIdx = typeof RANKS !== "undefined" ? RANKS.indexOf(rank) : 0;

  let realmOk = true;
  if (cond.minRealm !== undefined && info.realm < cond.minRealm) realmOk = false;
  if (cond.minSub !== undefined && info.realm === (cond.minRealm || 1) && info.lvl < cond.minSub) realmOk = false;
  if (cond.minRankIdx !== undefined && rankIdx < cond.minRankIdx) realmOk = false;

  let skillOk = false;
  if (cond.orSkill && S.skills && S.skills[cond.orSkill.name]) {
    if ((S.skills[cond.orSkill.name].lvl || 0) >= (cond.orSkill.lvl || 1)) {
      skillOk = true;
    }
  }

  if (realmOk || skillOk) {
    S.flags.secretUnlocked[id] = true;
    return true;
  }
  return false;
}

function unlockSecretEvent(id) {
  if (!S.flags.secretUnlocked) S.flags.secretUnlocked = {};
  if (S.flags.secretUnlocked[id]) return;
  S.flags.secretUnlocked[id] = true;
  const ev = getSecretEventById(id);
  log(`【秘境解锁】你获知了一处机缘秘境：【${ev ? ev.name : id}】！`, "c-gold");
}
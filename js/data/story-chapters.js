/* ============================================================
   data/story-chapters.js - 完整主线剧情章节、支线奇遇、修为触发条件、任务与多幕对白
   (凡人 -> 炼气十重 -> 筑基五重圆满 -> 金丹初期 封顶)
   支持动态插值：{playerName} = 玩家道号，{sectName} = 玩家所属宗门
   ============================================================ */

const STORY_CHAPTERS = [
  {
    id: 1,
    title: "第一章：云渊遗孤 · 凡胎问道",
    subtitle: "怀璧入山门，洗尽凡尘踏仙途",
    minRealm: 0,
    triggerRealm: 0,
    triggerLvl: 0,
    triggerConditionText: "初入仙门（凡人境自动开启）",
    maxRealmName: "炼气期三重",
    bgImage: "./src/assets/images/cave_cultivation_1792114546452.jpg",
    location: "{sectName} · 外门青石院",
    desc: "三日前雷雨之夜，云渊林氏古族惨遭黑衣魔修屠戮。你怀揣先祖临终托付的秘宝【太渊道玉】逃入仙山，拜入【{sectName}】外门。从洒扫砍柴的杂务弟子做起，在子夜道玉的共鸣下感气吐纳、洗尽凡胎，揭开波澜壮阔的修真长卷。",
    dialogues: [
      {
        sceneTag: "第一幕 · 山门托孤",
        speaker: "掌门 凌虚子",
        role: "{sectName}掌教",
        avatar: "🧙‍♂️",
        emotion: "威严慈和",
        text: "「世间万物皆有因果。{playerName}，你自云渊血火中幸存，怀揣这块古朴道玉投奔我{sectName}，便是一桩天命仙缘。虽是凡胎肉体，只要道心坚毅，未必不能夺天地之造化。」"
      },
      {
        sceneTag: "第二幕 · 外门立规",
        speaker: "执事 严老",
        role: "外门铁面执事",
        avatar: "🧔",
        emotion: "冷峻严厉",
        text: "「哼，修仙界弱肉强食、强者为尊！别以为进了{sectName}山门就能高枕无忧。外门不养闲人，每日先把杂务做完，再去后山打坐把《练气基础》熟练度修满，方有资格尝试引气入体！」"
      },
      {
        sceneTag: "第三幕 · 魁首逼视",
        speaker: "同门 墨无痕",
        role: "外门大师兄",
        avatar: "🥷",
        emotion: "倨傲审视",
        text: "「这便是新来的云渊遗孤？连一缕灵力都未曾凝聚的凡夫俗子，也配得掌门亲口垂询？小子，识相的便老实劈柴挑水，莫要碍了本师兄的眼。」"
      },
      {
        sceneTag: "第四幕 · 雪涵赠丹",
        speaker: "师姐 陆雪涵",
        role: "内门师姐",
        avatar: "👩‍🌾",
        emotion: "温婉关切",
        text: "「{playerName}师弟莫往心里去，墨无痕仗着炼气后期修为向来跋扈，严老则是刀子嘴豆腐心。初次引气入体切忌急功近利，这几枚灵石与回春丹你贴身收好，去【云雾山麓】历练时定能用上。」"
      },
      {
        sceneTag: "第五幕 · 子夜玉鸣",
        speaker: "太渊道玉 · 澜音",
        role: "古玉残魂",
        avatar: "🔮",
        emotion: "空灵幽远",
        text: "「（子夜时分，你胸前的青玉忽然泛起微光，一道虚弱却清冷的女声在识海响起）吾乃太渊道玉器灵【澜音】……九幽魔宗为你族守陵信物而来。快些突破炼气期吧，唯有灵气入体，吾方能醒转助你！」"
      },
      {
        sceneTag: "第六幕 · 山麓匪踪",
        speaker: "师姐 陆雪涵",
        role: "内门师姐",
        avatar: "👩‍🌾",
        emotion: "神色凝重",
        text: "「师弟，山下【云雾山麓】近来不仅有妖蛛筑巢，更有一伙来历不明的黑风山贼四处搜寻云渊遗族的下落。你突破炼气一重后，可入山麓外围历练一番，务必小心行事。」"
      },
      {
        sceneTag: "第七幕 · 道心初立",
        speaker: "{playerName}（我）",
        role: "云渊遗孤",
        avatar: "🗡️",
        emotion: "坚毅果决",
        text: "「族人血仇未报，胸前【太渊道玉】重若千钧。无论前路有多少荆棘与强敌，我定要在{sectName}修成无上大道，查明当年灭族真相！」"
      }
    ],
    sideStories: [
      {
        id: "c1_side_1",
        title: "【支线奇遇】柴房古碑的刀痕",
        npc: "执事 严老",
        avatar: "🧔",
        summary: "傍晚劈柴归来，你发现严老独自在柴房后院摩挲一块断裂的古剑碑……",
        reward: { stone: 60, exp: 40, dao: 10 },
        scenes: [
          { speaker: "{playerName}（我）", avatar: "🗡️", text: "「严长老，今日的木柴已经劈好入库了……咦，这块断碑上的剑痕好生凌厉！」" },
          { speaker: "执事 严老", avatar: "🧔", text: "「看出来了？老夫年轻时也曾是内门剑修，只因三十年前在北荒与九幽魔修死战，经脉尽碎，才退居外门管束尔等杂役。」" },
          { speaker: "执事 严老", avatar: "🧔", text: "「你小子劈柴挑水从不叫苦，心性倒像极了老夫当年的挚友。这本吐纳心得与几块碎灵石拿去，莫要堕了{sectName}的威名！」" }
        ]
      },
      {
        id: "c1_side_2",
        title: "【人物羁绊】月下药香与师姐旧事",
        npc: "师姐 陆雪涵",
        avatar: "👩‍🌾",
        summary: "青石院月色如水，陆雪涵师姐正坐在石桌旁分拣云雾山麓采来的灵草……",
        reward: { stone: 80, exp: 50, item: "回春丹_1阶_2品" },
        scenes: [
          { speaker: "师姐 陆雪涵", avatar: "👩‍🌾", text: "「{playerName}师弟还没歇息？正好，帮我把这几株洗骨花的根茎理一理。」" },
          { speaker: "{playerName}（我）", avatar: "🗡️", text: "「多谢师姐自入门以来屡次照拂。不知师姐为何对我格外关照？」" },
          { speaker: "师姐 陆雪涵", avatar: "👩‍🌾", text: "「五年前我下山采药遭妖狼围困，曾受云渊林氏一位猎户大叔舍命相救。得知云渊遭逢大难，我便暗下决心要护你周全。拿好这瓶二品回春丹，早日突破炼气！」" }
        ]
      }
    ],
    quests: [
      { id: "c1_q1", name: "完成 3 次宗门日常杂务", targetType: "choreCount", need: 3, reward: { stone: 100, exp: 40, item: "回春丹_1阶_2品" }, desc: "在【日常】中执行今日杂务或打杂，磨炼修道心性", actionTab: "day" },
      { id: "c1_q2", name: "突破至【炼气期一重】", targetType: "realm", needRealm: 1, needLvl: 1, reward: { stone: 180, exp: 60, item: "lianqi_basic_f2" }, desc: "打坐攒满心法熟练度并突破，获赐《练气基础·中卷》（可在背包参悟解锁4~6重）", actionTab: "day" },
      { id: "c1_q3", name: "通关历练【云雾山麓】", targetType: "dungeon", dungeonId: "realm_cloud", reward: { stone: 300, contrib: 60, item: "e_sword1" }, desc: "前往【云雾山麓】击退山贼流寇并抵达第 2 层出口", actionTab: "day" }
    ],
    choice: {
      title: "【命运抉择】山麓古井的雪狐哀鸣",
      desc: "在云雾山麓深处追击山贼哨探时，你发现一口枯竭古井下困着一只通体雪白、额生太渊灵纹的幼狐，井畔还散落着山贼遗留的沉重钱袋與血色禁符。",
      optionA: { label: "以灵气震断铁锁，耗费丹药救治灵狐", morality: 10, dao: 15, stone: 80, rewardText: "正气凛然：善念 +10，道心 +15，白狐衔来古修士遗藏灵石 +80" },
      optionB: { label: "搜刮山贼钱袋并炼化血符中的精纯灵力", morality: -10, dao: 30, stone: 200, rewardText: "杀伐果断：善念 -10，道心 +30，搜刮山贼秘藏灵石 +200" }
    }
  },
  {
    id: 2,
    title: "第二章：寒潭锁魔 · 剑影迷踪",
    subtitle: "寒潭封印松动，同门暗流涌动",
    minRealm: 1,
    triggerRealm: 1,
    triggerLvl: 4,
    triggerConditionText: "修为达到【炼气期四重】自动触发",
    maxRealmName: "炼气期七重",
    bgImage: "./src/assets/images/xianxia_bg_banner_1792114543496.jpg",
    location: "{sectName}后山 · 寒潭幽谷",
    desc: "参悟《练气基础·中卷》踏入炼气中期后，你体内的灵力引发【太渊道玉】第一重禁制苏醒。与此同时，{sectName}后山禁地【寒潭幽谷】魔气翻涌，冰封百年的封魔剑碑竟遭内鬼蓄意破坏，外门魁首墨无痕的行踪愈发诡秘……",
    dialogues: [
      {
        sceneTag: "第一幕 · 道玉苏醒",
        speaker: "太渊道玉 · 澜音",
        role: "古玉器灵",
        avatar: "🔮",
        emotion: "神念清朗",
        text: "「善哉！{playerName}，你已踏入炼气中期，吾之灵识终于恢复三成。后山寒潭之下镇压着一缕太古魔煞，与覆灭你云渊古族的魔修同出一源，万不可掉以轻心！」"
      },
      {
        sceneTag: "第二幕 · 深夜急召",
        speaker: "师姐 陆雪涵",
        role: "内门师姐",
        avatar: "👩‍🌾",
        emotion: "神色凝重",
        text: "「{playerName}师弟，大事不妙！方才巡山弟子回报，后山【寒潭幽谷】底部的封魔石碑被人以魔血侵蚀，镇守寒潭的古剑傀纷纷暴走，已经伤了好几名外门弟子！」"
      },
      {
        sceneTag: "第三幕 · 冰谷对峙",
        speaker: "同门 墨无痕",
        role: "外门魁首",
        avatar: "🥷",
        emotion: "阴鸷冷笑",
        text: "「哈哈哈，陆师姐与{playerName}来得倒快！可惜晚了一步——封魔碑下的《血煞九变》残篇已被本师兄所得！{sectName}守着太渊宝山却甘当腐朽看门犬，唯有九幽圣教方能赐我无上大道！」"
      },
      {
        sceneTag: "第四幕 · 剑气交锋",
        speaker: "{playerName}（我）",
        role: "{sectName}新秀",
        avatar: "🗡️",
        emotion: "怒目拔剑",
        text: "「墨无痕！原来引黑风山贼窥伺山门、损毁后山封印的内鬼竟是你！当年云渊古族惨案，九幽魔宗究竟在谋划什么？今日休想全身而退！」"
      },
      {
        sceneTag: "第五幕 · 魔影遁逃",
        speaker: "同门 墨无痕",
        role: "叛门魔徒",
        avatar: "🥷",
        emotion: "狞笑遁走",
        text: "「凭你区区炼气中期也想留我？寒潭剑傀听令——给我撕碎他们！{playerName}，待我去丹霞秘境夺取筑基造化，再来取你项上人头与胸前道玉！」"
      },
      {
        sceneTag: "第六幕 · 严老授卷",
        speaker: "执事 严老",
        role: "外门执事",
        avatar: "🧔",
        emotion: "沉声嘱咐",
        text: "「墨无痕捏碎血遁符逃往下山了，眼下当务之急是深入【寒潭幽谷】第 2 层，镇压暴走的寒潭剑傀、稳固封魔碑！待此事平定，老夫便保举你晋升【门外】正式弟子，并传你《练气基础·下卷》！」"
      }
    ],
    sideStories: [
      {
        id: "c2_side_1",
        title: "【支线奇遇】墨无痕旧居的密信",
        npc: "师姐 陆雪涵",
        avatar: "👩‍🌾",
        summary: "墨无痕叛逃后，你与陆雪涵奉命搜查他在外门的居所，在暗格中发现一封漆黑密信……",
        reward: { stone: 220, exp: 90, contrib: 40 },
        scenes: [
          { speaker: "师姐 陆雪涵", avatar: "👩‍🌾", text: "「师弟快看，床榻暗格里有一枚九幽骨令与一封未烧尽的密信！」" },
          { speaker: "{playerName}（我）", avatar: "🗡️", text: "「信上写着：『借丹霞洞天开启之机，收集百名修士精血，于北荒沉星古陵唤醒尸王，逼太渊道玉现世』……原来他们的真正目标是北荒古陵！」" },
          { speaker: "师姐 陆雪涵", avatar: "👩‍🌾", text: "「事关重大，我们将骨令呈交长老堂，这暗格中藏着的二百二十枚灵石便留给师弟充作修炼资粮！」" }
        ]
      },
      {
        id: "c2_side_2",
        title: "【器灵秘闻】太渊十二封魔印",
        npc: "太渊道玉 · 澜音",
        avatar: "🔮",
        summary: "寒潭归来后，澜音在识海中向你展露了一幅残缺的太古星图……",
        reward: { stone: 180, exp: 110, dao: 25 },
        scenes: [
          { speaker: "太渊道玉 · 澜音", avatar: "🔮", text: "「{playerName}，你可知你林氏先祖究竟是何许人？万载之前，太渊魔尊祸乱九州，是你林氏先祖化自身金丹为十二道封魔印，将其镇入极北【天渊道窟】。」" },
          { speaker: "{playerName}（我）", avatar: "🗡️", text: "「原来我族世代隐居云渊，竟是为了守护太渊道玉这枚大阵阵眼！」" },
          { speaker: "太渊道玉 · 澜音", avatar: "🔮", text: "「不错。如今封印历经万载日渐衰微，你唯有尽快修至炼气十重圆满、踏入筑基大道，方能重掌道图真威！」" }
        ]
      }
    ],
    quests: [
      { id: "c2_q1", name: "修为达到【炼气期五重】", targetType: "realm", needRealm: 1, needLvl: 5, reward: { stone: 400, exp: 120, item: "聚气丹_3品" }, desc: "在【背包>秘籍】参悟《练气基础·中卷》并打坐突破至炼气五重", actionTab: "day" },
      { id: "c2_q2", name: "通关秘境【寒潭幽谷】", targetType: "dungeon", dungeonId: "realm_frost", reward: { stone: 650, contrib: 150, item: "lianqi_basic_f3" }, desc: "深入寒潭幽谷击败寒潭剑傀抵达出口，获赐《练气基础·下卷》（解锁7~10重）", actionTab: "day" },
      { id: "c2_q3", name: "晋升为【门外】或更高宗门身份", targetType: "rank", needRank: "门外", reward: { stone: 550, contrib: 120, item: "shop_sword2" }, desc: "攒足铜钱与执事好感，在【宗门】申请晋升为门外弟子", actionTab: "sect" }
    ],
    choice: {
      title: "【命运抉择】封魔碑下的残缺魔卷",
      desc: "击溃寒潭剑傀后，你在裂开的封魔石碑底座下发现墨无痕仓促间遗落的半部《血煞九变》秘卷，其上血光流转，蕴含狂暴灵能。",
      optionA: { label: "呈交掌门凌虚子，以宗门正道大阵净化封印", morality: 15, dao: 25, stone: 260, rewardText: "正道表率：善念 +15，道心 +25，掌门嘉奖灵石 +260" },
      optionB: { label: "借太渊道玉压制戾气，逆向剥离魔卷中的精纯灵力", morality: -15, dao: 55, stone: 380, rewardText: "逆修奇功：善念 -15，道心 +55，炼化灵晶折合灵石 +380" }
    }
  },
  {
    id: 3,
    title: "第三章：丹霞秘境 · 筑基天劫",
    subtitle: "百草凝金液，逆天破凡筑道基",
    minRealm: 1,
    triggerRealm: 1,
    triggerLvl: 8,
    triggerConditionText: "修为达到【炼气期八重】或【筑基期】自动触发",
    maxRealmName: "筑基期二层",
    bgImage: "./src/assets/images/sect_mountain_1792114544521.jpg",
    location: "古仙洞天 · 丹霞秘境",
    desc: "参悟《练气基础·下卷》修至炼气后期，凡躯百载寿元终有尽时。唯有闯入十年一开的古仙洞天【丹霞秘境】，夺取千年灵药与《太渊筑基诀》，冲破炼气十重圆满的天地桎梏，方能凝气成液、铸就无上道基，寿享二百载！",
    dialogues: [
      {
        sceneTag: "第一幕 · 丹鼎论道",
        speaker: "长老 丹霞真人",
        role: "{sectName}丹鼎长老",
        avatar: "🧪",
        emotion: "郑重告诫",
        text: "「炼气十重不过是修真界之起点，筑基方为逆天改命第一道天堑！不成筑基，终为蝼蚁；一朝筑基，气海化液，寿增百载！{playerName}，十年一开的【丹霞秘境】今日开启，你的机缘到了！」"
      },
      {
        sceneTag: "第二幕 · 掌门嘱托",
        speaker: "掌门 凌虚子",
        role: "{sectName}掌教",
        avatar: "🧙‍♂️",
        emotion: "殷切期许",
        text: "「{playerName}，你胸前的太渊道玉已现第二重灵纹。据天机推演，丹霞秘境核心的紫阳丹殿中藏有上古《太渊筑基诀》。但叛徒墨无痕亦已潜入其中，你与雪涵定要联手破敌！」"
      },
      {
        sceneTag: "第三幕 · 秘境并肩",
        speaker: "师姐 陆雪涵",
        role: "内门师姐",
        avatar: "👩‍🌾",
        emotion: "英姿飒爽",
        text: "「师弟，我已经先一步探明百草灵田与紫阳丹殿的方位！这丹霞秘境中既有千年紫猴花，也有凶悍的丹霞守药兽，我们一同杀入第 2 层核心！」"
      },
      {
        sceneTag: "第四幕 · 丹殿重逢",
        speaker: "同门 墨无痕",
        role: "九幽外使",
        avatar: "🥷",
        emotion: "怨毒狂傲",
        text: "「{playerName}！真没想到你短短时日便从一介杂役修至炼气后期！可惜这紫阳丹殿的筑基丹药与古仙遗卷，今日尽归我九幽魔宗所有！」"
      },
      {
        sceneTag: "第五幕 · 道玉传法",
        speaker: "太渊道玉 · 澜音",
        role: "古玉器灵",
        avatar: "🔮",
        emotion: "仙音浩荡",
        text: "「区区魔门爪牙也敢染指太渊遗泽？{playerName}，通关丹霞秘境后即可领受吾为你解封的《太渊筑基诀》！当你修至炼气十重圆满、参悟此诀突破筑基之时，便是你鱼跃龙门之日！」"
      },
      {
        sceneTag: "第六幕 · 开辟洞府",
        speaker: "长老 丹霞真人",
        role: "{sectName}丹鼎长老",
        avatar: "🧪",
        emotion: "抚须赞叹",
        text: "「好苗子！待你突破筑基、晋升本门【门内】弟子后，宗门便会为你开辟专属【修真洞府】，届时你可自建聚灵阵、开炉炼制高阶丹药，仙途一片坦荡！」"
      }
    ],
    sideStories: [
      {
        id: "c3_side_1",
        title: "【支线奇遇】丹霞真人的炸炉危机",
        npc: "长老 丹霞真人",
        avatar: "🧪",
        summary: "丹霞真人开炉炼制一炉上古灵丹时炉火失控，急需你以太渊道玉的清凉灵韵稳住丹鼎……",
        reward: { stone: 500, exp: 200, item: "筑基丹_3品" },
        scenes: [
          { speaker: "长老 丹霞真人", avatar: "🧪", text: "「不好！这株千年紫猴花药力太过霸烈，赤阳丹鼎快要压不住火候了！{playerName}，快以灵力助老夫一臂之力！」" },
          { speaker: "{playerName}（我）", avatar: "🗡️", text: "「弟子遵命！太渊道玉，凝气镇火——起！」" },
          { speaker: "长老 丹霞真人", avatar: "🧪", text: "「哈哈哈哈！成了！一炉三枚极品灵丹！{playerName}，多亏你及时出手，这枚三品【筑基丹】与五百灵石便赠予你，助你一举冲破筑基天关！」" }
        ]
      },
      {
        id: "c3_side_2",
        title: "【人物羁绊】紫阳丹殿的并肩誓言",
        npc: "师姐 陆雪涵",
        avatar: "👩‍🌾",
        summary: "在丹霞秘境休整之夜，篝火映照着漫天霞光，陆雪涵为你包扎手臂上的伤痕……",
        reward: { stone: 600, exp: 220, dao: 40 },
        scenes: [
          { speaker: "师姐 陆雪涵", avatar: "👩‍🌾", text: "「方才面对丹霞守药兽的扑击，你为何不躲，反而横剑挡在我身前？」" },
          { speaker: "{playerName}（我）", avatar: "🗡️", text: "「当年我初入山门孤立无援，是师姐赠丹护持。如今我已有自保之力，自然轮到我为师姐遮风挡雨。」" },
          { speaker: "师姐 陆雪涵", avatar: "👩‍🌾", text: "「（脸颊微红，轻声一笑）傻师弟……漫漫长生路，若能与你一同踏上筑基、结丹大道，便不负此生了。」" }
        ]
      }
    ],
    quests: [
      { id: "c3_q1", name: "通关秘境【丹霞秘境】", targetType: "dungeon", dungeonId: "realm_danxia", reward: { stone: 1200, contrib: 220, item: "taiyuan_zhuji_f1" }, desc: "在丹霞秘境击败丹霞守药兽并抵达第 2 层出口，获赐《太渊筑基诀》（炼气10重圆满可在背包参悟）", actionTab: "day" },
      { id: "c3_q2", name: "成功突破至【筑基期一重】", targetType: "realm", needRealm: 2, needLvl: 1, reward: { stone: 2000, contrib: 300, item: "聚灵丹_3品" }, desc: "将炼气心法修至10重圆满后，在【背包>秘籍】参悟筑基心法并成功破关筑基", actionTab: "day" },
      { id: "c3_q3", name: "开辟洞府并晋升【门内】弟子", targetType: "rank", needRank: "门内", reward: { stone: 1600, exp: 350, item: "回春丹_2阶_4品" }, desc: "在【宗门】晋升为门内弟子，正式开启专属【修真洞府】", actionTab: "sect" }
    ],
    choice: {
      title: "【命运抉择】秘境核心的千年筑基灵果",
      desc: "丹霞秘境第 2 层核心处，一株三千年紫阳朱果即将成熟，但数名同门弟子正遭狂暴妖兽围攻，防线摇摇欲坠。",
      optionA: { label: "拔剑驰援同门，合力诛妖后平分灵果", morality: 20, dao: 35, stone: 600, rewardText: "仁侠仗义：善念 +20，道心 +35，同门感念赠予灵石 +600" },
      optionB: { label: "趁妖兽被同门死死牵制，施展身法独揽整株朱果", morality: -20, dao: 70, stone: 1300, rewardText: "独揽造化：善念 -20，道心 +70，独占灵藏折合灵石 +1300" }
    }
  },
  {
    id: 4,
    title: "第四章：沉星古陵 · 血煞大阵",
    subtitle: "古陵尸王苏醒，太渊身世揭晓",
    minRealm: 2,
    triggerRealm: 2,
    triggerLvl: 3,
    triggerConditionText: "修为达到【筑基期三重】自动触发",
    maxRealmName: "筑基期五重圆满",
    bgImage: "./src/assets/images/alchemy_pavilion_1792114547274.jpg",
    location: "北荒禁地 · 沉星古陵",
    desc: "踏入筑基中期后，北荒禁地【沉星古陵】轰然震动！彻底堕入魔道的墨无痕在古陵布下万灵血煞大阵，企图唤醒沉眠万载的【血煞尸王】。而当你踏入古陵石廊，却震惊地发现墓道壁画上竟镌刻着云渊林氏先祖的守陵徽记！",
    dialogues: [
      {
        sceneTag: "第一幕 · 北荒异变",
        speaker: "掌门 凌虚子",
        role: "{sectName}掌教",
        avatar: "🧙‍♂️",
        emotion: "神色肃穆",
        text: "「{playerName}，你已修至筑基中期，堪当本门重任！北荒【沉星古陵】昨晚血光冲霄，九幽魔宗余孽正在强行冲击古陵封印，本座命你率精锐弟子即刻驰援北荒！」"
      },
      {
        sceneTag: "第二幕 · 壁画秘辛",
        speaker: "太渊道玉 · 澜音",
        role: "古玉器灵",
        avatar: "🔮",
        emotion: "追忆万古",
        text: "「看这石廊上的星辰徽记……当年你林氏先祖林太渊以金丹大道镇封魔尊，麾下十二铁卫长眠于此化作守陵镇石。未曾想万载之后，竟有魔徒以污血惊扰英灵！」"
      },
      {
        sceneTag: "第三幕 · 祭坛狂魔",
        speaker: "魔修 墨无痕",
        role: "九幽血使",
        avatar: "👹",
        emotion: "癫狂大笑",
        text: "「哈哈哈哈！{playerName}，你果然自投罗网了！看看这古陵壁画吧，你们云渊林氏世代不过是看守太渊魔尊的守墓奴！而你怀里的太渊道玉，正是开启天渊道窟的最后一把钥匙！」"
      },
      {
        sceneTag: "第四幕 · 剑指叛徒",
        speaker: "师姐 陆雪涵",
        role: "真传师姐",
        avatar: "👩‍🌾",
        emotion: "拔剑护持",
        text: "「住口！林氏先祖舍身守陵，乃是为镇压魔劫、庇佑天下苍生，岂容你这欺师灭祖之徒玷污！{playerName}师弟，我们先斩墨无痕，再破血煞尸王！」"
      },
      {
        sceneTag: "第五幕 · 尸王出棺",
        speaker: "血煞尸王",
        role: "古陵霸主",
        avatar: "💀",
        emotion: "幽冥咆哮",
        text: "「吼——！！万载沉眠今朝醒，九幽血食祭吾身！凡怀太渊血脉者，皆化本王腹中枯骨！」"
      },
      {
        sceneTag: "第六幕 · 金丹契机",
        speaker: "太渊道玉 · 澜音",
        role: "古玉器灵",
        avatar: "🔮",
        emotion: "威严激昂",
        text: "「莫慌！血煞尸王体内凝结着先祖遗留的第三枚道图碎片。只要通关【沉星古陵】将其诛灭，吾便能彻底解封无上秘典——《太渊金丹真诀》，助你在筑基五重圆满之时一举结凝九转金丹！」"
      }
    ],
    sideStories: [
      {
        id: "c4_side_1",
        title: "【支线奇遇】先祖石棺中的家书",
        npc: "太渊道玉 · 澜音",
        avatar: "🔮",
        summary: "在沉星古陵偏殿的一座青铜古棺旁，你发现了一枚唯有林氏血脉方能开启的留音玉简……",
        reward: { stone: 1500, exp: 450, dao: 60 },
        scenes: [
          { speaker: "先祖 林太渊（留音）", avatar: "👑", text: "「后世子孙听令：吾辈守陵非为锁困自身，实乃炼化魔尊本源以补天地大道。若有一日魔劫再起，持太渊道玉者当修成金丹，彻底磨灭魔尊残念！」" },
          { speaker: "{playerName}（我）", avatar: "🗡️", text: "「先祖遗训，不肖子孙{playerName}字字铭记！灭族之仇、苍生之劫，定在吾手中作一了断！」" },
          { speaker: "太渊道玉 · 澜音", avatar: "🔮", text: "「先祖留下的本源仙气已汇入你四肢百骸，你的道心与筑基修为愈发凝实了！」" }
        ]
      },
      {
        id: "c4_side_2",
        title: "【宿命交锋】墨无痕的穷途末路",
        npc: "魔修 墨无痕",
        avatar: "👹",
        summary: "血煞祭坛崩塌之际，重伤的墨无痕跪倒在断崖边，向你道出了云渊灭门之夜的幕后黑手……",
        reward: { stone: 1800, exp: 500, item: "降尘丹_3品" },
        scenes: [
          { speaker: "魔修 墨无痕", avatar: "👹", text: "「咳咳……不可能！我献祭了半生寿元改修血魔功，为何还是败在你剑下？！」" },
          { speaker: "{playerName}（我）", avatar: "🗡️", text: "「说！三年前雨夜屠戮我云渊全族之人，究竟是谁？！」" },
          { speaker: "魔修 墨无痕", avatar: "👹", text: "「呵呵……是极北【天渊道窟】中苏醒的【太渊魔尊遗念】！他以魔魂操控九幽魔修血洗云渊，只为逼你带着太渊道玉步步修至金丹，好在天渊道窟夺舍你的金丹道体！我在黄泉路上等着看你如何灰飞烟灭！」" }
        ]
      }
    ],
    quests: [
      { id: "c4_q1", name: "修为达到【筑基期四重】", targetType: "realm", needRealm: 2, needLvl: 4, reward: { stone: 2600, exp: 600, item: "聚灵丹_4品" }, desc: "精进筑基期心法，将修为提升至筑基期四重", actionTab: "day" },
      { id: "c4_q2", name: "通关秘境【沉星古陵】", targetType: "dungeon", dungeonId: "realm_tomb", reward: { stone: 4200, contrib: 500, item: "taiyuan_jindan_f1" }, desc: "勇闯沉星古陵第 2 层诛灭血煞尸王，获赐《太渊金丹真诀》（筑基5重圆满可参悟）", actionTab: "day" },
      { id: "c4_q3", name: "宗门累计贡献达到 400 点", targetType: "contrib", needContrib: 400, reward: { stone: 3200, exp: 700, item: "降尘丹_4品" }, desc: "积累 400 点宗门贡献，获赐辅助突破金丹的四品【降尘丹】", actionTab: "sect" }
    ],
    choice: {
      title: "【命运抉择】古陵祭坛的太古血魄",
      desc: "斩杀血煞尸王后，祭坛中央浮现出一枚蕴含磅礴能量的【太古血魄】，你胸前的太渊道玉对其产生强烈共鸣。",
      optionA: { label: "以正道离火焚尽邪煞，仅取纯净星辰晶核反哺山门", morality: 25, dao: 50, stone: 1800, rewardText: "浩然正气：善念 +25，道心 +50，获赐纯净灵石 +1800" },
      optionB: { label: "催动太渊道玉霸道吞噬整枚血魄，化为自身无上底蕴", morality: -25, dao: 100, stone: 2800, rewardText: "吞天噬地：善念 -25，道心 +100，凝练灵石 +2800" }
    }
  },
  {
    id: 5,
    title: "第五章：天渊道窟 · 结凝金丹",
    subtitle: "一颗金丹吞入腹，始知我命不由天（终章）",
    minRealm: 2,
    triggerRealm: 2,
    triggerLvl: 5,
    triggerConditionText: "修为达到【筑基期五重圆满】或【金丹初期】自动触发",
    maxRealmName: "金丹初期 (本卷最高境界)",
    bgImage: "./src/assets/images/xianxia_bg_banner_1792114543496.jpg",
    location: "极北绝域 · 天渊道窟",
    desc: "筑基五重臻至大圆满，极北绝域轰然裂开万丈深渊！【太渊魔尊遗念】欲借天地交泰之刻夺舍你的道体。你将参悟《太渊金丹真诀》，在漫天紫霄雷劫中冲破本卷至高境界——【金丹初期】，深入【天渊道窟】迎来宿命终战！",
    dialogues: [
      {
        sceneTag: "第一幕 · 魔渊裂天",
        speaker: "太渊魔尊遗念",
        role: "太古魔魂",
        avatar: "🐉",
        emotion: "威压天地",
        text: "「小辈！三年前本尊命人覆灭云渊，便是为了逼你以林氏血脉温养【太渊道玉】！如今你已修至筑基大圆满，还不速速入我天渊道窟，献出你的肉身与道基，助本尊再临人间！」"
      },
      {
        sceneTag: "第二幕 · 举宗护道",
        speaker: "掌门 凌虚子",
        role: "{sectName}掌教",
        avatar: "🧙‍♂️",
        emotion: "倾力相助",
        text: "「痴心妄想！{playerName}乃我{sectName}百年不遇之天骄，岂容尔等太古孽障夺舍！全宗长老听令——开启护山九宫大阵，倾尽灵脉助{playerName}参悟金丹真诀、渡劫结丹！」"
      },
      {
        sceneTag: "第三幕 · 丹鼎赐宝",
        speaker: "长老 丹霞真人",
        role: "{sectName}丹鼎长老",
        avatar: "🧪",
        emotion: "慷慨激昂",
        text: "「{playerName}，你只需在【背包>秘籍】中参悟《太渊金丹真诀》，再服下【降尘丹】打坐攒满熟练度，即可一举破开金丹大关！老夫为你护法！」"
      },
      {
        sceneTag: "第四幕 · 生死相随",
        speaker: "师姐 陆雪涵",
        role: "生死道侣",
        avatar: "👩‍🌾",
        emotion: "深情坚毅",
        text: "「{playerName}，从你当年踏入外门青石院起，我便知你绝非池中之物。放手去突破【金丹初期】吧！无论天渊道窟有多少万古凶险，我都会执剑与你同往！」"
      },
      {
        sceneTag: "第五幕 · 器灵合道",
        speaker: "太渊道玉 · 澜音",
        role: "道图真灵",
        avatar: "🔮",
        emotion: "璀璨燃烧",
        text: "「万载等待，终得圆满！{playerName}，以吾太渊道玉为引，纳九天紫气入丹田——结尔不朽金丹，斩彼万古魔魂！」"
      },
      {
        sceneTag: "第六幕 · 金丹傲世",
        speaker: "{playerName}（金丹真人）",
        role: "金丹天骄",
        avatar: "⚡",
        emotion: "傲啸九霄",
        text: "「一颗金丹吞入腹，始知我命不由天！太渊魔尊，三年前云渊全族的血债，今日我便以这新铸的璀璨金丹，在天渊道窟与你彻底清算！」"
      }
    ],
    sideStories: [
      {
        id: "c5_side_1",
        title: "【支线奇遇】万宗朝贺与金丹大典",
        npc: "掌门 凌虚子",
        avatar: "🧙‍♂️",
        summary: "天渊决战前夕，九州正邪各派感念你镇压北荒尸乱之功，纷纷遣使送上贺礼……",
        reward: { stone: 5000, contrib: 500, dao: 100 },
        scenes: [
          { speaker: "掌门 凌虚子", avatar: "🧙‍♂️", text: "「{playerName}，如今你威震八荒，连周边各大宗门都送来千年灵石与灵丹助阵，实乃我{sectName}开派以来未有之盛况！」" },
          { speaker: "执事 严老", avatar: "🧔", text: "「呵呵，当年那个在青石院劈柴挑水的小家伙，如今已是连老夫都要仰望的大人物了。去天渊道窟，给老夫狠狠斩了那魔头！」" },
          { speaker: "{playerName}（我）", avatar: "⚡", text: "「严老、掌门放心，弟子定当荡平天渊，凯旋归来！」" }
        ]
      },
      {
        id: "c5_side_2",
        title: "【终章羁绊】云海之巅的千年之约",
        npc: "师姐 陆雪涵",
        avatar: "👩‍🌾",
        summary: "金丹霞光映照{sectName}云海，陆雪涵与你并肩立于绝顶，共望万里河山……",
        reward: { stone: 6000, exp: 1000, dao: 120 },
        scenes: [
          { speaker: "师姐 陆雪涵", avatar: "👩‍🌾", text: "「金丹大成，寿享四百载。{playerName}，待平定天渊道窟之后，你有什么打算？」" },
          { speaker: "{playerName}（我）", avatar: "⚡", text: "「九州虽大，不及师姐眉间一抹春色。待斩灭魔尊残念，我便携师姐游历山海、共参长生大道。」" },
          { speaker: "师姐 陆雪涵", avatar: "👩‍🌾", text: "「（含笑握住你的手）一言为定，四百载春秋，雪涵与君同渡。」" }
        ]
      }
    ],
    quests: [
      { id: "c5_q1", name: "突破至最高境界【金丹初期 (金丹一重)】", targetType: "realm", needRealm: 3, needLvl: 1, reward: { stone: 10000, contrib: 1000, item: "e_taiyuan_sword" }, desc: "在【背包>秘籍】参悟《太渊金丹真诀》并破开金丹大关，获赐神兵【太渊镇魔剑】！", actionTab: "day" },
      { id: "c5_q2", name: "通关终极秘境【天渊道窟】", targetType: "dungeon", dungeonId: "realm_abyss", reward: { stone: 20000, contrib: 2000, item: "聚凝丹_5品" }, desc: "深入天渊道窟第 2 层，彻底击败太渊魔尊遗念，完成宿命终战！", actionTab: "day" }
    ],
    choice: {
      title: "【终极结局抉择】金丹大成 · 道统立誓",
      desc: "太渊魔尊遗念在你的金丹神威下灰飞烟灭，九天云开月明。金丹璀璨夺目，九州修真宗门皆来朝拜，你的长生道途将走向何方？",
      optionA: { label: "接任{sectName}少尊，执掌太渊道图镇守万世太平", morality: 50, dao: 150, stone: 8888, rewardText: "【圆满结局：仙门少尊 · 万古正道魁首】" },
      optionB: { label: "与陆雪涵炼化太渊洞天，携侣逍遥天地沧海之外", morality: 20, dao: 200, stone: 9999, rewardText: "【圆满结局：太渊仙主 · 携美笑傲红尘】" }
    }
  }
];

/* 修为境界里程碑奇遇剧情（随小境界与大境界突破自动触发，严密对齐炼气10重->筑基5重->金丹初期） */
const REALM_STORY_MILESTONES = [
  {
    id: "ms_realm_1_1",
    realm: 1,
    lvl: 1,
    title: "✨ 【境界奇遇】初窥门径 · 炼气一重",
    speaker: "太渊道玉 · 澜音",
    avatar: "🔮",
    text: "当你体内第一缕先天灵气汇入丹田，胸前的【太渊道玉】骤然绽放温润青光！器灵澜音的声音流入脑海：「凡胎已蜕，仙路始开！{playerName}，赐尔灵石百枚，切记在【主线剧情】领取《练气基础·中卷》继续精进！」",
    reward: { stone: 150, dao: 15 }
  },
  {
    id: "ms_realm_1_4",
    realm: 1,
    lvl: 4,
    title: "❄️ 【主线推进】寒潭异变 · 炼气四重",
    speaker: "师姐 陆雪涵",
    avatar: "👩‍🌾",
    text: "「{playerName}师弟，恭喜突破炼气中期！方才{sectName}后山【寒潭幽谷】传来剧烈震动，封魔古碑似遭内鬼墨无痕损毁，快随我去【主线剧情】开启第二章！」",
    unlockChapter: 2,
    reward: { stone: 300, dao: 25 }
  },
  {
    id: "ms_realm_1_8",
    realm: 1,
    lvl: 8,
    title: "🔥 【主线推进】丹霞开启 · 炼气后期",
    speaker: "长老 丹霞真人",
    avatar: "🧪",
    text: "「善哉！{playerName}已修至炼气八重，距炼气十重圆满与筑基天关仅一步之遥。十年一开的【丹霞秘境】现已开启，主线第三章正式拉开帷幕！」",
    unlockChapter: 3,
    reward: { stone: 600, dao: 40 }
  },
  {
    id: "ms_realm_2_1",
    realm: 2,
    lvl: 1,
    title: "⚡ 【大道筑基】百脉俱通 · 筑基一重",
    speaker: "掌门 凌虚子",
    avatar: "🧙‍♂️",
    text: "九天降下甘霖瑞气，你丹田气海化作奔涌灵液，寿元暴涨至二百载！掌门凌虚子抚须大笑：「好！不愧是身怀太渊仙缘之人，从今日起你便是我{sectName}的中流砥柱！」",
    unlockChapter: 3,
    reward: { stone: 1500, contrib: 200, dao: 65 }
  },
  {
    id: "ms_realm_2_3",
    realm: 2,
    lvl: 3,
    title: "🏛️ 【主线推进】古陵惊变 · 筑基三重",
    speaker: "执事 严老",
    avatar: "🧔",
    text: "「紧急宗门法旨！北荒【沉星古陵】血气冲霄，叛徒墨无痕现身古陵企图唤醒血煞尸王。{playerName}已修至筑基三重，速往【主线剧情】开启第四章平乱！」",
    unlockChapter: 4,
    reward: { stone: 2000, dao: 85 }
  },
  {
    id: "ms_realm_2_5",
    realm: 2,
    lvl: 5,
    title: "🌌 【主线推进】天渊裂隙 · 筑基五重圆满",
    speaker: "太渊道玉 · 澜音",
    avatar: "🔮",
    text: "「宿命之子，你的筑基之道已臻五重圆满化境！极北【天渊道窟】封印即将破碎，主线终章【第五章：天渊道窟 · 结凝金丹】现已全面开启，速去参悟金丹真诀冲击金丹大道！」",
    unlockChapter: 5,
    reward: { stone: 3500, dao: 130 }
  },
  {
    id: "ms_realm_3_1",
    realm: 3,
    lvl: 1,
    title: "👑 【金丹大成】九转金光 · 金丹初期",
    speaker: "九天仙音",
    avatar: "🐉",
    text: "丹田之内灵液化作璀璨夺目的九转金丹，紫气东来三万里！{playerName}成功踏入本卷至高境界【金丹初期（金丹一重）】，寿享四百载，威震八荒！快去挑战终极秘境【天渊道窟】完成宿命一战吧！",
    unlockChapter: 5,
    reward: { stone: 8800, contrib: 1000, dao: 220 }
  }
];

/* 导出全局 */
if (typeof window !== "undefined") {
  window.STORY_CHAPTERS = STORY_CHAPTERS;
  window.REALM_STORY_MILESTONES = REALM_STORY_MILESTONES;
}

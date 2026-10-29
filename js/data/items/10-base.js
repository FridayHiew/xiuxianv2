/* ============================================================
   data/items/10-base.js - 静态基础物品
   ------------------------------------------------------------
   按 type 分区，未来单 type 太大时可单独拆出。
   ============================================================ */

/* ============================================================
   无品级丹药（旧版残留，保留兼容）
   ============================================================ */
Object.assign(ITEMS, {
  "回血丹": { id: "回血丹", type: "pill", name: "回血丹", grade: 1, tier: 1, usableIn: "field", effect: { type: "heal", value: 100 }, desc: "回复气血 +100", price: 20 },
  "回灵丹": { id: "回灵丹", type: "pill", name: "回灵丹", grade: 1, tier: 1, usableIn: "field", effect: { type: "healMp", value: 100 }, desc: "回复灵力 +100", price: 20 },
  "聚气丹": { id: "聚气丹", type: "pill", name: "聚气丹", grade: 1, tier: 1, usableIn: "field", effect: { type: "exp", value: 50 }, desc: "修为 +50", price: 40 },
  "静心丹": { id: "静心丹", type: "pill", name: "静心丹", grade: 1, tier: 1, usableIn: "field", effect: { type: "mood", value: 1 }, desc: "平复心境（心境 +1）", price: 30 },
  "延寿丹": { id: "延寿丹", type: "pill", name: "延寿丹", grade: 5, tier: 3, usableIn: "field", effect: { type: "age", value: 50 }, desc: "延年益寿（寿元上限 +50）", price: 500 },
  "解毒丹": { id: "解毒丹", type: "pill", name: "解毒丹", grade: 1, tier: 1, usableIn: "field", effect: { type: "cure", status: "poison" }, desc: "解除中毒负面状态", price: 15 },

  /* ============================================================
     无品级材料（旧版残留）
     ============================================================ */
  "灵草": { id: "灵草", type: "mat", name: "灵草", grade: 1, icon: "🌿", desc: "炼丹基础灵草材料", price: 5 },
  "泉水": { id: "泉水", type: "mat", name: "泉水", grade: 1, icon: "💧", desc: "山涧清冽灵泉水", price: 3 },
  "妖丹": { id: "妖丹", type: "mat", name: "妖丹", grade: 1, icon: "🔮", desc: "妖兽体内凝结内丹", price: 20 },
  "寒泉": { id: "寒泉", type: "mat", name: "寒泉", grade: 2, icon: "💧", desc: "幽谷寒潭冰泉", price: 10 },
  "千年灵芝": { id: "千年灵芝", type: "mat", name: "千年灵芝", grade: 3, icon: "🌿", desc: "珍稀千年灵药材", price: 200 },
});

/* ============================================================
   兽粮
   ============================================================ */
Object.assign(ITEMS, {
  "food_low":  { id: "food_low",  type: "food", name: "粗粮", hunger: 30,  price: 10,  desc: "回饥饿 +30" },
  "food_mid":  { id: "food_mid",  type: "food", name: "灵粮", hunger: 60,  price: 50,  desc: "回饥饿 +60" },
  "food_high": { id: "food_high", type: "food", name: "仙粮", hunger: 100, price: 200, desc: "回饥饿 +100" },
});

/* ============================================================
   灵宠突破材料
   ============================================================ */
Object.assign(ITEMS, {
  "petBreak_1": { id: "petBreak_1", type: "petBreak", name: "灵兽丹·凡", realm: 1, price: 100,  desc: "灵宠突破炼气" },
  "petBreak_2": { id: "petBreak_2", type: "petBreak", name: "灵兽丹·中", realm: 2, price: 500,  desc: "灵宠突破筑基" },
  "petBreak_3": { id: "petBreak_3", type: "petBreak", name: "灵兽丹·上", realm: 3, price: 2000, desc: "灵宠突破金丹" },
  "灵兽丹":     { id: "petBreak_1", type: "petBreak", name: "灵兽丹·凡", realm: 1, price: 100,  desc: "灵宠突破炼气" },
  "灵兽丹·凡":  { id: "petBreak_1", type: "petBreak", name: "灵兽丹·凡", realm: 1, price: 100,  desc: "灵宠突破炼气" },
  "灵兽丹·中":  { id: "petBreak_2", type: "petBreak", name: "灵兽丹·中", realm: 2, price: 500,  desc: "灵宠突破筑基" },
  "灵兽丹·上":  { id: "petBreak_3", type: "petBreak", name: "灵兽丹·上", realm: 3, price: 2000, desc: "灵宠突破金丹" },
});

/* ============================================================
   杂役铺道具
   ============================================================ */
Object.assign(ITEMS, {
  "dao1":  { type: "other", name: "砍柴刀 Lv1",  cat: "A", price: 100, chore: "chai", lvl: 1, desc: "砍柴时熟练 +0.5" },
  "dao2":  { type: "other", name: "砍柴刀 Lv2",  cat: "A", price: 300, chore: "chai", lvl: 2, desc: "砍柴 +0.5，熟练满时回合减半" },
  "dao3":  { type: "other", name: "砍柴刀 Lv3",  cat: "A", price: 800, chore: "chai", lvl: 3, desc: "砍柴 +0.5，熟练满时回合减到1" },
  "bian1": { type: "other", name: "扁担 Lv1",    cat: "A", price: 100, chore: "tiao", lvl: 1, desc: "挑水时熟练 +0.5" },
  "bian2": { type: "other", name: "扁担 Lv2",    cat: "A", price: 300, chore: "tiao", lvl: 2, desc: "挑水 +0.5，熟练满时回合减半" },
  "bian3": { type: "other", name: "扁担 Lv3",    cat: "A", price: 800, chore: "tiao", lvl: 3, desc: "挑水 +0.5，熟练满时回合减到1" },
  "chu1":  { type: "other", name: "锄头 Lv1",    cat: "A", price: 100, chore: "cai",  lvl: 1, desc: "种菜时熟练 +0.5" },
  "chu2":  { type: "other", name: "锄头 Lv2",    cat: "A", price: 300, chore: "cai",  lvl: 2, desc: "种菜 +0.5，熟练满时回合减半" },
  "chu3":  { type: "other", name: "锄头 Lv3",    cat: "A", price: 800, chore: "cai",  lvl: 3, desc: "种菜 +0.5，熟练满时回合减到1" },
  "ji1":   { type: "other", name: "鸡食盆 Lv1",  cat: "A", price: 100, chore: "ji",   lvl: 1, desc: "养鸡时熟练 +0.5" },
  "ji2":   { type: "other", name: "鸡食盆 Lv2",  cat: "A", price: 300, chore: "ji",   lvl: 2, desc: "养鸡 +0.5，熟练满时回合减半" },
  "ji3":   { type: "other", name: "鸡食盆 Lv3",  cat: "A", price: 800, chore: "ji",   lvl: 3, desc: "养鸡 +0.5，熟练满时回合减到1" },
  "w1":    { type: "other", name: "破瓦片", cat: "B", price: 5,   desc: "似乎没什么用" },
  "w2":    { type: "other", name: "干草",   cat: "B", price: 3,   desc: "一捆干草" },
  "w3":    { type: "other", name: "石头",   cat: "B", price: 1,   desc: "地上捡的石头" },
  "w4":    { type: "other", name: "枯枝",   cat: "B", price: 2,   desc: "折断的树枝" },
  "w5":    { type: "other", name: "泥巴",   cat: "B", price: 1,   desc: "一坨泥巴" },
  "h_qin": { type: "other", name: "古琴", cat: "C", price: 500, hobby: "琴", desc: "解锁【琴】爱好" },
  "h_qi":  { type: "other", name: "棋盘", cat: "C", price: 300, hobby: "棋", desc: "解锁【棋】爱好" },
  "h_shu": { type: "other", name: "笔墨", cat: "C", price: 200, hobby: "书", desc: "解锁【书】爱好" },
  "h_hua": { type: "other", name: "画卷", cat: "C", price: 400, hobby: "画", desc: "解锁【画】爱好" },
  "h_hua2":{ type: "other", name: "花种", cat: "C", price: 150, hobby: "花", desc: "解锁【花】爱好" },
  "h_diao":{ type: "other", name: "鱼竿", cat: "C", price: 100, hobby: "钓", desc: "解锁【钓】爱好" },
  "d_gan": { type: "other", name: "干粮", cat: "D", price: 20, desc: "抵消一次饿肚子" },
  "d_re":  { type: "other", name: "热水", cat: "D", price: 10, desc: "心情 +1" },
  "d_gao": { type: "other", name: "药膏", cat: "D", price: 30, desc: "气血 +20" },
});

/* ============================================================
   法术秘籍
   ============================================================ */
Object.assign(ITEMS, {
  "book_huojian":     { type: "spellbook", name: "火剑秘籍",     spellId: "huojian",     price: 100, desc: "【法术秘籍】以纯阳剑诀引火附锋，单体伤害倍率 ×1.5，附带 30% 灼烧内伤（需火灵根与明火心法）。" },
  "book_huoyanjian":  { type: "spellbook", name: "火焰剑秘籍",   spellId: "huoyanjian",  price: 300, desc: "【进阶法术】浩瀚剑气化作熊熊烈焰，群体焚灭敌阵，伤害倍率 ×1.2，附带 40% 灼烧（需火灵根2重与明火心法）。" },
  "book_lieyanjian":  { type: "spellbook", name: "烈焰剑秘籍",   spellId: "lieyanjian",  price: 800, desc: "【高阶秘术】焚天真火凝入剑意，单体爆发倍率 ×3.5，附带 50% 强力灼烧（需火灵根3重与火灵符法宝）。" },
  "book_jianqi_zhan": { type: "spellbook", name: "剑气斩秘籍",   spellId: "jianqi_zhan", price: 80,  desc: "【宗门剑术】引真元激荡化为凝实剑气，单体伤害倍率 ×2.0，附带 20% 流血割伤，无五行灵根限制。" },
  "book_bengquan":    { type: "spellbook", name: "崩拳秘籍",     spellId: "bengquan",    price: 60,  desc: "【近战体术】引气入拳，崩山碎石，消耗微量灵力对单体造成倍率 ×1.4 纯劲重击。" },
  "book_liehuoquan":  { type: "spellbook", name: "烈火拳秘籍",   spellId: "liehuoquan",  price: 260, desc: "【烈焰拳法】拳罡带火，势如雷火崩山，单体伤害倍率 ×2.0，附带 30% 灼烧烈焰（需火灵根）。" },
  "book_bingzhang":   { type: "spellbook", name: "冰霜掌秘籍",   spellId: "bingzhang",   price: 150, desc: "【寒玄掌印】汇聚玄冰真气，单体伤害倍率 ×1.6，附带 20% 冰冻迟缓（需冰系灵气亲和）。" },
  "book_kuangdao":    { type: "spellbook", name: "狂刀斩秘籍",   spellId: "kuangdao",    price: 200, desc: "【狂暴刀诀】刀罡狂乱如狂潮激荡，单体伤害倍率 ×1.8，附带 30% 撕裂流血伤势。" },
  "book_saodi":       { type: "spellbook", name: "扫地铁棍秘籍", spellId: "saodi",       price: 120, desc: "【杂役武道】扫地长棍运劲如风，横扫八荒，群体攻击倍率 ×1.0，兼备击退奇效。" },
  "book_lingqi_bo":   { type: "spellbook", name: "灵气波秘籍",   spellId: "lingqi_bo",   price: 90,  desc: "【正统道术】纯粹真元凝聚为冲击灵光，单体伤害倍率 ×1.3，无任何灵根与心法门槛。" },
});

/* ============================================================
   技能秘籍
   ============================================================ */
Object.assign(ITEMS, {
  "book_sk_sword1": { type: "skillbook", name: "基础剑招秘籍", skillId: "sk_sword1", price: 50,  desc: "【基本招式】剑修启蒙剑术，消耗少许气血造成 ×1.3 基础物理穿透伤害。" },
  "book_sk_sword2": { type: "skillbook", name: "连环剑秘籍",   skillId: "sk_sword2", price: 150, desc: "【进阶剑技】连环递出三柄快剑，剑光掠空扫荡全体敌人，威力倍率 ×1.2。" },
  "book_sk_sword3": { type: "skillbook", name: "剑意斩秘籍",   skillId: "sk_sword3", price: 400, desc: "【绝杀剑诀】神念化为纯阳剑意，单体爆发倍率高达 ×3.0，附带 40% 深度流血破甲。" },
  "book_sk_blade1": { type: "skillbook", name: "劈砍秘籍",     skillId: "sk_blade1", price: 50,  desc: "【基本招式】大开大合的刀客入门劈砍，消耗少许气血造成 ×1.3 刚猛斩击。" },
  "book_sk_blade2": { type: "skillbook", name: "狂刀斩秘籍",   skillId: "sk_blade2", price: 150, desc: "【狂刀绝技】凶猛凌厉的劈空刀势，单体伤害倍率 ×2.2，兼具 30% 流血伤口效果。" },
  "book_sk_fist1":  { type: "skillbook", name: "直拳秘籍",     skillId: "sk_fist1",  price: 40,  desc: "【基本招式】贴身短打直拳，消耗少许气血造成 ×1.2 迅捷近身重击。" },
  "book_sk_fist2":  { type: "skillbook", name: "崩拳秘籍",     skillId: "sk_fist2",  price: 150, desc: "【刚劲体术】崩山碎石之寸劲暗劲，单体倍率高达 ×2.0，重创肉身经络。" },
  "book_sk_palm1":  { type: "skillbook", name: "推掌秘籍",     skillId: "sk_palm1",  price: 40,  desc: "【基本招式】道家连绵推手掌法，消耗少许气血造成 ×1.3 气劲排击。" },
  "book_sk_palm2":  { type: "skillbook", name: "摧心掌秘籍",   skillId: "sk_palm2",  price: 200, desc: "【阴柔暗劲】掌劲隔山打牛震荡脏腑，单体伤害倍率 ×2.3，直击护体内气。" },
  "book_sk_staff1": { type: "skillbook", name: "横扫秘籍",     skillId: "sk_staff1", price: 60,  desc: "【棍法横扫】长棍环扫如风，攻击全体敌对目标，威力倍率 ×1.0。" },
  "book_sk_whip1":  { type: "skillbook", name: "鞭击秘籍",     skillId: "sk_whip1",  price: 60,  desc: "【奇门软兵】长鞭如灵蛇吐信，单体伤害倍率 ×1.4，专破敌人闪避步伐。" },
  "book_sk_beast1": { type: "skillbook", name: "兽吼秘籍",     skillId: "sk_beast1", price: 80,  desc: "【御兽心诀】效仿洪荒巨兽神威狂啸，单体倍率 ×1.2，震慑敌方心神气机。" },
  "book_sk_sacrifice": { type: "skillbook", name: "牺牲秘籍",  skillId: "sk_sacrifice", price: 800, desc: "【舍身禁术】以自身精血献祭天地，瞬间爆发惊天动地的毁灭杀机。" },
});

/* ============================================================
   召唤秘籍
   ============================================================ */
Object.assign(ITEMS, {
  "book_summon_beast":  { type: "summonbook", name: "召唤灵兽秘籍", summonId: "summon_beast",  price: 500, desc: "【通灵召唤】参悟后可掌握万兽通灵法，战斗中召唤伴生灵兽协同作战，分担仇恨。" },
  "book_summon_blood":  { type: "summonbook", name: "激发血脉秘籍", summonId: "summon_blood",  price: 500, desc: "【血脉沸腾】唤醒体内远古仙魔血脉，极大激发战斗潜能与肉身神力。" },
  "book_summon_soul":   { type: "summonbook", name: "招魂帆秘籍",   summonId: "summon_soul",   price: 500, desc: "【冥幽异术】驱使招魂仙帆，引渡阴煞游魂助阵，以诡道幽冥侵蚀敌心。" },
  "book_summon_puppet": { type: "summonbook", name: "机关术秘籍",   summonId: "summon_puppet", price: 500, desc: "【天工傀儡】以灵石驱动玄铁机关傀儡，作为坚固前锋抵挡强敌致命杀着。" },
  "book_summon_sword":  { type: "summonbook", name: "召唤灵兽秘籍", summonId: "summon_beast",  price: 500, desc: "【通灵召唤】参悟后可掌握万兽通灵法，战斗中召唤伴生灵兽协同作战，分担仇恨。" },
});

/* ============================================================
   装备
   ============================================================ */
Object.assign(ITEMS, {
  /* 开局执事赠予四式随身兵刃（1阶·1品） */
  "e_sword1": { type: "equip", name: "青锋剑",   slot: "rightHand", tier: 1, grade: 1, atk: 5,  def: 0,  hp: 0,  mp: 0,  price: 100, desc: "凡铁锻造的一品长剑，剑锋初显锋芒（1阶1品 · 攻击+5）。" },
  "e_blade1": { type: "equip", name: "精铁刀",   slot: "rightHand", tier: 1, grade: 1, atk: 5,  def: 0,  hp: 0,  mp: 0,  price: 100, desc: "百炼精铁铸就的一品厚背开山刀，劈砍势猛（1阶1品 · 攻击+5）。" },
  "e_staff1": { type: "equip", name: "熟铜棍",   slot: "rightHand", tier: 1, grade: 1, atk: 5,  def: 0,  hp: 0,  mp: 0,  price: 100, desc: "沉甸甸的一品齐眉熟铜长棍，横扫千军（1阶1品 · 攻击+5）。" },
  "e_whip1":  { type: "equip", name: "软皮鞭",   slot: "rightHand", tier: 1, grade: 1, atk: 5,  def: 0,  hp: 0,  mp: 0,  price: 100, desc: "韧牛筋混合蟒皮编织的一品长鞭，灵动刁钻（1阶1品 · 攻击+5）。" },

  "e_sword2": { type: "equip", name: "玄铁重剑", slot: "rightHand", tier: 1, grade: 2, atk: 12, def: 2,  hp: 0,  mp: 0,  price: 500, desc: "深海寒铁熔炼的二品沉重阔剑，势大力沉（1阶2品 · 攻击+12，防御+2）。" },
  "e_armor1": { type: "equip", name: "布衣",     slot: "body",      tier: 1, grade: 1, atk: 0,  def: 5,  hp: 20, mp: 0,  price: 100, desc: "凡间麻布粗衣，略具御寒防护（1阶1品 · 防御+5，气血+20）。" },
  "e_armor2": { type: "equip", name: "皮甲",     slot: "body",      tier: 1, grade: 2, atk: 0,  def: 10, hp: 40, mp: 0,  price: 300, desc: "低阶妖兽坚韧毛皮鞣制二品软甲（1阶2品 · 防御+10，气血+40）。" },
  "e_ring1":  { type: "equip", name: "聚灵戒",   slot: "accessory", tier: 1, grade: 2, atk: 0,  def: 0,  hp: 0,  mp: 20, price: 200, desc: "刻有聚灵微纹的二品戒指，温养丹田（1阶2品 · 灵力上限+20）。" },
  "e_ring2":  { type: "equip", name: "护心镜",   slot: "accessory", tier: 1, grade: 2, atk: 0,  def: 3,  hp: 30, mp: 0,  price: 200, desc: "青铜护心宝镜，护卫胸口关键脉络（1阶2品 · 防御+3，气血+30）。" },

  "e_sword_promotion": { type: "equip", name: "宗门制式剑", slot: "rightHand", tier: 1, grade: 2, atk: 15, def: 2,  hp: 0,  mp: 0,  price: 0, desc: "晋升门外弟子获赐的宗门二品精钢飞剑（1阶2品 · 攻击+15，防御+2）。" },
  "e_robe_promotion":  { type: "equip", name: "宗门道袍",   slot: "body",      tier: 1, grade: 2, atk: 0,  def: 8,  hp: 30, mp: 0,  price: 0, desc: "门外弟子配发二品青云道袍，编织避尘法线（1阶2品 · 防御+8，气血+30）。" },
  "e_sword_mennei":    { type: "equip", name: "精钢剑",     slot: "rightHand", tier: 2, grade: 3, atk: 25, def: 5,  hp: 0,  mp: 0,  price: 0, desc: "门内弟子配发三品精炼百辟宝剑（2阶3品 · 攻击+25，防御+5）。" },
  "e_robe_mennei":     { type: "equip", name: "灵纹袍",     slot: "body",      tier: 2, grade: 3, atk: 0,  def: 15, hp: 50, mp: 10, price: 0, desc: "绣有护身灵纹的三品门内锦袍（2阶3品 · 防御+15，气血+50，灵力+10）。" },
  "e_sword_zhenchuan": { type: "equip", name: "玄铁剑",     slot: "rightHand", tier: 2, grade: 4, atk: 40, def: 10, hp: 0,  mp: 0,  price: 0, desc: "真传弟子专属四品寒铁重剑，煞气逼人（2阶4品 · 攻击+40，防御+10）。" },
  "e_robe_zhenchuan":  { type: "equip", name: "真传道袍",   slot: "body",      tier: 2, grade: 4, atk: 0,  def: 25, hp: 80, mp: 20, price: 0, desc: "紫绡金丝四品真传法衣，刀枪难侵（2阶4品 · 防御+25，气血+80，灵力+20）。" },

  /* ===== 四大境界完整七件套装（兵器/左手/头/衣服/鞋/玉佩/法宝） ===== */
  /* 1. 凡人境套装 · 凡铁护身套（Realm 0 / 1阶·1品） */
  "fan_sword":    { type: "equip", name: "凡铁长剑",     slot: "rightHand", tier: 1, grade: 1, atk: 6,  def: 1,  hp: 0,   mp: 0,   price: 40,   desc: "【凡人套·兵器】山门铁匠千锤锻打的一品凡铁长剑（1阶1品 · 攻击+6，防御+1）。" },
  "fan_shield":   { type: "equip", name: "轻木圆盾",     slot: "leftHand",  tier: 1, grade: 1, atk: 0,  def: 5,  hp: 15,  mp: 0,   price: 35,   desc: "【凡人套·左手】铁箍包边的一品轻便硬木圆盾（1阶1品 · 防御+5，气血+15）。" },
  "fan_head":     { type: "equip", name: "粗麻护额",     slot: "head",      tier: 1, grade: 1, atk: 0,  def: 3,  hp: 15,  mp: 0,   price: 25,   desc: "【凡人套·头部】嵌有薄铜片的一品粗麻护额巾（1阶1品 · 防御+3，气血+15）。" },
  "fan_body":     { type: "equip", name: "百衲粗布衣",   slot: "body",      tier: 1, grade: 1, atk: 0,  def: 6,  hp: 25,  mp: 0,   price: 45,   desc: "【凡人套·衣服】厚实耐磨的一品百衲行者布衣（1阶1品 · 防御+6，气血+25）。" },
  "fan_shoes":    { type: "equip", name: "麻葛行军履",   slot: "shoes",     tier: 1, grade: 1, atk: 0,  def: 2,  hp: 10,  mp: 0,   price: 20,   desc: "【凡人套·鞋子】山藤与麻葛混编的一品轻便行履（1阶1品 · 防御+2，气血+10）。" },
  "fan_pendant":  { type: "equip", name: "青瓷压胜玉佩", slot: "accessory", tier: 1, grade: 1, atk: 1,  def: 2,  hp: 15,  mp: 10,  price: 30,   desc: "【凡人套·玉佩】刻有平安符纹的一品青釉玉佩（1阶1品 · 攻+1，防+2，血+15，灵+10）。" },

  /* 2. 炼气期套装 · 青云聚气套（Realm 1 / 1阶·2品） */
  "lianqi_sword":   { type: "equip", name: "青云流光剑",   slot: "rightHand", tier: 1, grade: 2, atk: 16, def: 3,  hp: 0,   mp: 10,  price: 120,  desc: "【炼气套·兵器】寒铁混入赤铜铸就的二品灵剑，剑刃流转青芒（1阶2品 · 攻+16，防+3，灵+10）。" },
  "lianqi_shield":  { type: "equip", name: "玄铁青光盾",   slot: "leftHand",  tier: 1, grade: 2, atk: 0,  def: 12, hp: 40,  mp: 0,   price: 100,  desc: "【炼气套·左手】玄铁熔铸的二品护身轻盾，刻有御气阵纹（1阶2品 · 防御+12，气血+40）。" },
  "lianqi_head":    { type: "equip", name: "凝神白玉冠",   slot: "head",      tier: 1, grade: 2, atk: 0,  def: 8,  hp: 30,  mp: 20,  price: 80,   desc: "【炼气套·头部】温润白玉束发二品道冠，清心凝神（1阶2品 · 防御+8，气血+30，灵力+20）。" },
  "lianqi_body":    { type: "equip", name: "青云避尘法袍", slot: "body",      tier: 1, grade: 2, atk: 0,  def: 16, hp: 60,  mp: 20,  price: 140,  desc: "【炼气套·衣服】灵蚕丝织就的二品避尘道袍，水火不侵（1阶2品 · 防御+16，气血+60，灵力+20）。" },
  "lianqi_shoes":   { type: "equip", name: "踏青登云履",   slot: "shoes",     tier: 1, grade: 2, atk: 0,  def: 6,  hp: 25,  mp: 10,  price: 70,   desc: "【炼气套·鞋子】绘有轻身符文的二品登云法履（1阶2品 · 防御+6，气血+25，灵力+10）。" },
  "lianqi_pendant": { type: "equip", name: "暖阳聚气玉佩", slot: "accessory", tier: 1, grade: 2, atk: 4,  def: 4,  hp: 35,  mp: 35,  price: 110,  desc: "【炼气套·玉佩】汲取地脉暖阳之气的二品灵玉佩（1阶2品 · 攻+4，防+4，血+35，灵+35）。" },

  /* 3. 筑基期套装 · 太渊玄灵套（Realm 2 / 2阶·4品） */
  "zhuji_sword":   { type: "equip", name: "寒渊碧影剑",   slot: "rightHand", tier: 2, grade: 4, atk: 38, def: 8,  hp: 0,   mp: 30,  price: 360,  desc: "【筑基套·兵器】秘银与深潭寒铁百炼四品灵剑，剑气森寒刺骨（2阶4品 · 攻+38，防+8，灵+30）。" },
  "zhuji_shield":  { type: "equip", name: "两仪玄龟盾",   slot: "leftHand",  tier: 2, grade: 4, atk: 0,  def: 26, hp: 100, mp: 20,  price: 300,  desc: "【筑基套·左手】百年玄龟背甲嵌秘银炼制的四品重盾（2阶4品 · 防御+26，气血+100，灵力+20）。" },
  "zhuji_head":    { type: "equip", name: "紫虚通玄冠",   slot: "head",      tier: 2, grade: 4, atk: 0,  def: 18, hp: 70,  mp: 50,  price: 240,  desc: "【筑基套·头部】紫金镶玉四品通玄宝冠，稳固筑基神识（2阶4品 · 防御+18，气血+70，灵力+50）。" },
  "zhuji_body":    { type: "equip", name: "天蚕九耀道袍", slot: "body",      tier: 2, grade: 4, atk: 0,  def: 35, hp: 150, mp: 60,  price: 420,  desc: "【筑基套·衣服】冰山天蚕丝与秘银金线织就的四品九耀宝衣（2阶4品 · 防御+35，气血+150，灵力+60）。" },
  "zhuji_shoes":   { type: "equip", name: "凌霄御风靴",   slot: "shoes",     tier: 2, grade: 4, atk: 0,  def: 14, hp: 60,  mp: 30,  price: 210,  desc: "【筑基套·鞋子】风属性妖兽皮炼制的四品御风战靴（2阶4品 · 防御+14，气血+60，灵力+30）。" },
  "zhuji_pendant": { type: "equip", name: "九幽镇魂玉佩", slot: "accessory", tier: 2, grade: 4, atk: 10, def: 10, hp: 80,  mp: 80,  price: 320,  desc: "【筑基套·玉佩】万年寒玉雕琢的四品护魂双鱼佩（2阶4品 · 攻+10，防+10，血+80，灵+80）。" },

  /* 4. 金丹期套装 · 真阳金丹套（Realm 3 / 3阶·6品） */
  "jindan_sword":   { type: "equip", name: "九天真阳断岳剑", slot: "rightHand", tier: 3, grade: 6, atk: 85, def: 20, hp: 0,   mp: 80,  price: 900,  desc: "【金丹套·兵器】九天陨落天金引丹火淬炼之六品神剑，斩岳断江（3阶6品 · 攻+85，防+20，灵+80）。" },
  "jindan_shield":  { type: "equip", name: "四象护道琉璃盾", slot: "leftHand",  tier: 3, grade: 6, atk: 0,  def: 58, hp: 260, mp: 60,  price: 750,  desc: "【金丹套·左手】四象神兽精血熔铸天金而成的六品琉璃宝盾（3阶6品 · 防御+58，气血+260，灵力+60）。" },
  "jindan_head":    { type: "equip", name: "九霄万劫金阳冠", slot: "head",      tier: 3, grade: 6, atk: 0,  def: 40, hp: 180, mp: 120, price: 620,  desc: "【金丹套·头部】赤金与极品火玉炼制的六品金丹宝冠，万邪不侵（3阶6品 · 防御+40，气血+180，灵力+120）。" },
  "jindan_body":    { type: "equip", name: "混元万象金光铠", slot: "body",      tier: 3, grade: 6, atk: 0,  def: 75, hp: 380, mp: 150, price: 1050, desc: "【金丹套·衣服】天金丝与蛟龙鳞片编织的六品护体金甲（3阶6品 · 防御+75，气血+380，灵力+150）。" },
  "jindan_shoes":   { type: "equip", name: "万里缩地疾光靴", slot: "shoes",     tier: 3, grade: 6, atk: 0,  def: 30, hp: 150, mp: 80,  price: 550,  desc: "【金丹套·鞋子】铭刻缩地成寸阵纹的六品金丹灵靴（3阶6品 · 防御+30，气血+150，灵力+80）。" },
  "jindan_pendant": { type: "equip", name: "太乙无极玄天玉佩",slot:"accessory", tier: 3, grade: 6, atk: 25, def: 25, hp: 200, mp: 200, price: 820,  desc: "【金丹套·玉佩】蕴含一丝天地造化之机的六品太乙神玉佩（3阶6品 · 攻+25，防+25，血+200，灵+200）。" },

  "shop_head1":   { type: "equip", name: "凡品头巾", slot: "head",      tier: 1, grade: 1, atk: 0,  def: 4,  hp: 15, mp: 0,  price: 30,  desc: "朴素一品布巾，定心安神（1阶1品 · 防御+4，气血+15）。" },
  "shop_sword1":  { type: "equip", name: "凡品铁剑", slot: "rightHand", tier: 1, grade: 1, atk: 6,  def: 0,  hp: 0,  mp: 0,  price: 50,  desc: "城镇铁匠铺凡铁打造的一品佩剑（1阶1品 · 攻击+6）。" },
  "shop_shield1": { type: "equip", name: "凡品木盾", slot: "leftHand",  tier: 1, grade: 1, atk: 0,  def: 5,  hp: 10, mp: 0,  price: 40,  desc: "硬木包铁一品方盾，遮挡箭矢暗器（1阶1品 · 防御+5，气血+10）。" },
  "shop_body1":   { type: "equip", name: "凡品布衣", slot: "body",      tier: 1, grade: 1, atk: 0,  def: 6,  hp: 20, mp: 0,  price: 60,  desc: "结实一品粗麻道衣，耐磨抗打（1阶1品 · 防御+6，气血+20）。" },
  "shop_shoes1":  { type: "equip", name: "凡品草鞋", slot: "shoes",     tier: 1, grade: 1, atk: 0,  def: 2,  hp: 5,  mp: 0,  price: 25,  desc: "山林野麻编织一品行路草鞋，步履轻快（1阶1品 · 防御+2，气血+5）。" },
  "shop_ring1":   { type: "equip", name: "凡品灵戒", slot: "accessory", tier: 1, grade: 1, atk: 0,  def: 0,  hp: 0,  mp: 10, price: 35,  desc: "微弱灵石嵌合的一品戒指（1阶1品 · 灵力+10）。" },
  "shop_ring2":   { type: "equip", name: "凡品护符", slot: "accessory", tier: 1, grade: 1, atk: 0,  def: 2,  hp: 15, mp: 0,  price: 35,  desc: "道观开光的一品平安护身锦囊（1阶1品 · 防御+2，气血+15）。" },
  "shop_head2":   { type: "equip", name: "灵品头冠", slot: "head",      tier: 2, grade: 3, atk: 0,  def: 10, hp: 40, mp: 0,  price: 150, desc: "灵玉铸就的三品金丝头冠，增幅灵识防御（2阶3品 · 防御+10，气血+40）。" },
  "shop_sword2":  { type: "equip", name: "灵品长剑", slot: "rightHand", tier: 2, grade: 3, atk: 18, def: 2,  hp: 0,  mp: 0,  price: 250, desc: "灵泉淬火三品铸剑，锋锐难当（2阶3品 · 攻击+18，防御+2）。" },
  "shop_shield2": { type: "equip", name: "灵品盾",   slot: "leftHand",  tier: 2, grade: 3, atk: 0,  def: 12, hp: 30, mp: 0,  price: 180, desc: "玄铁与龟甲复合三品护盾，格挡坚不可摧（2阶3品 · 防御+12，气血+30）。" },
  "shop_body2":   { type: "equip", name: "灵品道袍", slot: "body",      tier: 2, grade: 3, atk: 0,  def: 15, hp: 50, mp: 10, price: 300, desc: "真丝混织三品灵纹法袍，内蕴御风阵法（2阶3品 · 防御+15，气血+50，灵力+10）。" },
  "shop_shoes2":  { type: "equip", name: "灵品靴",   slot: "shoes",     tier: 2, grade: 3, atk: 0,  def: 6,  hp: 20, mp: 0,  price: 120, desc: "踏云灵鹿皮缝制三品仙履，步履如踏飞燕（2阶3品 · 防御+6，气血+20）。" },
  "shop_ring3":   { type: "equip", name: "灵品戒指", slot: "accessory", tier: 2, grade: 3, atk: 3,  def: 3,  hp: 20, mp: 20, price: 200, desc: "极品暖玉雕琢三品灵戒，攻守兼备（2阶3品 · 攻+3，防+3，血+20，蓝+20）。" },
  "shop_ring4":   { type: "equip", name: "灵品项链", slot: "accessory", tier: 2, grade: 3, atk: 0,  def: 5,  hp: 30, mp: 30, price: 200, desc: "嵌合水月灵珠的三品护道项链，气血真元两相滋养（2阶3品 · 防+5，血+30，蓝+30）。" },
});

/* ============================================================
   法宝
   ============================================================ */
Object.assign(ITEMS, {
  /* 四大境界套装专属法宝 */
  "fan_artifact":    { type: "artifact", name: "桃木辟邪镜",       slot: "artifact", tier: 1, grade: 1, element: "mu",   atk: 3,  def: 2,  spellBonus: 0.05, price: 60,   desc: "【凡人套·法宝】百年桃木芯雕刻的一品辟邪八卦镜，法术威力+5%，攻击+3，防御+2。" },
  "lianqi_artifact": { type: "artifact", name: "六合八卦盘",       slot: "artifact", tier: 1, grade: 2, element: "jin",  atk: 7,  def: 4,  spellBonus: 0.10, price: 180,  desc: "【炼气套·法宝】赤铜与寒铁精铸的二品子午八卦盘，法术威力+10%，攻击+7，防御+4。" },
  "zhuji_artifact":  { type: "artifact", name: "阴阳太极流光镜",   slot: "artifact", tier: 2, grade: 4, element: "shui", atk: 16, def: 10, spellBonus: 0.16, price: 500,  desc: "【筑基套·法宝】秘银镶嵌阴阳二气宝玉的四品流光古镜，法术威力+16%，攻击+16，防御+10。" },
  "jindan_artifact": { type: "artifact", name: "太虚混元镇天印",   slot: "artifact", tier: 3, grade: 6, element: "huo",  atk: 36, def: 22, spellBonus: 0.25, price: 1200, desc: "【金丹套·法宝】天金混合天外神晶炼制的六品镇天宝印，法术威力+25%，攻击+36，防御+22。" },

  "huo_fu":   { type: "artifact", name: "火灵符", slot: "artifact", tier: 2, grade: 3, element: "huo",  atk: 5, spellBonus: 0.10, price: 300, desc: "【火系法宝】三品朱雀真火灵符，增强火行术法威力 10%，攻击+5。" },
  "jin_ling": { type: "artifact", name: "金铃",   slot: "artifact", tier: 2, grade: 3, element: "jin",  atk: 4, spellBonus: 0.10, price: 300, desc: "【金系法宝】三品太乙金精铃铛，增强金行术法威力 10%，攻击+4。" },
  "mu_teng":  { type: "artifact", name: "木藤环", slot: "artifact", tier: 2, grade: 3, element: "mu",   atk: 3, spellBonus: 0.10, price: 300, desc: "【木系法宝】三品千岁青藤宝环，增强木行生机术法 10%，攻击+3。" },
  "shui_zhu": { type: "artifact", name: "水灵珠", slot: "artifact", tier: 2, grade: 3, element: "shui", atk: 4, spellBonus: 0.10, price: 300, desc: "【水系法宝】三品北海碧海沧珠，增强水行法术威力 10%，攻击+4。" },
  "tu_yin":   { type: "artifact", name: "土印",   slot: "artifact", tier: 2, grade: 3, element: "tu",   atk: 5, spellBonus: 0.10, price: 300, desc: "【土系法宝】三品大地戊土玄印，增强土行法术威力 10%，攻击+5。" },
  "lei_zhu":  { type: "artifact", name: "雷珠",   slot: "artifact", tier: 2, grade: 3, element: "lei",  atk: 6, spellBonus: 0.10, price: 300, desc: "【雷系法宝】三品九天神霄雷珠，增强雷行法术威力 10%，攻击+6。" },
  "bing_jing":{ type: "artifact", name: "冰晶",   slot: "artifact", tier: 2, grade: 3, element: "bing", atk: 5, spellBonus: 0.10, price: 300, desc: "【冰系法宝】三品极北万年玄冰晶，增强冰霜法术威力 10%，攻击+5。" },

  "shop_art_huo":  { type: "artifact", name: "凡品火符", slot: "artifact", tier: 1, grade: 1, element: "huo",  atk: 3, spellBonus: 0.05, price: 120, desc: "一品初阶火灵符纸，法术威力+5%，攻击+3。" },
  "shop_art_jin":  { type: "artifact", name: "凡品金铃", slot: "artifact", tier: 1, grade: 1, element: "jin",  atk: 3, spellBonus: 0.05, price: 120, desc: "一品黄铜金丝铃铛，金系法术威力+5%，攻击+3。" },
  "shop_art_mu":   { type: "artifact", name: "凡品木环", slot: "artifact", tier: 1, grade: 1, element: "mu",   atk: 2, spellBonus: 0.05, price: 120, desc: "一品灵木雕琢环佩，木系法术威力+5%，攻击+2。" },
  "shop_art_shui": { type: "artifact", name: "灵品水珠", slot: "artifact", tier: 2, grade: 3, element: "shui", atk: 6, spellBonus: 0.12, price: 500, desc: "三品深潭寒月水珠，水系法术威力+12%，攻击+6。" },
  "shop_art_lei":  { type: "artifact", name: "灵品雷珠", slot: "artifact", tier: 2, grade: 3, element: "lei",  atk: 7, spellBonus: 0.12, price: 500, desc: "三品雷击桃木芯淬炼雷珠，雷系法术威力+12%，攻击+7。" },
  "shop_art_bing": { type: "artifact", name: "灵品冰晶", slot: "artifact", tier: 2, grade: 3, element: "bing", atk: 6, spellBonus: 0.12, price: 500, desc: "三品雪山寒髓冰晶，冰系法术威力+12%，攻击+6。" },
});

/* ============================================================
   心法残卷（静态：炼气/筑基/金丹/宗门传承）
   ============================================================ */
Object.assign(ITEMS, {
  /* 练气基础 */
  "lianqi_basic_f2": { type: "heartFragment", name: "练气基础·中卷", artId: "lianqi_basic", start: 4, end: 6, price: 150, desc: "【心法中卷残篇】《练气基础》（炼气期通用）。研习参悟可解锁第 4~6 重修炼上限，增加功法攻防与真元积累。" },
  "lianqi_basic_f3": { type: "heartFragment", name: "练气基础·下卷", artId: "lianqi_basic", start: 7, end: 10, price: 400, desc: "【心法下卷圆满篇】《练气基础》（炼气期通用）。研读参悟可突破解锁第 7~10 重修炼圆满境地，为筑基打下坚实道基。" },

  /* 明火心法 */
  "minghuo_heart_f2": { type: "heartFragment", name: "明火心法·中卷", artId: "minghuo_heart", start: 4, end: 6, price: 150, desc: "【心法中卷残篇】《明火心法》（火属性练法）。引离火温养经脉，参悟可解锁第 4~6 重修炼境界与火灵亲和。" },
  "minghuo_heart_f3": { type: "heartFragment", name: "明火心法·下卷", artId: "minghuo_heart", start: 7, end: 10, price: 400, desc: "【心法下卷圆满篇】《明火心法》（火属性练法）。三昧真火初现，参悟可解锁第 7~10 重火修圆满境界。" },

  /* 练气进阶/精要/真解 */
  "lianqi_advanced_f2": { type: "heartFragment", name: "练气进阶·中卷", artId: "lianqi_advanced", start: 4, end: 6, price: 200, desc: "【心法进阶残篇】《练气进阶》。宗门高深练气导引法，参悟可解锁第 4~6 重进阶修炼境界。" },
  "lianqi_essence_f2":  { type: "heartFragment", name: "练气精要·中卷", artId: "lianqi_essence",  start: 4, end: 6, price: 200, desc: "【心法精要残篇】《练气精要》。古仙吐纳精要，参悟可解锁第 4~6 重淬体聚灵境地。" },
  "lianqi_truth_f2":    { type: "heartFragment", name: "练气真解·中卷", artId: "lianqi_truth",    start: 4, end: 6, price: 200, desc: "【大道真解中卷】《练气真解》。上乘练气正道，参悟解锁第 4~6 重深邃法门。" },
  "lianqi_truth_f3":    { type: "heartFragment", name: "练气真解·下卷", artId: "lianqi_truth",    start: 7, end: 10, price: 500, desc: "【大道真解下卷】《练气真解》。参悟解锁第 7~10 重通玄造化，圆满练气。" },

  /* 筑基正道与邪派基础/进阶 */
  "zhuji_basic_z_f2": { type: "heartFragment", name: "筑基基础·下卷", artId: "zhuji_basic_z", start: 4, end: 5, price: 250, desc: "【筑基正道真解】《筑基基础》（筑基期）。参悟可突破筑基前三重瓶颈，解锁第 4~5 重圆满大道。" },
  "zhuji_mid_z_f2":   { type: "heartFragment", name: "筑基进阶·下卷", artId: "zhuji_mid_z",   start: 4, end: 5, price: 300, desc: "【筑基玄元妙诀】《筑基进阶》（筑基期）。参悟可解锁第 4~5 重深厚道韵境界。" },
  "zhuji_basic_x_f2": { type: "heartFragment", name: "邪基基础·下卷", artId: "zhuji_basic_x", start: 4, end: 5, price: 250, desc: "【幽冥魔基残篇】《邪基基础》（邪道筑基）。吞噬煞气修筑魔基，参悟解锁第 4~5 重魔功境界。" },
  "zhuji_mid_x_f2":   { type: "heartFragment", name: "邪基进阶·下卷", artId: "zhuji_mid_x",   start: 4, end: 5, price: 300, desc: "【血海煞基进阶】《邪基进阶》（邪道筑基）。参悟解锁第 4~5 重血海凝煞大道。" },

  /* 金丹期正邪心法残卷（静态补充） */
  "jindan_basic_z_f2": { type: "heartFragment", name: "金丹基础·中卷", artId: "jindan_basic_z", start: 4, end: 6, price: 400, desc: "【金丹大道真诀】《金丹基础》（金丹期正道）。参悟温养九转金丹，解锁第 4~6 重中期境界。" },
  "jindan_basic_z_f3": { type: "heartFragment", name: "金丹基础·下卷", artId: "jindan_basic_z", start: 7, end: 7, price: 600, desc: "【金丹圆满真篇】《金丹基础》（金丹期正道）。参悟破关解锁第 7 重金丹巅峰圆满。" },
  "jindan_mid_z_f2":   { type: "heartFragment", name: "金丹进阶·中卷", artId: "jindan_mid_z",   start: 4, end: 6, price: 500, desc: "【紫府金丹进阶】《金丹进阶》（金丹期正道）。紫府结丹通玄，解锁第 4~6 重金丹法力。" },
  "jindan_mid_z_f3":   { type: "heartFragment", name: "金丹进阶·下卷", artId: "jindan_mid_z",   start: 7, end: 7, price: 800, desc: "【金丹大成秘卷】《金丹进阶》（金丹期正道）。参悟解锁第 7 重金丹大道巅峰。" },
  "jindan_basic_x_f2": { type: "heartFragment", name: "邪丹基础·中卷", artId: "jindan_basic_x", start: 4, end: 6, price: 400, desc: "【幽冥煞丹秘传】《邪丹基础》（金丹期魔道）。煞丹凝煞入体，解锁第 4~6 重魔丹修为。" },
  "jindan_basic_x_f3": { type: "heartFragment", name: "邪丹基础·下卷", artId: "jindan_basic_x", start: 7, end: 7, price: 600, desc: "【天煞邪丹圆满】《邪丹基础》（金丹期魔道）。参悟解锁第 7 重天魔血丹巅峰。" },
  "jindan_mid_x_f2":   { type: "heartFragment", name: "邪丹进阶·中卷", artId: "jindan_mid_x",   start: 4, end: 6, price: 500, desc: "【血海魔丹进阶】《邪丹进阶》（金丹期魔道）。血煞滔天，解锁第 4~6 重魔功杀伐。" },
  "jindan_mid_x_f3":   { type: "heartFragment", name: "邪丹进阶·下卷", artId: "jindan_mid_x",   start: 7, end: 7, price: 800, desc: "【万鬼魔丹大成】《邪丹进阶》（金丹期魔道）。参悟解锁第 7 重魔煞金丹绝巅。" },

  /* 星辰大道 */
  "xingchen_heart_f2": { type: "heartFragment", name: "星辰大法·中卷", artId: "xingchen_heart", start: 4, end: 6, price: 600, desc: "【诸天星宿妙法】《星辰大法》（上古玄秘心法）。引九天星辉入体，参悟解锁第 4~6 重周天星宿。" },
  "xingchen_heart_f3": { type: "heartFragment", name: "星辰大法·下卷", artId: "xingchen_heart", start: 7, end: 7, price: 900, desc: "【星辰圆满道典】《星辰大法》（上古玄秘心法）。参悟解锁第 7 重诸天星海神威大成。" },

  /* 宗门专属传承下卷 */
  "qingyun_sword_f2": { type: "heartFragment", name: "青云剑诀·下卷", artId: "qingyun_sword", start: 4, end: 5, price: 500, desc: "【宗门剑道真传】青云宗镇派《青云剑诀》（筑基期剑修）。参悟可解锁第 4~5 重圆满剑意境界。" },
  "danxia_heart_f2":  { type: "heartFragment", name: "丹霞真经·下卷", artId: "danxia_heart",  start: 4, end: 5, price: 500, desc: "【丹道造化真经】丹霞谷镇宗《丹霞真经》（筑基期炼丹）。参悟可解锁第 4~5 重丹火通明大道。" },
  "xuemou_heart_f2":  { type: "heartFragment", name: "血魔真经·下卷", artId: "xuemou_heart",  start: 4, end: 5, price: 500, desc: "【魔宗血海秘典】血魔门《血魔真经》（筑基期血煞）。参悟可解锁第 4~5 重血影神功造化。" },
  "leiyin_heart_f2":  { type: "heartFragment", name: "雷音大法·下卷", artId: "leiyin_heart",  start: 4, end: 5, price: 500, desc: "【梵天降魔真音】大雷音寺《雷音大法》（筑基期佛门）。参悟可解锁第 4~5 重金刚雷音护体法。" },
  "youming_heart_f2": { type: "heartFragment", name: "幽冥鬼典·下卷", artId: "youming_heart", start: 4, end: 5, price: 500, desc: "【阴煞九幽真卷】幽冥教《幽冥鬼典》（筑基期鬼修）。参悟可解锁第 4~5 重百鬼御魂境界。" },
  "wanshou_heart_f2": { type: "heartFragment", name: "万兽真经·下卷", artId: "wanshou_heart", start: 4, end: 5, price: 500, desc: "【通灵驭兽大道】万兽山《万兽真经》（筑基期御兽）。参悟可解锁第 4~5 重人兽一体真灵契合。" },
  "jianzhong_heart_f2":{type: "heartFragment", name: "剑冢剑典·下卷", artId: "jianzhong_heart",start: 4, end: 5, price: 500, desc: "【古剑通玄秘典】万剑冢《剑冢剑典》（筑基期古剑修）。参悟可解锁第 4~5 重万剑归宗剑煞。" },

  /* 主线专属法宝与神兵（最高至金丹初期） */
  "e_taiyuan_sword": { type: "equip", name: "太渊镇魔剑", slot: "rightHand", tier: 3, grade: 6, atk: 58, def: 15, hp: 120, mp: 45, price: 2000, desc: "太渊古陵出土的六品金丹神兵，剑锋蕴藏浩然星辉（3阶6品 · 攻击+58，防御+15，气血+120，灵力+45）。" },
  "e_taiyuan_jade":  { type: "artifact", name: "太渊护道玉", slot: "artifact", tier: 3, grade: 6, element: "jin", atk: 25, spellBonus: 0.20, price: 1500, desc: "太渊道玉共鸣凝结的六品护道法宝（3阶6品 · 法术威力+20%，攻击+25）。" },
});
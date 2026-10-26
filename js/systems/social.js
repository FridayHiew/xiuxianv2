/* ============================================================
   systems/social.js - 仙友同道 / 动态交互 / 好感度等级特权 / 自选金额与背包灵物馈赠
   ============================================================ */

/* ============================================================
   1. 好感度等级体系 (Favorability Tiers & Perks)
   ============================================================ */

const NPC_FAVOR_TIERS = [
  {
    level: 1,
    stage: "萍水相逢",
    class: "dim",
    icon: "🌱",
    minAff: 0,
    maxAff: 19,
    nextThreshold: 20,
    affNextText: "升至【泛泛之交】需好感 20",
    desc: "初识同门，尚不熟悉",
    perkSummary: "解锁基础寒暄与问候",
    perks: [
      "解锁日常寒暄与同门问候"
    ]
  },
  {
    level: 2,
    stage: "泛泛之交",
    class: "blue",
    icon: "🍃",
    minAff: 20,
    maxAff: 39,
    nextThreshold: 40,
    affNextText: "升至【志同道合】需好感 40",
    desc: "点头之交，偶有往还",
    perkSummary: "演武切磋心得 +15%；探问宗门异象秘辛",
    perks: [
      "演武切磋兵刃熟练度提升 +15%",
      "开启探问宗门异象与八方见闻",
      "偶有道友主动闲谈相聚"
    ]
  },
  {
    level: 3,
    stage: "志同道合",
    class: "good",
    icon: "🤝",
    minAff: 40,
    maxAff: 59,
    nextThreshold: 60,
    affNextText: "升至【莫逆之交】需好感 60",
    desc: "同修论道，相谈甚欢",
    perkSummary: "坐而论道经验 +25%；清晨偶获同道回赠灵丹",
    perks: [
      "坐而论道修为经验收益 +25%",
      "清晨有概率获赠仙友回礼灵药",
      "心境开导效果提升（心情恢复 +1）"
    ]
  },
  {
    level: 4,
    stage: "莫逆之交",
    class: "purple",
    icon: "🍶",
    minAff: 60,
    maxAff: 79,
    nextThreshold: 80,
    affNextText: "升至【生死与共】需好感 80",
    desc: "推心置腹，促膝长谈",
    perkSummary: "演武高人点拨加成；促膝长谈平复心魔；请教消耗减半",
    perks: [
      "演武切磋有高概率触发名师点拨（技能熟练度翻倍）",
      "促膝长谈平复心魔，道心大幅提升",
      "向其请教道法指点消耗减半"
    ]
  },
  {
    level: 5,
    stage: "生死与共",
    class: "gold",
    icon: "⚔️",
    minAff: 80,
    maxAff: 94,
    nextThreshold: 95,
    affNextText: "升至【金兰道侣】需好感 95",
    desc: "患难知交，誓同生死",
    perkSummary: "赠礼好感收益 +30%；可缔结【异姓金兰】或【双修道侣】",
    perks: [
      "馈赠心意好感收益额外 +30%",
      "可正式缔结【异姓金兰】或【双修道侣】盟誓契约",
      "历练危局时神识传音庇护，气运加持"
    ]
  },
  {
    level: 6,
    stage: "金兰道侣",
    class: "pink",
    icon: "💍",
    minAff: 95,
    maxAff: 100,
    nextThreshold: 100,
    affNextText: "好感已达极境圆满",
    desc: "生死相托，情深意笃",
    perkSummary: "双修修炼速度 +15%；突破心魔抗性 +10%；每日灵犀反哺",
    perks: [
      "双修闭关与日常修炼经验收益 +15%",
      "突破瓶颈时心魔率降低 10%",
      "每日清晨概率触发同道赠送天材地宝",
      "解锁专属专属情深知己心声"
    ]
  }
];

/* 查询 NPC 关系层阶与特权 */
function getNpcRelation(aff) {
  const safeAff = Math.max(0, Math.min(100, aff || 0));
  for (let i = NPC_FAVOR_TIERS.length - 1; i >= 0; i--) {
    if (safeAff >= NPC_FAVOR_TIERS[i].minAff) {
      return Object.assign({}, NPC_FAVOR_TIERS[i]);
    }
  }
  return Object.assign({}, NPC_FAVOR_TIERS[0]);
}

/* 检查好感是否发生跨阶突破 */
function checkFavorTierChange(oldAff, newAff) {
  const oldRel = getNpcRelation(oldAff);
  const newRel = getNpcRelation(newAff);
  if (newRel.level > oldRel.level) {
    return {
      leveledUp: true,
      oldLevel: oldRel.level,
      newLevel: newRel.level,
      oldStage: oldRel.stage,
      newStage: newRel.stage,
      newIcon: newRel.icon,
      perkSummary: newRel.perkSummary
    };
  }
  return { leveledUp: false };
}

/* 每日行为状态检测 */
function hasInteractedToday(id) {
  if (S.flags.npcDailyDay !== S.day) return false;
  return !!(S.flags.npcDailyInteraction && S.flags.npcDailyInteraction[id]);
}

function hasGiftedToday(id) {
  if (S.flags.npcDailyDay !== S.day) return false;
  return !!(S.flags.npcDailyGift && S.flags.npcDailyGift[id]);
}

function hasActedToday(id) {
  return hasInteractedToday(id) && hasGiftedToday(id);
}

/* 根据好感度等级与性格生成问候对白 */
function pickGreetingQuote(npc, rel) {
  if (npc.isCompanion) {
    return `「（眉目含情）你来了……只要见着你，这漫漫修仙孤寒之路便尽是温存。」`;
  }
  if (npc.isSworn) {
    return `「哈哈，贤弟/道兄！见你神采奕奕，为兄心中大为畅快！今日又当痛饮一场！」`;
  }
  if (rel.level >= 6) {
    return `「（温声款款）道友来了，快请坐。每每与你相聚，总觉道心格外澄明安宁。」`;
  }
  if (rel.level === 5) {
    return `「道友！见你安好，我便觉心头大定。今日有何想聊的，但说无妨！」`;
  }
  if (rel.level === 4) {
    return `「你我之间何须客套，快请坐！今日定要与你畅谈个痛快。」`;
  }
  if (rel.level === 3) {
    return `「哈哈哈，道友来得正好！我适才还在念及你近期的修行进境。」`;
  }
  if (rel.level === 2) {
    return `「道友今日神清气爽，修行可还顺遂？」`;
  }

  // Lv.1 萍水相逢
  if (npc.traits.includes("沉默寡言")) return `「……道友找我，所为何事？」`;
  if (npc.traits.includes("热心肠")) return `「同门师兄弟，不必拘礼，有什么需要在下帮衬的尽管提。」`;
  if (npc.traits.includes("爱八卦")) return `「哟，这位同门！今天宗门内外可热闹得很，想听点新鲜事吗？」`;
  if (npc.traits.includes("读书仔")) return `「手不释卷，怠慢道友了。不知同门有何见教？」`;
  if (npc.traits.includes("爱花钱")) return `「这位同门，看你步履生风，莫非最近在坊市淘到了什么好宝贝？」`;
  if (npc.traits.includes("为生活")) return `「哎，今日的杂务总算告一段落了。同门寻我可是有要紧事？」`;
  return `「这位同门，找在下可是有什么事？」`;
}

/* ============================================================
   2. 动态交互生成器 (Dynamic Interaction Generator)
   ============================================================ */

/* 缓存当前玩家针对特定 NPC 当日动态生成的选项 */
window._currentNpcTopics = {};

/* 根据 NPC 性格、境界、好感等级、玩家状态动态生成 4 个机缘话题 */
function generateDynamicTopics(npc) {
  const pRealm = typeof getPlayerRealmInfo === "function" ? getPlayerRealmInfo() : { realm: 0, lvl: 0 };
  const rel = getNpcRelation(npc.aff);
  const topics = [];

  // ================= 话题 1：秘闻探秘 / 修仙见闻 =================
  if (npc.traits.includes("爱八卦")) {
    topics.push({
      id: "rumor_gossip",
      category: "secret",
      tag: "🔍 宗门秘闻",
      tagClass: "gold",
      title: "【探听各峰密事与坊市黑幕】",
      desc: `倾听 ${npc.name} 眉飞色舞讲述主峰掌门与执事堂的最新传闻、拍卖行压轴秘宝去向。（机缘获赠灵石或探听关键秘辛）`,
      preview: "可能获得盘缠灵石，道心触动，好感高额提升",
      resolve: (n) => {
        const stones = isStoneTier() ? 40 : 120;
        let gotMoney = false;
        if (chance(0.45)) {
          gotMoney = true;
          if (isStoneTier()) S.stone = (S.stone || 0) + stones;
          else S.money = (S.money || 0) + stones;
        }
        S.dao = (S.dao || 0) + 1;
        return {
          aff: rndInt(6, 9),
          quote: `「（压低声音）我跟你说，听闻灵兽园昨夜走脱了一只异兽，执事堂正暗中悬赏呢！还有这笔碎银盘缠，道友拿去买茶喝！」`,
          details: [
            gotMoney ? `探听有获：对方慷慨塞给你盘缠备用，获得 ${stones} ${currencyName()}` : `探听得秘闻若干，拓宽眼界`,
            `道心触动：道心 +1`
          ]
        };
      }
    });
  } else if (npc.traits.includes("读书仔")) {
    topics.push({
      id: "rumor_library",
      category: "secret",
      tag: "📖 古籍考据",
      tagClass: "blue",
      title: "【探研藏经阁古卷与上古洞府】",
      desc: `与 ${npc.name} 共同对照上古舆图残片，推演附近秘境封印与上古大能坐化之地的蛛丝马迹。`,
      preview: "提升道心，增长修为见闻，读书性格额外好感",
      resolve: (n) => {
        const expGain = rndInt(20, 35);
        if (typeof gainCultivationExp === "function") gainCultivationExp(expGain);
        S.dao = (S.dao || 0) + 2;
        return {
          aff: rndInt(7, 10),
          quote: `「妙哉！古卷所载的'坎水引龙诀'果然与后山黑风林龙潭地脉暗合，道友见地精深，在下佩服！」`,
          details: [
            `考据古籍启发：修为经验 +${expGain}`,
            `明辨玄微：道心 +2`
          ]
        };
      }
    });
  } else if (npc.traits.includes("邪恶人")) {
    topics.push({
      id: "rumor_dark",
      category: "secret",
      tag: "⚡ 偏门异闻",
      tagClass: "purple",
      title: "【刺探黑市暗流与魔宗动向】",
      desc: `试探 ${npc.name} 口风，了解宗门禁地外的灰色地带、黑市杀人夺宝传闻与偏门功法内幕。`,
      preview: "提升实战应变与道心考验，好感大幅波动",
      resolve: (n) => {
        S.dao = (S.dao || 0) + 2;
        return {
          aff: rndInt(5, 8),
          quote: `「桀桀……修仙界从来弱肉强食，那些自诩名门正派之流私下干的脏事可不少，你小子倒也机敏。」`,
          details: [
            `勘破修仙残酷真相：道心 +2`,
            `对左道偏门手段有所防备`
          ]
        };
      }
    });
  } else if (npc.traits.includes("热心肠")) {
    topics.push({
      id: "rumor_kind",
      category: "secret",
      tag: "❤️ 同门守望",
      tagClass: "good",
      title: "【商讨救济贫寒同门与历练互助】",
      desc: `与 ${npc.name} 畅谈宗门新晋外门弟子的生存之艰，商定结伴外出历练、互通有无之策。`,
      preview: "获得心情与道心滋养，热心肠性格额外好感",
      resolve: (n) => {
        S.mood = Math.min(5, (S.mood || 0) + 1);
        S.dao = (S.dao || 0) + 1;
        return {
          aff: rndInt(6, 9),
          quote: `「道友仁义！修仙虽逆天，若失了同门赤诚之心，长生亦是荒坟。往后外出历练，你我互相照应！」`,
          details: [
            `善念相通：玩家心情 +1`,
            `守望相助：道心 +1`
          ]
        };
      }
    });
  } else {
    topics.push({
      id: "rumor_general",
      category: "secret",
      tag: "🍵 闲谈见闻",
      tagClass: "blue",
      title: "【探问宗门异象与八方机缘】",
      desc: `打探四方秘境灵气吞吐异动、灵脉潮汐与名山福地传闻，探求修仙机缘情报。`,
      preview: "稳步提升好感，偶尔获赠灵石或心得",
      resolve: (n) => {
        const stones = isStoneTier() ? 30 : 80;
        let gotMoney = false;
        if (chance(0.35)) {
          gotMoney = true;
          if (isStoneTier()) S.stone = (S.stone || 0) + stones;
          else S.money = (S.money || 0) + stones;
        }
        S.dao = (S.dao || 0) + 1;
        return {
          aff: rndInt(5, 7),
          quote: `「最近听闻秘境深处常有灵光吞吐，道友若是前去历练，切记多带些防身之物！」`,
          details: [
            gotMoney ? `对方赠你盘缠备用：获得 ${stones} ${currencyName()}` : `相谈融洽，道心有所触动`,
            `修仙见闻感悟：道心 +1`
          ]
        };
      }
    });
  }

  // ================= 话题 2：坐而论道 / 功法推演 =================
  if (npc.realm > pRealm.realm) {
    topics.push({
      id: "dao_learn_higher",
      category: "dao",
      tag: "🧘 虚心请教",
      tagClass: "good",
      title: `【请教高境心得：破关破障法门】`,
      desc: `向境界高深（${REALMS[npc.realm]?.name || '前辈'}）的 ${npc.name} 虚心请教周天行气关隘与突破瓶颈阻滞之法。`,
      preview: "巨额修为经验增长，受 Lv.3 志同道合 +25% 特权加成",
      resolve: (n) => {
        let baseExp = rndInt(35, 55);
        if (rel.level >= 3) baseExp = Math.floor(baseExp * 1.25);
        if (typeof gainCultivationExp === "function") gainCultivationExp(baseExp);
        S.dao = (S.dao || 0) + 1;
        return {
          aff: rndInt(5, 8),
          quote: `「你经络阻滞只因灵气行至气冲穴时过于急躁。只需凝神存意三息，水到自然渠成。好生体会！」`,
          details: [
            `得高人点拨：修为经验 +${baseExp}${rel.level >= 3 ? "（含志同道合+25%加成）" : ""}`,
            `悟道破障：道心 +1`
          ]
        };
      }
    });
  } else if (pRealm.realm > npc.realm && pRealm.realm > 0) {
    topics.push({
      id: "dao_guide_junior",
      category: "dao",
      tag: "🌟 提携指点",
      tagClass: "good",
      title: "【提携指点：传授周天吐纳要旨】",
      desc: `以更高境界的高屋建瓴视角，为 ${npc.name} 梳理吐纳经脉，倾囊相授自己的心得体验。`,
      preview: "极大提升对方好感，自身反刍心得获得道心",
      resolve: (n) => {
        S.dao = (S.dao || 0) + 2;
        return {
          aff: rndInt(8, 12),
          quote: `「道兄（道友）这番开示如醍醐灌顶！往日困扰我的关窍竟被道友一语道破，大恩不言谢！」`,
          details: [
            `教学相长，道心澄澈：道心 +2`,
            `对方极为感佩，好感大幅跃升`
          ]
        };
      }
    });
  } else {
    // 同境界论道
    topics.push({
      id: "dao_equal_mutual",
      category: "dao",
      tag: "🧘 坐而论道",
      tagClass: "good",
      title: "【推演天地五行与周天归源】",
      desc: `彼此盘膝而坐，互亮灵气运转轨迹，共同探讨天地灵气吐纳与阴阳顺逆造化玄奥。`,
      preview: "稳步获得修为经验（Lv.3+加成），提升道心",
      resolve: (n) => {
        let baseExp = rndInt(22, 40);
        if (rel.level >= 3) baseExp = Math.floor(baseExp * 1.25);
        if (typeof gainCultivationExp === "function") gainCultivationExp(baseExp);
        S.dao = (S.dao || 0) + 1;
        return {
          aff: rndInt(5, 8),
          quote: `「妙哉！道友对经脉周天循环的见解令人击节赞赏，我对此节亦颇有茅塞顿开之感！」`,
          details: [
            `同参造化：修为经验 +${baseExp}${rel.level >= 3 ? "（含论道加成）" : ""}`,
            `坚韧向道：道心 +1`
          ]
        };
      }
    });
  }

  // ================= 话题 3：同道切磋 / 兵刃演武 =================
  if (npc.traits.includes("不读书") || npc.traits.includes("邪恶人")) {
    topics.push({
      id: "spar_ferocious",
      category: "spar",
      tag: "⚔️ 倾力相搏",
      tagClass: "gold",
      title: "【倾力相搏：真刀真枪印证杀招】",
      desc: `各展真实手段，不用花哨虚文，下场近身搏击，激发出手本能与杀伐潜能！`,
      preview: "大幅提升随机兵刃技能熟练度（受 Lv.2/Lv.4 特权加成）",
      resolve: (n) => {
        const pickSkill = pick(["剑", "刀", "拳", "掌", "棍", "鞭"]);
        let skillGain = 2.0;
        if (rel.level >= 2) skillGain = +(skillGain * 1.15).toFixed(2);
        if (rel.level >= 4 && chance(0.5)) skillGain = +(skillGain * 1.8).toFixed(2);

        let leveled = false;
        if (S.skills && S.skills[pickSkill]) {
          S.skills[pickSkill].exp = +(S.skills[pickSkill].exp + skillGain).toFixed(2);
          while (S.skills[pickSkill].exp >= SKILL_LVL_EXP && S.skills[pickSkill].lvl < MAX_SKILL_LVL) {
            S.skills[pickSkill].exp -= SKILL_LVL_EXP;
            S.skills[pickSkill].lvl++;
            leveled = true;
          }
        }
        return {
          aff: rndInt(4, 7),
          quote: `「痛快！好久没有打得这般酣畅淋漓了！你方才那一记破空变招当真狠辣凌厉，过瘾！」`,
          details: [
            `实战砥砺：【${pickSkill}】熟练度 +${skillGain}${leveled ? `（升级突破至 Lv.${S.skills[pickSkill].lvl}！）` : ""}`,
            rel.level >= 4 ? `激发莫逆之交高人点拨潜能` : `演武筋骨舒展`
          ]
        };
      }
    });
  } else {
    topics.push({
      id: "spar_graceful",
      category: "spar",
      tag: "⚔️ 点到即止",
      tagClass: "gold",
      title: "【以武会友：演武场印证兵刃玄奇】",
      desc: `各留三分余力，纯粹以招式拆解、步法腾挪互印机变（安全稳妥，增进兵刃功底与默契）。`,
      preview: "提升兵刃技能熟练度，稳健增进同道好感",
      resolve: (n) => {
        const pickSkill = pick(["剑", "刀", "拳", "掌", "棍", "鞭"]);
        let skillGain = 1.2;
        if (rel.level >= 2) skillGain = +(skillGain * 1.15).toFixed(2);
        if (rel.level >= 4 && chance(0.4)) skillGain = +(skillGain * 1.5).toFixed(2);

        let leveled = false;
        if (S.skills && S.skills[pickSkill]) {
          S.skills[pickSkill].exp = +(S.skills[pickSkill].exp + skillGain).toFixed(2);
          while (S.skills[pickSkill].exp >= SKILL_LVL_EXP && S.skills[pickSkill].lvl < MAX_SKILL_LVL) {
            S.skills[pickSkill].exp -= SKILL_LVL_EXP;
            S.skills[pickSkill].lvl++;
            leveled = true;
          }
        }
        return {
          aff: rndInt(5, 8),
          quote: `「承让承让！道友招式沉稳内敛，攻防井井有条，真乃正人君子之风。」`,
          details: [
            `切磋演武：【${pickSkill}】熟练度 +${skillGain}${leveled ? `（升级突破至 Lv.${S.skills[pickSkill].lvl}！）` : ""}`,
            `以武会友，互有所得`
          ]
        };
      }
    });
  }

  // ================= 话题 4：心境排解 / 深交羁绊 / 誓约 =================
  if (rel.level >= 5 && !npc.isCompanion && !npc.isSworn) {
    topics.push({
      id: "bond_sworn_or_love",
      category: "bond",
      isBond: true,
      tag: "💍 缔结契约",
      tagClass: "pink",
      title: "【缔结道誓：结为双修道侣或金兰手足】",
      desc: `彼此情谊已至生死与共（好感 ${npc.aff}/100），可在天道见证下立下生死契约，大道同归！`,
      preview: "解锁专属温情称谓与心声，解锁顶级羁绊增益",
      resolve: (n) => {
        // 自动根据性别或者默认选择道侣/金兰
        const isOpposite = (S.gender && n.gender && S.gender !== n.gender);
        if (isOpposite) {
          n.isCompanion = true;
          return {
            aff: 10,
            quote: `「（眼含热泪，双手紧扣）执子之手，与子偕老。红尘万丈，往后生生世世，我都伴你左右！」`,
            details: [
              `【天作之合】正式与 ${n.name} 结为同心双修道侣！`,
              `解锁专属温情问候与双修加成`
            ]
          };
        } else {
          n.isSworn = true;
          return {
            aff: 10,
            quote: `「苍天在上，厚土在下！今日你我义结金兰，今生荣辱与共，肝胆相照，共护仙道！」`,
            details: [
              `【金兰之义】正式与 ${n.name} 结为异姓金兰手足！`,
              `解锁专属知己问候与守护之契`
            ]
          };
        }
      }
    });
  } else if (rel.level >= 4) {
    topics.push({
      id: "heart_deep_talk",
      category: "heart",
      tag: "🍶 促膝长谈",
      tagClass: "purple",
      title: "【促膝长谈：倾诉修行心魔与红尘挂碍】",
      desc: `温一壶灵酒，推心置腹，倾吐各自在修仙途中的彷徨、瓶颈心魔与未解心结。`,
      preview: "大幅抚平心魔，心情恢复满值，好感显著跃升",
      resolve: (n) => {
        S.mood = 5;
        S.dao = (S.dao || 0) + 2;
        return {
          aff: rndInt(8, 12),
          quote: `「（长舒一口气，碰杯对饮）知我者，谓我心忧；不知我者，谓我何求。修仙路长，有你相伴，何惧心魔！」`,
          details: [
            `解开心结心魔：玩家心情回满（Lv.5 极佳）`,
            `道心砥砺坚实：道心 +2`
          ]
        };
      }
    });
  } else {
    topics.push({
      id: "heart_mortal_reminisce",
      category: "heart",
      tag: "🍂 红尘温叙",
      tagClass: "blue",
      title: "【畅叙凡尘山川风物与闲情逸趣】",
      desc: `回忆凡俗家乡的烟火炊烟、四季轮转与山水旧景，笑看红尘百态，让紧绷的求道心神彻底放松。`,
      preview: "心情 +1，稳步提升好感，宾主尽欢",
      resolve: (n) => {
        S.mood = Math.min(5, (S.mood || 0) + 1);
        return {
          aff: rndInt(5, 8),
          quote: `「是啊，凡尘虽苦，却也有万家灯火与人间至味。偶尔回味一番，修仙之孤清也淡去不少。」`,
          details: [
            `身心放松：玩家心情 +1`,
            `相谈甚欢，关系进一步拉近`
          ]
        };
      }
    });
  }

  return topics;
}

/* 打开动态交流互动窗口 */
function openInteract(id) {
  const npc = S.npcMap[id];
  if (!npc || !npc.alive) return;
  if (hasInteractedToday(id)) {
    log(`今日已与 ${npc.name} 交流过，明日再叙。`, "c-bad");
    return;
  }

  const rel = getNpcRelation(npc.aff);
  const greeting = pickGreetingQuote(npc, rel);
  const realmText = npc.realm === 0 ? "凡人" : `${REALMS[npc.realm]?.name || '筑基'}·${subName(npc.sub)}${npc.sub}重`;

  // 生成今日 4 个动态机缘主题
  const topics = generateDynamicTopics(npc);
  window._currentNpcTopics[id] = topics;

  const topicsHtml = topics.map((t, idx) => `
    <div class="dynamic-topic-card ${t.isBond ? 'highlight' : ''}" onclick="resolveDynamicTopic('${id}', ${idx})">
      <div class="topic-header-row">
        <span class="topic-title">${t.title}</span>
        <span class="topic-tag tag ${t.tagClass}">${t.tag}</span>
      </div>
      <div class="topic-desc">${t.desc}</div>
      <div class="topic-gain-preview">💡 预期机缘：${t.preview}</div>
    </div>
  `).join("");

  const perksListHtml = rel.perks.map(p => `<li>${p}</li>`).join("");

  const bodyHtml = `
    <div class="social-modal-container">
      <div class="social-target-card">
        <div class="target-name-row">
          <span class="name">${npc.name}</span>
          ${npc.isCompanion ? '<span class="tag pink">💍 道侣</span>' : ''}
          ${npc.isSworn ? '<span class="tag gold">⚔️ 金兰</span>' : ''}
          <span class="tag lvl-${rel.level}">${rel.icon} Lv.${rel.level} ${rel.stage}</span>
          <span class="tag">${npc.role}</span>
          <span class="tag ${npc.gender === '女' ? 'pink' : 'blue'}">${npc.gender}</span>
          <span class="tag">${realmText}</span>
        </div>
        <div class="target-dialogue-quote">${greeting}</div>
        
        <div class="target-aff-meter">
          <span>好感羁绊：${npc.aff}/100</span>
          <div class="aff-bar-track"><div class="aff-bar-fill" style="width:${npc.aff}%;"></div></div>
          <span style="font-size:11px; color:var(--text-dim);">${rel.affNextText}</span>
        </div>

        <div class="social-perks-box">
          <b>当前等级特权（Lv.${rel.level} ${rel.stage}）：</b>${rel.perkSummary}
        </div>

        <div class="target-meta">
          性情：${npc.traits.join("、")}　悟性：${npc.talent}　气度：${npc.ie === 'E' ? '外向健谈' : '内向深沉'}　仪态：${npc.looks}/10
        </div>
      </div>

      <div class="social-choice-heading">✨ 今日同道机缘话题（动态生成 · 请选择其一参详）：</div>
      ${topicsHtml}
    </div>
  `;

  showModal("仙友交流 · " + npc.name, bodyHtml, [
    { label: "暂不交流", fn: closeModal }
  ]);
}

/* 结算执行选中的动态话题 */
function resolveDynamicTopic(id, topicIndex) {
  const npc = S.npcMap[id];
  if (!npc || !npc.alive) return;
  if (hasInteractedToday(id)) {
    log("今日已与对方交流过。", "c-bad");
    closeModal();
    return;
  }

  const topics = window._currentNpcTopics[id];
  if (!topics || !topics[topicIndex]) {
    closeModal();
    return;
  }
  const chosenTopic = topics[topicIndex];
  closeModal();

  // 记录今日已交互
  S.metNpcs[id] = true;
  if (S.flags.npcDailyDay !== S.day) {
    S.flags.npcDailyDay = S.day;
    S.flags.npcDailyInteraction = {};
    S.flags.npcDailyGift = {};
  }
  if (!S.flags.npcDailyInteraction) S.flags.npcDailyInteraction = {};
  S.flags.npcDailyInteraction[id] = true;
  npc.lastInteract = S.day;

  // 执行具体话题逻辑
  const result = chosenTopic.resolve(npc);

  // 好感度结算（包含心法加成与等级加成）
  const rel = getNpcRelation(npc.aff);
  let affGain = result.aff || 5;

  // 心法社交加成
  const art = typeof getCurrentArt === "function" ? getCurrentArt() : null;
  const socialBonus = (art && art.bonus && art.bonus.social) ? art.bonus.social : 0;
  if (socialBonus > 0) {
    affGain = Math.floor(affGain * (1 + socialBonus));
  }

  // 容貌与性格相合微调
  const lookBonus = Math.floor(npc.looks / 4);
  const ieBonus = (S.ie === npc.ie) ? 1 : 0;
  affGain += (lookBonus + ieBonus);

  const oldAff = npc.aff;
  npc.aff = Math.max(0, Math.min(100, npc.aff + affGain));
  const newRel = getNpcRelation(npc.aff);

  // 好感度跨阶突破检查
  const tierUp = checkFavorTierChange(oldAff, npc.aff);

  log(`与 ${npc.name} 交流【${chosenTopic.title}】，好感 +${affGain}。`, "c-pink");
  if (tierUp.leveledUp) {
    log(`【羁绊晋升】与 ${npc.name} 的好感关系提升至【Lv.${tierUp.newLevel} ${tierUp.newStage}】！`, "c-gold");
  }

  save(); render();

  const detailsList = [
    `对方心声：<i>${result.quote}</i>`,
    ...(result.details || []),
    `好感变化：+${affGain}（${oldAff} ➔ ${npc.aff} / 100）`,
    `当前关系：<span class="tag lvl-${newRel.level}">${newRel.icon} Lv.${newRel.level} ${newRel.stage}</span>`
  ];

  if (tierUp.leveledUp) {
    detailsList.push(`<div style="margin-top:6px; padding:6px 10px; background:rgba(212,163,71,0.15); border:1px solid #d4af37; border-radius:4px; color:#f5e2b3;">
      ⭐ <b>关系突破至【Lv.${tierUp.newLevel} ${tierUp.newStage}】！</b><br>
      解锁特权：${tierUp.perkSummary}
    </div>`);
  }

  showActionModal("交流结语 · " + chosenTopic.title, detailsList);
}

/* ============================================================
   3. 送礼系统：自由自选金额（铜钱/灵石）与背包灵物分类馈赠
   ============================================================ */

/* 获取 NPC 喜好倾向提示 */
function getNpcGiftPreferenceInfo(npc) {
  const hints = [];
  if (npc.traits.includes("读书仔")) hints.push("酷爱功法残卷、古籍笔墨、雅乐琴棋（功法书巨额好感）");
  if (npc.traits.includes("不读书")) hints.push("厌恶诗文墨卷，更喜烈酒、兵刃武具与杀伐实物");
  if (npc.traits.includes("爱花钱")) hints.push("偏爱名贵珍宝、高阶丹药与大量金银灵石（馈赠收益高）");
  if (npc.traits.includes("热心肠")) hints.push("格外器重疗伤解毒、济世救人的灵丹妙草（丹药额外好感）");
  if (npc.traits.includes("爱八卦")) hints.push("偏爱四方特产、灵茶美酒与奇异材料、泉水");
  if (npc.traits.includes("邪恶人")) hints.push("喜爱妖兽内丹、剧毒及杀伐之煞物");
  if (npc.traits.includes("为生活")) hints.push("求真务实，看重灵石盘缠与修行日用实物");
  if (hints.length === 0) hints.push("性情冲淡，凡修仙灵草、丹药与灵粮皆乐意接纳");
  return hints.join("；");
}

/* 计算赠送货币预期好感收益 */
function calculateCurrencyGain(npc, curType, amount) {
  if (!amount || amount <= 0) return 0;
  const rel = getNpcRelation(npc.aff);

  let baseAff = 0;
  if (curType === "stone") {
    // 灵石价值高
    baseAff = Math.max(1, Math.round(Math.pow(amount, 0.68) * 2.5));
  } else {
    // 铜钱
    baseAff = Math.max(1, Math.round(Math.pow(amount / 10, 0.68) * 1.8));
  }

  // 性格加成
  if (npc.traits.includes("爱花钱")) baseAff = Math.floor(baseAff * 1.3);
  if (npc.traits.includes("为生活")) baseAff = Math.floor(baseAff * 1.2);
  if (npc.traits.includes("邪恶人")) {
    baseAff = amount >= 200 ? Math.floor(baseAff * 1.15) : Math.max(1, Math.floor(baseAff * 0.85));
  }

  // Lv.5 生死与共 特权：馈赠好感收益 +30%
  if (rel.level >= 5) {
    baseAff = Math.floor(baseAff * 1.3);
  }

  // 心法社交加成
  const art = typeof getCurrentArt === "function" ? getCurrentArt() : null;
  const socialBonus = (art && art.bonus && art.bonus.social) ? art.bonus.social : 0;
  if (socialBonus > 0) {
    baseAff = Math.floor(baseAff * (1 + socialBonus));
  }

  return Math.max(1, baseAff);
}

/* 计算背包灵物赠送好感与偏好匹配 */
function calculateItemAffinityGain(npc, item, itemId, qty = 1) {
  let baseAff = 5;
  const price = item.price || 10;
  if (price >= 500) baseAff = 30;
  else if (price >= 200) baseAff = 22;
  else if (price >= 80) baseAff = 15;
  else if (price >= 30) baseAff = 10;
  else if (price >= 15) baseAff = 6;
  else baseAff = 3;

  let traitBonus = 0;
  let isPreferred = false;

  const itemName = item.name || itemId;
  const isBook = item.type === "spellbook" || item.type === "skillbook" || item.type === "heartArt" || item.type === "heartFragment" || itemId.startsWith("book_") || itemName.includes("墨") || itemName.includes("笔") || itemName.includes("棋") || itemName.includes("琴") || itemName.includes("残卷") || itemName.includes("秘籍");
  const isPill = item.type === "pill" || itemName.includes("丹");
  const isBeast = item.type === "food" || item.type === "petBreak" || itemName.includes("妖丹");
  const isWeapon = item.type === "weapon" || item.type === "armor" || item.type === "equip" || itemName.includes("刀") || itemName.includes("剑");

  if (npc.traits.includes("读书仔")) {
    if (isBook) { traitBonus += 10; isPreferred = true; }
  }
  if (npc.traits.includes("不读书")) {
    if (isBook && !itemName.includes("刀") && !itemName.includes("剑")) { traitBonus -= 4; }
    if (isWeapon || itemName.includes("酒")) { traitBonus += 7; isPreferred = true; }
  }
  if (npc.traits.includes("爱花钱")) {
    if (price >= 100) { traitBonus += 8; isPreferred = true; }
  }
  if (npc.traits.includes("热心肠")) {
    if (isPill) { traitBonus += 7; isPreferred = true; }
  }
  if (npc.traits.includes("爱八卦")) {
    if (itemName.includes("茶") || itemName.includes("草") || itemName.includes("泉") || price >= 40) {
      traitBonus += 5; isPreferred = true;
    }
  }
  if (npc.traits.includes("邪恶人")) {
    if (isBeast || itemName.includes("毒")) { traitBonus += 8; isPreferred = true; }
  }
  if (npc.traits.includes("为生活")) {
    if (price >= 30 || item.type === "food") { traitBonus += 5; isPreferred = true; }
  }

  let singleGain = Math.max(1, baseAff + traitBonus);

  // Lv.5 生死与共 特权：+30%
  const rel = getNpcRelation(npc.aff);
  if (rel.level >= 5) {
    singleGain = Math.floor(singleGain * 1.3);
  }

  const art = typeof getCurrentArt === "function" ? getCurrentArt() : null;
  const socialBonus = (art && art.bonus && art.bonus.social) ? art.bonus.social : 0;
  if (socialBonus > 0) {
    singleGain = Math.floor(singleGain * (1 + socialBonus));
  }

  // 数量倍增（略带边际收益保护）
  let totalGain = singleGain;
  if (qty > 1) {
    totalGain = Math.floor(singleGain * Math.pow(qty, 0.88));
  }

  return { singleGain, totalGain, isPreferred, isBook, isPill };
}

/* 物品赠送感谢台词 */
function pickGiftDialogue(npc, item, gain, isPreferred) {
  const itemName = item.name || "此物";

  if (isPreferred) {
    if (npc.traits.includes("读书仔")) {
      return `「妙极！${itemName}字字珠玑，在下必朝夕研读品味！多谢${S.name || "道友"}深情厚意！」`;
    }
    if (npc.traits.includes("爱花钱")) {
      return `「哈哈，果然是不可多得的稀世宝物！${S.name || "道友"}出手真是阔气，在下认你这个莫逆之交！」`;
    }
    if (npc.traits.includes("热心肠")) {
      return `「如此上佳的灵药！有了${itemName}，定能解同门燃眉之急，道友仁心厚德！」`;
    }
    if (npc.traits.includes("邪恶人")) {
      return `「嘿嘿……这${itemName}凶煞煞气极足，甚合我心！算你有眼力见。」`;
    }
    return `「此物正解在下修行燃眉之急！道友知遇厚赠之恩，铭感五内！」`;
  }

  if (npc.traits.includes("不读书") && (itemName.includes("书") || itemName.includes("笔") || itemName.includes("墨"))) {
    return `「咳咳……道友莫非不知在下最怕翻经卷？不过既然是道友相赠，权且收去垫桌脚……啊不，妥善收存吧！」`;
  }

  if (gain >= 25) {
    return `「如此贵重的${itemName}，道友竟舍得相赠？在下受之有愧，日后若有吩咐，定当赴汤蹈火！」`;
  }
  if (gain >= 12) {
    return `「多谢道友赠予${itemName}，同修仙途本该守望相助，在下欣然收下了！」`;
  }
  return `「礼轻情意重，多谢道友这份心意。」`;
}

/* 缓存当前打开的送礼面板状态 */
window._currentGiftState = {
  npcId: null,
  activeCurrency: "stone", // 'stone' 或 'money'
  currencyAmt: 50,
  itemFilter: "all"        // 'all', 'pill', 'book', 'mat', 'equip'
};

/* 打开送礼面板（支持自选金额铜钱/灵石，以及背包物品分类选择） */
function openGiftModal(id, options = {}) {
  const npc = S.npcMap[id];
  if (!npc || !npc.alive) return;
  if (hasGiftedToday(id)) {
    log(`今日已向 ${npc.name} 赠送过心意，明日再来吧。`, "c-bad");
    return;
  }

  const rel = getNpcRelation(npc.aff);
  const prefHint = getNpcGiftPreferenceInfo(npc);

  const stoneCount = S.stone || 0;
  const moneyCount = S.money || 0;

  // 默认货币选择
  let curType = options.currencyType || window._currentGiftState.activeCurrency || (isStoneTier() ? "stone" : "money");
  if (curType === "stone" && stoneCount <= 0 && moneyCount > 0) curType = "money";
  else if (curType === "money" && moneyCount <= 0 && stoneCount > 0) curType = "stone";

  window._currentGiftState.npcId = id;
  window._currentGiftState.activeCurrency = curType;

  const curBalance = curType === "stone" ? stoneCount : moneyCount;
  const curName = curType === "stone" ? "灵石" : "铜钱";
  const defaultAmt = Math.min(curBalance, Math.max(1, curType === "stone" ? (curBalance >= 50 ? 50 : curBalance) : (curBalance >= 100 ? 100 : curBalance)));
  window._currentGiftState.currencyAmt = defaultAmt;

  const activeFilter = options.itemFilter || window._currentGiftState.itemFilter || "all";
  window._currentGiftState.itemFilter = activeFilter;

  // 1. 货币自选模块 HTML
  const initialGain = calculateCurrencyGain(npc, curType, defaultAmt);

  const currencySectionHtml = `
    <div class="gift-section">
      <div class="gift-section-title">🪙 自由赠予仙财（自选数量）</div>
      
      <div class="currency-selector-tabs">
        <button class="currency-tab-btn ${curType === 'stone' ? 'active' : ''}" onclick="switchGiftCurrencyType('${id}', 'stone')">
          💎 灵石（现有：${stoneCount}）
        </button>
        <button class="currency-tab-btn ${curType === 'money' ? 'active' : ''}" onclick="switchGiftCurrencyType('${id}', 'money')">
          🪙 铜钱（现有：${moneyCount}）
        </button>
      </div>

      <div class="gift-custom-amount-box">
        <div class="custom-amount-controls">
          <span style="font-size:12px; color:var(--text-dim);">赠送数量：</span>
          <input type="range" class="custom-amount-slider" id="giftRangeSlider"
                 min="1" max="${Math.max(1, curBalance)}" value="${defaultAmt}"
                 oninput="syncGiftCurrencyAmount('${id}', this.value)">
          <input type="number" class="custom-amount-input" id="giftNumberInput"
                 min="1" max="${Math.max(1, curBalance)}" value="${defaultAmt}"
                 oninput="syncGiftCurrencyAmount('${id}', this.value)">
          <span style="font-size:12px; color:var(--text-gold); font-weight:bold;">${curName}</span>
        </div>

        <div class="quick-preset-btns">
          <button class="preset-btn" onclick="setGiftCurrencyPreset('${id}', 10)">10</button>
          <button class="preset-btn" onclick="setGiftCurrencyPreset('${id}', 50)">50</button>
          <button class="preset-btn" onclick="setGiftCurrencyPreset('${id}', 100)">100</button>
          <button class="preset-btn" onclick="setGiftCurrencyPreset('${id}', 200)">200</button>
          <button class="preset-btn" onclick="setGiftCurrencyPreset('${id}', 500)">500</button>
          <button class="preset-btn" onclick="setGiftCurrencyPreset('${id}', ${curBalance})">全部 (${curBalance})</button>
        </div>

        <div class="gift-live-preview">
          <div>
            预计获得好感：<span id="giftCurrencyGainPreview" style="color:var(--c-pink); font-size:13px; font-weight:bold;">+${initialGain}</span>
            ${npc.traits.includes("爱花钱") ? '<span style="color:#f2cf7e; margin-left:6px;">⭐ 投其所好（爱花钱 +30%）</span>' : ''}
            ${rel.level >= 5 ? '<span style="color:#e884a6; margin-left:6px;">✨ 生死与共加成 (+30%)</span>' : ''}
          </div>
          <button class="gift-btn" style="padding:4px 12px; font-size:12px;" ${curBalance <= 0 ? 'disabled' : ''}
                  onclick="confirmGiftCurrency('${id}')">
            确认赠予
          </button>
        </div>
      </div>
    </div>
  `;

  // 2. 背包物品扫描与过滤
  const backpackItems = [];
  if (S.inventory) {
    for (const itemId in S.inventory) {
      const count = S.inventory[itemId];
      if (count <= 0) continue;
      const it = (typeof getItem === "function" ? getItem(itemId) : null) || { name: itemId, desc: "修真随身灵物", price: 15, type: "other" };
      
      const itemName = it.name || itemId;
      const isBook = it.type === "spellbook" || it.type === "skillbook" || it.type === "heartArt" || it.type === "heartFragment" || itemId.startsWith("book_") || itemName.includes("秘籍") || itemName.includes("残卷");
      const isPill = it.type === "pill" || itemName.includes("丹");
      const isMat = it.type === "mat" || it.type === "food" || it.type === "petBreak" || itemName.includes("草") || itemName.includes("泉") || itemName.includes("妖丹");
      const isEquip = it.type === "equip" || it.type === "artifact" || it.type === "weapon" || it.type === "armor" || it.type === "ring" || it.type === "other";

      // 过滤器匹配
      if (activeFilter === "pill" && !isPill) continue;
      if (activeFilter === "book" && !isBook) continue;
      if (activeFilter === "mat" && !isMat) continue;
      if (activeFilter === "equip" && !isEquip) continue;

      const affInfo = calculateItemAffinityGain(npc, it, itemId, 1);
      backpackItems.push({
        id: itemId,
        item: it,
        count,
        singleGain: affInfo.singleGain,
        isPreferred: affInfo.isPreferred,
        isBook,
        isPill,
        isMat,
        isEquip
      });
    }
  }

  // 排序：投其所好优先，好感度高优先
  backpackItems.sort((a, b) => {
    if (a.isPreferred && !b.isPreferred) return -1;
    if (!a.isPreferred && b.isPreferred) return 1;
    return b.singleGain - a.singleGain;
  });

  const filterTabsHtml = `
    <div class="gift-filter-tabs">
      <span class="gift-filter-pill ${activeFilter === 'all' ? 'active' : ''}" onclick="switchGiftItemFilter('${id}', 'all')">全部灵物</span>
      <span class="gift-filter-pill ${activeFilter === 'pill' ? 'active' : ''}" onclick="switchGiftItemFilter('${id}', 'pill')">💊 灵丹妙药</span>
      <span class="gift-filter-pill ${activeFilter === 'book' ? 'active' : ''}" onclick="switchGiftItemFilter('${id}', 'book')">📜 功法道书</span>
      <span class="gift-filter-pill ${activeFilter === 'mat' ? 'active' : ''}" onclick="switchGiftItemFilter('${id}', 'mat')">🌿 天材地宝</span>
      <span class="gift-filter-pill ${activeFilter === 'equip' ? 'active' : ''}" onclick="switchGiftItemFilter('${id}', 'equip')">⚔️ 法宝器物</span>
    </div>
  `;

  let backpackListHtml = '';
  if (backpackItems.length === 0) {
    backpackListHtml = `
      <div class="empty-backpack-hint">
        储物袋中暂无符合当前分类的灵物。可自由赠送仙财灵石，或前往炼丹阁炼药、坊市淘书采宝后再来相赠。
      </div>
    `;
  } else {
    backpackListHtml = `
      <div class="gift-items-scroll">
        ${backpackItems.map(b => {
          const typeBadge = b.isPill ? '丹药' : (b.isBook ? '功法' : (b.isMat ? '材料' : '法宝器物'));
          const typeColor = b.isPill ? 'good' : (b.isBook ? 'purple' : (b.isMat ? 'blue' : 'gold'));
          const maxAllGain = calculateItemAffinityGain(npc, b.item, b.id, b.count).totalGain;

          return `
            <div class="gift-item-row">
              <div class="gift-item-info">
                <div class="gift-item-header">
                  <span class="gift-item-name">${b.item.name}</span>
                  <span class="tag ${typeColor}">${typeBadge}</span>
                  <span class="gift-item-count">拥有 ×${b.count}</span>
                  ${b.isPreferred ? '<span class="tag gold glow">⭐ 投其所好</span>' : ''}
                </div>
                <div class="gift-item-desc">${b.item.desc || '修真随身之灵物'}</div>
              </div>
              <div class="gift-item-action">
                <div style="display:flex; align-items:center; gap:6px;">
                  <button class="gift-btn" onclick="confirmGiftItem('${id}', '${b.id}', 1)">
                    赠送 1 枚 <span style="color:#e884a6;">(+${b.singleGain})</span>
                  </button>
                  ${b.count > 1 ? `
                    <button class="gift-btn" style="background:#20170e;" onclick="confirmGiftItem('${id}', '${b.id}', ${b.count})">
                      全赠 ×${b.count} <span style="color:#e884a6;">(+${maxAllGain})</span>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  const backpackSectionHtml = `
    <div class="gift-section">
      <div class="gift-section-title">🎒 储物袋灵物馈赠（支持丹药、功法书、灵材与法宝）</div>
      ${filterTabsHtml}
      ${backpackListHtml}
    </div>
  `;

  const bodyHtml = `
    <div class="social-modal-container">
      <div class="social-target-card">
        <div class="target-name-row">
          <span class="name">${npc.name}</span>
          ${npc.isCompanion ? '<span class="tag pink">💍 道侣</span>' : ''}
          ${npc.isSworn ? '<span class="tag gold">⚔️ 金兰</span>' : ''}
          <span class="tag lvl-${rel.level}">${rel.icon} Lv.${rel.level} ${rel.stage}</span>
          <span class="tag">${npc.role}</span>
          <span class="tag ${npc.gender === '女' ? 'pink' : 'blue'}">${npc.gender}</span>
        </div>
        <div class="target-aff-meter">
          <span>当前好感：${npc.aff}/100</span>
          <div class="aff-bar-track"><div class="aff-bar-fill" style="width:${npc.aff}%;"></div></div>
          <span style="font-size:11px; color:var(--text-dim);">${rel.affNextText}</span>
        </div>
        <div class="target-pref-hint">💡 <b>喜好倾向：</b>${prefHint}</div>
      </div>

      ${currencySectionHtml}
      ${backpackSectionHtml}
    </div>
  `;

  showModal("赠送心意 · " + npc.name, bodyHtml, [
    { label: "返回", fn: closeModal }
  ]);
}

/* 切换送礼货币类型（灵石/铜钱） */
function switchGiftCurrencyType(npcId, curType) {
  window._currentGiftState.activeCurrency = curType;
  openGiftModal(npcId, { currencyType: curType, itemFilter: window._currentGiftState.itemFilter });
}

/* 切换送礼物品分类标签 */
function switchGiftItemFilter(npcId, filter) {
  window._currentGiftState.itemFilter = filter;
  openGiftModal(npcId, { currencyType: window._currentGiftState.activeCurrency, itemFilter: filter });
}

/* 同步滑动条与输入框数量，并实时更新预期收益 */
function syncGiftCurrencyAmount(npcId, val) {
  const npc = S.npcMap[npcId];
  if (!npc) return;
  const curType = window._currentGiftState.activeCurrency;
  const max = curType === "stone" ? (S.stone || 0) : (S.money || 0);

  let num = parseInt(val, 10);
  if (isNaN(num) || num < 1) num = 1;
  if (num > max) num = max;

  window._currentGiftState.currencyAmt = num;

  const slider = document.getElementById("giftRangeSlider");
  const input = document.getElementById("giftNumberInput");
  const preview = document.getElementById("giftCurrencyGainPreview");

  if (slider) slider.value = num;
  if (input) input.value = num;
  if (preview) {
    const gain = calculateCurrencyGain(npc, curType, num);
    preview.innerText = `+${gain}`;
  }
}

/* 点击快捷预设金额按钮 */
function setGiftCurrencyPreset(npcId, amt) {
  syncGiftCurrencyAmount(npcId, amt);
}

/* 确认自选金额赠送 */
function confirmGiftCurrency(id) {
  const npc = S.npcMap[id];
  if (!npc || !npc.alive) return;
  if (hasGiftedToday(id)) {
    log("今日已向对方赠送过心意。", "c-bad");
    closeModal();
    return;
  }

  const curType = window._currentGiftState.activeCurrency;
  const amt = window._currentGiftState.currencyAmt || 1;
  const curName = curType === "stone" ? "灵石" : "铜钱";
  const curBalance = curType === "stone" ? (S.stone || 0) : (S.money || 0);

  if (curBalance < amt) {
    log(`${curName}不足（需 ${amt}，现有 ${curBalance}）。`, "c-bad");
    return;
  }

  // 扣除货币
  if (curType === "stone") S.stone -= amt;
  else S.money -= amt;

  closeModal();

  // 记录今日送礼
  S.metNpcs[id] = true;
  if (S.flags.npcDailyDay !== S.day) {
    S.flags.npcDailyDay = S.day;
    S.flags.npcDailyInteraction = {};
    S.flags.npcDailyGift = {};
  }
  if (!S.flags.npcDailyGift) S.flags.npcDailyGift = {};
  S.flags.npcDailyGift[id] = true;

  const finalGain = calculateCurrencyGain(npc, curType, amt);
  const oldAff = npc.aff;
  npc.aff = Math.max(0, Math.min(100, npc.aff + finalGain));
  npc.lastInteract = S.day;

  const tierUp = checkFavorTierChange(oldAff, npc.aff);
  const newRel = getNpcRelation(npc.aff);

  const quote = amt >= 200 || (curType === "stone" && amt >= 30)
    ? `「${S.name || "道友"}出手如此阔绰！在下正缺这批修行用度，此番深厚情谊在下定铭记五内！」`
    : `「多谢${S.name || "道友"}赠予${amt} ${curName}，同道守望相助，在下好生领受了。」`;

  log(`赠予 ${npc.name} ${amt} ${curName}，好感 +${finalGain}。`, "c-pink");
  if (tierUp.leveledUp) {
    log(`【羁绊晋升】与 ${npc.name} 的好感关系提升至【Lv.${tierUp.newLevel} ${tierUp.newStage}】！`, "c-gold");
  }

  save(); render();

  const detailsList = [
    `赠礼花费：${amt} ${curName}`,
    `对方心声：<i>${quote}</i>`,
    `好感变化：+${finalGain}（${oldAff} ➔ ${npc.aff} / 100）`,
    `当前关系：<span class="tag lvl-${newRel.level}">${newRel.icon} Lv.${newRel.level} ${newRel.stage}</span>`
  ];

  if (tierUp.leveledUp) {
    detailsList.push(`<div style="margin-top:6px; padding:6px 10px; background:rgba(212,163,71,0.15); border:1px solid #d4af37; border-radius:4px; color:#f5e2b3;">
      ⭐ <b>关系突破至【Lv.${tierUp.newLevel} ${tierUp.newStage}】！</b><br>
      解锁特权：${tierUp.perkSummary}
    </div>`);
  }

  showActionModal("仙财馈赠 · " + npc.name, detailsList);
}

/* 确认背包物品赠送（支持自选数量） */
function confirmGiftItem(id, itemId, qty = 1) {
  const npc = S.npcMap[id];
  if (!npc || !npc.alive) return;
  if (hasGiftedToday(id)) {
    log("今日已向对方赠送过心意。", "c-bad");
    closeModal();
    return;
  }
  if (!hasItem(itemId, qty)) {
    log("储物袋中该物品数量不足！", "c-bad");
    return;
  }

  closeModal();

  const it = (typeof getItem === "function" ? getItem(itemId) : null) || { name: itemId, desc: "修真灵物", price: 15, type: "other" };
  removeItem(itemId, qty);

  S.metNpcs[id] = true;
  if (S.flags.npcDailyDay !== S.day) {
    S.flags.npcDailyDay = S.day;
    S.flags.npcDailyInteraction = {};
    S.flags.npcDailyGift = {};
  }
  if (!S.flags.npcDailyGift) S.flags.npcDailyGift = {};
  S.flags.npcDailyGift[id] = true;

  const affInfo = calculateItemAffinityGain(npc, it, itemId, qty);
  const finalGain = affInfo.totalGain;
  const oldAff = npc.aff;
  npc.aff = Math.max(0, Math.min(100, npc.aff + finalGain));
  npc.lastInteract = S.day;

  const tierUp = checkFavorTierChange(oldAff, npc.aff);
  const newRel = getNpcRelation(npc.aff);
  const quote = pickGiftDialogue(npc, it, finalGain, affInfo.isPreferred);

  log(`将【${it.name}】×${qty} 赠予 ${npc.name}，好感 +${finalGain}。`, "c-pink");
  if (tierUp.leveledUp) {
    log(`【羁绊晋升】与 ${npc.name} 的好感关系提升至【Lv.${tierUp.newLevel} ${tierUp.newStage}】！`, "c-gold");
  }

  save(); render();

  const detailsList = [
    `赠出灵物：【${it.name}】 ×${qty}`,
    affInfo.isPreferred ? `<span style="color:#f2cf7e; font-weight:bold;">⭐ 投其所好（性格深度契合加成！）</span>` : '',
    `对方心声：<i>${quote}</i>`,
    `好感变化：+${finalGain}（${oldAff} ➔ ${npc.aff} / 100）`,
    `当前关系：<span class="tag lvl-${newRel.level}">${newRel.icon} Lv.${newRel.level} ${newRel.stage}</span>`
  ].filter(Boolean);

  if (tierUp.leveledUp) {
    detailsList.push(`<div style="margin-top:6px; padding:6px 10px; background:rgba(212,163,71,0.15); border:1px solid #d4af37; border-radius:4px; color:#f5e2b3;">
      ⭐ <b>关系突破至【Lv.${tierUp.newLevel} ${tierUp.newStage}】！</b><br>
      解锁特权：${tierUp.perkSummary}
    </div>`);
  }

  showActionModal("灵物馈赠 · " + npc.name, detailsList);
}

/* 兼容原有调用接口 */
function giveGift(id) {
  openGiftModal(id);
}

/* ============================================================
   4. 对练系统
   ============================================================ */
function doDuel() {
  if (S.actionsUsed >= ACTIONS_PER_SLOT) {
    log("本时段行动已用完。", "c-bad");
    return;
  }
  const cost = 50;
  if (!spendCurrency(cost)) {
    log(`${currencyName()}不足（需 ${cost}）。`, "c-bad");
    return;
  }

  const candidates = S.npcs.filter(n => n.alive
    && n.id !== S.master
    && (n.tier === "长老" || n.tier === "门内" || n.tier === "门外")
  );

  const master = S.master ? S.npcMap[S.master] : null;
  const list = master ? [master, ...candidates.slice(0, 3)] : candidates.slice(0, 4);

  if (list.length === 0) {
    log("没有合适的对练对象。", "c-bad");
    addCurrency(cost);
    return;
  }

  const html = list.map(n => {
    const realmText = n.realm === 0 ? "凡人" : `${REALMS[n.realm]?.name || '练气'}·${n.sub}重`;
    const rel = getNpcRelation(n.aff);
    return `<div class="card" style="margin-bottom:6px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <b>${n.name}</b> <span class="tag">${n.role}</span>
          <span class="tag lvl-${rel.level}">${rel.icon} Lv.${rel.level} ${rel.stage}</span>
        </div>
        <div class="small" style="color:var(--text-dim);">${realmText}　${n.tier}</div>
      </div>
      <div style="margin-top:4px; text-align:right;">
        <button onclick="startDuel('${n.id}')">选择对练</button>
      </div>
    </div>`;
  }).join("");

  showModal("对练基本功", `
    <p>花费 ${cost} ${currencyName()}，与人对练基本功。</p>
    ${html}
  `, [{ label: "取消", fn: () => { addCurrency(cost); closeModal(); } }]);
}

function startDuel(npcId) {
  const npc = S.npcMap[npcId];
  if (!npc) return;
  closeModal();
  S.actionsUsed++;

  const rel = getNpcRelation(npc.aff);
  const myBasics = ["剑", "刀", "拳", "掌", "棍", "鞭"].map(k => S.skills[k]?.lvl || 0);
  const myAvg = myBasics.reduce((a, b) => a + b, 0) / 6;
  const npcAvg = npc.realm * 2 + (npc.tier === "长老" ? 4 : 1);
  const diff = myAvg - npcAvg;
  const roll = rnd(0, 1) + diff * 0.1;

  let result, gain;
  if (roll > 0.7) { result = "胜"; gain = 1.5; }
  else if (roll > 0.4) { result = "平"; gain = 1.0; }
  else { result = "负"; gain = 0.5; }

  // Lv.2 特权：切磋心得 +15%
  if (rel.level >= 2) gain = +(gain * 1.15).toFixed(2);
  // Lv.4 特权：名师点拨几率翻倍
  if (rel.level >= 4 && chance(0.35)) gain = +(gain * 1.5).toFixed(2);

  const pickSkill = pick(["剑", "刀", "拳", "掌", "棍", "鞭"]);
  S.skills[pickSkill].exp = +(S.skills[pickSkill].exp + gain).toFixed(2);
  let leveled = false;
  while (S.skills[pickSkill].exp >= SKILL_LVL_EXP && S.skills[pickSkill].lvl < MAX_SKILL_LVL) {
    S.skills[pickSkill].exp -= SKILL_LVL_EXP;
    S.skills[pickSkill].lvl++;
    leveled = true;
  }
  npc.aff = Math.min(100, npc.aff + 1);
  S.metNpcs[npc.id] = true;

  log(`与 ${npc.name} 对练（${result}），${pickSkill} +${gain}。`, "c-gold");
  const detail = [
    `对手：${npc.name}`,
    `结果：${result}`,
    `${pickSkill} 熟练度 +${gain}${leveled ? ` (升级突破至 Lv.${S.skills[pickSkill].lvl}!)` : ""}`,
    `${npc.name} 好感 +1（当前：${npc.aff}/100）`
  ];

  consumeAction(() => showActionModal("对练结束", detail));
}

/* ============================================================
   5. 每日晨间仙友羁绊关怀特权 (Daily Morning Social Perks)
   ============================================================ */
function triggerDailySocialPerks() {
  if (!S || !S.npcs || !S.metNpcs) return;
  const friends = S.npcs.filter(n => n.alive && S.metNpcs[n.id]);
  if (!friends || friends.length === 0) return;

  for (const n of friends) {
    const rel = getNpcRelation(n.aff);
    if (rel.level >= 6 && chance(0.20)) {
      // 金兰道侣每日灵犀反哺
      const expGain = rndInt(20, 36);
      if (typeof gainCultivationExp === "function") gainCultivationExp(expGain);
      log(`【道侣灵犀】${n.name} 与你神识心意相通，清晨灵气反哺：修为经验 +${expGain}。`, "c-pink");
    } else if (rel.level >= 3 && chance(0.12)) {
      // 志同道合仙友回礼
      const giftItems = ["回血丹", "灵草", "泉水", "静心丹"];
      const gift = pick(giftItems);
      if (typeof addItem === "function") addItem(gift, 1);
      log(`【仙友关怀】清晨，同道仙友 ${n.name} 托杂役弟子送来【${gift}】一枚，道声早安安好。`, "c-gold");
    }
  }
}
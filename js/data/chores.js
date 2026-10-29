/* ============================================================
   data/chores.js - 杂务 / 杂役铺
   ============================================================ */

/* 杂务（杂务弟子） */
const CHORES_FAN = [
  { id: "tiao", name: "挑水", skill: "掌", baseTime: 60, gain: { 掌: 5.0 } },
  { id: "chai", name: "砍柴", skill: "刀", baseTime: 70, gain: { 刀: 5.0 } },
  { id: "cai",  name: "种菜", skill: "掌", baseTime: 50, gain: { 掌: 3.0, 炼丹: 3.0 } },
  { id: "ji",   name: "养鸡", skill: "兽", baseTime: 40, gain: { 兽: 5.0 } },
];

/* 杂务（门外弟子） */
const CHORES_MENWAI = [
  { id: "lingshou", name: "饲养灵兽", skill: "兽",   baseTime: 80, gain: { 兽: 10.0 } },
  { id: "lingyao",  name: "种灵药",   skill: "炼丹", baseTime: 70, gain: { 炼丹: 10.0 } },
  { id: "daqiao",   name: "打器",     skill: "炼器", baseTime: 90, gain: { 炼器: 10.0 } },
  { id: "cangjing", name: "打理藏经阁", skill: "符", baseTime: 60, gain: { 符: 7.0, 阵法: 5.0 } },
];

/* 杂务（门内弟子） */
const CHORES_MENNEI = [
  { id: "lianyao",  name: "炼药",     skill: "炼丹", baseTime: 100, gain: { 炼丹: 16.0 } },
  { id: "lianqi",   name: "炼器",     skill: "炼器", baseTime: 100, gain: { 炼器: 16.0 } },
  { id: "xunshou",  name: "训练灵兽", skill: "兽",   baseTime: 90,  gain: { 兽: 16.0 } },
  { id: "zhenfa",   name: "维护阵法", skill: "阵法", baseTime: 80,  gain: { 阵法: 16.0 } },
];

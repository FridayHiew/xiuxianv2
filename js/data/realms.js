
/* 天赋（决定最高境界，本版本最高上限至金丹初期） */

const APTITUDES = [
  { id: "fan",   name: "凡骨", maxRealm: 3, desc: "资质平庸，可至金丹初期。" },
  { id: "zhong", name: "中品", maxRealm: 3, desc: "资质尚可，可至金丹初期。" },
  { id: "shang", name: "上品", maxRealm: 3, desc: "资质上佳，可至金丹初期。" },
  { id: "tian",  name: "天灵", maxRealm: 3, desc: "天纵之资，可至金丹初期。" },
  { id: "xian",  name: "仙骨", maxRealm: 3, desc: "天生仙骨，可至金丹初期。" },
];

/* 灵根类型 */
const ROOT_TYPES = [
  { id: "jin",  name: "金" },
  { id: "mu",   name: "木" },
  { id: "shui", name: "水" },
  { id: "huo",  name: "火" },
  { id: "tu",   name: "土" },
  { id: "lei",  name: "雷" },
  { id: "bing", name: "冰" },
];


/* 境界（realm 索引：0=凡人, 1=炼气, 2=筑基, 3=金丹期） */
const REALMS = [
  { name: "凡人", life: 80 },
  { name: "炼气", life: 120 },
  { name: "筑基", life: 200 },
  { name: "金丹", life: 400 },
];
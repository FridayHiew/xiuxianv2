/* ============================================================
   core/state.js - 全局状态
   ============================================================ */

let S = null;

let currentTab = "cave";
let lastMainTab = "cave";       /* 记录进入全屏详情页前的主页 tab */
let currentBagTab = "丹药";
let currentBagFilter = "all";   /* 行囊5大分类: all, equip, pill, mat, special */
let currentSectTab = "简介";
let sectSubPanel = null;        /* 宗门建筑弹窗/子抽屉，null 为水墨山门全景 */
let caveSubPanel = null;        /* 洞府建筑子抽屉，null 为水墨洞府全景 */
let daySubPanel = null;         /* 日常子面板，null 为水墨城镇日常全景 */
let currentProfileTab = "角色信息";
let currentCGDTab = "心法";     /* 传功殿内部 tab */

let currentShopDay = 0;
let currentShopStock = [];
let currentCaveTab = "facility";

let pendingFight = null;

let morningPrompted = false;
let nightPrompted = false;
let hobbyPrompted = false;

let logBuffer = [];
let logUnread = 0;
let floatingLogMinimized = false;

let debugShowRoot = false;
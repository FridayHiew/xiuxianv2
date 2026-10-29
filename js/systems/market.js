/* ============================================================
   systems/market.js - 坊市逻辑
   ============================================================ */

/* 刷新拍卖行 */
function refreshAuctionStock() {
  const hasInvalidStock = !S.flags.auction
    || !Array.isArray(S.flags.auction.stock)
    || S.flags.auction.stock.length === 0
    || S.flags.auction.stock.some(g => !g || !g.itemId || g.itemId === "undefined" || g.itemId === "null");

  if (hasInvalidStock || S.flags.auction.refreshDay !== S.day) {
    S.flags.auction = {
      refreshDay: S.day,
      stock: generateAuctionStock(),
      bought: {},
    };
  }
}

/* 杂货铺购买 */
function buyMarketGood(itemId, price) {
  if (!itemId || itemId === "undefined") return;
  if (S.money < price) { log("铜钱不足。", "c-bad"); return; }
  S.money -= price;
  addItem(itemId, 1);
  const it = (typeof getItem === "function" ? getItem(itemId) : null) || ITEMS[itemId];
  const name = it ? it.name : itemId;
  log(`【坊市】购买 ${name}（${price} 铜钱）`, "c-gold");
  save(); render();
}

/* 拍卖行购买 */
function buyAuctionItem(index) {
  refreshAuctionStock();
  const item = S.flags.auction.stock[index];
  if (!item || !item.itemId || item.itemId === "undefined") return;
  if (S.flags.auction.bought[index]) { log("已购买。", "c-bad"); return; }
  if (S.stone < item.price) { log("灵石不足。", "c-bad"); return; }

  S.stone -= item.price;
  addItem(item.itemId, 1);
  S.flags.auction.bought[index] = true;
  const it = (typeof getItem === "function" ? getItem(item.itemId) : null) || ITEMS[item.itemId];
  const name = it ? it.name : item.itemId;
  log(`【拍卖行】拍下 ${name}（${item.price} 灵石）`, "c-gold");
  save(); render();
}

/* 卖东西（半价） */
function sellItemToMarket(itemId) {
  if (!hasItem(itemId)) return;
  const item = (typeof getItem === "function" ? getItem(itemId) : null) || ITEMS[itemId];
  if (!item) return;
  const price = Math.max(1, Math.floor((item.price || 10) / 2));
  removeItem(itemId, 1);
  S.money += price;
  log(`【坊市】卖出 ${item.name}（+${price} 铜钱）`, "c-gold");
  save(); render();
}
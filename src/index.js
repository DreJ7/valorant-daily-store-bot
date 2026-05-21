const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const STORE_PROVIDER = (process.env.STORE_PROVIDER || "henrik-featured").trim();
const HENRIK_API_KEY = process.env.HENRIK_API_KEY;
const CUSTOM_STORE_URL = process.env.CUSTOM_STORE_URL;
const CUSTOM_STORE_AUTH_HEADER = process.env.CUSTOM_STORE_AUTH_HEADER;
const CUSTOM_STORE_AUTH_VALUE = process.env.CUSTOM_STORE_AUTH_VALUE;

function assertRequired(name, value) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
}

function twNowString() {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());
}

async function fetchHenrikFeatured() {
  assertRequired("HENRIK_API_KEY", HENRIK_API_KEY);
  const res = await fetch("https://api.henrikdev.xyz/valorant/v2/store-featured", {
    headers: { Authorization: HENRIK_API_KEY }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Henrik API failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = await res.json();

  const featured = json?.data?.FeaturedBundle || json?.data?.featured_bundle || json?.data || {};
  const bundle =
    featured?.Bundle ||
    featured?.bundle ||
    featured?.FeaturedBundle ||
    featured?.featuredBundle ||
    {};

  const bundleName =
    bundle?.Name ||
    bundle?.name ||
    bundle?.DataAssetID ||
    bundle?.data_asset_id ||
    featured?.BundleName ||
    featured?.bundle_name ||
    "Unknown Bundle";

  const offers =
    bundle?.Items ||
    bundle?.items ||
    featured?.Items ||
    featured?.items ||
    json?.data?.items ||
    [];

  return {
    title: "VALORANT 每日商店更新（Featured）",
    subtitle: `Bundle: ${bundleName}`,
    offers: offers.map((x) => ({
      name:
        x?.Item?.Name ||
        x?.Item?.name ||
        x?.Item?.ItemID ||
        x?.Item?.item_id ||
        x?.name ||
        "Unknown Item",
      price:
        x?.DiscountedPrice ??
        x?.discounted_price ??
        x?.BasePrice ??
        x?.base_price ??
        x?.Price ??
        x?.price ??
        "?",
      discount: x?.DiscountPercent ?? x?.discount_percent ?? x?.discount ?? 0
    }))
  };
}

async function fetchCustomStore() {
  assertRequired("CUSTOM_STORE_URL", CUSTOM_STORE_URL);
  const headers = {};
  if (CUSTOM_STORE_AUTH_HEADER && CUSTOM_STORE_AUTH_VALUE) {
    headers[CUSTOM_STORE_AUTH_HEADER] = CUSTOM_STORE_AUTH_VALUE;
  }

  const res = await fetch(CUSTOM_STORE_URL, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CUSTOM_STORE_URL failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = await res.json();

  if (!Array.isArray(json?.offers)) {
    throw new Error("Custom store JSON must be: { title?, subtitle?, offers:[{name,price,discount?}] }");
  }

  return {
    title: json.title || "VALORANT 每日商店更新",
    subtitle: json.subtitle || "Custom Provider",
    offers: json.offers.map((x) => ({
      name: x.name || "Unknown Item",
      price: x.price ?? "?",
      discount: x.discount ?? 0
    }))
  };
}

async function getStoreData() {
  if (STORE_PROVIDER === "custom") {
    return fetchCustomStore();
  }

  return fetchHenrikFeatured();
}

function buildDiscordMessage(storeData) {
  const lines = [];
  lines.push(`**${storeData.title}**`);
  lines.push(storeData.subtitle);
  lines.push(`更新時間（台北）: ${twNowString()}`);
  lines.push("");

  if (!storeData.offers.length) {
    lines.push("今天沒有抓到商品資料。");
  } else {
    for (const [idx, offer] of storeData.offers.entries()) {
      lines.push(`${idx + 1}. ${offer.name} | 價格: ${offer.price} | 折扣: ${offer.discount}%`);
    }
  }

  lines.push("");
  lines.push("來源: 自動推播機器人");
  return lines.join("\n");
}

async function postToDiscord(content) {
  assertRequired("DISCORD_BOT_TOKEN", DISCORD_BOT_TOKEN);
  assertRequired("DISCORD_CHANNEL_ID", DISCORD_CHANNEL_ID);

  const url = `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord post failed (${res.status}): ${body.slice(0, 500)}`);
  }
}

async function main() {
  const storeData = await getStoreData();
  const content = buildDiscordMessage(storeData);
  await postToDiscord(content);
  console.log("Posted to Discord successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

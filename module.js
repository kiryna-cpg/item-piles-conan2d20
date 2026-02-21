/* Item Piles: Conan 2d20
 * Companion module for Robert E. Howard's Conan: Adventures in an Age Undreamed Of (Foundry system: conan2d20)
 */

console.log("Item Piles: Conan 2d20 | module.js loaded", { version: "0.0.7", time: Date.now() });

const MODULE_ID = "item-piles-conan2d20";

// Conan 2d20 item types (from system/template.json)
const CONAN_ITEM_TYPES = [
  "action",
  "archetype",
  "armor",
  "aspect",
  "caste",
  "display",
  "education",
  "enchantment",
  "homeland",
  "kit",
  "language",
  "miscellaneous",
  "nature",
  "npcaction",
  "npcattack",
  "spell",
  "story",
  "talent",
  "warstory",
  "weapon"
];

const DEFAULT_ALLOWED_TYPES = new Set(["weapon", "armor", "miscellaneous", "kit"]);

function hasSetting(key) {
  return game.settings?.settings?.has(`${MODULE_ID}.${key}`);
}

function getSettingSafe(key, fallback) {
  if (!hasSetting(key)) return fallback;
  return game.settings.get(MODULE_ID, key);
}

async function setSettingSafe(key, value) {
  if (!hasSetting(key)) return;
  await game.settings.set(MODULE_ID, key, value);
}

function getAllowedTypes() {
  const allowed = new Set(DEFAULT_ALLOWED_TYPES);
  if (getSettingSafe("allowSpellTrade", false)) allowed.add("spell");
  if (getSettingSafe("allowEnchantmentTrade", false)) allowed.add("enchantment");
  return allowed;
}

function buildItemFilterExclusions(allowedTypes) {
  // Item Piles' "Item Filters" setting is an exclusion list.
  // We enforce an allowlist by excluding every other Conan item type.
  return CONAN_ITEM_TYPES.filter((t) => !allowedTypes.has(t));
}

function buildItemFiltersSettingValue(excludedTypes) {
  // Item Piles 3.x expects filters as a comma-separated string.
  // cleanItemFilters() splits by comma and trims each entry.
  return [
    {
      path: "type",
      filters: excludedTypes.join(",")
    }
  ];
}

function recommendedItemPilesSettings() {
  const allowedTypes = getAllowedTypes();
  const excludedTypes = buildItemFilterExclusions(allowedTypes);

  return {
    // Actor type to use when Item Piles creates a default pile
    actorClassType: "npc",

    // Default item types used by Item Piles when categorizing items
    itemClassLootType: "miscellaneous",
    itemClassWeaponType: "weapon",
    itemClassEquipmentType: "armor",

    // Conan 2d20 "physical" items
    itemQuantityAttribute: "system.quantity",
    itemPriceAttribute: "system.cost",

    // Currency: Gold (stored as an object {min,max,value} in the system)
    currencies: [
      {
        type: "attribute",
        name: "Gold Pieces",
        primary: true,
        img: "icons/commodities/currency/coin-embossed-cobra-gold.webp",
        abbreviation: "{#}G",
        exchangeRate: 1,
        data: { path: "system.resources.gold.value" }
      }
    ],

    // Sorcery items (when enabled) should NEVER stack
    // (price must be set manually per-merchant item configuration)
    unstackableItemTypes: ["spell", "enchantment"],

    // Only allow a small set of item types to participate in pile/merchant/trade flows.
    // Item Piles expresses this as a blacklist.
    itemFilters: buildItemFiltersSettingValue(excludedTypes),

    // Avoid "merging" items by similarity across systems with complex data
    itemSimilarities: ["_id"]
  };
}

function normalizeFilterList(filtersString) {
  if (typeof filtersString !== "string") return [];
  return filtersString
    .split(",")
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length);
}

function hasGoldCurrency(currencies) {
  if (!Array.isArray(currencies)) return false;
  return currencies.some((c) => {
    return (
      c?.type === "attribute" &&
      c?.data?.path === "system.resources.gold.value"
    );
  });
}

function isRecommendedConfigApplied() {
  // Check a minimal set of "load-bearing" settings. If any are missing or mismatched,
  // we consider Item Piles not configured for Conan 2d20.
  try {
    if (!game.settings?.settings?.has("item-piles.actorClassType")) return false;

    const rec = recommendedItemPilesSettings();

    const actorOk = game.settings.get("item-piles", "actorClassType") === rec.actorClassType;
    const lootOk = game.settings.get("item-piles", "itemClassLootType") === rec.itemClassLootType;
    const weaponOk = game.settings.get("item-piles", "itemClassWeaponType") === rec.itemClassWeaponType;
    const equipOk = game.settings.get("item-piles", "itemClassEquipmentType") === rec.itemClassEquipmentType;

    const priceOk = game.settings.get("item-piles", "itemPriceAttribute") === rec.itemPriceAttribute;
    const qtyOk = game.settings.get("item-piles", "itemQuantityAttribute") === rec.itemQuantityAttribute;

    const currencies = game.settings.get("item-piles", "currencies") ?? [];
    const currencyOk = hasGoldCurrency(currencies);

    const filters = game.settings.get("item-piles", "itemFilters") ?? [];
    const expectedExcluded = new Set(normalizeFilterList(rec.itemFilters?.[0]?.filters));
    const filterEntry = Array.isArray(filters) ? filters.find((f) => f?.path === "type") : null;
    const currentExcluded = new Set(normalizeFilterList(filterEntry?.filters));

    const filtersOk =
      filterEntry?.path === "type" &&
      expectedExcluded.size > 0 &&
      expectedExcluded.size === currentExcluded.size &&
      [...expectedExcluded].every((t) => currentExcluded.has(t));

    return actorOk && lootOk && weaponOk && equipOk && priceOk && qtyOk && currencyOk && filtersOk;
  } catch (e) {
    return false;
  }
}


async function applyRecommendedSettings({ force = false } = {}) {
  if (game.system.id !== "conan2d20") return;

  // Only apply once unless forced.
  // However, if the setup flag is set but Item Piles is not actually configured as expected
  // (e.g. the user reset Item Piles settings manually), we will re-apply the recommended config.
  if (!force && getSettingSafe("setupDone", false)) {
    const ok = isRecommendedConfigApplied();
    if (ok) return;

    const msg =
      "Item Piles: Conan 2d20 | Detected Item Piles is not configured for Conan 2d20. Re-applying recommended defaults.";
    console.warn(msg);
    ui?.notifications?.warn("Item Piles: Conan 2d20 detected Item Piles is not configured correctly and re-applied the recommended defaults.");
  }

  const rec = recommendedItemPilesSettings();

  await game.settings.set("item-piles", "actorClassType", rec.actorClassType);
  await game.settings.set("item-piles", "itemClassLootType", rec.itemClassLootType);
  await game.settings.set("item-piles", "itemClassWeaponType", rec.itemClassWeaponType);
  await game.settings.set("item-piles", "itemClassEquipmentType", rec.itemClassEquipmentType);
  await game.settings.set("item-piles", "itemPriceAttribute", rec.itemPriceAttribute);
  await game.settings.set("item-piles", "itemQuantityAttribute", rec.itemQuantityAttribute);
  await game.settings.set("item-piles", "currencies", rec.currencies);
  await game.settings.set("item-piles", "unstackableItemTypes", rec.unstackableItemTypes);
  await game.settings.set("item-piles", "itemFilters", rec.itemFilters);
  await game.settings.set("item-piles", "itemSimilarities", rec.itemSimilarities);

  // Optional integration (non-critical)
  if (game.itempiles?.API?.addSystemIntegration) {
    try {
      game.itempiles.API.addSystemIntegration(
        {
          VERSION: "1.0.0",
          ACTOR_CLASS_TYPE: rec.actorClassType,
          ITEM_CLASS_LOOT_TYPE: rec.itemClassLootType,
          ITEM_CLASS_WEAPON_TYPE: rec.itemClassWeaponType,
          ITEM_CLASS_EQUIPMENT_TYPE: rec.itemClassEquipmentType,
          ITEM_PRICE_ATTRIBUTE: rec.itemPriceAttribute,
          ITEM_QUANTITY_ATTRIBUTE: rec.itemQuantityAttribute,
          ITEM_FILTERS: rec.itemFilters,
          ITEM_SIMILARITIES: rec.itemSimilarities,
          CURRENCIES: rec.currencies,
          UNSTACKABLE_ITEM_TYPES: rec.unstackableItemTypes
        },
        "latest"
      );
    } catch (e) {
      console.warn("Item Piles: Conan 2d20 | addSystemIntegration failed (non-critical):", e);
    }
  }

  await setSettingSafe("setupDone", true);
}

async function applyTypeFiltersOnly() {
  if (game.system.id !== "conan2d20") return;
  if (!game.settings?.settings?.has("item-piles.itemFilters")) return;

  const allowedTypes = getAllowedTypes();
  const excludedTypes = buildItemFilterExclusions(allowedTypes);

  await game.settings.set("item-piles", "itemFilters", buildItemFiltersSettingValue(excludedTypes));

  // Ensure sorcery items never stack if enabled
  const unstackable = new Set(game.settings.get("item-piles", "unstackableItemTypes") ?? []);
  unstackable.add("spell");
  unstackable.add("enchantment");
  await game.settings.set("item-piles", "unstackableItemTypes", Array.from(unstackable));
}

Hooks.once("init", () => {
  try {
    console.log("Item Piles: Conan 2d20 | init START");

    // Hidden flag to avoid overwriting manual Item Piles settings after first setup
    game.settings.register(MODULE_ID, "setupDone", {
      name: "Setup applied",
      hint: "Internal flag to prevent overwriting manual Item Piles settings after the initial setup.",
      scope: "world",
      config: false,
      type: Boolean,
      default: false
    });

    // Sorcery trade controls (disabled by default)
    // These are NOT stackable, and must be priced manually per merchant item configuration.
    game.settings.register(MODULE_ID, "allowSpellTrade", {
      name: "Allow trading Spells (Sorcery)",
      hint:
        "If enabled, Spell items can be used in Item Piles trade/merchant flows. " +
        "Spells are treated as non-stackable, and you must set their prices manually in the merchant item configuration.",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: () => applyTypeFiltersOnly()
    });

    game.settings.register(MODULE_ID, "allowEnchantmentTrade", {
      name: "Allow trading Enchantments (Alchemy)",
      hint:
        "If enabled, Enchantment items can be used in Item Piles trade/merchant flows. " +
        "Enchantments are treated as non-stackable, and you must set their prices manually in the merchant item configuration.",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: () => applyTypeFiltersOnly()
    });

    // World Settings -> Menu
    game.settings.registerMenu(MODULE_ID, "resetRecommended", {
      name: "Reset recommended settings",
      hint: "Re-apply the recommended Item Piles configuration for Conan 2d20.",
      label: "Open Reset Configuration",
      icon: "fas fa-rotate-left",
      restricted: true,
      type: class ResetMenu extends foundry.applications.api.ApplicationV2 {
        async render() {
          const allowSpell = game.settings.get(MODULE_ID, "allowSpellTrade");
          const allowEnchantment = game.settings.get(MODULE_ID, "allowEnchantmentTrade");
          const allowAnyMagic = allowSpell || allowEnchantment;
          const html =
            `<p>This will re-apply the recommended Item Piles settings for Conan 2d20 (currency, item attributes, and pile actor type).</p>` +
            `<p><strong>Note:</strong> This overwrites your current Item Piles settings.</p>` +
            (allowAnyMagic
              ? `<p><em>Sorcery trade is enabled.</em> Spells/Enchantments are intended to be priced manually per merchant item configuration and will never stack.</p>`
              : "");

          new Dialog({
            title: "Item Piles: Conan 2d20 | Reset configuration",
            content: html,
            buttons: {
              cancel: { label: "Cancel" },
              reset: {
                label: "Reset",
                callback: async () => {
                  await applyRecommendedSettings({ force: true });
                  ui.notifications.info("Item Piles: Conan 2d20 | Recommended configuration has been re-applied.");
                }
              }
            },
            default: "cancel"
          }).render(true);

          // Do not render an app window
          return this.close();
        }
      }
    });

    console.log("Item Piles: Conan 2d20 | init END");
  } catch (e) {
    console.error("Item Piles: Conan 2d20 | init FAILED", e);
  }
});

// One-time setup after everything is ready
Hooks.once("ready", async () => {
  await applyRecommendedSettings({ force: false });
  console.log("Item Piles: Conan 2d20 | ready");
});

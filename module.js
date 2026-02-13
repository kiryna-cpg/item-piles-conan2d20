/* Item Piles: Conan 2d20
 * Companion module for Robert E. Howard's Conan: Adventures in an Age Undreamed Of (Foundry system: conan2d20)
 *
 * Goals (v0.x):
 * - Apply a sensible, Conan-specific Item Piles configuration (once per world, unless reset).
 * - Provide a World Settings menu to re-apply the recommended configuration.
 * - Provide a toggle to allow trading "magic" items (spell/enchantment) later (handled in future versions).
 */

console.log("Item Piles: Conan 2d20 | module.js loaded", { version: "0.0.6", time: Date.now() });

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

async function applyRecommendedSettings({ force = false } = {}) {
  if (game.system.id !== "conan2d20") return;

  // Only apply once unless forced
  if (!force && getSettingSafe("setupDone", false)) return;

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

/**
 * On worlds where Item Piles is freshly installed/enabled as a dependency, there are edge-cases
 * where this companion's `ready` hook can run before Item Piles has registered all of its settings.
 * In that situation, applying configuration is a no-op and the user has to click Reset manually.
 *
 * This helper waits briefly until the core Item Piles settings exist before applying.
 */
async function waitForItemPilesSettings({ timeoutMs = 8000 } = {}) {
  const required = [
    "item-piles.actorClassType",
    "item-piles.itemPriceAttribute",
    "item-piles.itemQuantityAttribute",
    "item-piles.currencies",
    "item-piles.itemFilters"
  ];

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = required.every((k) => game.settings?.settings?.has(k));
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 250));
  }

  console.warn(
    "Item Piles: Conan 2d20 | Timed out waiting for Item Piles settings. Recommended setup may require manual reset."
  );
  return false;
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
  // Make sure Item Piles has registered its settings before applying.
  await waitForItemPilesSettings();
  await applyRecommendedSettings({ force: false });
  console.log("Item Piles: Conan 2d20 | ready");
});

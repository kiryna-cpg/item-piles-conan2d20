/* Item Piles: Conan 2d20
 * Companion module for Robert E. Howard's Conan: Adventures in an Age Undreamed Of (Foundry system: conan2d20)
 */

const MODULE_ID = "item-piles-conan2d20";
const MODULE_VERSION = "0.0.8";
const SYSTEM_ID = "conan2d20";
const ITEM_PILES_MODULE_ID = "item-piles";

const SETTING_KEYS = Object.freeze({
  SETUP_DONE: "setupDone",
  ALLOW_SPELL_TRADE: "allowSpellTrade",
  ALLOW_ENCHANTMENT_TRADE: "allowEnchantmentTrade"
});

// Conan 2d20 item types from system/template.json.
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

function localize(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}

function format(key, data = {}) {
  return game.i18n.format(`${MODULE_ID}.${key}`, data);
}

function isConanWorld() {
  return game.system?.id === SYSTEM_ID;
}

function isItemPilesActive() {
  return game.modules.get(ITEM_PILES_MODULE_ID)?.active === true;
}

function hasSetting(moduleId, key) {
  return game.settings?.settings?.has(`${moduleId}.${key}`) === true;
}

function getSettingSafe(moduleId, key, fallback) {
  if (!hasSetting(moduleId, key)) return fallback;
  return game.settings.get(moduleId, key);
}

async function setSettingIfExists(moduleId, key, value) {
  if (!hasSetting(moduleId, key)) return false;
  await game.settings.set(moduleId, key, value);
  return true;
}

function getAllowedTypes() {
  const allowed = new Set(DEFAULT_ALLOWED_TYPES);
  if (getSettingSafe(MODULE_ID, SETTING_KEYS.ALLOW_SPELL_TRADE, false)) allowed.add("spell");
  if (getSettingSafe(MODULE_ID, SETTING_KEYS.ALLOW_ENCHANTMENT_TRADE, false)) allowed.add("enchantment");
  return allowed;
}

function buildItemFilterExclusions(allowedTypes) {
  // Item Piles' "Item Filters" setting is an exclusion list.
  // We enforce an allowlist by excluding every other Conan item type.
  return CONAN_ITEM_TYPES.filter((type) => !allowedTypes.has(type));
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
    // Actor type to use when Item Piles creates a default pile.
    actorClassType: "npc",

    // Default item types used by Item Piles when categorizing items.
    itemClassLootType: "miscellaneous",
    itemClassWeaponType: "weapon",
    itemClassEquipmentType: "armor",

    // Conan 2d20 physical items.
    itemQuantityAttribute: "system.quantity",
    itemPriceAttribute: "system.cost",

    // Currency: Gold, stored as an actor attribute on Conan 2d20 characters.
    currencies: [
      {
        type: "attribute",
        name: `${MODULE_ID}.Currency.GoldPieces`,
        primary: true,
        img: "icons/commodities/currency/coin-embossed-cobra-gold.webp",
        abbreviation: "{#}G",
        exchangeRate: 1,
        data: { path: "system.resources.gold.value" }
      }
    ],

    // Sorcery items, when enabled, should never stack.
    // Their prices should be set manually per merchant item configuration.
    unstackableItemTypes: ["spell", "enchantment"],

    // Only allow a small set of item types to participate in pile/merchant/trade flows.
    // Item Piles expresses this as a blacklist.
    itemFilters: buildItemFiltersSettingValue(excludedTypes),

    // Avoid merging items by similarity across systems with complex data.
    itemSimilarities: ["_id"]
  };
}

function normalizeFilterList(filtersString) {
  if (Array.isArray(filtersString)) return filtersString.map((s) => String(s).trim()).filter(Boolean);
  if (typeof filtersString !== "string") return [];
  return filtersString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function setsAreEqual(a, b) {
  if (a.size !== b.size) return false;
  return [...a].every((value) => b.has(value));
}

function arraysAreEqualAsSets(a, b) {
  return setsAreEqual(new Set(a ?? []), new Set(b ?? []));
}

function hasGoldCurrency(currencies) {
  if (!Array.isArray(currencies)) return false;
  return currencies.some((currency) => {
    return (
      currency?.type === "attribute" &&
      currency?.primary === true &&
      currency?.data?.path === "system.resources.gold.value"
    );
  });
}

function areRequiredItemPilesSettingsRegistered() {
  return [
    "actorClassType",
    "itemClassLootType",
    "itemClassWeaponType",
    "itemClassEquipmentType",
    "itemPriceAttribute",
    "itemQuantityAttribute",
    "currencies",
    "unstackableItemTypes",
    "itemFilters",
    "itemSimilarities"
  ].every((key) => hasSetting(ITEM_PILES_MODULE_ID, key));
}

function isRecommendedConfigApplied() {
  // Check the load-bearing settings. If any are missing or mismatched,
  // Item Piles is not configured for Conan 2d20.
  try {
    if (!areRequiredItemPilesSettingsRegistered()) return false;

    const rec = recommendedItemPilesSettings();

    const actorOk = game.settings.get(ITEM_PILES_MODULE_ID, "actorClassType") === rec.actorClassType;
    const lootOk = game.settings.get(ITEM_PILES_MODULE_ID, "itemClassLootType") === rec.itemClassLootType;
    const weaponOk = game.settings.get(ITEM_PILES_MODULE_ID, "itemClassWeaponType") === rec.itemClassWeaponType;
    const equipOk = game.settings.get(ITEM_PILES_MODULE_ID, "itemClassEquipmentType") === rec.itemClassEquipmentType;

    const priceOk = game.settings.get(ITEM_PILES_MODULE_ID, "itemPriceAttribute") === rec.itemPriceAttribute;
    const qtyOk = game.settings.get(ITEM_PILES_MODULE_ID, "itemQuantityAttribute") === rec.itemQuantityAttribute;

    const currencies = game.settings.get(ITEM_PILES_MODULE_ID, "currencies") ?? [];
    const currencyOk = hasGoldCurrency(currencies);

    const filters = game.settings.get(ITEM_PILES_MODULE_ID, "itemFilters") ?? [];
    const expectedExcluded = new Set(normalizeFilterList(rec.itemFilters?.[0]?.filters));
    const filterEntry = Array.isArray(filters) ? filters.find((filter) => filter?.path === "type") : null;
    const currentExcluded = new Set(normalizeFilterList(filterEntry?.filters));
    const filtersOk = filterEntry?.path === "type" && expectedExcluded.size > 0 && setsAreEqual(expectedExcluded, currentExcluded);

    const unstackable = game.settings.get(ITEM_PILES_MODULE_ID, "unstackableItemTypes") ?? [];
    const unstackableOk = arraysAreEqualAsSets(unstackable, rec.unstackableItemTypes);

    const similarities = game.settings.get(ITEM_PILES_MODULE_ID, "itemSimilarities") ?? [];
    const similaritiesOk = arraysAreEqualAsSets(similarities, rec.itemSimilarities);

    return actorOk && lootOk && weaponOk && equipOk && priceOk && qtyOk && currencyOk && filtersOk && unstackableOk && similaritiesOk;
  } catch (error) {
    console.warn("Item Piles: Conan 2d20 | Failed to check recommended configuration", error);
    return false;
  }
}

function registerItemPilesSystemIntegration(rec) {
  if (!game.itempiles?.API?.addSystemIntegration) return;

  try {
    game.itempiles.API.addSystemIntegration(
      {
        VERSION: MODULE_VERSION,
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
  } catch (error) {
    console.warn("Item Piles: Conan 2d20 | addSystemIntegration failed (non-critical)", error);
  }
}

async function applyRecommendedSettings({ force = false } = {}) {
  if (!isConanWorld()) return false;
  if (!game.user?.isGM) return false;

  if (!isItemPilesActive() || !areRequiredItemPilesSettingsRegistered()) {
    ui.notifications?.warn(localize("Notification.ItemPilesNotReady"));
    return false;
  }

  // Only apply once unless forced. However, if the setup flag is set but Item Piles is not
  // actually configured as expected (for example, after a manual reset), re-apply defaults.
  if (!force && getSettingSafe(MODULE_ID, SETTING_KEYS.SETUP_DONE, false)) {
    const ok = isRecommendedConfigApplied();
    if (ok) return false;

    console.warn("Item Piles: Conan 2d20 | Detected Item Piles is not configured for Conan 2d20. Re-applying recommended defaults.");
    ui.notifications?.warn(localize("Notification.ConfigMismatchReapplied"));
  }

  const rec = recommendedItemPilesSettings();
  registerItemPilesSystemIntegration(rec);

  await setSettingIfExists(ITEM_PILES_MODULE_ID, "actorClassType", rec.actorClassType);
  await setSettingIfExists(ITEM_PILES_MODULE_ID, "itemClassLootType", rec.itemClassLootType);
  await setSettingIfExists(ITEM_PILES_MODULE_ID, "itemClassWeaponType", rec.itemClassWeaponType);
  await setSettingIfExists(ITEM_PILES_MODULE_ID, "itemClassEquipmentType", rec.itemClassEquipmentType);
  await setSettingIfExists(ITEM_PILES_MODULE_ID, "itemPriceAttribute", rec.itemPriceAttribute);
  await setSettingIfExists(ITEM_PILES_MODULE_ID, "itemQuantityAttribute", rec.itemQuantityAttribute);
  await setSettingIfExists(ITEM_PILES_MODULE_ID, "currencies", rec.currencies);
  await setSettingIfExists(ITEM_PILES_MODULE_ID, "unstackableItemTypes", rec.unstackableItemTypes);
  await setSettingIfExists(ITEM_PILES_MODULE_ID, "itemFilters", rec.itemFilters);
  await setSettingIfExists(ITEM_PILES_MODULE_ID, "itemSimilarities", rec.itemSimilarities);

  await setSettingIfExists(MODULE_ID, SETTING_KEYS.SETUP_DONE, true);
  return true;
}

async function applyTypeFiltersOnly() {
  if (!isConanWorld()) return;
  if (!game.user?.isGM) return;
  if (!hasSetting(ITEM_PILES_MODULE_ID, "itemFilters")) return;

  const allowedTypes = getAllowedTypes();
  const excludedTypes = buildItemFilterExclusions(allowedTypes);

  await game.settings.set(ITEM_PILES_MODULE_ID, "itemFilters", buildItemFiltersSettingValue(excludedTypes));

  // Ensure sorcery items never stack if enabled.
  if (hasSetting(ITEM_PILES_MODULE_ID, "unstackableItemTypes")) {
    const unstackable = new Set(game.settings.get(ITEM_PILES_MODULE_ID, "unstackableItemTypes") ?? []);
    unstackable.add("spell");
    unstackable.add("enchantment");
    await game.settings.set(ITEM_PILES_MODULE_ID, "unstackableItemTypes", Array.from(unstackable));
  }
}

class ResetRecommendedSettingsDialog extends foundry.applications.api.DialogV2 {
  constructor(options = {}) {
    const allowSpell = getSettingSafe(MODULE_ID, SETTING_KEYS.ALLOW_SPELL_TRADE, false);
    const allowEnchantment = getSettingSafe(MODULE_ID, SETTING_KEYS.ALLOW_ENCHANTMENT_TRADE, false);
    const allowAnyMagic = allowSpell || allowEnchantment;

    super({
      window: {
        title: localize("ResetDialog.Title")
      },
      content: `
        <form class="item-piles-conan2d20-reset-dialog">
          <p>${localize("ResetDialog.Content")}</p>
          <p><strong>${localize("ResetDialog.Warning")}</strong></p>
          ${allowAnyMagic ? `<p><em>${localize("ResetDialog.SorceryEnabled")}</em></p>` : ""}
        </form>
      `,
      modal: true,
      buttons: [
        {
          action: "reset",
          label: localize("ResetDialog.Reset"),
          icon: "fa-solid fa-rotate-left",
          default: true,
          callback: () => true
        },
        {
          action: "cancel",
          label: localize("ResetDialog.Cancel"),
          icon: "fa-solid fa-xmark"
        }
      ],
      submit: async (result) => {
        if (!result) return;
        const applied = await applyRecommendedSettings({ force: true });
        if (applied) ui.notifications?.info(localize("Notification.ResetComplete"));
      },
      ...options
    });
  }
}

Hooks.once("init", () => {
  try {
    console.log(`Item Piles: Conan 2d20 | Initializing v${MODULE_VERSION}`);

    // Hidden flag to avoid overwriting manual Item Piles settings after first setup.
    game.settings.register(MODULE_ID, SETTING_KEYS.SETUP_DONE, {
      name: `${MODULE_ID}.Setting.SetupDone.Name`,
      hint: `${MODULE_ID}.Setting.SetupDone.Hint`,
      scope: "world",
      config: false,
      type: Boolean,
      default: false
    });

    // Sorcery trade controls are disabled by default.
    // These are not stackable and must be priced manually per merchant item configuration.
    game.settings.register(MODULE_ID, SETTING_KEYS.ALLOW_SPELL_TRADE, {
      name: `${MODULE_ID}.Setting.AllowSpellTrade.Name`,
      hint: `${MODULE_ID}.Setting.AllowSpellTrade.Hint`,
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: () => applyTypeFiltersOnly()
    });

    game.settings.register(MODULE_ID, SETTING_KEYS.ALLOW_ENCHANTMENT_TRADE, {
      name: `${MODULE_ID}.Setting.AllowEnchantmentTrade.Name`,
      hint: `${MODULE_ID}.Setting.AllowEnchantmentTrade.Hint`,
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: () => applyTypeFiltersOnly()
    });

    game.settings.registerMenu(MODULE_ID, "resetRecommended", {
      name: `${MODULE_ID}.Menu.ResetRecommended.Name`,
      hint: `${MODULE_ID}.Menu.ResetRecommended.Hint`,
      label: `${MODULE_ID}.Menu.ResetRecommended.Label`,
      icon: "fa-solid fa-rotate-left",
      restricted: true,
      type: ResetRecommendedSettingsDialog
    });
  } catch (error) {
    console.error("Item Piles: Conan 2d20 | init failed", error);
  }
});

Hooks.once("ready", async () => {
  try {
    await applyRecommendedSettings({ force: false });
    console.log("Item Piles: Conan 2d20 | ready");
  } catch (error) {
    console.error("Item Piles: Conan 2d20 | ready setup failed", error);
    if (game.user?.isGM) ui.notifications?.error(format("Notification.SetupFailed", { version: MODULE_VERSION }));
  }
});

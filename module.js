/**
 * Conan 2d20 - Reach Status
 * Foundry VTT module for the Conan 2d20 system.
 */

const MODULE_ID = "conan2d20-reach-status";
const MAX_REACH = 3;

// Status IDs
const NO_REACH_ID = "conan-no-reach";
const REACH_IDS = Array.from({ length: MAX_REACH }, (_, i) => `conan-reach-${i + 1}`);
const ALL_STATUS_IDS = [NO_REACH_ID, ...REACH_IDS];

// Manual override flags (stored on Actor for linked actors, or on TokenDocument for unlinked/synthetic actors)
const FLAG_MANUAL_STATUS = "manualStatusId";
const FLAG_MANUAL_MARKER = "manualSetViaHud";

let _enforcingExclusivity = false;

// Per-actor debouncers (keyed by actor.uuid)
const _debouncers = new Map();

const MODULE_PATH = new URL(".", import.meta.url).pathname
  .replace(/^\/+/, "")
  .replace(/\/$/, "");

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function isAuthoritativeForActor(actor) {
  if (game.user.isGM) return true;
  const anyActiveGM = game.users?.some(u => u.active && u.isGM);
  if (anyActiveGM) return false;

  return actor?.isOwner === true;
}

function rerenderTokenHUD() {
  try {
    const hud = canvas?.hud?.token;
    if (hud?.rendered) hud.render();
  } catch (_) { /* no-op */ }
}

function buildStatusEffects() {
  const reachStatuses = Array.from({ length: MAX_REACH }, (_, i) => {
    const n = i + 1;
    return {
      id: `conan-reach-${n}`,
      name: `Reach ${n}`,
      label: `Reach ${n}`,
      img: `${MODULE_PATH}/icons/reach-${n}.webp`,
      hud: true
    };
  });

  const noReachStatus = {
    id: NO_REACH_ID,
    name: "No Reach",
    label: "No Reach",
    img: `${MODULE_PATH}/icons/no-reach.webp`,
    hud: true
  };

  return [...reachStatuses, noReachStatus];
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "showReach1", {
    name: "Show Reach 1 Icon",
    hint: "If disabled, Reach 1 will not be applied automatically (reduces on-screen clutter).",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      if (!canvas?.ready) return;
      for (const token of canvas.tokens.placeables) {
        const actor = token.actor;
        if (actor && isAuthoritativeForActor(actor)) scheduleReach(actor, { immediate: true });
      }
    }
  });

  const effects = buildStatusEffects();
  const existingIds = new Set((CONFIG.statusEffects ?? []).map(e => e.id));
  CONFIG.statusEffects = (CONFIG.statusEffects ?? []).concat(
    effects.filter(e => !existingIds.has(e.id))
  );
});

function effectHasStatus(effect, statusId) {
  const statuses = effect?.statuses ?? effect?._source?.statuses;
  if (!statuses) return false;
  if (statuses instanceof Set) return statuses.has(statusId);
  if (Array.isArray(statuses)) return statuses.includes(statusId);
  return false;
}

function actorHasStatus(actor, statusId) {
  return actor.effects.some(e => !e.disabled && effectHasStatus(e, statusId));
}

async function applyExclusiveStatus(actor, activeId) {
  if (!actor) return;

  _enforcingExclusivity = true;
  try {
    for (const id of ALL_STATUS_IDS) {
      await actor.toggleStatusEffect(id, { active: id === activeId });
    }
  } finally {
    _enforcingExclusivity = false;
  }

  rerenderTokenHUD();
}

function getFlagDocument(actor) {
  if (actor?.isToken && actor?.token?.document) return actor.token.document;
  return actor;
}

function getManualFlags(actor) {
  const doc = getFlagDocument(actor);
  return {
    manualId: doc?.getFlag(MODULE_ID, FLAG_MANUAL_STATUS),
    marker: doc?.getFlag(MODULE_ID, FLAG_MANUAL_MARKER)
  };
}

async function setManualFlags(actor, manualId) {
  const doc = getFlagDocument(actor);
  await doc.update({
    [`flags.${MODULE_ID}.${FLAG_MANUAL_STATUS}`]: manualId,
    [`flags.${MODULE_ID}.${FLAG_MANUAL_MARKER}`]: true
  });
}

async function clearManualFlags(actor) {
  const doc = getFlagDocument(actor);
  await doc.update({
    [`flags.${MODULE_ID}.${FLAG_MANUAL_STATUS}`]: null,
    [`flags.${MODULE_ID}.${FLAG_MANUAL_MARKER}`]: null
  });
}

function isEquippedWeapon(item) {
  if (item.type !== "weapon") return false;
  const equipped =
    item.system?.equipped ??
    item.system?.isEquipped ??
    item.system?.equippedWeapon;
  return equipped === true;
}

function getPcReach(actor) {
  const weapons = actor.items.filter(isEquippedWeapon);
  if (!weapons.length) return 0;
  return Math.max(...weapons.map(w => Number(w.system?.range ?? 0) || 0), 0);
}

function getNpcReach(actor) {
  const allowedTypes = new Set(["npcattack", "weapon"]);
  const candidates = actor.items.filter(i => allowedTypes.has(i.type));
  if (!candidates.length) return 0;
  const reaches = candidates
    .map(i => Number(i.system?.range ?? 0) || 0)
    .filter(n => n > 0);
  return reaches.length ? Math.max(...reaches) : 0;
}

async function redrawActorTokenEffects(actor) {
  if (!canvas?.ready || typeof actor.getActiveTokens !== "function") return;
  for (const token of actor.getActiveTokens()) await token.drawEffects();
}

async function reconcileManualOverride(actor) {
  if (actor.type !== "npc") return;
  const { manualId, marker } = getManualFlags(actor);
  if (marker !== true || !manualId) return;
  if (!ALL_STATUS_IDS.includes(manualId) || !actorHasStatus(actor, manualId)) {
    await clearManualFlags(actor);
  }
}

async function setReachStatus(actor) {
  if (!actor || !isAuthoritativeForActor(actor)) return;

  if (actor.type === "npc") await reconcileManualOverride(actor);
  if (actorHasStatus(actor, NO_REACH_ID)) {
    await applyExclusiveStatus(actor, NO_REACH_ID);
    await redrawActorTokenEffects(actor);
    return;
  }

  const showReach1 = game.settings.get(MODULE_ID, "showReach1");
  if (actor.type === "npc") {
    const { manualId, marker } = getManualFlags(actor);
    if (marker === true && manualId && ALL_STATUS_IDS.includes(manualId)) {
      await applyExclusiveStatus(actor, manualId);
      await redrawActorTokenEffects(actor);
      return;
    }
  }

  // Automatic computation
  const reachValue = (actor.type === "npc") ? getNpcReach(actor) : getPcReach(actor);
  const reach = clampNumber(reachValue, 0, MAX_REACH);

  let targetId = null;
  if (reach === 1 && showReach1) targetId = "conan-reach-1";
  else if (reach >= 2) targetId = `conan-reach-${reach}`;
  else targetId = null;

  await applyExclusiveStatus(actor, targetId);
  await redrawActorTokenEffects(actor);
}
/** Schedule a Reach recomputation for an Actor. */
function scheduleReach(actor, { immediate = false } = {}) {
  if (!actor) return;
  const key = actor.uuid ?? actor.id ?? actor._id;
  if (!key) return;

  if (immediate) {
    setReachStatus(actor);
    return;
  }

  if (!_debouncers.has(key)) {
    _debouncers.set(key, foundry.utils.debounce(() => setReachStatus(actor), 100));
  }
  _debouncers.get(key)();
}

function shouldRecomputeForItem(item) {
  return item?.type === "weapon" || item?.type === "npcattack";
}

Hooks.on("updateItem", (item) => {
  const actor = item.parent;
  if (actor && shouldRecomputeForItem(item)) scheduleReach(actor);
});
Hooks.on("createItem", (item) => {
  const actor = item.parent;
  if (actor && shouldRecomputeForItem(item)) scheduleReach(actor);
});
Hooks.on("deleteItem", (item) => {
  const actor = item.parent;
  if (actor && shouldRecomputeForItem(item)) scheduleReach(actor);
});

Hooks.on("createToken", (tokenDoc) => {
  const actor = tokenDoc?.actor;
  if (actor) scheduleReach(actor);
});
Hooks.on("updateToken", (tokenDoc) => {
  const actor = tokenDoc?.actor;
  if (actor) scheduleReach(actor);
});

Hooks.on("renderTokenHUD", (hud, html) => {
  const actor = hud?.object?.actor;
  if (!actor) return;

  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;

  const allowReachHud = game.user.isGM && actor.type === "npc";

  if (!allowReachHud) {
    for (const id of REACH_IDS) {
      root.querySelectorAll(`[data-status-id="${id}"]`).forEach(el => el.remove());
    }
    return;
  }

  root.querySelectorAll(`[data-status-id]`).forEach(el => {
    const statusId = el.getAttribute("data-status-id");
    if (!ALL_STATUS_IDS.includes(statusId)) return;

    if (el.dataset.reachBound === "1") return;
    el.dataset.reachBound = "1";

    el.addEventListener("click", async (ev) => {
      try {
        ev.preventDefault();
        ev.stopPropagation();
        if (_enforcingExclusivity) return;
        if (!isAuthoritativeForActor(actor)) return;

        const currentlyActive = actorHasStatus(actor, statusId);

        if (currentlyActive) {
          await applyExclusiveStatus(actor, null);
          await clearManualFlags(actor);
          await redrawActorTokenEffects(actor);
          scheduleReach(actor);
          return;
        }

        await applyExclusiveStatus(actor, statusId);

        if (statusId !== NO_REACH_ID) await setManualFlags(actor, statusId);
        else await clearManualFlags(actor);

        await redrawActorTokenEffects(actor);
      } catch (err) {
        console.error(`${MODULE_ID} | HUD click handler error`, err);
      }
    }, { capture: true });
  });
});

Hooks.on("createActiveEffect", (effect) => {
  if (_enforcingExclusivity) return;

  const actor = effect.parent;
  if (!actor || actor.documentName !== "Actor") return;
  if (!isAuthoritativeForActor(actor)) return;

  const addedId = ALL_STATUS_IDS.find(id => effectHasStatus(effect, id));
  if (!addedId) return;

  // Re-evaluate immediately so that enabling "No Reach" removes any Reach status,
  // and enabling Reach statuses respects module rules.
  scheduleReach(actor, { immediate: true });
});

Hooks.on("deleteActiveEffect", async (effect) => {
  if (_enforcingExclusivity) return;

  const actor = effect.parent;
  if (!actor || actor.documentName !== "Actor") return;
  if (!isAuthoritativeForActor(actor)) return;

  const removedId = ALL_STATUS_IDS.find(id => effectHasStatus(effect, id));
  if (!removedId) return;

  // If an NPC manual override effect was removed outside the HUD, clear the stored override.
  if (actor.type === "npc") {
    const { manualId, marker } = getManualFlags(actor);
    if (marker === true && manualId === removedId) {
      await clearManualFlags(actor);
    }
  }

  // Re-evaluate immediately so that disabling "No Reach" restores automatic Reach.
  scheduleReach(actor, { immediate: true });
});

Hooks.on("canvasReady", () => {
  for (const token of canvas.tokens.placeables) {
    const actor = token.actor;
    if (actor) scheduleReach(actor);
  }
});

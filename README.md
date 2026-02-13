# Item Piles: Conan 2d20

Item Piles companion module for the Foundry VTT system **“Robert E. Howard’s Conan: Adventures in an Age Undreamed Of”**.

This module applies a set of recommended Item Piles settings tailored for Conan 2d20 (gold stored on actors as `system.resources.gold.value`, item prices in `system.cost`, and strict filtering so merchants only deal in actual trade goods).

---

## Features

- Auto-configures Item Piles for Conan 2d20 (one-time setup)
- Configures **Gold Pieces** as an attribute currency (`system.resources.gold.value`)
- Uses item price attribute: `system.cost`
- Uses item quantity attribute: `system.quantity`
- Enforces a tradable item allowlist:
  - `weapon`, `armor`, `miscellaneous`, `kit`
- Optional Sorcery trade (Module Settings):
  - Allow **Spells** (`spell`)
  - Allow **Enchantments** (`enchantment`)
- Adds a World Settings button to **Reset Recommended Settings**
- Avoids overwriting manual settings after initial setup (unless you use Reset)

---

## Requirements

- Foundry VTT: v13
- System: Robert E. Howard’s Conan 2d20 (**tested with 2.4.3**)
- Module: Item Piles (**tested with 3.2.31**)

---

## Installation

### Install via Manifest URL (recommended)

1. Foundry → **Add-on Modules** → **Install Module**
2. Paste this Manifest URL:

```txt
https://raw.githubusercontent.com/kiryna-cpg/item-piles-conan2d20/main/module.json
```

3. Install, then enable it in your world:
   - **World → Manage Modules → enable “Item Piles: Conan 2d20”**

---

## What this module configures

Recommended Item Piles settings applied:

- Default Item Pile Actor type: `npc`
- Item price attribute: `system.cost`
- Item quantity attribute: `system.quantity`
- Currency:
  - **Gold Pieces** stored on actors at `system.resources.gold.value`
  - Exchange: `1`
  - Abbreviation: `{#}G`
  - Icon: `icons/commodities/currency/coin-embossed-cobra-gold.webp`
- Item filtering:
  - Allows only: `weapon`, `armor`, `miscellaneous`, `kit`
  - Optional (Module Settings): `spell`, `enchantment`

After initial setup, settings are not overwritten unless you choose **Reset Recommended Settings**.

---

## Sorcery trading (Spells / Enchantments)

In **World Settings → Item Piles: Conan 2d20**, you can optionally enable:

- Allow trading **Spells**
- Allow trading **Enchantments**

### Important notes

- Spells and Enchantments are treated as **non-stackable**.
- Their prices are **not derived from `system.cost`** by default.
  - If you enable Sorcery trading, you should **set prices manually per item** in the merchant’s Item Piles item configuration.

Recommended workflow:

1. Enable the Sorcery options (Spells and/or Enchantments)
2. Create/configure a merchant
3. Add spells/enchantments to the merchant inventory
4. Set prices per item in the merchant UI

---

## Reset recommended settings

If someone changes Item Piles settings and something breaks:

1. Foundry → **World Settings** → **Item Piles: Conan 2d20**
2. Click **Open Reset Configuration**
3. Click **Reset Recommended Settings**

This re-applies the recommended configuration and may overwrite current Item Piles settings.

---

## Compatibility notes

- Conan 2d20 tracks currency as an actor attribute (`system.resources.gold.value`), not as a physical “coin item”.
- Conan actors often contain many non-inventory Items (actions, talents, story items, etc.); this module filters them out by default to keep merchant inventories clean.
- This module is intentionally minimal: it doesn’t add item types, sheets, or rules automation.

---

## Support / Issues

Report issues or request improvements here:

```txt
https://github.com/kiryna-cpg/item-piles-conan2d20/issues
```

When reporting, include:

- Foundry version
- Conan 2d20 system version
- Item Piles version
- Steps to reproduce + console logs (F12)

---

## License

MIT. See `LICENSE`.

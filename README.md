# Item Piles: Conan 2d20

A companion module that configures **Item Piles** for the Foundry VTT system **Robert E. Howard's Conan: Adventures in an Age Undreamed Of** (`conan2d20`).

This module exists because Item Piles is now system-agnostic and relies on companion modules (or manual configuration) for system-specific rules. 

## What it does (v0.0.5)

On first load (per world), it applies a recommended Item Piles configuration:

- **Default pile actor type**: `npc`
- **Quantity attribute**: `system.quantity`
- **Price attribute**: `system.cost`
- **Currency**: Gold at `system.resources.gold.value`
- **Item type allowlist**: only `weapon`, `armor`, `miscellaneous`, `kit` are allowed by default
- **Never stack**: `spell` and `enchantment` (if you decide to trade sorcery/alchemy)

It also adds a **World Settings** menu entry:

- **Reset recommended settings**: re-applies the recommended configuration (overwrites your current Item Piles settings)

## Sorcery trade (spells & enchantments)

In **Module Settings**, you can optionally allow trading of:

- **Spells (Sorcery)**
- **Enchantments (Alchemy)**

When enabled:

- Those item types are included in the module allowlist
- They will **never stack**
- Their **price must be set manually** in the merchant item configuration inside Item Piles

> Recommendation: keep this **disabled** unless you explicitly want a “magic market” or alchemy trade in your campaign.

## Requirements

- Foundry VTT v13+
- The **Item Piles** module (`item-piles`)
- The **Conan 2d20** system (`conan2d20`)

## License

MIT.

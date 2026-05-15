# Item Piles: Conan 2d20

Item Piles: Conan 2d20 is a small companion module that configures **Item Piles** for **Robert E. Howard's Conan: Adventures in an Age Undreamed Of**.

It provides Conan-specific Item Piles defaults for currency, prices, item quantities, item filters, and optional spell/enchantment trade behavior.

## v14 status

- Foundry VTT: **v14**
- Conan 2d20 system: **2.5.0**
- Item Piles: **3.3.1**
- Languages: English and Spanish

## Main features

- Registers Conan 2d20 as an Item Piles system integration.
- Configures Conan gold as the default currency:

```txt
system.resources.gold.value
```

- Uses Conan item fields for price and quantity:

```txt
system.cost
system.quantity
```

- Applies Conan-aware item filters.
- Optional settings for trading spells and enchantments.
- One-click reset to restore recommended Item Piles settings for Conan.

## Requirements

- Foundry VTT: `14`
- Conan 2d20 system: `2.5.0`
- Item Piles: `3.3.1`

## Installation

Install with this manifest URL:

```txt
https://raw.githubusercontent.com/kiryna-cpg/item-piles-conan2d20/main/module.json
```

Enable both modules in the world:

- Item Piles
- Item Piles: Conan 2d20

## Recommended first run

After enabling the module as GM:

1. Open **Configure Settings → Module Settings → Item Piles: Conan 2d20**.
2. Review spell and enchantment trade settings.
3. Use **Reset Recommended Configuration** if you want the module to rewrite Item Piles settings to the Conan defaults.
4. Reload the application.

## Support

Report issues at:

```txt
https://github.com/kiryna-cpg/item-piles-conan2d20/issues
```

Include Foundry version, Conan system version, Item Piles version, reproduction steps, and console logs.

## License

MIT.

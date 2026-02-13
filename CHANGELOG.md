# Changelog

All notable changes to this project will be documented in this file.

## [0.0.5] - 2026-02-13
### Changed
- Minor UI changes.

## [0.0.4] - 2026-02-13
### Fixed
- Fixed Item Filters format to match Item Piles 3.x expectations (comma-separated string). This resolves errors when dropping items onto the canvas.
### Added
- Applied default Item class types in Item Piles settings:
  - Loot: `miscellaneous`
  - Weapon: `weapon`
  - Equipment: `armor`

## [0.0.3] - 2026-02-13
### Changed
- Default currency definition updated to match Conan conventions:
  - Name: "Gold Pieces"
  - Abbreviation: "{#}G"
  - Icon: `icons/commodities/currency/coin-embossed-cobra-gold.webp`
  - Data path: `system.resources.gold.value`

## [0.0.2] - 2026-02-13
### Added
- Enforced item type allowlist via Item Piles “Item Filters”: only `weapon`, `armor`, `miscellaneous`, `kit` are allowed by default.
- Sorcery trade options in Module Settings:
  - Allow trading Spells
  - Allow trading Enchantments
  (Both are non-stackable and must be priced manually per-merchant item configuration.)
### Changed
- Reset dialog reflects the new sorcery trade options.

## [0.0.1] - 2026-02-13
### Added
- Initial module skeleton for Conan 2d20.
- One-time recommended Item Piles setup (currency, item quantity/price attributes, pile actor type).
- World Settings menu: “Reset Recommended Settings”.

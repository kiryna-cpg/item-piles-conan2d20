# Changelog

All notable changes to this project will be documented in this file.

## [0.0.9] - 2026-05-15
### Changed
- Updated compatibility for Foundry VTT v14, Conan 2d20 system 2.5.0, and Item Piles 3.3.1.
- Updated manifest download, README, and changelog links for the v14 release.
- Normalized Conan system compatibility under `relationships.systems`.

### Fixed
- Fixed module setting localization so Foundry displays translated labels instead of raw i18n keys.
- Replaced the reset confirmation dialog with `DialogV2`.
- Limited world-scoped Item Piles setting writes to GM users.

## [0.0.8]
### Added
- Conan-specific Item Piles defaults for currency, price, quantity, filters, and trade settings.

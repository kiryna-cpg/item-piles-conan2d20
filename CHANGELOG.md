# Changelog

All notable changes to this project will be documented in this file.

## [0.0.7] - 2026-02-13
### Fixed
- If this world has previously been set up by the companion but Item Piles settings were later reset/changed, the companion now detects the mismatch on load and automatically re-applies the recommended defaults (with a warning notification).

## [0.0.2] - 2026-02-12
### Added
- Manifest + release download support for Foundry installation.
- World Settings menu: “Reset Recommended Settings”.
- Safe one-time setup (does not overwrite manual Item Piles settings after initial setup).

### Changed
- Uses attribute currency configuration for Pepitas: `system.pips.value`.
- Default configuration tuned for slot-based inventory (no stacking).

## [0.0.1] - 2026-02-12
### Added
- Initial companion module with Mausritter-specific Item Piles settings.

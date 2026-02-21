# Changelog
All notable changes to this project will be documented in this file.

## [0.0.4] - 2026-02-21
### Fixed
- Ensured the **No Reach** status is mutually exclusive with Reach 1–3 for both Player Characters and NPCs.
- Restored automatic Reach re-evaluation when Reach-related statuses are toggled (e.g., disabling **No Reach** re-applies the appropriate automatic Reach).
- Improved reliability of status updates when equipping/unequipping items and when toggling module settings.

## [0.0.3] - 2026-02-18
### Added
- NPC support: automatic Reach is derived from the highest `system.range` among `npcattack` (and `weapon`) items.
- NPC GM override: the GM may set Reach 1–3 from the Token HUD; the selection is persisted per token/actor.

### Changed
- Setting **Show Reach 1 Icon** now updates all placed tokens immediately.

### Fixed
- Correct handling for unlinked (synthetic) tokens by storing manual override flags on the TokenDocument when applicable.
- Prevented missed updates when recalculating multiple tokens by using per-Actor debouncing.

## [0.0.2] - 2026-02-17
### Added
- Module Setting: **Show Reach 1 Icon** (enabled by default).
- Manual status effect: **No Reach** (`no-reach.webp`), HUD-visible and user-toggleable.
- Mutual exclusivity across Reach statuses and No Reach (only one can be active at a time).
- Manual override behavior: when **No Reach** is active, automatic Reach application is suppressed.

### Changed
- Reach range reduced to **1–3** (system maximum).
- Asset path handling made more robust (module-relative pathing).

### Fixed
- Prevented status stacking by enforcing exclusivity between Reach statuses.

## [0.0.1] - 2026-02-17
### Added
- Initial release.
- Automatic Reach status application (Reach 1–5 prototype) based on equipped weapon `system.range`.

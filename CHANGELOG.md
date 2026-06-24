# Changelog

All notable changes to colinbalcarek.com are documented here.

## [v2.1.1] — 2026-06-24
### Fixed
- Favicon PNGs regenerated with Helvetica Bold (not Neue) for correct weight
- Transparent background on all PNG favicon sizes

## [v2.1.0] — 2026-06-24
### Added
- PNG favicon fallbacks (16px, 32px, 180px apple-touch-icon) for Safari compatibility
- SVG favicons are unsupported in iOS Safari and older desktop Safari

## [v2.0.0] — 2026-06-24
### Added
- Dark mode UI throughout: identity card, pills, bottom sheet, all overlays
- "Take the Tour" button below identity card (blue CTA, hides when sheet open)
- Mode intro sheets for Work, Art, and Projects on pill tap
- Tour flow: starts with Colin sheet → Work intro → individual stops
- About sheet with GitHub, LinkedIn, email links matching identity card
- Orange C bullet favicon (SVG)
- GitHub link in identity card replacing search
- PNG favicon with apple-touch-icon support
- Dynamic Island support: viewport-fit=cover, safe-area insets, theme-color meta

### Changed
- Default map zoom 12, bearing 29°, centered on upper Manhattan
- Closing sheet (X, swipe down, handle tap) now deactivates pill and resets map
- Pills lift above open sheet using actual rendered height (getBoundingClientRect)
- Pill active state: orange (#FF6319) for high contrast on both light map and dark sheet

### Removed
- Solari flip-board splash screen
- Map style switcher (standard style only)
- Search bar
- Zoom controls
- Explore pill (tapping active pill now acts as explore/reset)
- Marathon year selector (redundant with running sheet results table)

### Fixed
- contentReady race condition — sheets now gate on content.json load
- Work sheet pagination listener accumulation (switched to event delegation)
- GeoJSON animation fetch missing .catch() handler
- Lightbox broken image onerror handler
- Duplicate .pc-actions CSS declaration
- Removed unused escapeHtml function
- will-change: bottom on pills for GPU-composited animation

## [v1.1.0] — 2026-05-01
### Added
- Map style switcher: Standard, Minimal, Dark, Schematic

## [v1.0.0] — 2026-05-01
### Added
- Initial release: colinbalcarek.com
- Mapbox GL JS v3.4.0 map centered on NYC
- NYC subway lines as life metaphor (Work, Running, Art, Projects)
- Identity card, mode pills, bottom sheet, lightbox
- Tour flow with guided stops
- Marathon data from static JSON with localStorage cache

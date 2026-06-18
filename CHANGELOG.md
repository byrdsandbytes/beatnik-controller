# Changelog

## [0.5.6] - 2026-06-14

### Added
- Add pipe stream asset

### Changed
- Refine theme color definitions and variables

## [0.5.5] - 2026-05-27

### Added
- Add Mopidy support, control, visuals, and presets

## [0.5.4] - 2026-05-08

### Added
- Display system info and alerts
- Allow system reboot

## [0.5.3] - 2026-04-18

### Added
- Add volume and fade presets editing
- Add system endpoints and LED UI
- Add line DSP for rdm20

### Fixed
- Fix Snapcast volume knob jumping
- Fix UI clipping and card issues

## [0.5.2] - 2026-04-03

### Added
- Add Dark Mode and adaptations

### Fixed
- Fix card colors

## [0.5.1] - 2026-03-31

### Added
- Handle CamillaDSP configuration and websocket reading
- Add cover art data service and placeholder image

### Fixed
- Fix zeroconf functionality
- Purge state and wait to reconnect properly
- Fix connection button handling

## [0.5.0] - 2026-03-24

### Changed
- Minor internal fixes and merges

## [0.4.9] - 2026-03-24

### Added
- Add pull-to-refresh on the dashboard

### Changed
- Cleanup Snapcast service

### Fixed
- Fix server setup logic

## [0.4.8] - 2026-03-10

### Added
- Implement soundcard picker and complete setup process

### Fixed
- Fix issue with streams hidden by the bottom section
- Fix Docker container not restarting properly

## [0.4.6] - 2026-02-24

### Added
- Add beatnik TCP scan
- Add soundcard images and device reordering

### Changed
- Polish various screens and UI refinements
- Abstract client details component

### Fixed
- Fix player toolbar spacing and breakpoints

## [0.4.3] - 2026-01-27

### Added
- Add HTTPS setup using beatnik-server, Caddy, and Nginx

## [0.4.1] - 2026-01-09

### Added
- Add reusable CamillaDSP component and styling
- Add initial version of BLE WiFi provisioning

## [0.4.0] - 2025-11-25

### Added
- Establish BLE connection (bleno POC)
- Add CamillaDSP websocket tests and config model
- Add Zeroconf checking for local Snapcast servers
- Add server setup POC

## [0.3.1] - 2025-08-30

### Changed
- Reorganize README and Docker build pipeline

## [0.3.0] - 2025-08-30

### Added
- Add livereload command for native platform development

### Fixed
- Fix tabbar issue on iPad


## [0.2.2] - 2025-08-12

### Added
- Add missing android icon
- Add Android assets
- Add terms of service
- Add privacy policy

### Fixed
- Fix navigation for iPad
- Adapt device detail navigation to prevent screen squeeze
- Fix navigation issues resulting in cropped of screens
- Hide modal when user leaves tab view
- Fix webview serving over https while snapcast websocket is not served over wss

### Changed
- Make "stream" routing standalone
- Adapt client navigation
- Format changelog

### Removed
- Remove deprecated getclient func
- Remove codeql.yml workflow

## [0.2.1] - 2025-08-01

### Added
- Add changelog

## [0.2.0] - 2025-07-23

### Added
- Add group, server and stream requests
- Add client mutation functions
- Connect to state in app component, add triggers for foreground and background events
- Handle mobile page lifecycles
- Add client name to selectors and list
- Add client detail page
- Add indicator fab logic
- Add first version of github workflows
- Add user preference hostname
- Key value store for user peferences, variable hostname, menu page, settings page
- Add preview screen
- Add basic readme
- Add device details page
- Add devices page
- Extend snapcast service with group functions
- Add haptic feedback
- Add capacitor and compile iOS POC
- Add font
- Add icons

### Changed
- Update docker-compose.yml
- Improve readme
- Update readme with docker setup
- Standardize server naming
- Rename project
- Shift snapcast server url to env
- Improve change detection
- Decrease playertoolbar size
- Refactoring state management
- Handling states
- Setting up snapcast connection
- First hacky version of services and ui
- Tab routing
- Handle websocket notifications
- Improve realtiminess
- Clean up naming
- Routing
- Player toolbar formatting

### Fixed
- Fix desktop slider issues
- Fix broken link
- Fix title
- Fix disappearing range
- Hacky fix for overlapping tabbar

### Removed
- Remove double linting
- Remove old user preference service
- Remove deprecated service impor
- Remove old server stauts
- Remove old imports
- Clean up old service
- Remove auto generated assets, pages and components
- Removed over-engineered "desired" and "reported" state logic

## [0.1.0] - 2025-07-14

### Added
- Add contributing and app compile infos
- Add docker installation guide
- Add docker setup
- Add favicon

### Changed
- Update readme

## [0.0.3] - 2025-07-13

### Added
- User preferences in dashboard, loading and error handling

### Changed
- Clean up naming
- Routing

### Fixed
- Prevent range jitter if multiple apps are connected

## [0.0.2] - 2025-06-22

### Added
- Create LICENSE

### Changed
- Rename project
- Shift snapcast server url to env

### Removed
- Clean up old service
- Remove auto generated assets, pages and components

### Changed
- Refactored state management
- Use base64 for art data
- Add android platform to gitignore configuration

### Added
- Add mock server for testing
- Add proof-of-concept for speaker selection

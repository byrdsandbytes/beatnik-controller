# Changelog

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

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/) 2.0.0.

## [1.4.4] - 2026-11-04

### Added

- Document SecuredWhisker KeyBox as a private-key protection option.

### Changed

- Enable GitHub Actions on pushes and pull requests.
- Upgrade service runtimes and tooling, including PHP 8.5, Go 1.26.10, and the frontend lint configuration.
- Align Dockerfiles, Compose services, and environment variables.
- Enable Doctrine native lazy objects.

### Fixed

- Resolve Composer and Go dependency vulnerability findings.
- Remove the Doctrine and Symfony deprecation warnings.

## [1.4.3] - 2026-09-15

### Changed

- Upgrade Next.js to 16.3.5.

## [1.4.2] - 2026-06-17

### Added

- Add security-related HTTP headers.

### Fixed

- Fix a Next.js security issue.

## [1.4.1] - 2026-04-05

### Added

- Add keyboard shortcuts and integration with [SW-KeyBox](https://github.com/YR72dpi/SecuredWhisker-keybox).

### Changed

- Refactor code management.

### Fixed

- Fix a Next.js security issue.

## [1.4.0] - 2025-12-15

### Added

- Expand project documentation.

### Changed

- Refactor code management.

### Fixed

- Fix a Next.js security issue.

## [1.3.5] - 2025-11-06

### Added

- Add contact deletion and feedback while saved messages load.

## [1.3.4] - 2025-10-30

### Added

- Add Web Push subscription and per-device notification management.
- Add an iOS PWA installation prompt.

## [1.3.3] - 2025-10-18

### Added

- Add automatic message expiration, configurable with PHP `DateTime::modify` syntax (defaults to one week).

### Changed

- Migrate to Next.js 15 and ESLint; show message timestamps and improve private-key password entry.

## [1.3.2] - 2025-10-15

### Added

- Allow adding friends by QR code.

### Changed

- Improve QR scanning, message saving controls, chat styling, and navigation.

## [1.3.1] - 2025-10-10

### Added

- Add loading feedback and a logout button.

### Changed

- Validate JWTs with a GET request and improve contact-list spacing.

### Fixed

- Fix saved-message decryption across browsers.

## [1.3.0] - 2025-10-06

### Added

- Add an offline PWA page and the ability to save messages.

### Changed

- Reload the contact list when needed.

### Fixed

- Fix SVG visibility on the access-denied page.

## [1.2.0] - 2025-10-03

### Added

- Add front-end IP allowlisting.

## [1.1.9] - 2025-10-03

### Changed

- Improve QR scanning, chat layout, and interface wording.

### Fixed

- Keep the latest messages visible at the bottom of the chat.

## [1.1.8] - 2025-10-02

### Added

- Allow transferring a private key between browsers by QR code or manual entry.

## [1.1.7] - 2025-10-01

### Added

- Improve chat usability with WebSocket reconnection, automatic scrolling, and input focus handling.

## [1.1.6] - 2025-09-30

### Changed

- Improve mobile responsiveness and support the system theme; use light theme by default.

## [1.1.5] - 2025-09-30

### Added

- Add a favicon and PWA support.

## [1.1.4] - 2025-09-30

### Added

- Add a dark/light theme switch and redirect users based on JWT validity.

### Changed

- Improve the contact-list and chat layout.

## [1.1.3] - 2025-09-30

### Added

- Allow copying public and private RSA keys.

### Changed

- Remove the message subject.

## [1.1.2] - 2025-09-29

### Added

- Add navigation and relationship-management menus.

## [1.1.1] - 2025-09-29

### Added

- Add home navigation and improve login and registration pages.

## [1.1.0] - 2025-09-27

### Added

- Encrypt messages with AES and encrypt AES keys with the recipient's RSA public key.
- Add the ability to copy a user's identifier.

### Changed

- Improve message styling.

## [1.0.0] - 2025-07-14

### Added

- Provide registration, login, contacts, chat, and ChatGPT translation.

## [0.0.0] - 2024-11-07 - Beta

The first version was a proof of concept in the [SecuredWhisker-beta repository](https://github.com/YR72dpi/SecuredWhisker-beta).

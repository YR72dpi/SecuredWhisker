# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/) 2.0.0.

## [1.3.3] - 2025-10-xx

### Added

- Deletion of messages after a specified period of time
    - using php's ```DateTime::modify``` string
    - By default : _-1 week_

### Changed

- Migrate from Netjs 14 to NextJS 15
- Migrating from next lint to eslint
- Show date & time on messages

### Fixed

-

---

## [1.3.2] - 2025-10-15

### Added

- Add friends by qr code

### Changed

- Make existing qr code scanner as componenet
- Switch button instead of a checkbox to choose whether messages will be saved
- Message box style
- New menu

### Fixed

-

---

## [1.3.1] - 2025-10-10

### Added

- (UI) Spinne loader
- Disconnection button

### Changed

- Check JWT token by GET method
- Contacts list line height (to 44px)

### Fixed

- Decrypt saved message on all browser 

---

## [1.3.0] - 2025-10-06

### Added

- PWA offline page
- ability to save message

### Changed

- reload contact list

### Fixed

- svg visible in denied access page

---

## [1.2.0] - 2025-10-03

### Added

- IP white list on front end

### Changed

/

### Fixed

/
---

## [1.1.9] - 2025-10-03

### Added

/

### Changed

- Some UI elements
- QR code reader square shapped
- Some wording

### Fixed

- View messages at the bottom of the chatbox as on all other chat applications

---

## [1.1.8] - 2025-10-02

### Added

- Ability to transfer the private key from one browser to another using a QR code or manual entry

### Changed

/

### Fixed

/

---

## [1.1.7] - 2025-10-01

### Added

- autofocus on the input
-  try to reconnect to websocket server if disconnected
- manage auto scroll on when there is many message
- "unfocus" the input after sending message

### Changed

-  delete console log

### Fixed

/

---

## [1.1.6] - 2025-09-30

### Added

- Responsive for phone 

### Changed

- Light theme by default
- Enable system theme

### Fixed

/

---

## [1.1.5] - 2025-09-30

### Added

- Favicon
- PWA

### Changed

/

### Fixed

/

---

## [1.1.4] - 2025-09-30

### Added

- Dark / light theme switch
- From home page, redirect to the chat if there is a valid JWT Token
- From chat page, redirect to the home page if there no or invald JWT Token

### Changed

- UI between the contacts list and the chat

### Fixed

/

---

## [1.1.3] - 2025-09-30

### Added

- Possibility to copy the private and public RSA key

### Changed

- Delete the subject

### Fixed

/

---

## [1.1.2] - 2025-09-29

### Added

- Menu with Secured Whisker links
- Menu with relationship management

### Changed

/

### Fixed

/

---

## [1.1.1] - 2025-09-29

### Added

- Button home on home login / sign in pages

### Changed

- UI on home / login / sign in pages

### Fixed

/

---

## [1.1.0] - 2025-09-27

### Added

- Button to copy user's identifier

### Changed

- Message crypted in AES and aes crypt with the recipent RSA public key.
- Style of message

### Fixed


## [1.0.0] - 2025-07-14

### Added

Capability to :
- Login
- Register
- Add someone
- Chat
- Translate with chatGPT

### Changed

/

### Fixed

/

## [0.0.0] - 2024-11-07 - Beta

The first version was a POC. It's in this repository :

[github.com/YR72dpi/SecuredWhisker-beta](https://github.com/YR72dpi/SecuredWhisker-beta)


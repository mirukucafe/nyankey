# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Changed
- foundkey-js is now part of the main FoundKey repo
- BREAKING: foundkey-js now uses ES2020 modules. Ensure that your version of Node supports them.
- The `comment` property of `DriveFile` is now nullable. Make sure to check that this property is not `null` before accessing it.

## 0.0.15 - 2022-07-22
### Changed
- foundkey.js forked from misskey.js

### Added
- Add `pollEnded` event
- Add `unreacted` to `NoteUpdatedEvent`
- Add `comment` property to `DriveFile`

## 0.0.14 - 2022-01-30
### Removed
- remove needless Object.freeze()

## 0.0.13 - 2022-01-13
### Changed
- expose ChannelConnection and Channels types

## 0.0.12 - 2022-01-01
### Fixed
- fix a bug that cannot connect to streaming

## 0.0.11 - 2022-01-01
### Changed
- update user type

### Added
- add missing main stream types

## 0.0.10 - 2021-11-11
### Added
- add consts

## 0.0.9 - 2021-11-11
### Changed
- Update Note type

### Added
- add list of api permission

## 0.0.8 - 2021-10-17
### Changed
- Update Note type

### Added
- add type definition for `messagingMessage` event to main stream channel

## 0.0.7 - 2021-10-16
### Fixed
- Fixed Notifications type
- Fixed MessagingMessage type
- Fixed UserLite type

### Changed
- Wrap native fetches in api with an anonymous function when storing them.

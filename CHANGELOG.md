# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This changelog covers changes since Misskey v12.111.1, the version prior to the FoundKey fork.
For older Misskey versions, see [CHANGELOG-OLD.md](./CHANGELOG-OLD.md).

## Unreleased
### Added
- Client: Show instance info in ticker
- Client: Readded group pages
- Client: add re-collapsing to quoted notes

### Changed
- Client: Use consistent date formatting based on language setting
- Client: Add threshold to reduce occurances of "future" timestamps
- Pages have been considerably simplified, several of the very complex features have been removed.
  Pages are now MFM only.
  **For admins:** There is a migration in place to convert page contents to text, but not everything can be migrated.
  You might want to check if you have any more complex pages on your instance and ask users to migrate them by hand.
  Or generally advise all users to simplify their pages to only text.

### Removed
- Okteto config and Helm chart
- Client: acrylic styling
- Client: Twitter embeds, the standard URL preview is used instead.
- Promotion entities and endpoints
- Server: The configuration item `signToActivityPubGet` has been removed and will be ignored if set explicitly.
  Foundkey will now work as if it was set to `true`.

### Fixed
- Client: Notifications for ended polls can now be turned off
- Client: Emoji picker should load faster now
- Server: Blocking remote accounts

### Security
- Server: Update `multer` dependency to resolve [CVE-2022-24434](https://nvd.nist.gov/vuln/detail/CVE-2022-24434)

## 13.0.0-preview1 - 2022-08-05
### Added
- Server: Replies can now be fetched recursively.

### Changed
- Server: Replies/quotes cannot have a more open visibility than the parent post
- Server: Allow GET method for some endpoints
- Server: Add rate limit to i/notifications
- Server: Improve performance
- Server: Supports IPv6 on Redis transport
  IPv4/IPv6 is used by default. You can tune this behavior via `redis.family`
- Server: Mutes and blocks now apply recursively to replies and renotes
- Server: Admins can now delete accounts
- Client: Improve control panel
- Client: Show warning in control panel when there is an unresolved abuse report
- Client: For notes with specified visibility, show recipients when hovering over visibility symbol.
- Client: Add rss-ticker widget
- Client: Removing entries from a clip
- Client: Searching in the emoji picker is now case insensitive
- Client: MFM search button changed to a no-op
- Client: Fix URL-encoded routing
- Client: Poll highlights in explore page
- Client: Improve player detection in URL preview
- Client: Add Badge Image to Push Notification
- Client: Custom Emoji pages have been merged into the Instance Info page

### Removed
- Server: ID generation methods other than `aid`
- Client: Ability to show advertisements

### Fixed
- Server: Video thumbnails are now generated properly
- Server: Ensure temp directory cleanup
- Client: Favicons of remote instances now show up
- Client: Fix switch to receive email notifications
- Client: Page freezes when trying to open configuration page of existing webhooks
- Client: Fix a bug where new chat messages don't show up
- Client: Fix collapsing long notes
- Client: Add padding to pages

### Security
- Server: Hide metadata of private notes

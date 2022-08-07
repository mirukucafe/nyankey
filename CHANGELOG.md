# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This changelog covers changes since Misskey v12.111.1, the version prior to the FoundKey fork.
For older Misskey versions, see [CHANGELOG-OLD.md](./CHANGELOG-OLD.md).

## [Unreleased]
### Added
- Server: Replies can now be fetched recursively.

### Changed
- Server: Replies/quotes cannot have a more open visibility than the parent post
- Client: Searching in the emoji picker is now case insensitive
- Client: MFM search button changed to a no-op
- Client: Fix URL-encoded routing
- Server: Allow GET method for some endpoints
- Server: Add rate limit to i/notifications
- Client: Improve control panel
- Client: Show warning in control panel when there is an unresolved abuse report
- Client: For notes with specified visibility, show recipients when hovering over visibility symbol.
- Client: Add rss-ticker widget
- Client: Removing entries from a clip
- Client: Poll highlights in explore page
- Make possible to delete an account by admin
- Improve player detection in URL preview
- Add Badge Image to Push Notification
- Server: Improve performance
- Server: Supports IPv6 on Redis transport.
  IPv4/IPv6 is used by default. You can tune this behavior via `redis.family`.
- Custom Emoji pages have been merged into the Instance Info page
- Mutes and blocks now apply recursively to replies and renotes.

### Removed
- Ability to show advertisements
- Server: ID generation methods other than `aid`

### Fixed
- Server: Video thumbnails are now generated properly
- Server: Ensure temp directory cleanup
- Favicons of remote instances now show up
- Client: Fix switch to receive email notifications
- Client: Page freezes when trying to open configuration page of existing webhooks
- Client: Fix a bug where new chat messages don't show up
- Client: Fix collapsing long notes
- Client: Add padding to pages

### Security
- Hide metadata of private notes

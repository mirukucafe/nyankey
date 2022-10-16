# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This changelog covers changes since Misskey v12.111.1, the version prior to the FoundKey fork.
For older Misskey versions, see [CHANGELOG-OLD.md](./CHANGELOG-OLD.md).

Unreleased changes should not be listed in this file.
Instead, run `git shortlog --format='%h %s' --group=trailer:changelog <last tag>..` to see unreleased changes; replace `<last tag>` with the tag you wish to compare from.
If you are a contributor, please read [CONTRIBUTING.md, section "Changelog Trailer"](./CONTRIBUTING.md#changelog-trailer) on what to do instead.

## 13.0.0-preview2 - 2022-10-16
### Security
- server: Update `multer` dependency to resolve [CVE-2022-24434](https://nvd.nist.gov/vuln/detail/CVE-2022-24434)
- server: Update `file-type`, `got`, and `sharp` dependencies to fix various security issues

### Added
- allow to mute only renotes of a user
- allow to export only selected custom emoji
- client: improve emoji picker search
- client: Extend Emoji list
- client: show alt text in image viewer
- client: Show instance info in ticker
- client: Readded group pages
- client: add re-collapsing to quoted notes
- server: allow files storage path to be set explicitly
- server: refactor expiring data and expire signins after 60 days
- server: send delete activity to all known instances
- server: add automatic dead instance detection

### Changed
- foundkey-js: Sync possible endpoints from backend
- foundkey-js: update LiteInstanceMetadata fields
- meta: use parallel and incremental builds
- meta: update WORKDIR to foundkey
- meta: update dependencies
- client: consolidate about & notifications pages
- client: include renote in visibility computation
- client: make emoji amount slider more intuitive
- client: sort emojis by query similarity in fuzzy picker
- client: discard drafts that are just the default state
- client: Use consistent date formatting based on language setting
- client: Add threshold to reduce occurances of "future" timestamps
- server: mute notifications in muted threads
- server: allow for source lang to be overridden in note/translate
- server: allow redis family to be specified as a string
- server: increase image description limit to 2048 characters
- server: Pages have been considerably simplified, several of the very complex features have been removed.
  Pages are now MFM only.
  **For admins:** There is a migration in place to convert page contents to text, but not everything can be migrated.
  You might want to check if you have any more complex pages on your instance and ask users to migrate them by hand.
  Or generally advise all users to simplify their pages to only text.

### Fixed
- client: alt text dialog properly handles non-images
- client: Fix style scoping in MkMention
- client: default instance ticker name to instance's domain name
- client: improve error message for empty gallery posts
- client: fix default-selected reply scopes
- client: Make MFM cheatsheet interactive again
- client: Fix reports not showing in control panel
- client: make hard coded strings in emoji admin panel internationalized
- client: Notifications for ended polls can now be turned off
- client: improve emoji picker performance
- server: Blocking remote accounts
- server: fix table name used in toHtml
- server: Fix appendChildren TypeError
- server: ensure only own notifications can be marked as read
- server: render HTML mentions correctly
- server: increase requestId max size for GNU Social
- server: fix HTTP GET parameters in OpenAPI docs
- server: proper error messages for creating accounts
- server: Fix thread muting queries
- docker: add built foundkey-js files to container
- service worker: Remove fetch handler from service worker

### Removed
- remove misskey-assets submodule
- server: remove room data from user
- client: remove ai mode
- client: remove "Disable AiScript on Pages" setting
- client: acrylic styling
- client: Twitter embeds, the standard URL preview is used instead.
- foundkey-js: remove room api endpoints
- server: remove unusable setting to send error reports
- server: ignore detail parameter on meta endpoint
- server: Promotion entities and endpoints
- server: The configuration item `signToActivityPubGet` has been removed and will be ignored if set explicitly.
  Foundkey will now work as if it was set to `true`.

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

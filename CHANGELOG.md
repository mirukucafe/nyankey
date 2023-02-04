# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This changelog covers changes since Misskey v12.111.1, the version prior to the FoundKey fork.
For older Misskey versions, see [CHANGELOG-OLD.md](./CHANGELOG-OLD.md).

Unreleased changes should not be listed in this file.
Instead, run `git shortlog --format='%h %s' --group=trailer:changelog <last tag>..` to see unreleased changes; replace `<last tag>` with the tag you wish to compare from.
If you are a contributor, please read [CONTRIBUTING.md, section "Changelog Trailer"](./CONTRIBUTING.md#changelog-trailer) on what to do instead.

## 13.0.0-preview4 - 2023-02-05
This release contains 6 breaking changes, including changes to the configuration file format.

### Added
- new Foundkey logo
- client: add button to unrenote/remove all own renotes
- client: add mod tracker
- client: add button to delete all files of a user for moderators
- server: implement OAuth 2.0 Authorization Code grant
- server: add config for error images
- server: expire notifications after 3 months
- server: start adding /api/v2 routes
- server: indicate Retry-After when rate limiting
- docs: show rate limit information

### Changed
- **BREAKING** server: implement separate web workers
  The configuration file format has been changed: The `clusterLimit` item has been removed
  and `clusterLimits` has been added instead. Check the example configuration file.
- **BREAKING** server: remove wildcard blocking and instead block subdomains (#269)
  As an administrator you may need to check the list of blocked instances.
- **BREAKING** server: disable deliver rate limit by default
  We found that the deliver rate limit causes a lot of load for no real benefit. Because of this,
  it will be disabled by default. The default value of `deliverJobPerSec` is set to
  disable this rate limit.
- server: adjust permissions for `/api/admin/accounts/delete`
  The admin/accounts/delete endpoint now requries administrator privileges
  instead of just moderator privileges.
- server: increase nodeinfo caching
- client: headlines in queue widget are links
- client: add tooltips to visibility icons
- server: improve error messages
- server: change default value for `/api/admin/show-users` origin param
- server: lower rate limit for deletion activities
  Deleting things that result in federating a delete activity have a more strict rate limit.
  This affects the following endpoints:
  - `/api/notes/delete`
  - `/api/notes/reactions/delete`
  - `/api/notes/unrenote`
- server: improve OpenGraph data
  - properly render note attachments as RDFa
  - add more metadata about e.g. author
  - proper OpenGraph data replaces custom `misskey:` RDFa tags
- activitypub: implement [FEP-e232](https://codeberg.org/fediverse/fep/src/branch/main/feps/fep-e232.md) qoutes
- activitypub: use `quoteUri` instead of `quoteUrl`

### Fixed
- client: fix layout of app authorization page
- client: unify different error dialogs
- client: set display name limit same as server
- client: dont display instance banner tooltip if software name is unknown
- client: fix 500 error in notifications
- client: fix some tooltips not closing
- client: fix issue of search only working once
- client: check `quoteId` for canPost computation
- client: fix quotes with only a CW
- server: fix thread mutes not applying to renotes
- server: fix ReferenceError: meta is undefined
- server: fix TypeError in registerOrFetchInstanceDoc
- server: fix ratelimit in `/api/i/import-following`
- server: handle redirects in signed get
- server: remove reversi database tables
- server: set file permissions after copy
- server: also use human readable URL in search
- server: fix user deletion race condition
- server: add websocket ping mechanism
  This should help keep websocket connections alive even if there are no events for
  prolonged time periods. This should also fix issues where the "connection has been lost"
  dialog appeared despite the connection being fine.
- activitypub: properly parse incoming hashtags
- activitypub: Do block checks more globally
- activitypub: properly render CW only quotes

### Removed:
- **BREAKING** server: remove Twitter, Github and Discord integrations
ff31b8b06 server: remove bios and cli
a673647fb server: remove avatarColor and bannerColor properties
- **BREAKING** server: remove `api/admin/delete-account`, 
  You should use the API endpoint `admin/accounts/delete` instead.
  It has the same parameter and the same behaviour.
- **BREAKING** remove galleries
  Galleries have been removed because low usage and duplication of other behaviour.
  Existing gallery posts will be turned into ordinary notes.
  If a user had any gallery posts, a new clip called "Gallery" will be created containing
  all of the former gallery posts that are now notes.
  This affects the following endpoints:
  - `/api/gallery/featured`
  - `/api/gallery/popular`
  - `/api/gallery/posts`
  - `/api/gallery/posts/create`
  - `/api/gallery/posts/delete`
  - `/api/gallery/posts/like`
  - `/api/gallery/posts/show`
  - `/api/gallery/posts/unlike`
  - `/api/i/gallery/likes`
  - `/api/i/gallery/posts`
  - `/api/users/gallery/posts`
- server: remove application level websocket ping
  This pinging mechanism was unused in `foundkey-js`, and we expect other usage to be low.
  You can use the pinging mechanism built into the websocket protocol if you wish.
  Note that the Server will now also send pings on its own (see *Fixed* section).

## 13.0.0-preview3 - 2022-12-02
This release contains 1 urgent security fix necessitated by `misskey-forkbomb`.
This release contains 1 breaking change.
If you are a 3rd party client developer please see the "Intended future changes" section at the end.

### Security
- activitypub: add recursion limit to resolver

### Added
- server: make max note length configurable
- server: LibreTranslate support
- activitypub: not forwarding block activities
  This can be configured per user.
- client: add "follows you" hint to user profile popup
- client: improved search page for notes and users
- client: ability to delete webhooks
- client: put back button to let admin remove all followings from an instance

### Changed
- **BREAKING** server: remove support for node 16.x.
  Since 2022-10-18, Node.js 16.x is out of Long Term Support and has entered the Maintenance phase.
  The new Long Term Support version since 2022-10-25 is Node.js 18.x.
  Foundkey now requires at least Node.js 18.7.0.
- updated documentation
- client: updated translations
- client: update emoji list
- client: autocomplete flag emoji
- client: autocompletion for emoji is case insensitive
- client: use browser native notifications
- client: close webhook settings page automatically after saving
- client: remove hostname from signup and signin forms
- server: increase user profile description length limit to 2048
- server: always enable push notifications
- server: allow to like own pages
- server: allow to like own gallery pages
- server: produce error when trying to unclip note that was not clipped
- server: stricter API permissions, more endpoints require authentication
  This affects the following endpoints:
  - `/api/federation/instances`
  - `/api/federation/show-instance`
  - `/api/federation/stats`
  - `/api/federation/users`
  - `/api/federation/followers`
  - `/api/federation/following`
  - `/api/fetch-rss`
- server: stricter rate limiting for password reset
- server: refactor API errors and improve documentation
  This affects all API endpoints.
  API errors no longer have a UUID (previous `id` property). Use the properties `code` and `endpoint` instead.
- server: avoid adding suspended instances to the delivery queue in the first place
- server: rewrite skipped instances query in raw SQL to improve performance
- activitypub: don't nyaize blockquotes
- server: add wildcard matching to blocked hosts
- server: updated dependencies

### Fixed
- client: fix detection of maximum lenght for profile description
- client: editing webhooks
- client: files in some states couldnot be dropped and uploaded
- service worker: don't trigger "push notification have been updated"
- server: properly delete expired password reset requests
- server: skip delivering to instances that proclaim themself dead via HTTP 410
- server: use host parameter in note search even if elasticsearch is not enabled
- activitypub: fix rendering of Follow activity `id` when force-removing a follow
- activitypub: remove akkoma quote URLs

### Removed
- client: remove user search from explore page
  You can use the new revamped search page instead.
- server: remove `deeplIsPro` setting
  This setting can be automatically detected based on the DeepL Auth Key provided.
  This affects the following endpoints:
  - `/api/admin/meta`
  - `/api/admin/update-meta`
- server: remove unused endpoints
  This affects the following endpoints. Expected usage of these endpoints is low.
  - `/api/test`
  - `/api/users/get-frequently-replied-users`

### Intended future changes
This section is intended for 3rd party client developers.

MiAuth will be removed in a future release, most likely in the next release.
This affects the follwing endpoints:
- `/miauth`
- `/api/miauth/:session/check`
The `features.miauth` feature flag in `/api/meta` will no longer be `true` (set to `false` or removed entirely).

We would like to clarify that the follwing ndpoints are not part of the public API as they were never part of the documentation generated at `/api-doc`.
They may be removed at any point, without notice.
- `/api/signup`
- `/api/signin`
- `/api/signup-pending`

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

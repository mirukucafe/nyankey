# User moderation

A lot of the user moderation activities can be found on the `user-info` page. You can reach this page by going to a users profile page, open the three dot menu, select "About" and navigating to the "Moderation" section of the page that opens.
With the necessary privileges, this page will allow you to:
- Toggle whether a user is a moderator (administrators on local users only)
- Reset the users password (local users only)
- Delete a user (administrators only)
- Delete all files of a user
  For remote users, cached files (if any) will be deleted.
- Silence a user
  This disallows a user from making a note with `public` visibility.
  If necessary the visibility of incoming notes or locally created notes will be lowered.
- Suspend a user
  This will drop any incoming activities of this actor and hide them from public view on this instance.

# Administrator

When an instance is first set up, the initial user to be created will be made an administrator by default.
This means that typically the instance owner is the administrator.
It is also possible to have multiple administrators, however making a user an administrator is not implemented in the client.
To make a user an administrator, you will need access to the database.
This is intended for security reasons of
1. not exposing this very dangerous functionality via the API
2. making sure someone that has shell access to the server anyway "approves" this.

To make a user an administrator, you will first need the user's ID.
To get it you can go to the user's profile page, open the three dot menu, select "About" and copy the ID displayed there.
Then, go to the database and run the following query, replacing `<ID>` with the ID gotten above.
```sql
UPDATE "user" SET "isAdmin" = true WHERE "id" = '<ID>';
```

The user that was made administrator may need to reload their client to see the changes take effect.

To demote a user, you can do a similar operation, but instead with `... SET "isAdmin" = false ...`.

## Immunity

- Cannot be reported by local users.
- Cannot have their password reset.
  To see how you can reset an administrator password, see below.
- Cannot have their account deleted.
- Cannot be suspended.
- Cannot be silenced.
- Cannot have their account details viewed by moderators.
- Cannot be made moderators.

## Abilities

- Create or delete user accounts.
- Add or remove moderators.
- View and change instance configuration (e.g. Translation API keys).
- View all followers and followees.

Administrators also have the same ability as moderators.
Note of course that people with access to the server and/or database access can do basically anything without restrictions (including breaking the instance).

## Resetting an administrators password

Administrators are blocked from the paths of resetting the password by moderators or administrators.
However, if your server has email configured you should be able to use the "Forgot password" link on the normal signin dialog.

If you did not set up email, you will need to kick of this process instead through modifying the database yourself.
You will need the user ID whose password should be reset, indicated in the following as `<USERID>`;
as well as a random string (a UUID would be recommended) indicated as `<TOKEN>`.

Replacing the two terms above, run the following SQL query:
```sql
INSERT INTO "password_reset_request" VALUES ('0000000000', now(), '<TOKEN>', '<USERID>');
```

After that, navigate to `/reset-password/<TOKEN>` on your instance to finish the password reset process.
After that you should be able to sign in with the new password you just set.

# Moderator

A moderator has fewer privileges than an administrator.
They can also be more easily added or removed by an adminstrator.
Having moderators may be a good idea to help with user moderation.

## Immunity

- Cannot be reported by local users.
- Cannot be suspended.

## Abilities

- Suspend users.
- Add, list and remove relays.
- View queue, database and server information.
- Create, edit, delete, export and import local custom emoji.
- View global, social and local timelines even if disabled by administrators.
- Show, update and delete any users files and file metadata.
  Managing emoji is described in [a separate file](emoji.md).
- Delete any users notes.
- Create an invitation.
  This allows users to register an account even if (public) registrations are closed using an invite code.
- View users' account details.
- Suspend and unsuspend users.
- Silence and unsilence users.
- Handle reports.
- Create, update and delete announcements.
- View the moderation log.

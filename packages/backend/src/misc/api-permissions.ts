// IF YOU ADD KINDS(PERMISSIONS), YOU MUST ADD TRANSLATIONS (under _permissions).

// short English descriptions used for the documentation
export const descriptions = {
	'read:account': 'Read the accounts data.',
	'write:account': 'Write the accounts data.',
	'read:blocks': 'Read which users are blocked.',
	'write:blocks': 'Create, change and delete blocks.',
	'read:drive': 'List files and folders in the drive.',
	'write:drive': 'Create, change and delete files from the drive.',
	'read:favourites': 'List favourited notes.',
	'write:favourites': 'Favourite or unfavourite notes.',
	'read:following': 'Read who the user is following.',
	'write:following': 'Follow or unfollow other users.',
	'read:messaging': 'Read chat messages and history.',
	'write:messaging': 'Create and delete chat messages.',
	'read:mutes': 'List users which are muted or whose renotes are muted.',
	'write:mutes': 'Create or delete (renote) mutes.',
	'write:notes': 'Create or delete notes.',
	'read:notifications': 'Read notifications.',
	'write:notifications': 'Mark notifications as read or create notifications.',
	'write:reactions': 'Create or delete reactions.',
	'write:votes': 'Vote in polls.',
	'read:pages': 'List and read pages.',
	'write:pages': 'Create, modify and delete pages.',
	'read:page-likes': 'List page likes.',
	'write:page-likes': 'Like or unlike pages.',
	'read:user-groups': 'List joined, owned and invited to groups.',
	'write:user-groups': 'Create, modify, delete, transfer, join, or leave groups. Invite or ban others from groups. Accept or reject group invitations.',
	'read:channels': 'List followed and owned channels.',
	'write:channels': 'Create, modify, follow or unfollow channels.',
	'read:gallery': 'Read gallery posts.',
	'write:gallery': 'Create, modify or delete gallery posts.',
	'read:gallery-likes': 'List which gallery posts are liked.',
	'write:gallery-likes': 'Like or unlike gallery posts.',
};

export const kinds = Object.keys(descriptions);

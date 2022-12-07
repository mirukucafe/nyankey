import { DAY } from '@/const.js';
import { Note } from '@/models/entities/note.js';
import { User } from '@/models/entities/user.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { Notes, UserProfiles, NoteReactions } from '@/models/index.js';
import { generateMutedUserQuery } from './generate-muted-user-query.js';
import { generateBlockedUserQuery } from './generate-block-query.js';

// TODO: リアクション、Renote、返信などをしたノートは除外する

export async function injectFeatured(timeline: Note[], user?: User | null) {
	if (timeline.length < 5) return;

	if (user) {
		const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
		if (!profile.injectFeaturedNote) return;
	}

	const max = 30;
	const offset = 3 * DAY;

	const query = Notes.createQueryBuilder('note')
		.addSelect('note.score')
		.where('note.userHost IS NULL')
		.andWhere('note.score > 0')
		.andWhere('note.createdAt > :date', { date: new Date(Date.now() - offset) })
		.andWhere("note.visibility = 'public'")
		.innerJoinAndSelect('note.user', 'user');

	if (user) {
		query.andWhere('note.userId != :userId', { userId: user.id });

		generateMutedUserQuery(query, user);
		generateBlockedUserQuery(query, user);

		const reactionQuery = NoteReactions.createQueryBuilder('reaction')
			.select('reaction.noteId')
			.where('reaction.userId = :userId', { userId: user.id });

		query.andWhere(`note.id NOT IN (${ reactionQuery.getQuery() })`);
	}

	const notes = await query
		.orderBy('note.score', 'DESC')
		.take(max)
		.getMany();

	if (notes.length === 0) return;

	// Pick random one
	const featured = notes[Math.floor(Math.random() * notes.length)];

	(featured as any)._featuredId_ = secureRndstr(8);

	// Inject featured
	timeline.splice(3, 0, featured);
}

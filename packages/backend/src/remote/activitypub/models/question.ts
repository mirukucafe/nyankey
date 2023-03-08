import config from '@/config/index.js';
import { Notes, Polls } from '@/models/index.js';
import { IPoll } from '@/models/entities/poll.js';
import { Resolver } from '@/remote/activitypub/resolver.js';
import { IObject, IQuestion, isQuestion } from '../type.js';
import { apLogger } from '../logger.js';

export async function extractPollFromQuestion(source: string | IObject, resolver: Resolver): Promise<IPoll> {
	const question = await resolver.resolve(source);

	if (!isQuestion(question)) {
		throw new Error('invalid type');
	}

	const multiple = !question.oneOf;
	const expiresAt = question.endTime ? new Date(question.endTime) : question.closed ? new Date(question.closed) : null;

	if (multiple && !question.anyOf) {
		throw new Error('invalid question');
	}

	const choices = question[multiple ? 'anyOf' : 'oneOf']!
		.map(x => x.name!);

	const votes = question[multiple ? 'anyOf' : 'oneOf']!
		.map(x => x.replies && x.replies.totalItems || 0);

	return {
		choices,
		votes,
		multiple,
		expiresAt,
	};
}

/**
 * Update votes of Question
 * @param value AP Question object or its id
 * @param resolver Resolver to use
 * @returns true if updated
 */
export async function updateQuestion(value: string | IObject, resolver: Resolver) {
	const uri = typeof value === 'string' ? value : value.id;

	// URIがこのサーバーを指しているならスキップ
	if (uri.startsWith(config.url + '/')) throw new Error('uri points local');

	//#region このサーバーに既に登録されているか
	const note = await Notes.findOneBy({ uri });
	if (note == null) throw new Error('Question is not registed');

	const poll = await Polls.findOneBy({ noteId: note.id });
	if (poll == null) throw new Error('Question is not registed');
	//#endregion

	// resolve new Question object
	const question = await resolver.resolve(value) as IQuestion;
	apLogger.debug(`fetched question: ${JSON.stringify(question, null, 2)}`);

	if (question.type !== 'Question') throw new Error('object is not a Question');

	const apChoices = question.oneOf || question.anyOf;

	let changed = false;

	for (const choice of poll.choices) {
		const oldCount = poll.votes[poll.choices.indexOf(choice)];
		const newCount = apChoices!.filter(ap => ap.name === choice)[0].replies!.totalItems;

		if (oldCount !== newCount) {
			changed = true;
			poll.votes[poll.choices.indexOf(choice)] = newCount;
		}
	}

	await Polls.update({ noteId: note.id }, {
		votes: poll.votes,
	});

	return changed;
}

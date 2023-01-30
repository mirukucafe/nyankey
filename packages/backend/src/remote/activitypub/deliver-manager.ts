import { ILocalUser, IRemoteUser, User } from '@/models/entities/user.js';
import { Users, Followings } from '@/models/index.js';
import { deliver } from '@/queue/index.js';
import { skippedInstances } from '@/misc/skipped-instances.js';

//#region types
interface IRecipe {
	type: string;
}

interface IEveryoneRecipe extends IRecipe {
	type: 'Everyone';
}

interface IFollowersRecipe extends IRecipe {
	type: 'Followers';
}

interface IDirectRecipe extends IRecipe {
	type: 'Direct';
	to: IRemoteUser;
}

const isEveryone = (recipe: any): recipe is IEveryoneRecipe =>
	recipe.type === 'Everyone';

const isFollowers = (recipe: any): recipe is IFollowersRecipe =>
	recipe.type === 'Followers';

const isDirect = (recipe: any): recipe is IDirectRecipe =>
	recipe.type === 'Direct';
//#endregion

export class DeliverManager {
	private actor: { id: User['id']; host: null; };
	private activity: any;
	private recipes: IRecipe[] = [];

	/**
	 * Constructor
	 * @param actor Actor
	 * @param activity Activity to deliver
	 */
	constructor(actor: { id: User['id']; host: null; }, activity: any) {
		this.actor = actor;
		this.activity = activity;
	}

	/**
	 * Add recipe for followers deliver
	 */
	public addFollowersRecipe() {
		const deliver = {
			type: 'Followers',
		} as IFollowersRecipe;

		this.addRecipe(deliver);
	}

	/**
	 * Add recipe for direct deliver
	 * @param to To
	 */
	public addDirectRecipe(to: IRemoteUser) {
		const recipe = {
			type: 'Direct',
			to,
		} as IDirectRecipe;

		this.addRecipe(recipe);
	}

	/**
	 * Add recipe to send this activity to all known sharedInboxes
	 */
	public addEveryone() {
		this.addRecipe({ type: 'Everyone' } as IEveryoneRecipe);
	}

	/**
	 * Add recipe
	 * @param recipe Recipe
	 */
	public addRecipe(recipe: IRecipe) {
		this.recipes.push(recipe);
	}

	/**
	 * Execute delivers
	 */
	public async execute() {
		if (!Users.isLocalUser(this.actor)) return;

		const inboxes = new Set<string>();

		/*
		build inbox list

		Processing order matters to avoid duplication.
		*/

		if (this.recipes.some(r => isEveryone(r))) {
			// deliver to all of known network
			const sharedInboxes = await Users.createQueryBuilder('users')
				.select('users.sharedInbox', 'sharedInbox')
				// so we don't have to make our inboxes Set work as hard
				.distinct(true)
				// can't deliver to unknown shared inbox
				.where('users.sharedInbox IS NOT NULL')
				// don't deliver to ourselves
				.andWhere('users.host IS NOT NULL')
				.getRawMany();

			for (const inbox of sharedInboxes) {
				inboxes.add(inbox.sharedInbox);
			}
		}

		if (this.recipes.some(r => isFollowers(r))) {
			// followers deliver
			const followers = await Followings.createQueryBuilder('followings')
				// return either the shared inbox (if available) or the individual inbox
				.select('COALESCE(followings.followerSharedInbox, followings.followerInbox)', 'inbox')
				// so we don't have to make our inboxes Set work as hard
				.distinct(true)
				// ...for the specific actors followers
				.where('followings.followeeId = :actorId', { actorId: this.actor.id })
				// don't deliver to ourselves
				.andWhere('followings.followerHost IS NOT NULL')
				.getRawMany();

			followers.forEach(({ inbox }) => inboxes.add(inbox));
		}

		this.recipes.filter((recipe): recipe is IDirectRecipe =>
			// followers recipes have already been processed
			isDirect(recipe)
			// check that shared inbox has not been added yet
			&& !(recipe.to.sharedInbox && inboxes.has(recipe.to.sharedInbox))
			// check that they actually have an inbox
			&& recipe.to.inbox != null,
		)
		.forEach(recipe => inboxes.add(recipe.to.inbox!));

		const instancesToSkip = await skippedInstances(
			// get (unique) list of hosts
			Array.from(new Set(
				Array.from(inboxes)
				.map(inbox => new URL(inbox).host),
			)),
		);

		// deliver
		for (const inbox of inboxes) {
			// skip instances as indicated
			if (instancesToSkip.includes(new URL(inbox).host)) continue;

			deliver(this.actor, this.activity, inbox);
		}
	}
}

//#region Utilities
/**
 * Deliver activity to followers
 * @param activity Activity
 * @param from Followee
 */
export async function deliverToFollowers(actor: { id: ILocalUser['id']; host: null; }, activity: any) {
	const manager = new DeliverManager(actor, activity);
	manager.addFollowersRecipe();
	await manager.execute();
}

/**
 * Deliver activity to user
 * @param activity Activity
 * @param to Target user
 */
export async function deliverToUser(actor: { id: ILocalUser['id']; host: null; }, activity: any, to: IRemoteUser) {
	const manager = new DeliverManager(actor, activity);
	manager.addDirectRecipe(to);
	await manager.execute();
}
//#endregion

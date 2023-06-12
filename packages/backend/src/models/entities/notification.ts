import { Entity, Index, JoinColumn, ManyToOne, Column, PrimaryColumn } from 'typeorm';
import { notificationTypes } from 'foundkey-js';
import { id } from '../id.js';
import { User } from './user.js';
import { Note } from './note.js';
import { FollowRequest } from './follow-request.js';
import { UserGroupInvitation } from './user-group-invitation.js';
import { AccessToken } from './access-token.js';

@Entity()
export class Notification {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Notification.',
	})
	public createdAt: Date;

	/**
	 * 通知の受信者
	 */
	@Index()
	@Column({
		...id(),
		comment: 'The ID of recipient user of the Notification.',
	})
	public notifieeId: User['id'];

	@ManyToOne(() => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public notifiee: User | null;

	/**
	 * 通知の送信者(initiator)
	 */
	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of sender user of the Notification.',
	})
	public notifierId: User['id'] | null;

	@ManyToOne(() => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public notifier: User | null;

	/**
	 * Type of notification.
	 * follow - notifier followed notifiee
	 * mention - notifiee was mentioned
	 * reply - notifiee (author or watching) was replied to
	 * renote - notifiee (author or watching) was renoted
	 * quote - notifiee (author or watching) was quoted
	 * reaction - notifiee (author or watching) had a reaction added to the note
	 * pollVote - new vote in a poll notifiee authored or watched
	 * pollEnded - notifiee's poll ended
	 * receiveFollowRequest - notifiee received a new follow request
	 * followRequestAccepted - notifier accepted notifees follow request
	 * groupInvited - notifiee was invited into a group
	 * move - notifier moved
	 * app - custom application notification
	 */
	@Index()
	@Column('enum', {
		enum: notificationTypes,
		comment: 'The type of the Notification.',
	})
	public type: typeof notificationTypes[number];

	/**
	 * 通知が読まれたかどうか
	 */
	@Index()
	@Column('boolean', {
		default: false,
		comment: 'Whether the Notification is read.',
	})
	public isRead: boolean;

	@Column({
		...id(),
		nullable: true,
	})
	public noteId: Note['id'] | null;

	@ManyToOne(() => Note, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: Note | null;

	@Column({
		...id(),
		nullable: true,
	})
	public followRequestId: FollowRequest['id'] | null;

	@ManyToOne(() => FollowRequest, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public followRequest: FollowRequest | null;

	@Column({
		...id(),
		nullable: true,
	})
	public userGroupInvitationId: UserGroupInvitation['id'] | null;

	@ManyToOne(() => UserGroupInvitation, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public userGroupInvitation: UserGroupInvitation | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public reaction: string | null;

	@Column('integer', {
		nullable: true,
	})
	public choice: number | null;

	@Column({
		...id(),
		nullable: true,
		comment: 'The ID of the moved to account.',
	})
	public moveTargetId: User['id'] | null;

	@ManyToOne(() => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public moveTarget: User | null;

	/**
	 * アプリ通知のbody
	 */
	@Column('varchar', {
		length: 2048, nullable: true,
	})
	public customBody: string | null;

	/**
	 * アプリ通知のheader
	 * (省略時はアプリ名で表示されることを期待)
	 */
	@Column('varchar', {
		length: 256, nullable: true,
	})
	public customHeader: string | null;

	/**
	 * アプリ通知のicon(URL)
	 * (省略時はアプリアイコンで表示されることを期待)
	 */
	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public customIcon: string | null;

	/**
	 * アプリ通知のアプリ(のトークン)
	 */
	@Index()
	@Column({
		...id(),
		nullable: true,
	})
	public appAccessTokenId: AccessToken['id'] | null;

	@ManyToOne(() => AccessToken, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public appAccessToken: AccessToken | null;
}

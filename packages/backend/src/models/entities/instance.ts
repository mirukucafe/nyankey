import { Entity, PrimaryColumn, Index, Column } from 'typeorm';
import { id } from '../id.js';

@Entity()
export class Instance {
	@PrimaryColumn(id())
	public id: string;

	/**
	 * Date and time this instance was first seen.
	 */
	@Index()
	@Column('timestamp with time zone', {
		comment: 'The caught date of the Instance.',
	})
	public caughtAt: Date;

	/**
	 * Hostname
	 */
	@Index({ unique: true })
	@Column('varchar', {
		length: 128,
		comment: 'The host of the Instance.',
	})
	public host: string;

	/**
	 * Number of users on this instance.
	 */
	@Column('integer', {
		default: 0,
		comment: 'The count of the users of the Instance.',
	})
	public usersCount: number;

	/**
	 * Number of notes on this instance.
	 */
	@Column('integer', {
		default: 0,
		comment: 'The count of the notes of the Instance.',
	})
	public notesCount: number;

	/**
	 * Number of local users who are followed by users from this instance.
	 */
	@Column('integer', {
		default: 0,
	})
	public followingCount: number;

	/**
	 * Number of users from this instance who are followed by local users.
	 */
	@Column('integer', {
		default: 0,
	})
	public followersCount: number;

	/**
	 * Timestamp of the latest outgoing HTTP request.
	 */
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public latestRequestSentAt: Date | null;

	/**
	 * HTTP status code that was received for the last outgoing HTTP request.
	 */
	@Column('integer', {
		nullable: true,
	})
	public latestStatus: number | null;

	/**
	 * Timestamp of the latest incoming HTTP request.
	 */
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public latestRequestReceivedAt: Date | null;

	/**
	 * Timestamp of last communication with this instance (incoming or outgoing).
	 */
	@Column('timestamp with time zone')
	public lastCommunicatedAt: Date;

	/**
	 * Whether this instance seems unresponsive.
	 */
	@Column('boolean', {
		default: false,
	})
	public isNotResponding: boolean;

	/**
	 * Whether sending activities to this instance has been suspended.
	 */
	@Index()
	@Column('boolean', {
		default: false,
	})
	public isSuspended: boolean;

	@Column('varchar', {
		length: 64, nullable: true,
		comment: 'The software of the Instance.',
	})
	public softwareName: string | null;

	@Column('varchar', {
		length: 64, nullable: true,
	})
	public softwareVersion: string | null;

	@Column('boolean', {
		nullable: true,
	})
	public openRegistrations: boolean | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public name: string | null;

	@Column('varchar', {
		length: 4096, nullable: true,
	})
	public description: string | null;

	@Column('varchar', {
		length: 128, nullable: true,
	})
	public maintainerName: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public maintainerEmail: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public iconUrl: string | null;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public faviconUrl: string | null;

	@Column('varchar', {
		length: 64, nullable: true,
	})
	public themeColor: string | null;

	@Column('timestamp with time zone', {
		nullable: true,
	})
	public infoUpdatedAt: Date | null;
}

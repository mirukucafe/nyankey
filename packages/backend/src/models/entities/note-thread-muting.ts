import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { noteNotificationTypes } from 'foundkey-js';
import { id } from '../id.js';
import { User } from './user.js';

@Entity()
@Index(['userId', 'threadId'], { unique: true })
export class NoteThreadMuting {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
	})
	public userId: User['id'];

	@ManyToOne(() => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('varchar', {
		length: 256,
	})
	public threadId: string;

	@Column('enum', {
		enum: noteNotificationTypes,
		array: true,
		default: [],
	})
	public mutingNotificationTypes: typeof noteNotificationTypes[number][];
}

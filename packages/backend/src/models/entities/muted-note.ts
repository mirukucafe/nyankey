import { Entity, Index, JoinColumn, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { mutedNoteReasons } from 'foundkey-js';
import { id } from '../id.js';
import { Note } from './note.js';
import { User } from './user.js';

@Entity()
@Index(['noteId', 'userId'], { unique: true })
export class MutedNote {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The note ID.',
	})
	public noteId: Note['id'];

	@ManyToOne(() => Note, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public note: Note | null;

	@Index()
	@Column({
		...id(),
		comment: 'The user ID.',
	})
	public userId: User['id'];

	@ManyToOne(() => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	/**
	 * ミュートされた理由。
	 */
	@Index()
	@Column('enum', {
		enum: mutedNoteReasons,
		comment: 'The reason of the MutedNote.',
	})
	public reason: typeof mutedNoteReasons[number];
}

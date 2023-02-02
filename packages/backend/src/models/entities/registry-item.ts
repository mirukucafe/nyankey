import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne, Unique } from 'typeorm';
import { id } from '../id.js';
import { User } from './user.js';

@Entity()
@Unique(['userId', 'key', 'scope'])
export class RegistryItem {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the RegistryItem.',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the RegistryItem.',
	})
	public updatedAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The owner ID.',
	})
	public userId: User['id'];

	@ManyToOne(() => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column('text', {
		comment: 'The key of the RegistryItem.',
	})
	public key: string;

	@Column('jsonb', {
		default: {}, nullable: true,
		comment: 'The value of the RegistryItem.',
	})
	public value: any | null;

	@Index()
	@Column('varchar', {
		length: 1024, array: true, default: '{}',
	})
	public scope: string[];
}

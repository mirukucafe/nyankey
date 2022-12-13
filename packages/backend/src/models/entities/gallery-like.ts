import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '../id.js';
import { User } from './user.js';
import { GalleryPost } from './gallery-post.js';

@Entity()
@Index(['userId', 'postId'], { unique: true })
export class GalleryLike {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Index()
	@Column(id())
	public userId: User['id'];

	@ManyToOne(() => User, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: User | null;

	@Column(id())
	public postId: GalleryPost['id'];

	@ManyToOne(() => GalleryPost, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public post: GalleryPost | null;
}

import { Entity, PrimaryColumn, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../id.js';
import { AccessToken } from './access-token.js';
import { App } from './app.js';

@Entity()
export class AuthSession {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the AuthSession.',
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 128,
	})
	public token: string;

	@Column({
		...id(),
		nullable: true,
	})
	public accessTokenId: AccessToken['id'] | null;

	@ManyToOne(() => AccessToken, {
		onDelete: 'CASCADE',
		nullable: true,
	})
	@JoinColumn()
	public accessToken: AccessToken | null;

	@Column(id())
	public appId: App['id'];

	@ManyToOne(() => App, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public app: App | null;

	@Column('text', {
		nullable: true,
		comment: 'PKCE code_challenge value, if provided (OAuth only)',
	})
		pkceChallenge: string | null;
}

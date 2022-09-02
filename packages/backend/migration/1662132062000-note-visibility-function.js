export class noteVisibilityFunction1662132062000 {
	name = 'noteVisibilityFunction1662132062000';

	async up(queryRunner) {
		await queryRunner.query(`
			CREATE OR REPLACE FUNCTION note_visible(note_id varchar, user_id varchar) RETURNS BOOLEAN
			LANGUAGE SQL
			STABLE
			CALLED ON NULL INPUT
			AS $$
				SELECT CASE
					WHEN note_id IS NULL THEN TRUE
					WHEN NOT EXISTS (SELECT 1 FROM note WHERE id = note_id) THEN FALSE
					WHEN user_id IS NULL THEN (
						-- simplified check without logged in user
						SELECT
							visibility IN ('public', 'home')
							-- check reply / renote recursively
							AND note_visible("replyId", NULL)
							AND note_visible("renoteId", NULL)
						FROM note WHERE note.id = note_id
					) ELSE (
						SELECT
							(
								visibility IN ('public', 'home')
								OR
								user_id = "userId"
								OR
								user_id = ANY("visibleUserIds")
								OR
								user_id = ANY("mentions")
								OR (
									visibility = 'followers'
									AND
									EXISTS (
										SELECT 1 FROM following WHERE "followeeId" = "userId" AND "followerId" = user_id
									)
								)
							)
							-- check reply / renote recursively
							AND note_visible("replyId", user_id)
							AND note_visible("renoteId", user_id)
						FROM note WHERE note.id = note_id
					)
				END;
			$$;
		`);
	}

	async down(queryRunner) {
		await queryRunner.query('DROP FUNCTION note_visible');
	}
}

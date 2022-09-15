/**
 * Possible visibilities of notes.
 * Ordered most public first.
 */
export const noteVisibilities = ['public', 'home', 'followers', 'specified'] as const;

export type NoteVisibility = typeof noteVisibilities[number];

export function minVisibility(a: NoteVisibility, b: NoteVisibility): NoteVisibility {
	return noteVisibilities[
		// larger index means more private, so pick the largest index
		Math.max(
			noteVisibilities.indexOf(a),
			noteVisibilities.indexOf(b),
		)
	];
}

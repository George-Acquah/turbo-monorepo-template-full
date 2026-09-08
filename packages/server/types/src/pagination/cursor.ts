/** Utilities for cursor encoding/decoding used by cursor pagination implementations */
export type Cursor = string;

export interface EncodedCursor {
	id: string;
	t: number; // timestamp
}

export function encodeCursor(payload: EncodedCursor): Cursor {
	return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(cursor: Cursor): EncodedCursor | null {
	try {
		const raw = Buffer.from(cursor, 'base64url').toString('utf8');
		return JSON.parse(raw) as EncodedCursor;
	} catch {
		return null;
	}
}

// Time constants
export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 365 * DAY;

// List of file types allowed to be viewed directly in the browser.
// Anything not included here will be reported as application/octet-stream
// SVG is not allowed because it can lead to XSS
export const FILE_TYPE_BROWSERSAFE = [
	// Images
	'image/png',
	'image/gif',
	'image/jpeg',
	'image/webp',
	'image/apng',
	'image/bmp',
	'image/tiff',
	'image/x-icon',

	// OggS
	'audio/opus',
	'video/ogg',
	'audio/ogg',
	'application/ogg',

	// ISO/IEC base media file format
	'video/quicktime',
	'video/mp4',
	'audio/mp4',
	'video/x-m4v',
	'audio/x-m4a',
	'video/3gpp',
	'video/3gpp2',

	'video/mpeg',
	'audio/mpeg',

	'video/webm',
	'audio/webm',

	'audio/aac',
	'audio/x-flac',
	'audio/vnd.wave',
];

export const FILE_EXT_TRACKER_MODULES = [
	'mod',
	's3m',
	'xm',
	'it',
	'mptm',
	'stm',
	'nst',
	'm15',
	'stk',
	'wow',
	'ult',
	'669',
	'mtm',
	'med',
	'far',
	'mdl',
	'ams',
	'dsm',
	'amf',
	'okt',
	'dmf',
	'ptm',
	'psm',
	'mt2',
	'dbm',
	'digi',
	'imf',
	'j2b',
	'gdm',
	'umx',
	'plm',
	'mo3',
	'xpk',
	'ppm',
	'mmcmp'
];
/*
https://github.com/sindresorhus/file-type/blob/main/supported.js
https://github.com/sindresorhus/file-type/blob/main/core.js
https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers
*/

export const LOG_LEVELS = {
	error: 5,
	warning: 4,
	success: 3,
	info: 2,
	debug: 1,
};

export const envOption = {
	onlyQueue: false,
	onlyServer: false,
	noDaemons: false,
	disableClustering: false,
	verbose: false,
	withLogTime: false,
	quiet: false,
	slow: false,
	logLevel: LOG_LEVELS.info,
};

for (const key of Object.keys(envOption) as (keyof typeof envOption)[]) {
	const value = process.env['MK_' + key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()];
	if (value) {
		if (key === 'logLevel') {
			if (value.toLowerCase() in LOG_LEVELS) {
				envOption.logLevel = LOG_LEVELS[value.toLowerCase()];
			}
			console.log('Unknown log level ' + JSON.stringify(value.toLowerCase()) + ', defaulting to "info"');
		} else {
			envOption[key] = true;
		}
	}
}

if (process.env.NODE_ENV === 'test') envOption.disableClustering = true;
if (process.env.NODE_ENV === 'test') envOption.quiet = true;
if (process.env.NODE_ENV === 'test') envOption.noDaemons = true;

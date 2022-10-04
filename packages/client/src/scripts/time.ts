import { DAY, HOUR } from '@/const';

const dateTimeIntervals = {
	'day': DAY,
	'hour': HOUR,
	'ms': 1,
};

export function addTime(x: Date, value: number, span: keyof typeof dateTimeIntervals = 'ms'): Date {
	return new Date(x.getTime() + (value * dateTimeIntervals[span]));
}

export function subtractTime(x: Date, value: number, span: keyof typeof dateTimeIntervals = 'ms'): Date {
	return new Date(x.getTime() - (value * dateTimeIntervals[span]));
}

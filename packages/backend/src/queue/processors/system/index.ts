import Bull from 'bull';
import { tickCharts } from './tick-charts.js';
import { resyncCharts } from './resync-charts.js';
import { cleanCharts } from './clean-charts.js';
import { checkExpired } from './check-expired.js';

const jobs = {
	tickCharts,
	resyncCharts,
	cleanCharts,
	checkExpired,
} as Record<string, Bull.ProcessCallbackFunction<Record<string, unknown>> | Bull.ProcessPromiseFunction<Record<string, unknown>>>;

export default function(dbQueue: Bull.Queue<Record<string, unknown>>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}

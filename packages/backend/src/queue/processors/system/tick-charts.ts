import Bull from 'bull';

import { activeUsersChart, driveChart, federationChart, hashtagChart, instanceChart, notesChart, perUserDriveChart, perUserFollowingChart, perUserNotesChart, perUserReactionsChart, usersChart, apRequestChart } from '@/services/chart/index.js';
import { queueLogger } from '@/queue/logger.js';

const logger = queueLogger.createSubLogger('tick-charts');

export async function tickCharts(job: Bull.Job<Record<string, unknown>>, done: any): Promise<void> {
	logger.info('Tick charts...');

	await Promise.all([
		federationChart.tick(false),
		notesChart.tick(false),
		usersChart.tick(false),
		activeUsersChart.tick(false),
		instanceChart.tick(false),
		perUserNotesChart.tick(false),
		driveChart.tick(false),
		perUserReactionsChart.tick(false),
		hashtagChart.tick(false),
		perUserFollowingChart.tick(false),
		perUserDriveChart.tick(false),
		apRequestChart.tick(false),
	]);

	logger.succ('All charts successfully ticked.');
	done();
}

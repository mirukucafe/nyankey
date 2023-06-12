import main from './main.js';
import homeTimeline from './home-timeline.js';
import localTimeline from './local-timeline.js';
import hybridTimeline from './hybrid-timeline.js';
import globalTimeline from './global-timeline.js';
import serverStats from './server-stats.js';
import queueStats from './queue-stats.js';
import userList from './user-list.js';
import antenna from './antenna.js';
import messaging from './messaging.js';
import messagingIndex from './messaging-index.js';
import drive from './drive.js';
import hashtag from './hashtag.js';
import channel from './channel.js';
import admin from './admin.js';

export const channels: Record<string, Channel> = {
	'main': main,
	'homeTimeline': homeTimeline,
	'localTimeline': localTimeline,
	'hybridTimeline': hybridTimeline,
	'globalTimeline': globalTimeline,
	'serverStats': serverStats,
	'queueStats': queueStats,
	'userList': userList,
	'antenna': antenna,
	'messaging': messaging,
	'messagingIndex': messagingIndex,
	'drive': drive,
	'hashtag': hashtag,
	'channel': channel,
	'admin': admin,
};

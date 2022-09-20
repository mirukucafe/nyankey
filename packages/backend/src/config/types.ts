/**
 * IP address family
 */
export type IpFamily = 'ipv4' | 'ipv6' | 'dual';

/**
 * Configuration options set up by the user
 */
export type Source = {
	repository_url?: string;
	feedback_url?: string;
	url: string;
	port: number;
	disableHsts?: boolean;
	db: {
		host: string;
		port: number;
		db: string;
		user: string;
		pass: string;
		disableCache?: boolean;
		extra?: { [x: string]: string };
	};
	redis: {
		host: string;
		port: number;
		family?: number | IpFamily;
		pass: string;
		db?: number;
		prefix?: string;
	};
	elasticsearch: {
		host: string;
		port: number;
		ssl?: boolean;
		user?: string;
		pass?: string;
		index?: string;
	};

	proxy?: string;
	proxySmtp?: string;
	proxyBypassHosts?: string[];

	allowedPrivateNetworks?: string[];

	maxFileSize?: number;

	accesslog?: string;

	clusterLimit?: number;

	id: string;

	outgoingAddressFamily?: IpFamily;

	deliverJobConcurrency?: number;
	inboxJobConcurrency?: number;
	deliverJobPerSec?: number;
	inboxJobPerSec?: number;
	deliverJobMaxAttempts?: number;
	inboxJobMaxAttempts?: number;

	syslog: {
		host: string;
		port: number;
	};

	mediaProxy?: string;
	proxyRemoteFiles?: boolean;
	internalStoragePath?: string;
};

/**
 * Information that FoundKey automatically sets (by inference from information set by the user)
 */
export type Mixin = {
	version: string;
	host: string;
	hostname: string;
	scheme: string;
	wsScheme: string;
	apiUrl: string;
	wsUrl: string;
	authUrl: string;
	driveUrl: string;
	userAgent: string;
	clientEntry: string;
};

export type Config = Source & Mixin;

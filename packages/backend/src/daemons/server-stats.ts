import si from 'systeminformation';
import Xev from 'xev';
import * as osUtils from 'os-utils';

const ev = new Xev();

const interval = 2000;

const roundCpu = (num: number): number => Math.round(num * 1000) / 1000;
const round = (num: number): number => Math.round(num * 10) / 10;

/**
 * Report server stats regularly
 */
export function serverStats(): void {
	const log: Record<string, Record<string, number> | number>[] = [];

	ev.on('requestServerStatsLog', x => {
		ev.emit(`serverStatsLog:${x.id}`, log.slice(0, x.length || 50));
	});

	async function tick(): Promise<void> {
		const cpu = await cpuUsage();
		const memStats = await mem();
		const netStats = await net();
		const fsStats = await fs();

		const stats = {
			cpu: roundCpu(cpu),
			mem: {
				used: round(memStats.used - memStats.buffers - memStats.cached),
				active: round(memStats.active),
			},
			net: {
				rx: round(Math.max(0, netStats.rx_sec)),
				tx: round(Math.max(0, netStats.tx_sec)),
			},
			fs: {
				r: round(Math.max(0, fsStats.rIO_sec ?? 0)),
				w: round(Math.max(0, fsStats.wIO_sec ?? 0)),
			},
		};
		ev.emit('serverStats', stats);
		log.unshift(stats);
		if (log.length > 200) log.pop();
	}

	tick();

	setInterval(tick, interval);
}

// CPU STAT
function cpuUsage(): Promise<number> {
	return new Promise((res) => {
		osUtils.cpuUsage((cpuUsage) => {
			res(cpuUsage);
		});
	});
}

// MEMORY STAT
async function mem(): Promise<si.Systeminformation.MemData> {
	const data = await si.mem();
	return data;
}

// NETWORK STAT
async function net(): Promise<si.Systeminformation.NetworkStatsData> {
	const iface = await si.networkInterfaceDefault();
	const data = await si.networkStats(iface);
	return data[0];
}

// FS STAT
async function fs(): Promise<si.Systeminformation.DisksIoData | {
	rIO_sec: number;
	wIO_sec: number;
}> {
	const data = await si.disksIO().catch(() => ({ rIO_sec: 0, wIO_sec: 0 }));
	return data;
}

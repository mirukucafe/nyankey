/**
 * chart engine
 *
 * Tests located in test/chart
 */

import * as nestedProperty from 'nested-property';
import { EntitySchema, Repository, LessThan, Between } from 'typeorm';
import { isTimeSame, isTimeBefore, subtractTime, addTime } from '@/prelude/time.js';
import { unique } from '@/prelude/array.js';
import { getChartInsertLock } from '@/misc/app-lock.js';
import { db } from '@/db/postgre.js';
import Logger from '../logger.js';

const logger = new Logger('chart', 'white', process.env.NODE_ENV !== 'test');

const columnPrefix = '___' as const;
const uniqueTempColumnPrefix = 'unique_temp___' as const;
const columnDot = '_' as const;

type Schema = Record<string, {
	uniqueIncrement?: boolean;

	intersection?: string[] | ReadonlyArray<string>;

	range?: 'big' | 'small' | 'medium';

	// Whether or not to accumulate with previous values.
	accumulate?: boolean;
}>;

type KeyToColumnName<T extends string> = T extends `${infer R1}.${infer R2}` ? `${R1}${typeof columnDot}${KeyToColumnName<R2>}` : T;

type Columns<S extends Schema> = {
	[K in keyof S as `${typeof columnPrefix}${KeyToColumnName<string & K>}`]: number;
};

type TempColumnsForUnique<S extends Schema> = {
	[K in keyof S as `${typeof uniqueTempColumnPrefix}${KeyToColumnName<string & K>}`]: S[K]['uniqueIncrement'] extends true ? string[] : never;
};

type RawRecord<S extends Schema> = {
	id: number;

	/**
	 * aggregation group
	 */
	group?: string | null;

	/**
	 * Unix epoch timestamp (seconds) of aggregation
	 */
	date: number;
} & TempColumnsForUnique<S> & Columns<S>;

const camelToSnake = (str: string): string => {
	return str.replace(/([A-Z])/g, s => '_' + s.charAt(0).toLowerCase());
};

type Commit<S extends Schema> = {
	[K in keyof S]?: S[K]['uniqueIncrement'] extends true ? string[] : number;
};

export type KVs<S extends Schema> = {
	[K in keyof S]: number;
};

type ChartResult<T extends Schema> = {
	[P in keyof T]: number[];
};

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

type UnflattenSingleton<K extends string, V> = K extends `${infer A}.${infer B}`
	? { [_ in A]: UnflattenSingleton<B, V>; }
	: { [_ in K]: V; };

type Unflatten<T extends Record<string, any>> = UnionToIntersection<
	{
		[K in Extract<keyof T, string>]: UnflattenSingleton<K, T[K]>;
	}[Extract<keyof T, string>]
>;

type ToJsonSchema<S> = {
	type: 'object';
	properties: {
		[K in keyof S]: S[K] extends number[] ? { type: 'array'; items: { type: 'number'; }; } : ToJsonSchema<S[K]>;
	},
	required: (keyof S)[];
};

export function getJsonSchema<S extends Schema>(schema: S): ToJsonSchema<Unflatten<ChartResult<S>>> {
	const jsonSchema = {
		type: 'object',
		properties: {} as Record<string, unknown>,
		required: [],
	};

	for (const k in schema) {
		jsonSchema.properties[k] = {
			type: 'array',
			items: { type: 'number' },
		};
	}

	return jsonSchema as ToJsonSchema<Unflatten<ChartResult<S>>>;
}

/**
 * Parent class of all charts that governs how they run in general.
 */
// eslint-disable-next-line import/no-default-export
export default abstract class Chart<T extends Schema> {
	public schema: T;

	private name: string;
	private buffer: {
		diff: Commit<T>;
		group: string | null;
	}[] = [];

	/*
	 * The following would be nice but it gives a type error when used with findOne
	 *private repositoryForHour: Repository<RawRecord<T>>;
	 *private repositoryForDay: Repository<RawRecord<T>>;
	 */

	private repositoryForHour: Repository<{ id: number; group?: string | null; date: number; }>;
	private repositoryForDay: Repository<{ id: number; group?: string | null; date: number; }>;

	/**
	 * Computation to run once a day. Intended to fix discrepancies e.g. due to cascaded deletes or other changes that were missed.
	 */
	protected abstract tickMajor(group: string | null): Promise<Partial<KVs<T>>>;

	/**
	 * A smaller computation that should be run once per lowest time interval.
	 */
	protected abstract tickMinor(group: string | null): Promise<Partial<KVs<T>>>;

	private static convertSchemaToColumnDefinitions(schema: Schema): Record<string, { type: string; array?: boolean; default?: any; }> {
		const columns = {} as Record<string, { type: string; array?: boolean; default?: any; }>;
		for (const [k, v] of Object.entries(schema)) {
			const name = k.replaceAll('.', columnDot);
			const type = v.range === 'big' ? 'bigint' : v.range === 'small' ? 'smallint' : 'integer';
			if (v.uniqueIncrement) {
				columns[uniqueTempColumnPrefix + name] = {
					type: 'varchar',
					array: true,
					default: '{}',
				};
				columns[columnPrefix + name] = {
					type,
					default: 0,
				};
			} else {
				columns[columnPrefix + name] = {
					type,
					default: 0,
				};
			}
		}
		return columns;
	}

	private static dateToTimestamp(x: Date): number {
		return Math.floor(x.getTime() / 1000);
	}

	private static parseDate(date: Date): [number, number, number, number, number, number, number] {
		const y = date.getUTCFullYear();
		const m = date.getUTCMonth();
		const d = date.getUTCDate();
		const h = date.getUTCHours();
		const _m = date.getUTCMinutes();
		const _s = date.getUTCSeconds();
		const _ms = date.getUTCMilliseconds();

		return [y, m, d, h, _m, _s, _ms];
	}

	private static getCurrentDate() {
		return Chart.parseDate(new Date());
	}

	public static schemaToEntity(name: string, schema: Schema, grouped = false): {
		hour: EntitySchema,
		day: EntitySchema,
	} {
		const createEntity = (span: 'hour' | 'day'): EntitySchema => new EntitySchema({
			name:
				span === 'hour' ? `__chart__${camelToSnake(name)}` :
				span === 'day' ? `__chart_day__${camelToSnake(name)}` :
				new Error('not happen') as never,
			columns: {
				id: {
					type: 'integer',
					primary: true,
					generated: true,
				},
				date: {
					type: 'integer',
				},
				...(grouped ? {
					group: {
						type: 'varchar',
						length: 128,
					},
				} : {}),
				...Chart.convertSchemaToColumnDefinitions(schema),
			},
			indices: [{
				columns: grouped ? ['date', 'group'] : ['date'],
				unique: true,
			}],
			uniques: [{
				columns: grouped ? ['date', 'group'] : ['date'],
			}],
			relations: {
				/* TODO
					group: {
						target: () => Foo,
						type: 'many-to-one',
						onDelete: 'CASCADE',
					},
				*/
			},
		});

		return {
			hour: createEntity('hour'),
			day: createEntity('day'),
		};
	}

	constructor(name: string, schema: T, grouped = false) {
		this.name = name;
		this.schema = schema;

		const { hour, day } = Chart.schemaToEntity(name, schema, grouped);
		this.repositoryForHour = db.getRepository<{ id: number; group?: string | null; date: number; }>(hour);
		this.repositoryForDay = db.getRepository<{ id: number; group?: string | null; date: number; }>(day);
	}

	private convertRawRecord(x: RawRecord<T>): KVs<T> {
		const kvs = {} as Record<string, number>;
		for (const k of Object.keys(x).filter((k) => k.startsWith(columnPrefix)) as (keyof Columns<T>)[]) {
			kvs[(k as string).substr(columnPrefix.length).split(columnDot).join('.')] = x[k];
		}
		return kvs as KVs<T>;
	}

	private getNewLog(latest: KVs<T> | null): KVs<T> {
		const log = {} as Record<keyof T, number>;
		for (const [k, v] of Object.entries(this.schema) as ([keyof typeof this['schema'], this['schema'][string]])[]) {
			if (v.accumulate && latest) {
				log[k] = latest[k];
			} else {
				log[k] = 0;
			}
		}
		return log as KVs<T>;
	}

	private getLatestLog(group: string | null, span: 'hour' | 'day'): Promise<RawRecord<T> | null> {
		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
			new Error('not happen') as never;

		return repository.findOne({
			where: group ? { group } : {},
			order: {
				date: -1,
			},
		}).then(x => x ?? null) as Promise<RawRecord<T> | null>;
	}

	/**
	 * Search the database for the current (=current Hour or Day) log and return it if available, otherwise create and return it.
	 */
	private async claimCurrentLog(group: string | null, span: 'hour' | 'day'): Promise<RawRecord<T>> {
		const [y, m, d, h] = Chart.getCurrentDate();

		const current = new Date(Date.UTC(...(
			span === 'hour' ? [y, m, d, h] :
			span === 'day' ? [y, m, d] :
			new Error('not happen') as never)));

		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
			new Error('not happen') as never;

		// current hour or day log entry
		const currentLog = await repository.findOneBy({
			date: Chart.dateToTimestamp(current),
			...(group ? { group } : {}),
		}) as RawRecord<T> | undefined;

		// If logs are available, return them and exit.
		if (currentLog != null) {
			return currentLog;
		}

		let log: RawRecord<T>;
		let data: KVs<T>;

		// If this is the first chart update since the start of the aggregation period,
		// use the most recent log entry.
		//
		// For example, if the aggregation period is "day", if nothing happened yesterday
		// to change the chart, the log entry is not created in the first place. So "most
		// recent" is used instead of "yesterdays" because there might be missing log
		// entries.
		const latest = await this.getLatestLog(group, span);

		if (latest != null) {
			// Create empty log data
			data = this.getNewLog(this.convertRawRecord(latest));
		} else {
			// if the log did not exist.
			// (e.g., when updating a chart for the first time after building a FoundKey instance)

			// Create initial log data
			data = this.getNewLog(null);

			logger.info(`${this.name + (group ? `:${group}` : '')}(${span}): Initial commit created`);
		}

		const date = Chart.dateToTimestamp(current);
		const lockKey = group ? `${this.name}:${date}:${span}:${group}` : `${this.name}:${date}:${span}`;

		const unlock = await getChartInsertLock(lockKey);
		try {
			// check once more now that we're holding the lock
			const currentLog = await repository.findOneBy({
				date,
				...(group ? { group } : {}),
			}) as RawRecord<T> | undefined;

			// if log entries are available now, return them and exit
			if (currentLog != null) return currentLog;

			const columns = {} as Record<string, number | unknown[]>;
			for (const [k, v] of Object.entries(data)) {
				const name = k.replaceAll('.', columnDot);
				columns[columnPrefix + name] = v;
			}

			// insert new entries
			log = await repository.insert({
				date,
				...(group ? { group } : {}),
				...columns,
			}).then(x => repository.findOneByOrFail(x.identifiers[0])) as RawRecord<T>;

			logger.info(`${this.name + (group ? `:${group}` : '')}(${span}): New commit created`);

			return log;
		} finally {
			unlock();
		}
	}

	protected commit(diff: Commit<T>, group: string | null = null): void {
		for (const [k, v] of Object.entries(diff)) {
			if (v == null || v === 0 || (Array.isArray(v) && v.length === 0)) delete diff[k];
		}
		this.buffer.push({
			diff, group,
		});
	}

	public async save(): Promise<void> {
		if (this.buffer.length === 0) {
			logger.info(`${this.name}: Write skipped`);
			return;
		}

		// TODO: handling of previous time logs in buffer

		// For example, suppose that a save is performed every 20 minutes, and the last
		// save was performed at 01:50. If a new log is added to the buffer at 01:55, the
		// next save will take place at 02:10, and if the new log is added to the buffer
		// at 01:55, then If a new log is added to the buffer at 01:55, the log is
		// treated as a 02:00~ log, even though it should be saved as a 01:00~ log. The
		// implementation to work around this is pending, as it would be complicated.

		const update = async (logHour: RawRecord<T>, logDay: RawRecord<T>): Promise<void> => {
			const finalDiffs = {} as Record<string, number | string[]>;

			for (const diff of this.buffer.filter(q => q.group == null || (q.group === logHour.group)).map(q => q.diff)) {
				for (const [k, v] of Object.entries(diff)) {
					if (finalDiffs[k] == null) {
						finalDiffs[k] = v;
					} else {
						if (typeof finalDiffs[k] === 'number') {
							(finalDiffs[k] as number) += v as number;
						} else {
							(finalDiffs[k] as string[]) = (finalDiffs[k] as string[]).concat(v);
						}
					}
				}
			}

			const queryForHour: Record<keyof RawRecord<T>, number | (() => string)> = {} as any;
			const queryForDay: Record<keyof RawRecord<T>, number | (() => string)> = {} as any;
			for (const [k, v] of Object.entries(finalDiffs)) {
				if (typeof v === 'number') {
					const name = columnPrefix + k.replaceAll('.', columnDot) as keyof Columns<T>;
					if (v > 0) queryForHour[name] = () => `"${name}" + ${v}`;
					if (v < 0) queryForHour[name] = () => `"${name}" - ${Math.abs(v)}`;
					if (v > 0) queryForDay[name] = () => `"${name}" + ${v}`;
					if (v < 0) queryForDay[name] = () => `"${name}" - ${Math.abs(v)}`;
				} else if (Array.isArray(v) && v.length > 0) { // unique increment
					const tempColumnName = uniqueTempColumnPrefix + k.replaceAll('.', columnDot) as keyof TempColumnsForUnique<T>;
					// TODO: SQL escape for item
					const itemsForHour = v.filter(item => !logHour[tempColumnName].includes(item)).map(item => `"${item}"`);
					const itemsForDay = v.filter(item => !logDay[tempColumnName].includes(item)).map(item => `"${item}"`);
					if (itemsForHour.length > 0) queryForHour[tempColumnName] = () => `array_cat("${tempColumnName}", '{${itemsForHour.join(',')}}'::varchar[])`;
					if (itemsForDay.length > 0) queryForDay[tempColumnName] = () => `array_cat("${tempColumnName}", '{${itemsForDay.join(',')}}'::varchar[])`;
				}
			}

			// bake unique count
			for (const [k, v] of Object.entries(finalDiffs)) {
				if (this.schema[k].uniqueIncrement) {
					const name = columnPrefix + k.replaceAll('.', columnDot) as keyof Columns<T>;
					const tempColumnName = uniqueTempColumnPrefix + k.replaceAll('.', columnDot) as keyof TempColumnsForUnique<T>;
					queryForHour[name] = new Set([...(v as string[]), ...logHour[tempColumnName]]).size;
					queryForDay[name] = new Set([...(v as string[]), ...logDay[tempColumnName]]).size;
				}
			}

			// compute intersection
			// TODO: what to do if the column specified for intersection is an intersection itself
			for (const [k, v] of Object.entries(this.schema)) {
				const intersection = v.intersection;
				if (intersection) {
					const name = columnPrefix + k.replaceAll('.', columnDot) as keyof Columns<T>;
					const firstKey = intersection[0];
					const firstTempColumnName = uniqueTempColumnPrefix + firstKey.replaceAll('.', columnDot) as keyof TempColumnsForUnique<T>;
					const firstValues = finalDiffs[firstKey] as string[] | undefined;
					const currentValuesForHour = new Set([...(firstValues ?? []), ...logHour[firstTempColumnName]]);
					const currentValuesForDay = new Set([...(firstValues ?? []), ...logDay[firstTempColumnName]]);
					for (let i = 1; i < intersection.length; i++) {
						const targetKey = intersection[i];
						const targetTempColumnName = uniqueTempColumnPrefix + targetKey.replaceAll('.', columnDot) as keyof TempColumnsForUnique<T>;
						const targetValues = finalDiffs[targetKey] as string[] | undefined;
						const targetValuesForHour = new Set([...(targetValues ?? []), ...logHour[targetTempColumnName]]);
						const targetValuesForDay = new Set([...(targetValues ?? []), ...logDay[targetTempColumnName]]);
						currentValuesForHour.forEach(v => {
							if (!targetValuesForHour.has(v)) currentValuesForHour.delete(v);
						});
						currentValuesForDay.forEach(v => {
							if (!targetValuesForDay.has(v)) currentValuesForDay.delete(v);
						});
					}
					queryForHour[name] = currentValuesForHour.size;
					queryForDay[name] = currentValuesForDay.size;
				}
			}

			// update log
			await Promise.all([
				this.repositoryForHour.createQueryBuilder()
					.update()
					.set(queryForHour as any)
					.where('id = :id', { id: logHour.id })
					.execute(),
				this.repositoryForDay.createQueryBuilder()
					.update()
					.set(queryForDay as any)
					.where('id = :id', { id: logDay.id })
					.execute(),
			]);

			logger.info(`${this.name + (logHour.group ? `:${logHour.group}` : '')}: Updated`);

			// TODO: do not delete anything new in the buffer since this round of processing began
			this.buffer = this.buffer.filter(q => q.group != null && (q.group !== logHour.group));
		};

		const groups = unique(this.buffer.map(log => log.group));

		await Promise.all(
			groups.map(group =>
				Promise.all([
					this.claimCurrentLog(group, 'hour'),
					this.claimCurrentLog(group, 'day'),
				]).then(([logHour, logDay]) =>
					update(logHour, logDay))));
	}

	public async tick(major: boolean, group: string | null = null): Promise<void> {
		const data = major ? await this.tickMajor(group) : await this.tickMinor(group);

		const columns = {} as Record<keyof Columns<T>, number>;
		for (const [k, v] of Object.entries(data) as ([keyof typeof data, number])[]) {
			const name = columnPrefix + (k as string).replaceAll('.', columnDot) as keyof Columns<T>;
			columns[name] = v;
		}

		if (Object.keys(columns).length === 0) {
			return;
		}

		const update = async (logHour: RawRecord<T>, logDay: RawRecord<T>): Promise<void> => {
			await Promise.all([
				this.repositoryForHour.createQueryBuilder()
					.update()
					.set(columns)
					.where('id = :id', { id: logHour.id })
					.execute(),
				this.repositoryForDay.createQueryBuilder()
					.update()
					.set(columns)
					.where('id = :id', { id: logDay.id })
					.execute(),
			]);
		};

		return Promise.all([
			this.claimCurrentLog(group, 'hour'),
			this.claimCurrentLog(group, 'day'),
		]).then(([logHour, logDay]) =>
			update(logHour, logDay));
	}

	public resync(group: string | null = null): Promise<void> {
		return this.tick(true, group);
	}

	public async clean(): Promise<void> {
		const current = new Date(Date.UTC(...Chart.getCurrentDate()));

		// more than 1 day and less than 3 days
		const gt = Chart.dateToTimestamp(current) - (60 * 60 * 24 * 3);
		const lt = Chart.dateToTimestamp(current) - (60 * 60 * 24);

		const columns = {} as Record<keyof TempColumnsForUnique<T>, []>;
		for (const [k, v] of Object.entries(this.schema)) {
			if (v.uniqueIncrement) {
				const name = uniqueTempColumnPrefix + k.replaceAll('.', columnDot) as keyof TempColumnsForUnique<T>;
				columns[name] = [];
			}
		}

		if (Object.keys(columns).length === 0) {
			return;
		}

		await Promise.all([
			this.repositoryForHour.createQueryBuilder()
				.update()
				.set(columns)
				.where('date > :gt', { gt })
				.andWhere('date < :lt', { lt })
				.execute(),
			this.repositoryForDay.createQueryBuilder()
				.update()
				.set(columns)
				.where('date > :gt', { gt })
				.andWhere('date < :lt', { lt })
				.execute(),
		]);
	}

	public async getChartRaw(span: 'hour' | 'day', amount: number, cursor: Date | null, group: string | null = null): Promise<ChartResult<T>> {
		const [y, m, d, h, _m, _s, _ms] = cursor ? Chart.parseDate(subtractTime(addTime(cursor, 1, span), 1)) : Chart.getCurrentDate();
		const [y2, m2, d2, h2] = cursor ? Chart.parseDate(addTime(cursor, 1, span)) : [] as never;

		const lt = new Date(Date.UTC(y, m, d, h, _m, _s, _ms));

		const gt =
			span === 'day' ? subtractTime(cursor ? new Date(Date.UTC(y2, m2, d2, 0)) : new Date(Date.UTC(y, m, d, 0)), amount - 1, 'day') :
			span === 'hour' ? subtractTime(cursor ? new Date(Date.UTC(y2, m2, d2, h2)) : new Date(Date.UTC(y, m, d, h)), amount - 1, 'hour') :
			new Error('not happen') as never;

		const repository =
			span === 'hour' ? this.repositoryForHour :
			span === 'day' ? this.repositoryForDay :
			new Error('not happen') as never;

		// gathering logs
		let logs = await repository.find({
			where: {
				date: Between(Chart.dateToTimestamp(gt), Chart.dateToTimestamp(lt)),
				...(group ? { group } : {}),
			},
			order: {
				date: -1,
			},
		}) as RawRecord<T>[];

		// If there is no log entry in the requested range
		if (logs.length === 0) {
			// Use the most recent logs instead.
			// (At least 1 log entry is needed to fill the gap.)
			const recentLog = await repository.findOne({
				where: group ? { group } : {},
				order: {
					date: -1,
				},
			}) as RawRecord<T> | undefined;

			if (recentLog) {
				logs = [recentLog];
			}

		// If there is no log located at the earliest point in the requested range
		} else if (!isTimeSame(new Date(logs[logs.length - 1].date * 1000), gt)) {
			// Bring the most recent log as of the earliest point in the requested range and append it to the end.
			// (Due to inability to fill gaps)
			const outdatedLog = await repository.findOne({
				where: {
					date: LessThan(Chart.dateToTimestamp(gt)),
					...(group ? { group } : {}),
				},
				order: {
					date: -1,
				},
			}) as RawRecord<T> | undefined;

			if (outdatedLog) {
				logs.push(outdatedLog);
			}
		}

		const chart: KVs<T>[] = [];

		for (let i = (amount - 1); i >= 0; i--) {
			const current =
				span === 'hour' ? subtractTime(new Date(Date.UTC(y, m, d, h)), i, 'hour') :
				span === 'day' ? subtractTime(new Date(Date.UTC(y, m, d)), i, 'day') :
				new Error('not happen') as never;

			const log = logs.find(l => isTimeSame(new Date(l.date * 1000), current));

			if (log) {
				chart.unshift(this.convertRawRecord(log));
			} else {
				// fill in gaps
				const latest = logs.find(l => isTimeBefore(new Date(l.date * 1000), current));
				const data = latest ? this.convertRawRecord(latest) : null;
				chart.unshift(this.getNewLog(data));
			}
		}

		const res = {} as ChartResult<T>;

		// Turn array of objects into object of arrays.
		for (const record of chart) {
			for (const [k, v] of Object.entries(record) as ([keyof typeof record, number])[]) {
				if (res[k]) {
					res[k].push(v);
				} else {
					res[k] = [v];
				}
			}
		}

		return res;
	}

	public async getChart(span: 'hour' | 'day', amount: number, cursor: Date | null, group: string | null = null): Promise<Unflatten<ChartResult<T>>> {
		const result = await this.getChartRaw(span, amount, cursor, group);
		const object = {};
		for (const [k, v] of Object.entries(result)) {
			nestedProperty.set(object, k, v);
		}
		return object as Unflatten<ChartResult<T>>;
	}
}

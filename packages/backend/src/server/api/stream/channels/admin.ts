import Channel from '@/server/api/stream/channel.js';

export default class extends Channel {
	public readonly chName = 'admin';
	public static shouldShare = true;
	public static requireCredential = true;

	public async init() {
		// Subscribe admin stream
		this.subscriber.on(`adminStream:${this.user!.id}`, data => {
			this.send(data);
		});
	}
}

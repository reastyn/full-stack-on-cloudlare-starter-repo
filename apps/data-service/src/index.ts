import { WorkerEntrypoint } from 'cloudflare:workers';
import { App } from './hono/app';
import { initDatabase } from '@repo/data-ops/database';
import { QueueMessageSchema } from '@repo/data-ops/zod-schema/queue';
import { handleLinkClick } from './queue-handlers/link-clicks';

export default class DataService extends WorkerEntrypoint<Env> {
	constructor(ctx: ExecutionContext, env: Env) {
		super(ctx, env);
		initDatabase(env.DB);
	}
	fetch(request: Request) {
		return App.fetch(request, this.env, this.ctx);
	}
	async queue(batch: MessageBatch<unknown>): Promise<void> {
		for (const message of batch.messages) {
			const parsedEvent = QueueMessageSchema.safeParse(message.body);
			if (!parsedEvent.success) {
				console.error('Invalid message', parsedEvent.error);
				continue;
			}
			const event = parsedEvent.data;
			switch (event.type) {
				case 'LINK_CLICK':
					await handleLinkClick(this.env, event);
					break;
			}
		}
	}
}

export { DestinationEvaluationWorkflow } from './workflows/destination-evalutation-workflow';

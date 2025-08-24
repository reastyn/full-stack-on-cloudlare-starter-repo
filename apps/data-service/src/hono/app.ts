import { getDestinationForCountry, getRoutingDestinations } from '@/helpers/route-ops';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { Hono } from 'hono';

export const App = new Hono<{ Bindings: Env }>();

App.get('/:id', async (c) => {
	const link = await getRoutingDestinations(c.env, c.req.param('id'));
	if (!link) {
		return c.text('Link not found', 404);
	}
	const cfHeader = cloudflareInfoSchema.safeParse(c.req.raw.cf);
	if (!cfHeader.success) {
		return c.text('Invalid Cloudflare header', 400);
	}
	const headers = cfHeader.data;
	const destination = getDestinationForCountry(link, headers.country);
	return c.redirect(destination);
});

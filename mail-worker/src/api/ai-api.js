import app from '../hono/hono';
import aiService from '../service/ai-service';

app.post('/ai/chat', async (c) => {
	const params = await c.req.json();
	return await aiService.chatStream(c, params);
});

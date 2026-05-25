import app from '../hono/hono';
import folderService from '../service/folder-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.post('/folder/add', async (c) => {
	const data = await folderService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.put('/folder/update', async (c) => {
	await folderService.update(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/folder/delete', async (c) => {
	await folderService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/folder/list', async (c) => {
	const data = await folderService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

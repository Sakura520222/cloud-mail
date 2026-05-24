import app from '../hono/hono';
import reportService from '../service/report-service';
import result from '../model/result';
import BizError from '../error/biz-error';
import permService from '../service/perm-service';

app.get('/report/data', async (c) => {
	const user = c.get('user');
	const { year, month, timeZone, scope } = c.req.query();

	if (!year || !month) {
		throw new BizError('year and month are required', 400);
	}

	const reportScope = scope === 'admin' ? 'admin' : 'user';

	if (reportScope === 'admin') {
		const permKeys = await permService.userPermKeys(c, user.userId);
		if (!permKeys.includes('*') && !permKeys.includes('analysis:query')) {
			throw new BizError('unauthorized', 403);
		}
	}

	const params = {
		userId: user.userId,
		year: parseInt(year),
		month: parseInt(month),
		timeZone: timeZone || 'UTC',
		scope: reportScope
	};

	const data = await reportService.getReport(c, params);
	return c.json(result.ok(data));
});

app.post('/report/refresh', async (c) => {
	const user = c.get('user');
	const body = await c.req.json();
	const { year, month, scope } = body;

	if (!year || !month) {
		throw new BizError('year and month are required', 400);
	}

	const reportScope = scope === 'admin' ? 'admin' : 'user';

	if (reportScope === 'admin') {
		const permKeys = await permService.userPermKeys(c, user.userId);
		if (!permKeys.includes('*') && !permKeys.includes('analysis:query')) {
			throw new BizError('unauthorized', 403);
		}
	}

	const params = {
		userId: user.userId,
		year: parseInt(year),
		month: parseInt(month),
		timeZone: body.timeZone || 'UTC',
		scope: reportScope
	};

	const data = await reportService.refreshReport(c, params);
	return c.json(result.ok(data));
});

import reportDao from '../dao/report-dao';
import kvConst from '../const/kv-const';
import dayjs from 'dayjs';
import { toUtc } from '../utils/date-uitil';

const reportService = {

	async getReport(c, params) {
		const cacheKey = this.reportCacheKey(params);
		const cache = await c.env.kv.get(cacheKey, { type: 'json' });

		if (cache) {
			return cache;
		}

		return await this.refreshReportCacheByKey(c, params);
	},

	async refreshReportCacheByKey(c, params) {
		const data = await this.queryReport(c, params);
		await c.env.kv.put(this.reportCacheKey(params), JSON.stringify(data), { expirationTtl: 3600 });
		return data;
	},

	async refreshReport(c, params) {
		const cacheKey = this.reportCacheKey(params);
		await c.env.kv.delete(cacheKey);
		return await this.refreshReportCacheByKey(c, params);
	},

	reportCacheKey(params) {
		const { year, month, scope, userId } = params;
		return `${kvConst.REPORT_CACHE}${scope}:${userId}:${year}-${String(month).padStart(2, '0')}`;
	},

	async queryReport(c, params) {
		const { userId, year, month, timeZone, scope } = params;
		const admin = scope === 'admin';

		const utcDate = toUtc().startOf('day');
		const localDate = utcDate.tz(timeZone);
		const utcDayjs = dayjs(utcDate.format('YYYY-MM-DD HH:mm:ss'));
		const localDayjs = dayjs(localDate.format('YYYY-MM-DD HH:mm:ss'));
		const diffHours = localDayjs.diff(utcDayjs, 'hour', true);

		const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();

		const [
			stats,
			dayTrendRaw,
			topSenders,
			topRecipients,
			hourlyHeatmapRaw,
			statusBreakdownRaw,
			accountBreakdownRaw
		] = await Promise.all([
			reportDao.monthlyEmailStats(c, userId, year, month, admin),
			reportDao.monthlyDayTrend(c, userId, year, month, diffHours, admin),
			reportDao.topSenders(c, userId, year, month, admin),
			reportDao.topRecipients(c, userId, year, month, admin),
			reportDao.hourlyHeatmap(c, userId, year, month, diffHours, admin),
			reportDao.emailStatusBreakdown(c, userId, year, month, admin),
			reportDao.accountBreakdown(c, userId, year, month, admin)
		]);

		const dayTrend = this.fillDays(dayTrendRaw, year, month, daysInMonth);
		const hourlyHeatmap = this.fillHours(hourlyHeatmapRaw);

		const statusMap = {
			0: 'received', 1: 'sent', 2: 'delivered', 3: 'bounced',
			4: 'complained', 5: 'delayed', 7: 'noRecipient', 8: 'failed'
		};
		const statusBreakdown = {};
		for (const item of statusBreakdownRaw) {
			const key = statusMap[item.status] || `status_${item.status}`;
			statusBreakdown[key] = item.count;
		}

		return {
			period: { year, month, daysInMonth, type: 'monthly' },
			stats,
			dayTrend,
			topSenders,
			topRecipients,
			hourlyHeatmap,
			statusBreakdown,
			accountBreakdown: accountBreakdownRaw
		};
	},

	fillDays(data, year, month, daysInMonth) {
		const days = Array.from({ length: daysInMonth }, (_, i) => {
			const date = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
			const found = data.find(item => item.date === date);
			return {
				date,
				received: found ? Number(found.received) : 0,
				sent: found ? Number(found.sent) : 0
			};
		});
		return days;
	},

	fillHours(data) {
		const hours = Array.from({ length: 24 }, (_, i) => {
			const found = data.find(item => item.hour === i);
			return { hour: i, count: found ? found.count : 0 };
		});
		return hours;
	}
};

export default reportService;

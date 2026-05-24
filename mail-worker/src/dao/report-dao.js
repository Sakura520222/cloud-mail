import { emailConst } from '../const/entity-const';

const reportDao = {

	async monthlyEmailStats(c, userId, year, month, admin) {
		const userWhere = admin ? '' : `AND user_id = ${userId}`;
		const { results } = await c.env.db.prepare(`
			SELECT
				COALESCE(SUM(CASE WHEN type = ${emailConst.type.RECEIVE} THEN 1 ELSE 0 END), 0) AS received,
				COALESCE(SUM(CASE WHEN type = ${emailConst.type.SEND} THEN 1 ELSE 0 END), 0) AS sent,
				COALESCE(SUM(CASE WHEN type = ${emailConst.type.RECEIVE} AND unread = ${emailConst.unread.UNREAD} THEN 1 ELSE 0 END), 0) AS unread,
				COALESCE(SUM(CASE WHEN type = ${emailConst.type.RECEIVE} AND unread = ${emailConst.unread.READ} THEN 1 ELSE 0 END), 0) AS readCount,
				COUNT(*) AS total
			FROM email
			WHERE status != ${emailConst.status.SAVING}
				AND is_del = 0
				AND strftime('%Y', create_time) = '${year}'
				AND strftime('%m', create_time) = '${String(month).padStart(2, '0')}'
				${userWhere}
		`).all();
		return results[0];
	},

	async monthlyDayTrend(c, userId, year, month, diffHours, admin) {
		const userWhere = admin ? '' : `AND user_id = ${userId}`;
		const { results } = await c.env.db.prepare(`
			SELECT
				DATE(create_time, '+${diffHours} hours') AS date,
				COALESCE(SUM(CASE WHEN type = ${emailConst.type.RECEIVE} THEN 1 ELSE 0 END), 0) AS received,
				COALESCE(SUM(CASE WHEN type = ${emailConst.type.SEND} THEN 1 ELSE 0 END), 0) AS sent
			FROM email
			WHERE status != ${emailConst.status.SAVING}
				AND is_del = 0
				AND DATE(create_time, '+${diffHours} hours') >= DATE('${year}-${String(month).padStart(2, '0')}-01', '+${diffHours} hours')
				AND DATE(create_time, '+${diffHours} hours') < DATE('${year}-${String(month).padStart(2, '0')}-01', '+1 month', '+${diffHours} hours')
				${userWhere}
			GROUP BY DATE(create_time, '+${diffHours} hours')
			ORDER BY date ASC
		`).all();
		return results;
	},

	async yearlyMonthTrend(c, userId, year, diffHours, admin) {
		const userWhere = admin ? '' : `AND user_id = ${userId}`;
		const { results } = await c.env.db.prepare(`
			SELECT
				strftime('%m', create_time, '+${diffHours} hours') AS month,
				COALESCE(SUM(CASE WHEN type = ${emailConst.type.RECEIVE} THEN 1 ELSE 0 END), 0) AS received,
				COALESCE(SUM(CASE WHEN type = ${emailConst.type.SEND} THEN 1 ELSE 0 END), 0) AS sent
			FROM email
			WHERE status != ${emailConst.status.SAVING}
				AND is_del = 0
				AND strftime('%Y', create_time, '+${diffHours} hours') = '${year}'
				${userWhere}
			GROUP BY strftime('%m', create_time, '+${diffHours} hours')
			ORDER BY month ASC
		`).all();
		return results;
	},

	async topSenders(c, userId, year, month, admin, limit = 10) {
		const userWhere = admin ? '' : `AND user_id = ${userId}`;
		const { results } = await c.env.db.prepare(`
			SELECT send_email AS email, name, COUNT(*) AS count
			FROM email
			WHERE type = ${emailConst.type.RECEIVE}
				AND status != ${emailConst.status.SAVING}
				AND is_del = 0
				AND send_email IS NOT NULL AND send_email != ''
				AND strftime('%Y', create_time) = '${year}'
				AND strftime('%m', create_time) = '${String(month).padStart(2, '0')}'
				${userWhere}
			GROUP BY send_email
			ORDER BY count DESC
			LIMIT ${limit}
		`).all();
		return results;
	},

	async topRecipients(c, userId, year, month, admin, limit = 10) {
		const userWhere = admin ? '' : `AND user_id = ${userId}`;
		const { results } = await c.env.db.prepare(`
			SELECT to_email AS email, to_name AS name, COUNT(*) AS count
			FROM email
			WHERE type = ${emailConst.type.SEND}
				AND status != ${emailConst.status.SAVING}
				AND is_del = 0
				AND to_email IS NOT NULL AND to_email != ''
				AND strftime('%Y', create_time) = '${year}'
				AND strftime('%m', create_time) = '${String(month).padStart(2, '0')}'
				${userWhere}
			GROUP BY to_email
			ORDER BY count DESC
			LIMIT ${limit}
		`).all();
		return results;
	},

	async hourlyHeatmap(c, userId, year, month, diffHours, admin) {
		const userWhere = admin ? '' : `AND user_id = ${userId}`;
		const { results } = await c.env.db.prepare(`
			SELECT
				CAST(strftime('%H', create_time, '+${diffHours} hours') AS INTEGER) AS hour,
				COUNT(*) AS count
			FROM email
			WHERE status != ${emailConst.status.SAVING}
				AND is_del = 0
				AND strftime('%Y', create_time) = '${year}'
				AND strftime('%m', create_time) = '${String(month).padStart(2, '0')}'
				${userWhere}
			GROUP BY strftime('%H', create_time, '+${diffHours} hours')
			ORDER BY hour ASC
		`).all();
		return results;
	},

	async accountBreakdown(c, userId, year, month, admin) {
		const userWhere = admin ? '' : `AND e.user_id = ${userId}`;
		const { results } = await c.env.db.prepare(`
			SELECT
				a.email,
				COALESCE(SUM(CASE WHEN e.type = ${emailConst.type.RECEIVE} THEN 1 ELSE 0 END), 0) AS received,
				COALESCE(SUM(CASE WHEN e.type = ${emailConst.type.SEND} THEN 1 ELSE 0 END), 0) AS sent
			FROM email e
			JOIN account a ON e.account_id = a.account_id
			WHERE e.status != ${emailConst.status.SAVING}
				AND e.is_del = 0
				AND strftime('%Y', e.create_time) = '${year}'
				AND strftime('%m', e.create_time) = '${String(month).padStart(2, '0')}'
				${userWhere}
			GROUP BY a.email
			ORDER BY received + sent DESC
		`).all();
		return results;
	},

	async emailStatusBreakdown(c, userId, year, month, admin) {
		const userWhere = admin ? '' : `AND user_id = ${userId}`;
		const { results } = await c.env.db.prepare(`
			SELECT
				status,
				COUNT(*) AS count
			FROM email
			WHERE status != ${emailConst.status.SAVING}
				AND is_del = 0
				AND strftime('%Y', create_time) = '${year}'
				AND strftime('%m', create_time) = '${String(month).padStart(2, '0')}'
				${userWhere}
			GROUP BY status
			ORDER BY count DESC
		`).all();
		return results;
	}
};

export default reportDao;

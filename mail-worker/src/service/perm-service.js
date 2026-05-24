import orm from '../entity/orm';
import perm from '../entity/perm';
import { eq, ne, and, asc } from 'drizzle-orm';
import rolePerm from '../entity/role-perm';
import user from '../entity/user';
import role from '../entity/role';
import { permConst } from '../const/entity-const';
import { t } from '../i18n/i18n'

const permService = {
	async tree(c) {
		await this.ensureAiPerm(c);
		const pList = await orm(c).select().from(perm).where(eq(perm.pid, 0)).orderBy(asc(perm.sort)).all();
		const cList = await orm(c).select().from(perm).where(ne(perm.pid, 0)).orderBy(asc(perm.sort)).all();

		cList.forEach(cItem => {
			cItem.name = t('perms.' + cItem.name)
		})

		pList.forEach(pItem => {
			pItem.name = t('perms.' + pItem.name)
			pItem.children = cList.filter(cItem => cItem.pid === pItem.permId)
		})
		return pList;
	},

	async ensureAiPerm(c) {
		await c.env.db.prepare(`
			INSERT INTO perm (name, perm_key, pid, type, sort)
			SELECT 'AI 助手', NULL, 0, 1, 7
			WHERE NOT EXISTS (SELECT 1 FROM perm WHERE name = 'AI 助手' AND pid = 0)
		`).run();
		await c.env.db.prepare(`
			INSERT INTO perm (name, perm_key, pid, type, sort)
			SELECT 'AI 使用', 'ai:use', (SELECT perm_id FROM perm WHERE name = 'AI 助手' AND pid = 0 LIMIT 1), 2, 0
			WHERE NOT EXISTS (SELECT 1 FROM perm WHERE perm_key = 'ai:use')
		`).run();

		const AI_PERM_INIT = [
			{ name: 'AI 分类', permKey: 'ai:classify', sort: 1 },
			{ name: 'AI 自动分类', permKey: 'ai:auto-classify', sort: 2 },
			{ name: 'AI 标签', permKey: 'ai:tag', sort: 3 },
			{ name: 'AI 自动标签', permKey: 'ai:auto-tag', sort: 4 }
		];
		for (const perm of AI_PERM_INIT) {
			await c.env.db.prepare(`
				INSERT INTO perm (name, perm_key, pid, type, sort)
				SELECT '${perm.name}', '${perm.permKey}', (SELECT perm_id FROM perm WHERE name = 'AI 助手' AND pid = 0 LIMIT 1), 2, ${perm.sort}
				WHERE NOT EXISTS (SELECT 1 FROM perm WHERE perm_key = '${perm.permKey}')
			`).run().catch(e => console.warn(`跳过权限${perm.name}：${e.message}`));
		}
	},

	async userPermKeys(c, userId) {
		const userPerms = await orm(c).select({permKey: perm.permKey}).from(user)
			.leftJoin(role, eq(role.roleId,user.type))
			.rightJoin(rolePerm, eq(rolePerm.roleId,role.roleId))
			.leftJoin(perm, eq(rolePerm.permId,perm.permId))
			.where(and(eq(user.userId,userId),eq(perm.type,permConst.type.BUTTON)))
			.all();
		return userPerms.map(perm => perm.permKey);
	}
}

export default permService

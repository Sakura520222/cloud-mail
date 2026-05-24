import orm from '../entity/orm';
import { folder } from '../entity/folder';
import { email } from '../entity/email';
import { and, eq, asc } from 'drizzle-orm';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';

const folderService = {

	async add(c, params, userId) {
		const { name, icon } = params;
		if (!name || !name.trim()) {
			throw new BizError(t('folderNameRequired'));
		}
		const exist = await orm(c).select().from(folder).where(
			and(eq(folder.userId, userId), eq(folder.name, name.trim()))
		).get();
		if (exist) {
			throw new BizError(t('folderNameExists'));
		}
		return orm(c).insert(folder).values({
			userId,
			name: name.trim(),
			icon: icon || ''
		}).returning().get();
	},

	async update(c, params, userId) {
		const { folderId, name, icon, sort } = params;
		const folderRow = await this.selectById(c, folderId);
		if (!folderRow || folderRow.userId !== userId) {
			throw new BizError(t('folderNotExist'));
		}
		if (name) {
			const exist = await orm(c).select().from(folder).where(
				and(eq(folder.userId, userId), eq(folder.name, name.trim()))
			).get();
			if (exist && exist.folderId !== folderId) {
				throw new BizError(t('folderNameExists'));
			}
		}
		const values = {};
		if (name !== undefined) values.name = name.trim();
		if (icon !== undefined) values.icon = icon;
		if (sort !== undefined) values.sort = sort;
		await orm(c).update(folder).set(values).where(eq(folder.folderId, folderId)).run();
	},

	async delete(c, params, userId) {
		const { folderId } = params;
		const folderRow = await this.selectById(c, folderId);
		if (!folderRow || folderRow.userId !== userId) {
			throw new BizError(t('folderNotExist'));
		}
		await orm(c).update(email)
			.set({ folderId: null })
			.where(eq(email.folderId, folderId))
			.run();
		await orm(c).delete(folder).where(eq(folder.folderId, folderId)).run();
	},

	async list(c, userId) {
		return orm(c).select().from(folder)
			.where(eq(folder.userId, userId))
			.orderBy(asc(folder.sort), asc(folder.folderId))
			.all();
	},

	async selectById(c, folderId) {
		return orm(c).select().from(folder)
			.where(eq(folder.folderId, folderId))
			.get();
	},

	async selectByUserIdAndName(c, userId, name) {
		return orm(c).select().from(folder).where(
			and(eq(folder.userId, userId), eq(folder.name, name.trim()))
		).get();
	},

	async getOrCreateByName(c, userId, name) {
		let folderRow = await this.selectByUserIdAndName(c, userId, name);
		if (!folderRow) {
			folderRow = await orm(c).insert(folder).values({
				userId,
				name: name.trim()
			}).returning().get();
		}
		return folderRow;
	}
};

export default folderService;

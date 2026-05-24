import orm from '../entity/orm';
import { tag } from '../entity/tag';
import { emailTag } from '../entity/email-tag';
import { and, eq, asc, inArray } from 'drizzle-orm';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';

const tagService = {

	async add(c, params, userId) {
		const { name, color } = params;
		if (!name || !name.trim()) {
			throw new BizError(t('tagNameRequired'));
		}
		const exist = await orm(c).select().from(tag).where(
			and(eq(tag.userId, userId), eq(tag.name, name.trim()))
		).get();
		if (exist) {
			throw new BizError(t('tagNameExists'));
		}
		return orm(c).insert(tag).values({
			userId,
			name: name.trim(),
			color: color || '#409EFF'
		}).returning().get();
	},

	async update(c, params, userId) {
		const { tagId, name, color, sort } = params;
		const tagRow = await this.selectById(c, tagId);
		if (!tagRow || tagRow.userId !== userId) {
			throw new BizError(t('tagNotExist'));
		}
		if (name) {
			const exist = await orm(c).select().from(tag).where(
				and(eq(tag.userId, userId), eq(tag.name, name.trim()))
			).get();
			if (exist && exist.tagId !== tagId) {
				throw new BizError(t('tagNameExists'));
			}
		}
		const values = {};
		if (name !== undefined) values.name = name.trim();
		if (color !== undefined) values.color = color;
		if (sort !== undefined) values.sort = sort;
		await orm(c).update(tag).set(values).where(eq(tag.tagId, tagId)).run();
	},

	async delete(c, params, userId) {
		const { tagId } = params;
		const tagRow = await this.selectById(c, tagId);
		if (!tagRow || tagRow.userId !== userId) {
			throw new BizError(t('tagNotExist'));
		}
		await orm(c).delete(emailTag).where(eq(emailTag.tagId, tagId)).run();
		await orm(c).delete(tag).where(eq(tag.tagId, tagId)).run();
	},

	async list(c, userId) {
		return orm(c).select().from(tag)
			.where(eq(tag.userId, userId))
			.orderBy(asc(tag.sort), asc(tag.tagId))
			.all();
	},

	async selectById(c, tagId) {
		return orm(c).select().from(tag)
			.where(eq(tag.tagId, tagId))
			.get();
	},

	async selectByUserIdAndName(c, userId, name) {
		return orm(c).select().from(tag).where(
			and(eq(tag.userId, userId), eq(tag.name, name.trim()))
		).get();
	},

	async getOrCreateByName(c, userId, name, color) {
		let tagRow = await this.selectByUserIdAndName(c, userId, name);
		if (!tagRow) {
			tagRow = await orm(c).insert(tag).values({
				userId,
				name: name.trim(),
				color: color || '#409EFF'
			}).returning().get();
		}
		return tagRow;
	},

	async selectByEmailIds(c, emailIds) {
		if (!emailIds || emailIds.length === 0) return [];
		const rows = await orm(c).select({
			emailId: emailTag.emailId,
			tagId: tag.tagId,
			tagName: tag.name,
			tagColor: tag.color
		}).from(emailTag)
			.leftJoin(tag, eq(tag.tagId, emailTag.tagId))
			.where(inArray(emailTag.emailId, emailIds))
			.all();
		return rows;
	}
};

export default tagService;

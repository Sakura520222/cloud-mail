import orm from '../entity/orm';
import { emailTag } from '../entity/email-tag';
import { and, eq, inArray } from 'drizzle-orm';

const emailTagService = {

	async addTags(c, emailId, tagIds) {
		if (!tagIds || tagIds.length === 0) return;
		const values = tagIds.map(tagId => ({ emailId, tagId }));
		await orm(c).insert(emailTag).values(values)
			.onConflictDoNothing()
			.run();
	},

	async removeTags(c, emailId, tagIds) {
		if (!tagIds || tagIds.length === 0) return;
		await orm(c).delete(emailTag).where(
			and(
				eq(emailTag.emailId, emailId),
				inArray(emailTag.tagId, tagIds)
			)
		).run();
	},

	async setTags(c, emailId, tagIds) {
		await orm(c).delete(emailTag).where(eq(emailTag.emailId, emailId)).run();
		if (tagIds && tagIds.length > 0) {
			const values = tagIds.map(tagId => ({ emailId, tagId }));
			await orm(c).insert(emailTag).values(values).run();
		}
	},

	async selectByEmailIds(c, emailIds) {
		if (!emailIds || emailIds.length === 0) return [];
		return orm(c).select().from(emailTag)
			.where(inArray(emailTag.emailId, emailIds))
			.all();
	},

	async removeByEmailIds(c, emailIds) {
		if (!emailIds || emailIds.length === 0) return;
		await orm(c).delete(emailTag).where(
			inArray(emailTag.emailId, emailIds)
		).run();
	},

	async removeByTagId(c, tagId) {
		await orm(c).delete(emailTag).where(eq(emailTag.tagId, tagId)).run();
	}
};

export default emailTagService;

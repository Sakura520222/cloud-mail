import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';

export const emailTag = sqliteTable('email_tag', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	emailId: integer('email_id').notNull(),
	tagId: integer('tag_id').notNull(),
});
export default emailTag;

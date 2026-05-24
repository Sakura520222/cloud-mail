import app from '../hono/hono';
import aiService from '../service/ai-service';
import emailService from '../service/email-service';
import folderService from '../service/folder-service';
import tagService from '../service/tag-service';
import emailTagService from '../service/email-tag-service';
import userContext from '../security/user-context';
import result from '../model/result';
import { t } from '../i18n/i18n';

app.post('/ai/chat', async (c) => {
	const params = await c.req.json();
	return await aiService.chatStream(c, params);
});

app.post('/ai/classify', async (c) => {
	const { emailId } = await c.req.json();
	const userId = userContext.getUserId(c);
	const emailRow = await emailService.selectById(c, emailId);
	if (!emailRow || emailRow.userId !== userId) {
		return c.json(result.fail(t('emailNotExist')), 404);
	}
	const classifyResult = await aiService.classifyEmail(c, {
		subject: emailRow.subject,
		content: emailRow.content,
		sendEmail: emailRow.sendEmail
	}, userId);
	if (classifyResult && classifyResult.folderName) {
		const folderRow = await folderService.getOrCreateByName(c, userId, classifyResult.folderName);
		await emailService.moveToFolder(c, { emailIds: String(emailId), folderId: folderRow.folderId }, userId);
		return c.json(result.ok({ folder: folderRow, isNew: classifyResult.isNew }));
	}
	return c.json(result.ok(null));
});

app.post('/ai/tag', async (c) => {
	const { emailId } = await c.req.json();
	const userId = userContext.getUserId(c);
	const emailRow = await emailService.selectById(c, emailId);
	if (!emailRow || emailRow.userId !== userId) {
		return c.json(result.fail(t('emailNotExist')), 404);
	}
	const tagResult = await aiService.tagEmail(c, {
		subject: emailRow.subject,
		content: emailRow.content,
		sendEmail: emailRow.sendEmail
	}, userId);
	const tagList = [];
	if (tagResult && tagResult.length > 0) {
		const tagIds = [];
		for (const tagItem of tagResult) {
			const tagRow = await tagService.getOrCreateByName(c, userId, tagItem.name, tagItem.color);
			tagIds.push(tagRow.tagId);
			tagList.push(tagRow);
		}
		await emailTagService.setTags(c, emailId, tagIds);
	}
	return c.json(result.ok(tagList));
});

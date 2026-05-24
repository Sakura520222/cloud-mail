import emailUtils from '../utils/email-utils';
import { settingConst } from '../const/entity-const';
import settingService from './setting-service';
import BizError from '../error/biz-error';
import { stream } from 'hono/streaming';
import { t } from '../i18n/i18n';

const aiService = {
	async extractCode(c, email, options = {}) {
		if (!this.shouldExtractCode(options.aiCode, options.aiCodeFilter, email)) {
			return '';
		}

		const ai = c.env.ai;

		try {
			const subject = email.subject || '';
			const text = emailUtils.formatText(email.text || '');
			const htmlText = emailUtils.htmlToText(email.html || '');
			const body = (htmlText || text).slice(0, 6000);

			if (!subject && !body) {
				return '';
			}

			const result = await ai.run(c.env.ai_model || '@cf/meta/llama-3.1-8b-instruct', {
				messages: [
					{
						role: 'system',
						content: 'You extract verification codes from emails. Return only JSON like {"code":"12345678"} or {"code":""}. The code must be 8 characters or fewer and must not contain spaces. If the code is longer than 8 characters or contains spaces, return {"code":""}. Do not explain.'
					},
					{
						role: 'user',
						content: `Subject: ${subject}\n\n${body}`
					}
				],
				temperature: 0,
				max_tokens: 32
			});

			const content = typeof result === 'string' ? result : result?.response || '';
			const json = JSON.parse(content);
			if (typeof json.code !== 'string') {
				return '';
			}

			if (json.code.length > 8 || /\s/.test(json.code)) {
				return '';
			}

			return json.code;
		} catch (e) {
			console.error('验证码提取失败: ', e);
			return '';
		}
	},

	shouldExtractCode(aiCode, aiCodeFilterStr, email) {
		if (aiCode !== settingConst.aiCode.OPEN) {
			return false;
		}

		const filterList = aiCodeFilterStr ? aiCodeFilterStr.split(',').map(item => item.trim().toLowerCase()).filter(Boolean) : [];

		if (filterList.length === 0) {
			return true;
		}

		const fromEmail = (email.from?.address || '').trim().toLowerCase();
		const fromDomain = emailUtils.getDomain(fromEmail).toLowerCase();

		return filterList.some(item => item === fromEmail || item === fromDomain);
	},

	buildSystemPrompt(action, params) {
		const language = params.language || '中文';
		const prompts = {
			translate: `You are a professional email translator. Translate the following email content into ${language}. Preserve the original formatting, tone, and structure. Only output the translated content without any explanation or additional text.`,
			summarize: `You are a professional email summarizer. Provide a concise summary of the following email. Extract the key points, action items, and important details. Output the summary in ${language}.`,
			reply: `You are a professional email reply assistant. Based on the following email content, generate an appropriate and professional reply. The reply should be polite, relevant, and address all key points in the original email. Output the reply in ${language}. Only output the reply body without subject line.`,
			polish: `You are a professional writing assistant. Improve and polish the following email content to make it more professional, clear, and well-structured. Fix any grammar or spelling errors. Maintain the original meaning and intent. Only output the polished content without any explanation.`,
			generate: `You are a professional email writer. Based on the user's description, generate a well-structured and professional email. Output the email content in ${language}. Only output the email body without subject line.`
		};
		return prompts[action] || prompts.generate;
	},

	async getAIConfig(c) {
		const setting = await settingService.query(c);
		if (setting.aiApiUrl && setting.aiApiKey) {
			return {
				provider: 'external',
				apiUrl: setting.aiApiUrl,
				apiKey: setting.aiApiKey,
				model: setting.aiModel || 'gpt-3.5-turbo'
			};
		}
		if (c.env.ai) {
			return {
				provider: 'workers',
				model: c.env.ai_model || '@cf/meta/llama-3.1-8b-instruct'
			};
		}
		throw new BizError(t('aiNotConfigured'), 500);
	},

	async chatStream(c, params) {
		const { action, content, subject, prompt } = params;

		if (!action || !['translate', 'summarize', 'reply', 'polish', 'generate'].includes(action)) {
			throw new BizError(t('invalidAiAction'), 400);
		}

		const aiConfig = await this.getAIConfig(c);

		const systemPrompt = this.buildSystemPrompt(action, params);

		let userContent = '';
		if (action === 'generate') {
			userContent = prompt || '';
		} else {
			if (subject) {
				userContent += `Subject: ${subject}\n\n`;
			}
			userContent += content || '';
		}

		if (!userContent.trim()) {
			throw new BizError(t('emptyAiContent'), 400);
		}

		const messages = [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userContent }
		];

		c.header('Content-Type', 'text/event-stream; charset=utf-8');
		c.header('Cache-Control', 'no-cache');
		c.header('Connection', 'keep-alive');

		return stream(c, async (stream) => {
			try {
				if (aiConfig.provider === 'external') {
					await this.streamWithExternalAI(stream, aiConfig, messages);
				} else {
					await this.streamWithWorkersAI(stream, c, aiConfig.model, messages);
				}
			} catch (e) {
				console.error('AI stream error:', e);
				await stream.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
			}
			await stream.write('data: [DONE]\n\n');
		});
	},

	async streamWithWorkersAI(stream, c, model, messages) {
		const ai = c.env.ai;
		const response = await ai.run(model, {
			messages,
			stream: true
		});

		if (response && typeof response[Symbol.asyncIterator] === 'function') {
			for await (const chunk of response) {
				const text = typeof chunk === 'string' ? chunk : chunk?.response || '';
				if (text) {
					await stream.write(`data: ${JSON.stringify({ content: text })}\n\n`);
				}
			}
		} else {
			const text = typeof response === 'string' ? response : response?.response || '';
			if (text) {
				await stream.write(`data: ${JSON.stringify({ content: text })}\n\n`);
			}
		}
	},

	async streamWithExternalAI(stream, aiConfig, messages) {
		const response = await fetch(aiConfig.apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${aiConfig.apiKey}`
			},
			body: JSON.stringify({
				model: aiConfig.model,
				messages,
				stream: true
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			if (response.status === 404) {
				throw new Error(t('aiApiUrl404'));
			}
			throw new Error(`AI API error: ${response.status} ${errorText.slice(0, 200)}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.startsWith('data: ')) continue;

				const data = trimmed.slice(6);
				if (data === '[DONE]') continue;

				try {
					const json = JSON.parse(data);
					const content = json.choices?.[0]?.delta?.content || '';
					if (content) {
						await stream.write(`data: ${JSON.stringify({ content })}\n\n`);
					}
				} catch {
					// skip malformed chunks
				}
			}
		}
	}
};

export default aiService;

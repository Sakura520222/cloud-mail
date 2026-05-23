import { useSettingStore } from '@/store/setting.js';

export function aiChat(params, { onMessage, onDone, onError }) {
	const { lang } = useSettingStore();
	const baseURL = import.meta.env.VITE_BASE_URL || '';
	const token = localStorage.getItem('token');

	const controller = new AbortController();

	fetch(`${baseURL}/ai/chat`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `${token}`,
			'accept-language': lang
		},
		body: JSON.stringify(params),
		signal: controller.signal
	}).then(async (response) => {
		if (!response.ok) {
			const data = await response.json().catch(() => ({ message: response.statusText }));
			if (onError) onError(data.message || `Error: ${response.status}`);
			return;
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
				if (data === '[DONE]') {
					if (onDone) onDone();
					return;
				}

				try {
					const json = JSON.parse(data);
					if (json.error) {
						if (onError) onError(json.error);
						return;
					}
					if (json.content && onMessage) {
						onMessage(json.content);
					}
				} catch {
					// skip malformed chunks
				}
			}
		}

		if (onDone) onDone();
	}).catch((err) => {
		if (err.name !== 'AbortError' && onError) {
			onError(err.message);
		}
	});

	return controller;
}

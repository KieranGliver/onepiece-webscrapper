import { describe, expect, it, vi } from 'vitest';
import { fetchText } from '../src/utils';

describe('fetchText', () => {
	it('Should call fetch with the correct URL', async () => {
		const fetchSpy = vi.spyOn(global, 'fetch');
		const url = 'https://en.onepiece-cardgame.com/cardlist/?series=569001';
		const result = await fetchText(url);
		expect(fetchSpy).toHaveBeenCalledWith(url);
		expect(result).toBe('<html><body>569001</body></html>');
	});
	it('should handle 404 errors gracefully', async () => {
		const warnSpy = vi.spyOn(console, 'warn');
		const url = 'https://en.onepiece-cardgame.com/cardlist/?series=notfound';
		const result = await fetchText(url);
		expect(result).toBe('');
		expect(warnSpy).toHaveBeenCalledWith(
			'HTTP error fetching at https://en.onepiece-cardgame.com/cardlist/?series=notfound: 404',
		);
	});
});

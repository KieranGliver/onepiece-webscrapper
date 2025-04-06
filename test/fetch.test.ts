import { describe, expect, it } from 'vitest';
import { fetchText } from '../src/utils';

describe('fetchText', () => {
	it('Should call fetch with the correct URL', async () => {
		const url = 'https://en.onepiece-cardgame.com/cardlist/?series=569001';
		const result = await fetchText(url);
		expect(result).toBe('<html><body>569001</body></html>');
	});
});

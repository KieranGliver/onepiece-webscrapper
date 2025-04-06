import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCardData } from '../src/card-scrapper';
import { seriesPrefix } from '../src/types';

const warnSpy = vi.spyOn(console, 'warn');
const errorSpy = vi.spyOn(console, 'error');
const fetchMock = vi.fn();

fetchMock.mockImplementation((url: string) => url.slice(-6));

beforeEach(() => {
	warnSpy.mockClear();
	errorSpy.mockClear();
	fetchMock.mockClear();
});

describe('Invalid Inputs', () => {
	it('Should handle empty prefix gracefully', async () => {
		const prefix = Number.NaN as unknown as seriesPrefix;
		const range = 1;
		const result = await fetchCardData(prefix, range, fetchMock);
		expect(fetchMock.mock.calls.length).toBe(0);
		expect(warnSpy).toHaveBeenCalledWith('Prefix is required');
		expect(result).toStrictEqual([]);
	});
	it('Should handle invalid range gracefully', async () => {
		const prefix = seriesPrefix.stc;
		const range = Number.NaN as unknown as number;
		const result = await fetchCardData(prefix, range, fetchMock);
		expect(fetchMock.mock.calls.length).toBe(0);
		expect(warnSpy).toHaveBeenCalledWith('Range is required');
		expect(result).toStrictEqual([]);
	});
	it('Should handle ranges less than 1 gracefully', async () => {
		const prefix = seriesPrefix.stc;
		const range = 0;
		const result = await fetchCardData(prefix, range, fetchMock);
		expect(fetchMock.mock.calls.length).toBe(0);
		expect(warnSpy).toHaveBeenCalledWith('Range must be greater than 0');
		expect(result).toStrictEqual([]);
	});
	it('Should handle ranges greater than 21 for stc gracefully', async () => {
		const prefix = seriesPrefix.stc;
		const range = 22;
		const result = await fetchCardData(prefix, range, fetchMock);
		expect(fetchMock.mock.calls.length).toBe(0);
		expect(warnSpy).toHaveBeenCalledWith('Range must be less than 21 for stc');
		expect(result).toStrictEqual([]);
	});
	it('Should handle ranges greater than 10 for set gracefully', async () => {
		const prefix = seriesPrefix.set;
		const range = 11;
		const result = await fetchCardData(prefix, range, fetchMock);
		expect(fetchMock.mock.calls.length).toBe(0);
		expect(result).toStrictEqual([]);
	});
	it('Should handle ranges greater than 1 for eb, prb, and pc gracefully', async () => {
		const range = 2;
		const resultEb = await fetchCardData(seriesPrefix.eb, range, fetchMock);
		const resultPrb = await fetchCardData(seriesPrefix.prb, range, fetchMock);
		const resultPc = await fetchCardData(seriesPrefix.pc, range, fetchMock);
		expect(fetchMock.mock.calls.length).toBe(0);
		expect(warnSpy.mock.calls.length).toBe(3);
		expect(warnSpy.mock.calls[0][0]).toBe('Range must be 1 for eb, prb and pc');
		expect(warnSpy.mock.calls[1][0]).toBe('Range must be 1 for eb, prb and pc');
		expect(warnSpy.mock.calls[2][0]).toBe('Range must be 1 for eb, prb and pc');
		expect(resultEb).toStrictEqual([]);
		expect(resultPrb).toStrictEqual([]);
		expect(resultPc).toStrictEqual([]);
	});
});
describe('Valid Inputs', () => {
	it('Should call fetch with the correct URL', async () => {
		const prefix = seriesPrefix.stc;
		const range = 1;

		const result = await fetchCardData(prefix, range, fetchMock);

		expect(fetchMock.mock.calls.length).toBe(1);
		expect(fetchMock.mock.calls[0]).toStrictEqual([
			'https://en.onepiece-cardgame.com/cardlist/?series=569001',
		]);
		expect(result).toStrictEqual(['569001']);
	});
	it('Should call fetch 10 times', async () => {
		const prefix = seriesPrefix.stc;
		const range = 10;

		const result = await fetchCardData(prefix, range, fetchMock);

		expect(fetchMock.mock.calls.length).toBe(10);
		expect(result).toStrictEqual([
			'569001',
			'569002',
			'569003',
			'569004',
			'569005',
			'569006',
			'569007',
			'569008',
			'569009',
			'569010',
		]);
	});
});
describe('Multiple function calls', () => {
	it('Should handle a mix of valid and invalid ranges', async () => {
		const prefix = seriesPrefix.stc;
		const validRange = 2;
		const invalidRange = 22;

		const validResult = await fetchCardData(prefix, validRange, fetchMock);
		const invalidResult = await fetchCardData(prefix, invalidRange, fetchMock);

		expect(fetchMock.mock.calls.length).toBe(2); // Only valid range calls fetch
		expect(validResult).toStrictEqual(['569001', '569002']);
		expect(invalidResult).toStrictEqual([]);
	});
	it('Should handle multiple valid prefixes with valid ranges', async () => {
		const prefix1 = seriesPrefix.stc;
		const prefix2 = seriesPrefix.set;
		const range1 = 2;
		const range2 = 3;

		const result1 = await fetchCardData(prefix1, range1, fetchMock);
		const result2 = await fetchCardData(prefix2, range2, fetchMock);

		expect(fetchMock.mock.calls.length).toBe(5); // 2 calls for prefix1 and 3 calls for prefix2
		expect(result1).toStrictEqual(['569001', '569002']);
		expect(result2).toStrictEqual(['569101', '569102', '569103']);
	});
});
describe('Invalid fetch responses', () => {
	it('Should handle fetch returning unexpected data gracefully', async () => {
		const prefix = seriesPrefix.stc;
		const range = 1;

		fetchMock.mockImplementationOnce(() => null);

		const result = await fetchCardData(prefix, range, fetchMock);

		expect(fetchMock.mock.calls.length).toBe(1);
		expect(warnSpy).toHaveBeenCalledWith('Unexpected data format for 569001');
		expect(result).toStrictEqual([]);
	});
	it('Should handle empty results from fetch gracefully', async () => {
		const prefix = seriesPrefix.stc;
		const range = 1;

		fetchMock.mockImplementationOnce(() => '');

		const result = await fetchCardData(prefix, range, fetchMock);

		expect(fetchMock.mock.calls.length).toBe(1);
		expect(warnSpy).toHaveBeenCalledWith('No data found for 569001');
		expect(result).toStrictEqual([]);
	});
	it('Should handle fetch error gracefully', async () => {
		const prefix = seriesPrefix.stc;
		const range = 1;

		fetchMock.mockImplementationOnce(() => {
			throw new Error('Fetch error');
		});

		const result = await fetchCardData(prefix, range, fetchMock);

		expect(fetchMock.mock.calls.length).toBe(1);
		expect(errorSpy).toHaveBeenCalledWith(
			'Error fetching card list for 569001:',
			expect.any(Error),
		);
		expect(result).toStrictEqual([]);
	});
});

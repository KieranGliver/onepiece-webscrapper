import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import 'whatwg-fetch';

export const handlers = [
	http.get('https://en.onepiece-cardgame.com/cardlist', ({request}) => {
		const series = new URL(request.url).searchParams.get('series');
		if (series === '569001') {
			return HttpResponse.text('<html><body>569001</body></html>');
		}
		return HttpResponse.text('<html><body>Not Found</body></html>', { status: 404 });
	}),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterAll(() => server.close());

afterEach(() => server.resetHandlers());

import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import "whatwg-fetch";

export const handlers = [
    http.get("https://en.onepiece-cardgame.com/cardlist/?series=569001", () => {
        return HttpResponse.text("<html><body>569001</body></html>");
    }),
]

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
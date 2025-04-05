import { fetchCardData, seriesPrefix } from "../src/card-scrapper";
import { describe, it, expect } from "vitest";

describe("fetchCardData", () => {
    it("Should call fetch with the correct URL", async () => {
        
        const prefix = seriesPrefix.stc;
        const range = 1;

        const result = await fetchCardData(prefix, range);

        expect(result).toStrictEqual(["<html><body>569001</body></html>"]);
    });
});
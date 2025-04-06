export async function fetchText(url: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`HTTP error fetching at ${url}: ${res.status}`);
	}
	return await res.text();
}

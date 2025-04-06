export async function fetchText(url: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) {
		console.warn(`HTTP error fetching at ${url}: ${res.status}`);
		return '';
	}
	return await res.text();
}

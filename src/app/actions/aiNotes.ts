"use server";

export type StructuredInline = {
	text: string;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
};

export type StructuredListItem = {
	segments: StructuredInline[];
	checked?: boolean;
};

export type StructuredBlock =
	| { type: "heading1" | "heading2" | "heading3" | "paragraph"; segments: StructuredInline[] }
	| { type: "bulleted_list" | "numbered_list"; items: StructuredListItem[] }
	| { type: "checklist"; items: StructuredListItem[] }
	| { type: "horizontal_rule"; segments?: StructuredInline[]; items?: StructuredListItem[] };

export type StructuredNotesResponse = {
	blocks: StructuredBlock[];
};

type StructureNotesResult =
	| { success: true; data: StructuredNotesResponse }
	| { success: false; error: string };

function getSystemPrompt(): string {
	return "You convert spoken transcripts into actionable notes in JSON only. Keep the output language the same as the transcript language and NEVER translate. CRITICAL: preserve concrete details exactly: ticket IDs/numbers, times, dates, names, owners, blockers, durations, and deadlines. Never replace specifics with generic labels like 'Tickets to Complete' or 'Meetings' without listing the actual items. You may clean filler words and repetition, but do not drop factual details. Reorganize content using: heading1, heading2, heading3, paragraph, bulleted_list, numbered_list, checklist, horizontal_rule, plus inline bold/italic/underline. NEVER output quote blocks. If the transcript includes tasks, include them as checklist items with the original details. Output valid JSON only with this shape: {\"blocks\":[{\"type\":\"heading1|heading2|heading3|paragraph|bulleted_list|numbered_list|checklist|horizontal_rule\",\"segments\":[{\"text\":\"...\",\"bold\":false,\"italic\":false,\"underline\":false}],\"items\":[{\"checked\":false,\"segments\":[{\"text\":\"...\",\"bold\":false,\"italic\":false,\"underline\":false}]}]}]}. For heading/paragraph blocks, use segments and items:[]. For list/checklist blocks, use items and segments:[]. For horizontal_rule, use type only with segments:[] and items:[].";
}

function normalizeStructuredResponse(payload: unknown): StructuredNotesResponse | null {
	if (!payload || typeof payload !== "object") return null;
	const blocks = (payload as { blocks?: unknown }).blocks;
	if (!Array.isArray(blocks) || blocks.length === 0) return null;
	return { blocks: blocks as StructuredBlock[] };
}

function parseModelJson(content: string): unknown {
	const trimmed = content.trim();
	if (trimmed.startsWith("```")) {
		const withoutFence = trimmed
			.replace(/^```(?:json)?\s*/i, "")
			.replace(/\s*```$/, "");
		return JSON.parse(withoutFence);
	}
	return JSON.parse(trimmed);
}

export async function structureNotesSelection(input: string): Promise<StructureNotesResult> {
	const trimmedInput = input.trim();
	if (!trimmedInput) return { success: false, error: "No content provided for structuring." };

	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		return { success: false, error: "OPENAI_API_KEY is missing." };
	}

	try {
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				temperature: 0.2,
				response_format: { type: "json_object" },
				messages: [
					{
						role: "system",
						content: getSystemPrompt(),
					},
					{
						role: "user",
						content: `Structure these notes:\n\n${trimmedInput}`,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			let message = "AI structuring failed. Please try again.";
			try {
				const parsed = JSON.parse(errorBody) as { error?: { message?: string } };
				if (parsed.error?.message) {
					message = parsed.error.message;
				}
			} catch {
				// keep default message
			}
			console.error("OpenAI structureNotesSelection failed:", response.status, errorBody);
			return { success: false, error: message };
		}

		const json = (await response.json()) as {
			choices?: Array<{ message?: { content?: string | null } }>;
		};
		const content = json.choices?.[0]?.message?.content ?? "";
		if (!content) {
			console.error("OpenAI structureNotesSelection returned empty content.");
			return { success: false, error: "AI returned empty output." };
		}

		const parsed = parseModelJson(content);
		const normalized = normalizeStructuredResponse(parsed);
		if (!normalized) {
			console.error("OpenAI structureNotesSelection returned invalid JSON structure:", parsed);
			return { success: false, error: "AI returned an invalid structure." };
		}
		return {
			success: true,
			data: normalized,
		};
	} catch (error) {
		console.error("OpenAI structureNotesSelection crashed:", error);
		return { success: false, error: "AI structuring failed. Please try again." };
	}
}

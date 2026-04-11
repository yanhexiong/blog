import type { APIRoute } from "astro";
import { getSeriesAnswerBoardData } from "../../utils/series-answer-board";

export const GET: APIRoute = async ({ url }) => {
	const seriesSlug = url.searchParams.get("series") || "linux-tutorial-series";
	const board = await getSeriesAnswerBoardData(seriesSlug);

	return new Response(JSON.stringify(board), {
		status: 200,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
		},
	});
};

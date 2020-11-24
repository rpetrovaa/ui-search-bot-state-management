export class PostRequest {
    query: string;
    method: string;
	qe_method: string;
	max_results: number;
}

export class PostResult {
    rank: number;
    index: number;
    score: number;
}
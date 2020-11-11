import { PostRequest } from '../classes/post';
import { Query } from '../model/query.model';

export class AddQuery {
    static readonly type = '[QUERY] Add'

    constructor(public url: string, public payload: PostRequest) {}
}
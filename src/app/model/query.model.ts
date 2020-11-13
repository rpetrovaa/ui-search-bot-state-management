import { PostRequest } from '../classes/post';

export interface Query {
    query: string,
    requestType: RequestType,
    postRequest: PostRequest
}

export enum RequestType {
    INITIAL, ADDITIVE, NEGATIVE
}
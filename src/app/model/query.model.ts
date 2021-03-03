import { PostRequest, PostResult } from '../classes/post';

export interface Query {
  query: string;
  requestType: string;
  postRequest: PostRequest;
  counter: number;
}

export class CombinedRequest {
  postRequest: PostRequest;
  requestType: RequestType;
  counter: number;
}

export interface QueryResult {
  query: Query;
  result: PostResult[];
}

export enum RequestType {
  INITIAL,
  ADDITIVE,
  NEGATIVE,
}

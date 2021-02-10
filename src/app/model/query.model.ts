import { PostRequest, PostResult } from '../classes/post';

export interface Query {
  query: string;
  requestType: string;
  postRequest: PostRequest;
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

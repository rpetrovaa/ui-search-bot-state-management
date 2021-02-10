import { Injectable } from '@angular/core';
import { PostRequest } from '../classes/post';

@Injectable({
  providedIn: 'root',
})
export class PostRequestService {
  constructor() {}

  createPostRequest(query: string) {
    const postRequest: PostRequest = {
      query: query,
      method: 'bm25okapi',
      qe_method: '',
      max_results: 1000,
    };

    //console.log('inside post', postRequest);

    return postRequest;
  }
}

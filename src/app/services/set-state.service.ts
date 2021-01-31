import { Injectable } from '@angular/core';
import { PostRequest } from '../classes/post';
import { AddQuery } from '../actions/query.actions';
import { RequestType } from '../model/query.model';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SetStateService {
  constructor() {}

  private postRequest$ = new BehaviorSubject<PostRequest>(null);
  private postRequestNegative$ = new BehaviorSubject<PostRequest>(null);
  private postRequestExtended$ = new BehaviorSubject<PostRequest>(null);
  request = this.postRequest$.asObservable();
  requestNegative = this.postRequestNegative$.asObservable();
  requestExtended = this.postRequestExtended$.asObservable();

  setAction(postRequest: PostRequest) {
    this.postRequest$.next(postRequest);
  }

  setActionNegative(postRequest: PostRequest) {
    this.postRequestNegative$.next(postRequest);
  }

  setActionExtended(postRequest: PostRequest) {
    this.postRequestExtended$.next(postRequest);
  }

  getAction() {
    let value = this.postRequest$.getValue();
    console.log(value);
    if (!value) {
      console.log('it is in undefied if condition');
      return;
    }

    console.log('in get action, the global post request is', this.postRequest$);

    let action = new AddQuery({
      query: value.query,
      requestType: RequestType.INITIAL,
      postRequest: value,
    });

    console.log('getting action', action);

    return action;
  }
}

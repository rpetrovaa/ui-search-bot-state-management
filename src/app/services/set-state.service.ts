import { Injectable } from '@angular/core';
import { PostRequest } from '../classes/post';
import { AddQuery } from '../actions/query.actions';
import { CombinedRequest, RequestType } from '../model/query.model';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SetStateService {
  constructor() {}

  private postRequest$ = new BehaviorSubject<CombinedRequest>(null);
  private postRequestNegative$ = new BehaviorSubject<CombinedRequest>(null);
  private postRequestExtended$ = new BehaviorSubject<CombinedRequest>(null);
  private postRequestMoreScreens$ = new BehaviorSubject<CombinedRequest>(null);
  request = this.postRequest$.asObservable();
  requestNegative = this.postRequestNegative$.asObservable();
  requestExtended = this.postRequestExtended$.asObservable();
  requestMoreScreens = this.postRequestMoreScreens$.asObservable();

  setAction(
    postRequest: PostRequest,
    requestType: RequestType,
    counter: number
  ) {
    this.postRequest$.next({ postRequest, requestType, counter });
  }

  setActionNegative(
    postRequest: PostRequest,
    requestType: RequestType,
    counter: number
  ) {
    this.postRequestNegative$.next({ postRequest, requestType, counter });
  }

  setActionExtended(
    postRequest: PostRequest,
    requestType: RequestType,
    counter: number
  ) {
    this.postRequestExtended$.next({ postRequest, requestType, counter });
  }

  setActionMoreScreens(
    postRequest: PostRequest,
    requestType: RequestType,
    counter: number
  ) {
    this.postRequestMoreScreens$.next({ postRequest, requestType, counter });
  }
  // getAction() {
  //   let value = this.postRequest$.getValue();
  //   console.log(value);
  //   if (!value) {
  //     console.log('it is in undefied if condition');
  //     return;
  //   }

  //   console.log('in get action, the global post request is', this.postRequest$);

  //   let action = new AddQuery({
  //     query: value.query,
  //     requestType: RequestType.INITIAL,
  //     postRequest: value,
  //   });

  //   console.log('getting action', action);

  //   return action;
  // }
}

import { Injectable } from '@angular/core';
import { PostRequest } from '../classes/post';
import { IState } from '../state/model/i-state';
import { Gui2wireApiService } from './gui2wire-api.service';

@Injectable({
  providedIn: 'root'
})
export class SetStateService {

  state: IState;
  connectService;
  postRequest: PostRequest = {
    query: "login",
    method: "bm25okapi",
    qe_method:"",
    max_results: 8
  };
  prevState: IState = {query: this.postRequest.query, request_type: RequestType.INITIAL }

  constructor(connectService: Gui2wireApiService) { 
    this.connectService = connectService;
  }

  setState(prevState: IState, newState: IState){
    this.connectService.post('/api', this.postRequest).subscribe(data => console.log(data));
    prevState.query;


  }

  
  
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PostRequest } from '../classes/post';

@Injectable({
  providedIn: 'root'
})
export class Gui2wireApiService {

  // api: string;
  // body: PostRequest;

  constructor(private httpClient: HttpClient) { }

  
  post(api: string, body: PostRequest): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.httpClient.post(api, body, httpOptions);
  }

  get(ui: string): Observable<any> {
    // console.log("getting images...")
    return this.httpClient.get(ui, { responseType: 'blob' });
  }
}

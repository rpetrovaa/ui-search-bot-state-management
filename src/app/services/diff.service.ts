import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PostRequest, PostResult } from '../classes/post';

@Injectable({
  providedIn: 'root',
})
export class DiffService {
  private diff$ = new BehaviorSubject<PostResult[]>(null);
  diff = this.diff$.asObservable();

  constructor() {}

  setDifference(diff: PostResult[]) {
    this.diff$.next(diff);
    //this.difference = diff;
  }

  getDifference() {
    return this.diff$.getValue();
  }
}

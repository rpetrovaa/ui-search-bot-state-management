import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PostRequest, PostResult } from '../classes/post';

@Injectable({
  providedIn: 'root',
})
export class IntersectService {
  private intersect$ = new BehaviorSubject<PostResult[]>(null);
  intersect = this.intersect$.asObservable();

  constructor() {}

  setIntersection(intersect: PostResult[]) {
    this.intersect$.next(intersect);
    //this.difference = diff;
  }

  getIntersection() {
    return this.intersect$.getValue();
  }
}

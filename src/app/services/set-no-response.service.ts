import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root',
})
export class SetNoResponseService {
  private noResults$ = new BehaviorSubject<boolean>(false);
  noResults = this.noResults$.asObservable();

  constructor() {}

  setNoResultsFlag(noResults: boolean) {
    this.noResults$.next(noResults);
    //this.difference = diff()
  }

  getNoResultsFlag() {
    return this.noResults$.getValue();
  }
}

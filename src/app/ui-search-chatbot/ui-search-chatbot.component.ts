import { Component, OnInit } from '@angular/core';
import { Gui2wireApiService } from '../services/gui2wire-api.service';
import { PostRequest, PostResult } from '../classes/post';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import {
  AddNegativeQueryBeforeDiff,
  AddQuery,
  AddExtendedQueryBeforeIntersect,
  AddNextScreens,
} from '../actions/query.actions';
import { QueryState } from '../state/query.state';
import { Observable, Subscription } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { RequestType } from '../model/query.model';
import { SetStateService } from '../services/set-state.service';
import { API } from '../model/api';
import { DiffService } from '../services/diff.service';
import { IntersectService } from '../services/intersect.service';
import { SetNoResponseService } from '../services/set-no-response.service';
import { InstructionsDialogComponent } from '../shared/instructions-dialog/instructions-dialog.component';

@Component({
  selector: 'app-ui-search-chatbot',
  templateUrl: './ui-search-chatbot.component.html',
  styleUrls: ['./ui-search-chatbot.component.css'],
})
export class UISearchChatbotComponent implements OnInit {
  @Select(QueryState.getQueryResults) queryResults$: Observable<any[]>; // Select - observable that subscribes to the results of a search request that is forwarded by the state management to the backend
  @Select(QueryState.getLastQuery) lastQuery$: Observable<any[]>; // Select - observable that returns the latest 'query' or search request for UI screens

  api = API;

  postRequest: PostRequest = {
    query: '',
    method: 'bm25okapi',
    qe_method: '',
    max_results: 8,
  };

  resultsMeta: any[]; // array containing the combined metadata of results and images for displaying
  resultsImages: any[]; // array containing the metadata of the images in the returned results from backend
  isImageLoading: boolean;
  imageToShow: string | ArrayBuffer;

  request: PostRequest;
  requestNegative: PostRequest;
  requestExtended: PostRequest;
  reuqestMoreScreens: PostRequest;

  resultsNegative: any;
  resultsDiff: PostResult[];

  resultsExtended: any;
  resultsIntersect: PostResult[];

  snapshot;
  lastResults: any[]; // array holding the laste results from backend

  state: string;
  stateExt: string;

  counter: number;
  nextResults: any;
  indexNext: number = 0;

  subscription: Subscription;
  generalResults: any[];

  counterEntires = 0;
  endResults: any;

  noResults: boolean = false;
  routeQueryParams$: Subscription;

  constructor(
    private store: Store,
    private service: Gui2wireApiService,
    private setActionService: SetStateService,
    private diffService: DiffService,
    private intersectService: IntersectService,
    public dialog: MatDialog,
    public setNoResultsService: SetNoResponseService
  ) {}

  ngOnInit() {
    if (this.setActionService.requestNegative) {
      this.indexNext = 0;
      this.setActionService.requestNegative.subscribe((request) => {
        if (!request) return;
        this.requestNegative = request.postRequest;
        if (this.requestNegative) {
          if (this.noResults) {
            this.setNoResultsService.setNoResultsFlag(false);
            this.noResults = this.setNoResultsService.getNoResultsFlag();
          }
          this.computeNegativeResults(this.requestNegative, this.counter);
        }
      });
      this.setActionService.requestNegative = null;
    }

    if (this.setActionService.requestExtended) {
      this.indexNext = 0;
      this.setActionService.requestExtended.subscribe((request) => {
        if (!request) return;
        this.requestExtended = request.postRequest;

        if (this.noResults) {
          this.setNoResultsService.setNoResultsFlag(false);
          this.noResults = this.setNoResultsService.getNoResultsFlag();
        }
        this.stateExt = RequestType[request.requestType];
        this.counter = request.counter;
        if (this.stateExt === 'INITIAL') {
          this.indexNext = 0;
        }
        if (this.requestExtended) {
          this.computeExtendedResults(
            this.requestExtended,
            this.counter,
            this.stateExt
          );
        }
      });
      this.setActionService.requestExtended = null;
    }

    // dispatch action for state management of more screens request
    if (this.setActionService.requestMoreScreens) {
      this.setActionService.requestMoreScreens.subscribe((request) => {
        if (!request) return;
        this.reuqestMoreScreens = request.postRequest;

        if (this.noResults) {
          return;
        }
        this.stateExt = RequestType[request.requestType];
        this.counter = request.counter;

        if (!this.stateExt) return;
        if (!this.counter) return;

        // dispatch an action of type 'AddNextScreens'
        this.store.dispatch(
          new AddNextScreens(
            {
              query: null,
              requestType: this.stateExt,
              postRequest: null,
              counter: this.counter,
            },
            null
          )
        );
      });
      this.setActionService.requestMoreScreens = null;
    }

    this.lastQuery$.subscribe((results) => {
      if (!results) return;

      this.generalResults = results;
      if (this.requestExtended) {
        if (this.counter > 0) {
          this.counterEntires += 1;
          //if there were no results from the prev. query, reset state to INITAL. Otherwise itersect will not be computed for the two following requests and the code will break
          if (!results[results.length - 1].length) {
            this.counter = 0;
          }

          let intersect = this.calculateSetIntersection(
            results[results.length - 2],
            results[results.length - 1]
          );
          this.endResults = intersect;
        } else {
          this.counterEntires += 1;
          this.endResults = results[results.length - 1].result;
        }

        this.noResults = this.setNoResultsService.getNoResultsFlag();
        this.renderChatbotResultsFromMetaData(this.endResults);
        this.requestExtended = null;
      }

      if (this.requestNegative) {
        let setDiff: PostResult[] = this.calculateSetDifference(
          results[results.length - 2],
          results[results.length - 1]
        );

        this.noResults = this.setNoResultsService.getNoResultsFlag();
        //if there were no results from the prev. query, reset state to INITAL. Otherwise itersect will not be computed for the two following requests and the code will break
        if (!results[results.length - 1].length) {
          this.counter = 0;
        }

        this.endResults = setDiff;
        this.renderChatbotResultsFromMetaData(this.endResults);

        this.requestNegative = null;
      }

      if (this.reuqestMoreScreens) {
        if (this.counter < 1) {
          this.noResults = true;
          this.counter = 0;
        }
        this.nextResults = [];
        this.nextResults = this.getNextTopResults(
          results[results.length - 1].result
        );

        if (!this.nextResults) return;
        this.renderChatbotResultsFromMetaData(this.nextResults);
        this.counter = this.counter + 1;
        this.reuqestMoreScreens = null;
        this.noResults = false;
      }
    });
  }

  ngOnDestroy() {
    this.routeQueryParams$.unsubscribe();
  }

  //dispatch actions for negative type requerts
  computeNegativeResults(negRequest: PostRequest, counter: number) {
    this.store.dispatch(
      new AddNegativeQueryBeforeDiff({
        query: negRequest.query,
        requestType: RequestType[2],
        postRequest: negRequest,
        counter: counter,
      })
    );
  }

  // dispatch actions for additive type requests.
  computeExtendedResults(
    extRequest: PostRequest,
    counter: number,
    type: string
  ) {
    this.store.dispatch(
      new AddExtendedQueryBeforeIntersect({
        query: extRequest.query,
        requestType: type,
        postRequest: extRequest,
        counter: counter,
      })
    );
  }

  // computes next top results and displays results in browser
  computeNextScreensResults(
    extRequest: PostRequest,
    counter: number,
    type: string
  ) {
    this.nextResults = [];

    this.nextResults = this.getNextTopResults(this.lastResults[1].result);

    if (!this.nextResults) return;

    // dispatch an action of type 'AddNextScreens'
    this.store.dispatch(
      new AddNextScreens(
        {
          query: null,
          requestType: type,
          postRequest: null,
          counter: counter,
        },
        this.lastResults[1].result
      )
    );

    this.renderChatbotResultsFromMetaData(this.nextResults);
  }

  // method that prepares the top ranked results in array 'this.resultsMeta' to be displayed in the browser
  renderChatbotResultsFromMetaData(results: any) {
    if (!results) return;
    this.noResults = this.setNoResultsService.getNoResultsFlag();
    this.resultsMeta = [];
    this.resultsImages = [];
    const primary = [];

    // getting top results (20 or more based on having requested the 'more screens' option) and configuring the image data for fronted rendering
    const top = this.getTopResults(results);
    if (!top) return;
    top.forEach((result) => {
      if (!result) return;
      const index = result.index;
      const url = '/ui/' + index + '.jpg';
      primary.push(result);
      this.resultsImages.push(url);
    });
    if (!this.resultsMeta && !primary && !this.resultsImages) return;
    // prepare the combined array of ranking metadata and image metadata for frontend rendering
    this.resultsMeta = this.combineArrays(primary, this.resultsImages);
  }

  getUIs(data) {
    if (!data) {
      return;
    }

    data.results.forEach((result) => {
      const index = result.index;
      const url = '/ui/' + index + '.jpg';
      this.service.get(url).subscribe(
        (data) => {
          this.resultsImages.push(this.createImageFromBlob(data));
          this.isImageLoading = false;
        },
        (error) => {
          this.isImageLoading = false;
          console.log(error);
        }
      );
    });
  }

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener(
      'load',
      () => {
        this.imageToShow = reader.result;
      },
      false
    );

    if (image) {
      reader.readAsDataURL(image);
    }

    if (this.imageToShow) {
      return this.imageToShow;
    }
  }

  // method to combine the ranking metadata with the image meta for displaying in the browser
  combineArrays(a1, a2) {
    a1 = a1.map((value, index) => ({
      resultMeta: value,
      screenURL: a2[index],
    }));

    return a1;
  }

  // calculate the new result set based on set difference in negative type requests
  calculateSetDifference(setA, setB) {
    if (!setA) return;
    if (!setB) return;

    //remove the common screens between the current and previous serach requests from the previous search request
    let diff = setA.result.filter(
      ({ index: id1 }) => !setB.result.some(({ index: id2 }) => id2 === id1)
    );

    if (!diff.length) {
      this.setNoResultsService.setNoResultsFlag(true);
      return;
    }

    // this.noResults = false;
    if (diff.length < 20 && diff.length >= 1) {
      diff = new Set([...setA.result, ...diff]);
      diff = [...diff].sort((a, b) => {
        if (b.score < a.score) {
          return -1;
        }
        if (b.score > a.score) {
          return 1;
        }
        return 0;
      });
    }

    this.diffService.setDifference(diff);
    return diff;
  }

  // calculate the new result set based on set intersection in additive type requests
  calculateSetIntersection(setA, setB) {
    if (!setA) return;
    if (!setB) return;

    //retain the common screens between the current and previous serach requests from the current search request
    let intersect = setB.result.filter(({ index: id1 }) =>
      setA.result.some(({ index: id2 }) => id2 === id1)
    );
    if (!intersect) {
      this.setNoResultsService.setNoResultsFlag(true);
      return;
    }

    if (intersect.length < 20 && intersect.length >= 1) {
      intersect = new Set([...setA.result, ...intersect]);
      intersect = [...intersect].sort((a, b) => {
        if (b.score < a.score) {
          return -1;
        }
        if (b.score > a.score) {
          return 1;
        }
        return 0;
      });
    }
    this.intersectService.setIntersection(intersect);
    return intersect;
  }

  openImageDialog(url: String) {
    this.dialog.open(ImageDialogComponent, {
      data: {
        url: url,
      },
      panelClass: 'image-dialog-container',
    });
  }

  //get top 20 results
  getTopResults(metaResults: any[]) {
    if (!metaResults) return;
    if (this.indexNext === undefined) {
      return;
    }
    let top = [];
    for (let i = 0; i < this.indexNext + 20; i++) {
      top.push(metaResults[i]);
    }
    return top;
  }

  // method that gets the next top 20 results based on the current 'indexNext'
  getNextTopResults(metaResults: any[]) {
    if (!metaResults) {
      this.noResults = true;
      this.counter = 0;
      return;
    }

    let iter_start = this.indexNext + 20;
    let iter_end = this.indexNext + 40;

    if (iter_start >= metaResults.length) {
      this.noResults = true;
      this.counter = 0;
      return;
    }

    if (metaResults.length > 20 && metaResults.length < iter_end) {
      iter_end = metaResults.length;
    }

    let top = [];
    for (let i = 0; i < iter_end; i++) {
      top.push(metaResults[i]);
    }
    this.indexNext = this.indexNext + 20;
    return top;
  }

  openDialog() {
    const dialogRef = this.dialog.open(InstructionsDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {});
  }
}

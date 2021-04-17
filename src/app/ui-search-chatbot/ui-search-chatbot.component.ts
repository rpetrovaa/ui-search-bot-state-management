import { Component, OnInit } from '@angular/core';
import { Gui2wireApiService } from '../services/gui2wire-api.service';
import { PostRequest, PostResult } from '../classes/post';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import {
  AddNegativeQueryBeforeDiff,
  AddNegativeQueryAfterDiff,
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
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-ui-search-chatbot',
  templateUrl: './ui-search-chatbot.component.html',
  styleUrls: ['./ui-search-chatbot.component.css'],
})
export class UISearchChatbotComponent implements OnInit {
  @Select(QueryState.getQueryResults) queryResults$: Observable<any[]>;
  @Select(QueryState.getLastQuery) lastQuery$: Observable<any[]>;

  api = API;

  mode_chatbot = true; //'search ui'; //'chatbot'; //or "search ui"
  mode_searchUI = false;

  postRequest: PostRequest = {
    query: '',
    method: 'bm25okapi',
    qe_method: '',
    max_results: 8,
  };

  results: any;
  resultsMeta: any;
  resultsImages: any;
  isImageLoading: boolean;
  imageToShow: string | ArrayBuffer;
  searchForm: FormGroup;

  request: PostRequest;
  requestNegative: PostRequest;
  requestExtended: PostRequest;
  reuqestMoreScreens: PostRequest;

  resultsNegative: any;
  resultsDiff: PostResult[];

  resultsExtended: any;
  resultsIntersect: PostResult[];

  snapshot;
  lastResults: any;

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
    public setNoResultsService: SetNoResponseService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.routeQueryParams$ = this.route.queryParams.subscribe((params) => {
      params = params['dialog'];
      this.openDialog();
    });
    if (this.mode_searchUI === true) {
      this.searchForm = new FormGroup({
        value: new FormControl('login'),
      });
    } else {
      if (this.setActionService.requestNegative) {
        this.indexNext = 0;
        this.setActionService.requestNegative.subscribe((request) => {
          if (!request) return;
          this.requestNegative = request.postRequest;
          if (this.requestNegative) {
            if (this.noResults) {
              this.setNoResultsService.setNoResultsFlag(false);
              this.noResults = this.setNoResultsService.getNoResultsFlag();
              console.log('no results?', this.noResults);
            }
            this.computeNegativeResults(this.requestNegative, this.counter);
          }
        });
        this.setActionService.requestNegative = null;
      }
    }

    if (this.setActionService.requestExtended) {
      this.indexNext = 0;
      console.log('JUMPED IN REQUEST EXTENDED AS WELL');
      this.setActionService.requestExtended.subscribe((request) => {
        console.log('IN SUBSCRIBE');
        console.log('REQ', request);
        if (!request) return;
        this.requestExtended = request.postRequest;

        if (this.noResults) {
          this.setNoResultsService.setNoResultsFlag(false);
          this.noResults = this.setNoResultsService.getNoResultsFlag();
          console.log('no results?', this.noResults);
        }
        this.stateExt = RequestType[request.requestType];
        this.counter = request.counter;
        // console.log('Before resetting index, statet is: ' + this.stateExt);
        if (this.stateExt === 'INITIAL') {
          this.indexNext = 0;
        }
        if (this.requestExtended) {
          // console.log('requestExtended is not undefined');
          console.log('In request extended');

          this.computeExtendedResults(
            this.requestExtended,
            this.counter,
            this.stateExt
          );
        }
      });
      this.setActionService.requestExtended = null;
    }

    if (this.setActionService.requestMoreScreens) {
      console.log('IS THERE SOMETHING IN REQ MORE SCREENS');
      console.log('more', this.setActionService.requestMoreScreens);
      this.setActionService.requestMoreScreens.subscribe((request) => {
        if (!request) return;
        this.reuqestMoreScreens = request.postRequest;

        if (this.noResults) {
          // this.setNoResultsService.setNoResultsFlag(false);
          // this.noResults = this.setNoResultsService.getNoResultsFlag();
          // console.log('no results?', this.noResults);
          return;
        }
        this.stateExt = RequestType[request.requestType];
        this.counter = request.counter;

        if (!this.stateExt) return;
        if (!this.counter) return;
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
      console.log('RESULTs', results);

      if (this.requestExtended) {
        console.log('COUNTER', this.counter);
        if (this.counter > 0) {
          console.log('IN 1nd part');
          this.counterEntires += 1;
          console.log('ENTERED FOR THE ' + this.counterEntires + ' TIME');

          //if there were no results from the prev. query, reset state to INITIAL. Otherwise itersect will not be computed for the two following requests and the code will break
          //if there were no results from the prev. query, reset state to INITAL. Otherwise itersect will not be computed for the two following requests and the code will break
          if (!results[results.length - 1].length) {
            console.log(true);
            this.counter = 0;
          }

          let intersect = this.calculateSetIntersection(
            results[results.length - 2],
            results[results.length - 1]
          );
          console.log('Calculataed intersection', intersect);
          console.log('previ', results[results.length - 2].query);
          console.log('curri', results[results.length - 1].query);
          this.endResults = intersect;
        } else {
          this.counterEntires += 1;
          console.log('ENTERED FOR THE ' + this.counterEntires + ' TIME');
          this.endResults = results[results.length - 1].result;
        }

        this.noResults = this.setNoResultsService.getNoResultsFlag();
        console.log('GENERAL', this.endResults);
        this.renderChatbotResultsFromMetaData(this.endResults);
        this.requestExtended = null;
      }

      if (this.requestNegative) {
        let setDiff: PostResult[] = this.calculateSetDifference(
          results[results.length - 2],
          results[results.length - 1]
        );

        this.noResults = this.setNoResultsService.getNoResultsFlag();
        console.log('no results?', this.noResults);

        //if there were no results from the prev. query, reset state to INITAL. Otherwise itersect will not be computed for the two following requests and the code will break
        if (!results[results.length - 1].length) {
          console.log(true);
          this.counter = 0;
        }

        console.log('SetDiff', setDiff);
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

        console.log(
          'what is the original value',
          results[results.length - 1].result
        );

        this.nextResults = this.getNextTopResults(
          results[results.length - 1].result
        );

        // if (this.nextResults.length === 0) {
        //   this.noResults = true;
        //   this.counter = 0;
        // }
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

  sendRequest() {
    this.postRequest.query = this.searchForm.get('value').value;

    this.store.dispatch(
      new AddQuery({
        query: this.postRequest.query,
        requestType: RequestType[0],
        postRequest: this.postRequest,
        counter: this.counter,
      })
    );
    this.queryResults$.subscribe((results) => {
      if (!results) return;

      this.resultsMeta = [];
      this.resultsImages = [];
      const primary = [];

      results.forEach((result) => {
        result.result.forEach((element) => {
          const index = element.index;
          const url = '/ui/' + index + '.jpg';
          primary.push(element);
          this.resultsImages.push(url);
        });
      });

      if (!this.resultsMeta && !primary && !this.resultsImages) return;
      this.resultsMeta = this.combineArrays(primary, this.resultsImages);

      this.searchForm.reset();
    });
    this.resultsMeta = [];
    this.resultsImages = [];
  }

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

  computeNextScreensResults(
    extRequest: PostRequest,
    counter: number,
    type: string
  ) {
    this.nextResults = [];

    this.nextResults = this.getNextTopResults(this.lastResults[1].result);

    if (!this.nextResults) return;

    this.store.dispatch(
      new AddNextScreens(
        {
          query: null,
          requestType: type,
          postRequest: null,
          counter: counter,
        },
        this.lastResults[1].result
        //result[result.length - 1]
      )
    );

    this.renderChatbotResultsFromMetaData(this.nextResults);
  }

  renderChatbotResults(request: PostRequest, counter: number) {
    this.store.dispatch(
      new AddQuery({
        query: request.query,
        requestType: this.state,
        postRequest: request,
        counter: counter,
      })
    );
    this.queryResults$.subscribe((results) => {
      if (!results) return;
      this.resultsMeta = [];
      this.resultsImages = [];
      //console.log('Results in app:', results);

      const primary = [];

      results.forEach((result) => {
        if (!result) return;
        if (!result.result) return;
        const top = this.getTopResults(result.result);
        //console.log('TOP', top);
        top.forEach((element) => {
          if (!element) return;
          const index = element.index;
          const url = '/ui/' + index + '.jpg';
          primary.push(element);
          this.resultsImages.push(url);
        });
      });

      if (!this.resultsMeta && !primary && !this.resultsImages) return;
      this.resultsMeta = this.combineArrays(primary, this.resultsImages);
    });
    this.resultsMeta = [];
    this.resultsImages = [];
  }

  renderChatbotResultsFromMetaData(results: any) {
    console.log('is it null?', results);
    console.log('Trying to render in results meta');
    if (!results) return;

    let query_results = results;

    this.noResults = this.setNoResultsService.getNoResultsFlag();

    //console.log('RESULTS', results);

    this.resultsMeta = [];
    this.resultsImages = [];
    const primary = [];

    const top = this.getTopResults(results);
    console.log('TOP', top);

    if (!top) return;
    top.forEach((result) => {
      // console.log('iterating in TOP', result);
      if (!result) return;
      const index = result.index;
      const url = '/ui/' + index + '.jpg';
      primary.push(result);
      this.resultsImages.push(url);
    });
    if (!this.resultsMeta && !primary && !this.resultsImages) return;
    this.resultsMeta = this.combineArrays(primary, this.resultsImages);
    console.log('this.resultsMeta', this.resultsMeta);
  }

  getUIs(data) {
    if (!data) {
      // console.log('No metadata retrieved from server.');
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

  combineArrays(a1, a2) {
    a1 = a1.map((value, index) => ({
      resultMeta: value,
      screenURL: a2[index],
    }));

    return a1;
  }

  calculateSetDifference(setA, setB) {
    console.log('CALCULATING DIFF');
    if (!setA) return;
    if (!setB) return;
    let diff = setA.result.filter(
      ({ index: id1 }) => !setB.result.some(({ index: id2 }) => id2 === id1)
    );
    // console.log('the diff', diff);
    // if (diff.length === 0) {
    if (!diff.length) {
      //  this.noResults = true;
      this.setNoResultsService.setNoResultsFlag(true);
      return;
    }

    // this.noResults = false;
    if (diff.length < 20 && diff.length >= 1) {
      console.log(
        'Diffren was smaller than 20 and bigger than 1. Calculating new intersect'
      );
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

  calculateSetIntersection(setA, setB) {
    console.log('CALCULATING INTERSECTION');
    if (!setA) return;
    if (!setB) return;
    let intersect = setB.result.filter(
      ({ index: id1 }) => setA.result.some(({ index: id2 }) => id2 === id1),
      console.log('tralalala')
    );
    // console.log('the intersect', intersect);
    // if (intersect.length === 0) {
    if (!intersect) {
      //  this.noResults = true;
      this.setNoResultsService.setNoResultsFlag(true);
      return;
    }

    if (intersect.length < 20 && intersect.length >= 1) {
      console.log(
        'Intersect was smaller than 20 and bigger than 1. Calculating new intersect'
      );
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

    //this.diffService.setDifference(intersect);
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
    console.log('in top results', metaResults);
    if (!metaResults) return;
    console.log('INDEX NEXT', this.indexNext);
    if (this.indexNext === undefined) {
      console.log('in if statement');
      return;
    }
    let top = [];
    console.log('index next');
    for (let i = 0; i < this.indexNext + 20; i++) {
      top.push(metaResults[i]);
    }
    return top;
  }

  getNextTopResults(metaResults: any[]) {
    console.log('in next results', metaResults);
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
      iter_end = metaResults.length - 1;
    }

    console.log('NEXT INDEX', this.indexNext);
    let top = [];
    for (let i = 0; i < iter_end; i++) {
      console.log('i: ', i);
      top.push(metaResults[i]);
    }
    this.indexNext = this.indexNext + 20;
    return top;
  }

  openDialog() {
    const dialogRef = this.dialog.open(InstructionsDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
}

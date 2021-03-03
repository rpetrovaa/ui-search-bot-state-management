import { Component, OnInit } from '@angular/core';
import { Gui2wireApiService } from './services/gui2wire-api.service';
import { PostRequest, PostResult } from './classes/post';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';
import {
  AddNegativeQueryBeforeDiff,
  AddNegativeQueryAfterDiff,
  AddQuery,
  AddExtendedQueryBeforeIntersect,
  AddNextScreens,
} from './actions/query.actions';
import { QueryState } from './state/query.state';
import { Observable } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { RequestType } from './model/query.model';
import { SetStateService } from './services/set-state.service';
import { API } from './model/api';
import { DiffService } from './services/diff.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
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

  constructor(
    private store: Store,
    private service: Gui2wireApiService,
    private setActionService: SetStateService,
    private diffService: DiffService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    if (this.mode_searchUI === true) {
      this.searchForm = new FormGroup({
        value: new FormControl('login'),
      });
    } else {
      if (this.setActionService.requestNegative) {
        this.setActionService.requestNegative.subscribe((request) => {
          if (!request) return;
          this.requestNegative = request.postRequest;
          if (this.requestNegative) {
            // console.log('requestNegative is not undefined');

            this.computeNegativeResults(this.requestNegative, this.counter);

            this.lastQuery$.subscribe((results) => {
              this.lastResults = results;
              let setDiff: PostResult[] = this.calculateSetDifference(
                this.lastResults[0],
                this.lastResults[1]
              );
              //console.log(setDiff);
              if (!setDiff) return;
              this.resultsDiff = [];
              setDiff.forEach((res) => {
                this.resultsDiff.push(res);
              });
            });

            if (!this.resultsDiff) return;
            this.renderChatbotResultsFromMetaData(this.resultsDiff);
          }
        });
        this.setActionService.requestNegative = null;
      }

      if (this.setActionService.request) {
        this.setActionService.request.subscribe((request) => {
          if (!request) return;
          this.request = request.postRequest;
          this.state = RequestType[request.requestType];
          this.counter = request.counter;
          // console.log('in app request is: ', this.request);
          if (this.request) {
            //console.log('rendering');
            this.renderChatbotResults(this.request, this.counter);
          }
        });
        this.setActionService.request = null;
      }
    }

    if (this.setActionService.requestExtended) {
      this.setActionService.requestExtended.subscribe((request) => {
        if (!request) return;
        this.requestExtended = request.postRequest;
        console.log('STATE', this.stateExt);
        console.log(request.requestType);
        this.stateExt = RequestType[request.requestType];
        this.counter = request.counter;
        console.log('Before resetting index, statet is: ' + this.stateExt);
        if (this.stateExt === 'INITIAL') {
          this.indexNext = 0;
        }
        if (this.requestExtended) {
          // console.log('requestExtended is not undefined');

          this.computeExtendedResults(
            this.requestExtended,
            this.counter,
            this.stateExt
          );

          this.lastQuery$.subscribe((results) => {
            if (!results) return;
            this.lastResults = results;
            if (this.counter > 0) {
              let intersect: PostResult[] = this.calculateSetIntersection(
                this.lastResults[0],
                this.lastResults[1]
              );
              //console.log(setDiff);
              if (!intersect) return;
              this.resultsIntersect = [];
              intersect.forEach((res) => {
                this.resultsIntersect.push(res);
              });
              if (!this.resultsIntersect) return;
              this.renderChatbotResultsFromMetaData(this.resultsIntersect);
            } else {
              console.log('IN HEREEE');

              if (this.lastResults[1] && this.lastResults[1].result) {
                console.log(this.lastResults[1].result);
                this.renderChatbotResultsFromMetaData(
                  this.lastResults[1].result
                );
              }
            }
          });
        }
      });
      this.setActionService.requestExtended = null;
    }

    if (this.setActionService.requestMoreScreens) {
      console.log('more', this.setActionService.requestMoreScreens);
      this.setActionService.requestMoreScreens.subscribe((request) => {
        if (!request) return;
        console.log('STATE', this.stateExt);
        console.log(request.requestType);
        this.stateExt = RequestType[request.requestType];
        this.counter = request.counter;

        this.computeNextScreensResults(
          this.requestExtended,
          this.counter,
          this.stateExt
        );
      });
    }

    // this.snapshot = this.store.snapshot();
    // console.log('SNAPSHOT:', this.snapshot);
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
    this.queryResults$.subscribe((results) => {
      if (!results) return;

      this.resultsNegative = [];
      const primary = [];
      let resImgs = [];

      results.forEach((result) => {
        result.result.forEach((element) => {
          const index = element.index;
          const url = '/ui/' + index + '.jpg';
          primary.push(element);
          resImgs.push(url);
        });
      });

      if (!this.resultsNegative && !primary && !resImgs) return;
      this.resultsNegative = this.combineArrays(primary, resImgs);
    });
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
    this.queryResults$.subscribe((results) => {
      if (!results) return;

      this.resultsIntersect = [];
      const primary = [];
      let resImgs = [];

      results.forEach((result) => {
        result.result.forEach((element) => {
          const index = element.index;
          const url = '/ui/' + index + '.jpg';
          primary.push(element);
          resImgs.push(url);
        });
      });

      if (!this.resultsIntersect && !primary && !resImgs) return;
      this.resultsIntersect = this.combineArrays(primary, resImgs);
    });
  }

  computeNextScreensResults(
    extRequest: PostRequest,
    counter: number,
    type: string
  ) {
    this.nextResults = [];

    console.log('LAST RES', this.lastResults);

    this.nextResults = this.getNextTopResults(this.lastResults[1].result);

    console.log('NEXT RES: ', this.nextResults);

    if (!this.nextResults) return;
    console.log('next res', this.nextResults);

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

  renderChatbotResults(request: PostRequest, counter: number) {
    //if (!this.state) return;
    //console.log('STATE', this.state);
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
    if (!results) return;

    let query_results = results;

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
    //console.log('this.resultsMeta', this.resultsMeta);
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
    // console.log('setA', setA);
    // console.log('setB', setB);
    if (!setA) return;
    if (!setB) return;
    let diff = setA.result.filter(
      ({ index: id1 }) => !setB.result.some(({ index: id2 }) => id2 === id1)
    );
    // console.log('the diff', diff);
    if (!diff) return;
    this.diffService.setDifference(diff);
    return diff;
  }

  calculateSetIntersection(setA, setB) {
    // console.log('setA', setA);
    // console.log('setB', setB);
    if (!setA) return;
    if (!setB) return;
    let intersect = setA.result.filter(({ index: id1 }) =>
      setB.result.some(({ index: id2 }) => id2 === id1)
    );
    // console.log('the intersect', intersect);
    if (!intersect) return;
    this.diffService.setDifference(intersect);
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
    let top = [];
    for (let i = 0; i < 20; i++) {
      top.push(metaResults[i]);
    }
    return top;
  }

  getNextTopResults(metaResults: any[]) {
    if (!metaResults) return;
    console.log('NEXT INDEX', this.indexNext);
    let top = [];
    for (let i = this.indexNext + 20; i < this.indexNext + 40; i++) {
      //console.log('i: ', i);
      top.push(metaResults[i]);
    }
    this.indexNext = this.indexNext + 20;
    return top;
  }
}

import { Component, OnInit } from '@angular/core';
import { Gui2wireApiService } from './services/gui2wire-api.service';
import { PostRequest } from './classes/post';
import { FormControl, FormGroup } from '@angular/forms';
import { AddNegativeQuery, AddQuery } from './actions/query.actions';
import { QueryState } from './state/query.state';
import { Observable } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { RequestType } from './model/query.model';
import { SetStateService } from './services/set-state.service';
import { API } from './model/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  @Select(QueryState.getQueryResults) queryResults$: Observable<any[]>;
  @Select(QueryState.getLastQuery) lastQuery$: Observable<any[]>;

  api = API;

  mode_chatbot = false; //'search ui'; //'chatbot'; //or "search ui"
  mode_searchUI = true;

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

  resultsNegative: any;

  snapshot;
  lastResults: any;

  constructor(
    private store: Store,
    private service: Gui2wireApiService,
    private setActionService: SetStateService
  ) {}

  ngOnInit() {
    if (this.mode_searchUI === true) {
      this.searchForm = new FormGroup({
        value: new FormControl('login'),
      });
    } else {
      if (this.setActionService.requestNegative) {
        this.setActionService.requestNegative.subscribe((request) => {
          this.requestNegative = request;
          //console.log('in app NEGATIVE request is: ', this.requestNegative);
          if (this.requestNegative) {
            console.log('requestNegative is not undefined');

            this.computeNegativeResults(this.requestNegative);

            this.lastQuery$.subscribe((results) => {
              //console.log('LAST RESULTS IN in the Subscribe', results);
              this.lastResults = results;
              let setDiff = this.calculateSetDifference(
                this.lastResults[0],
                this.lastResults[1]
              );

              console.log('Viewing the difference', setDiff);

              this.renderChatbotResultsFromMetaData(setDiff);
            });
          }
        });
      }

      if (this.setActionService.request) {
        this.setActionService.request.subscribe((request) => {
          this.request = request;
          console.log('in app request is: ', this.request);
          if (this.request) {
            console.log('rendering');
            this.renderChatbotResults(this.request);
          }
        });
      }
    }

    this.snapshot = this.store.snapshot();
    console.log('SNAPSHOT:', this.snapshot);
  }

  sendRequest() {
    this.postRequest.query = this.searchForm.get('value').value;

    this.store.dispatch(
      new AddQuery({
        query: this.postRequest.query,
        requestType: RequestType.INITIAL,
        postRequest: this.postRequest,
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

  computeNegativeResults(negRequest: PostRequest) {
    //console.log('in computeNegativeResults');

    this.store.dispatch(
      new AddNegativeQuery({
        query: negRequest.query,
        requestType: RequestType.NEGATIVE,
        postRequest: negRequest,
      })
    );
    this.queryResults$.subscribe((results) => {
      if (!results) return;

      //console.log('Results from NEGATIVE request in app:', results);

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
      //console.log('this.resultsNegative in the loop', this.resultsNegative);
    });
    //console.log('this.resultsNegative after the loop', this.resultsNegative);
  }

  renderChatbotResults(request: PostRequest) {
    this.store.dispatch(
      new AddQuery({
        query: request.query,
        requestType: RequestType.INITIAL,
        postRequest: request,
      })
    );
    this.queryResults$.subscribe((results) => {
      if (!results) return;
      this.resultsMeta = [];
      this.resultsImages = [];
      console.log('Results in app:', results);

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
    });
    this.resultsMeta = [];
    this.resultsImages = [];
  }

  renderChatbotResultsFromMetaData(results: any) {
    if (!results) return;

    console.log('RESULTS', results);

    this.resultsMeta = [];
    this.resultsImages = [];
    const primary = [];

    results.forEach((result) => {
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
      console.log('No metadata retrieved from server.');
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
    console.log('setA', setA);
    console.log('setB', setB);
    if (!setA) return;
    if (!setB) return;
    let diff = setA.result.filter(
      ({ index: id1 }) => !setB.result.some(({ index: id2 }) => id2 === id1)
    );
    console.log('the diff', diff);
    return diff;
  }
}

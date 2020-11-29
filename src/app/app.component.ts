import { Component, OnInit, Query } from '@angular/core';
import { Gui2wireApiService } from './services/gui2wire-api.service';
import { PostRequest, PostResult } from './classes/post';
import { FormControl, FormGroup } from '@angular/forms';
import { AddQuery } from './actions/query.actions';
import { QueryState, QueryStateModel } from './state/query.state';
import { Observable } from 'rxjs';
import {Select, Store} from '@ngxs/store';
import { INITIAL_STATE_TOKEN } from '@ngxs/store/internals';
import { QueryResult, RequestType } from './model/query.model';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  @Select(QueryState.getQueryResults) queryResults$: Observable<any[]>;

  api = "http://alkmaar.informatik.uni-mannheim.de/gui2r/gui2r/v1/retrieval";

  postRequest: PostRequest = {
    query: "",
    method: "bm25okapi",
    qe_method:"",
    max_results: 8
  };

  //results: PostResult;
  results: any;
  resultsMeta: any;
  resultsImages: any;
  isImageLoading: boolean;
  imageToShow: string | ArrayBuffer;

  compoundResult: any[];
  blobs: any[];
  value;
  searchForm: FormGroup;

  constructor(private store: Store,
    private service: Gui2wireApiService) { }

  // addQuery(requestType: PostRequest) {
  //   this.store.dispatch(new AddQuery({requestType}));
  // }

  ngOnInit() {
    this.searchForm = new FormGroup({
      value: new FormControl("login")
    });
  }

  sendRequest() {
    //_data;
    this.postRequest.query = this.searchForm.get("value").value;
    const test = this.store.dispatch(new AddQuery({query: this.postRequest.query, requestType: RequestType.INITIAL, postRequest: this.postRequest}));
    test.subscribe((x) => console.log("x", x));
    this.queryResults$.subscribe(results => {
      //console.log("small results", results);
      if(!results) return;
      this.resultsMeta = [];
      //console.log("Results: ", this.resultsMeta);

      this.resultsImages = [];
      this.blobs = [];

      const primary = [];

      results.forEach(result => {
        //console.log("RES",result.result);
        result.result.forEach(element => {
          //console.log(element);
          const index = element.index;
          const url = '/ui/' + index + '.jpg';
          primary.push(element);
          this.resultsImages.push(url);
        });

        //const index = result.result.index;
        // const url = '/ui/' + index + '.jpg';
        // this.resultsImages.push(url);
      });

      if(!this.resultsMeta && !primary && !this.resultsImages) return;
      this.resultsMeta = this.combineArrays(primary, this.resultsImages);

      this.searchForm.reset();
    });
    this.resultsMeta = [];
    this.resultsImages = [];
  }

  getUIs(data) {
    if(!data) {
      console.log("No metadata retrieved from server.");
      return
    };

    data.results.forEach(result => {
      const index = result.index;
      const url = '/ui/' + index + '.jpg';
      //console.log("URL: ", url);
      this.service.get(url).subscribe(data => {
        this.resultsImages.push(this.createImageFromBlob(data));
        this.isImageLoading = false;
      }, error => {
        this.isImageLoading = false;
        console.log(error);
      });
    });
  }

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
       this.imageToShow = reader.result;
    }, false);

    if (image) {
       reader.readAsDataURL(image);
    }

    if (this.imageToShow){
      return this.imageToShow
    };
  }

  combineArrays(a1, a2) {
    a1 = a1.map((value, index) =>
        ({resultMeta: value,
         screenURL: a2[index]})
    );
    //console.log(a1);
    return a1;
  }

}

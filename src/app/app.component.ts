import { Component } from '@angular/core';
import { Gui2wireApiService } from './services/gui2wire-api.service';
import { PostRequest, PostResult } from './classes/post';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AddQuery } from './actions/query.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  //title = 'state-management';
  
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

  addQuery(query, requestType) {
    this.store.dispatch(new AddQuery({query: query, requestType: requestType}));
  }

  ngOnInit() {
    this.searchForm = new FormGroup({
      value: new FormControl("login")
    });
  }

  sendRequest() {
    //_data;
    this.postRequest.query = this.searchForm.get("value").value;
    console.log("this post request:", this.postRequest);

    this.service.post('/api', this.postRequest).subscribe(data => {
      this.resultsMeta = [...data.results];
      console.log("Results: ", this.resultsMeta);
      //_data = data;

      this.resultsImages = [];
      this.blobs = [];

      data.results.forEach(result => {
        const index = result.index;
        //this.resultsImages.push(index);
        const url = '/ui/' + index + '.jpg';
        // console.log("URL: ", url);
        this.resultsImages.push(url);
      });

      this.resultsMeta = this.combineArrays(this.resultsMeta, this.resultsImages);
      console.log("updated:", this.resultsMeta)



      console.log("this.resultsImages", this.resultsImages);
      console.log("blobs 2", this.blobs);

      if(!data) { 
        console.log("empty data!");
        return
      }

      //this.getUIs(data);
      this.searchForm.reset();
    });
    // return _data;
  }

  getUIs(data) {
    if(!data) { 
      console.log("No metadata retrieved from server.");
      return
    };

    data.results.forEach(result => {
      const index = result.index;
      //this.resultsImages.push(index);
      const url = '/ui/' + index + '.jpg';
      console.log("URL: ", url);
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
        ({firstResult: value,
        secondResult: a2[index]})
    );
    console.log(a1);
    return a1;
  }

}

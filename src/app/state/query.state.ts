import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AddInitialRequestType, AddQuery } from '../actions/query.actions';
import { PostRequest, PostResult } from '../classes/post';
import { Query, QueryResult, RequestType } from '../model/query.model';
import { Gui2wireApiService } from '../services/gui2wire-api.service';
import { tap, take } from 'rxjs/operators'; 

export class QueryStateModel {
    queries: QueryResult[];
    //results: PostResult[];
}

@State<QueryStateModel>({
    name: "queries",
    defaults: {
        queries: [],
        //results: []
    }
})
@Injectable()
export class QueryState {

    constructor(private queryService: Gui2wireApiService) {}

    @Selector()
    static getQueryResults(state: QueryStateModel) {
        return [...state.queries];
    }

    @Action(AddQuery)
    add({getState, setState}: StateContext<QueryStateModel>, { payload }: AddQuery) {
        const state = getState();
        // return this.queryService.post('/api', payload.postRequest).subscribe((result) => {
        //     if(!result) return;
            
        //     //console.log("res:", result.results);
        //     setState({
        //         queries: [ ...state.queries,
        //                     {query: payload.query, requestType: RequestType.INITIAL, postRequest: payload.postRequest},
        //                  ],
        //         results: [...state.results, ...result.results],
        //     });
        //   })
        return this.queryService.post('/api', payload.postRequest).pipe(take(1),tap((result) => {
            if(!result) return;
            
            //console.log("res:", result.results);
            setState({
                queries: [ ...state.queries,
                            {query: {query: payload.query, requestType: RequestType.INITIAL, postRequest: payload.postRequest}, result: result.results},
                         ]
                //results: [...state.results, ...result.results],
            });
          }));
    }

    // @Action(AddInitialRequestType)
    // addInitialRequest({getState, setState}: StateContext<QueryStateModel>) {
    //     const state = getState();
    //     setState({
    //         ...state,
    //         queries:
    //     });
    //}

    // @Action(SetRequestType)
    // setRequestType({getState, setState}: StateContext<QueryStateModel>, { payload }: SetRequestType) {
    //     const state = getState();

    //     const current = {
    //         coffeeList: payload.requestType
    //     };

    //     setState({
    //         ...state,
    //         payload.requestType
    //     });
    // }
}
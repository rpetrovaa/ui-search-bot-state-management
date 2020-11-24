import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AddInitialRequestType, AddQuery } from '../actions/query.actions';
import { PostRequest, PostResult } from '../classes/post';
import { Query, RequestType } from '../model/query.model';
import { Gui2wireApiService } from '../services/gui2wire-api.service';

export class QueryStateModel {
    queries: Query[];
    results: PostResult[];
}

@State<QueryStateModel>({
    name: "queries",
    defaults: {
        queries: [],
        results: []
    }
})
@Injectable()
export class QueryState {

    constructor(private queryService: Gui2wireApiService) {}

    @Selector()
    static getQueryResults(state: QueryStateModel) {
        return state.results;
    }

    @Action(AddQuery)
    add({getState, setState}: StateContext<QueryStateModel>, { payload }: AddQuery) {
        return this.queryService.post('/api', payload.postRequest).subscribe((result) => {
            const state = getState();
            //console.log("res:", result.results);
            setState({
                ...state,
                queries: [ ...state.queries,
                            {query: payload.query, requestType: RequestType.INITIAL, postRequest: payload.postRequest},
                         ],
                results: [...state.results, ...result.results],
            });
          })
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
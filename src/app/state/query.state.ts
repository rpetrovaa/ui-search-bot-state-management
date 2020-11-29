import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AddInitialRequestType, AddQuery } from '../actions/query.actions';
import { Query, QueryResult, RequestType } from '../model/query.model';
import { Gui2wireApiService } from '../services/gui2wire-api.service';
import { tap, take } from 'rxjs/operators'; 

export class QueryStateModel {
    queries: QueryResult[];
    counter: number;
}

@State<QueryStateModel>({
    name: "queries",
    defaults: {
        queries: [],
        counter: 0
    }
})
@Injectable()
export class QueryState {

    constructor(private queryService: Gui2wireApiService) {}

    @Selector()
    static getQueryResults(state: QueryStateModel) {
        //return [...state.queries];
        const current = state.queries[state.queries.length - 1];
        if(!current) return;
        return [current];
    }

    @Action(AddQuery)
    add({getState, setState}: StateContext<QueryStateModel>, { payload }: AddQuery) {
        const state = getState();
        return this.queryService.post('/api', payload.postRequest).pipe(take(1),tap((result) => {
            if(!result) return;
            let type = RequestType.ADDITIVE;
            if(state.counter == 0) {
                type = RequestType.INITIAL;
            }
            setState({
                queries: [ ...state.queries,
                            {query: {query: payload.query, requestType: type, postRequest: payload.postRequest}, result: result.results},
                         ],
                counter: state.counter += 1
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
    // }

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
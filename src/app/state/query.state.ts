import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AddQuery } from '../actions/query.actions';
import { PostRequest } from '../classes/post';
import { Query } from '../model/query.model';
import { Gui2wireApiService } from '../services/gui2wire-api.service';

export class QueryStateModel {
    queries: PostRequest[];
}

@State<QueryStateModel>({
    name: "queries",
    defaults: {
        queries: []
    }
})
@Injectable()
export class QueryState {

    constructor(private queryService: Gui2wireApiService) {}

    @Selector()
    static getQueries(state: QueryStateModel) {
        return state.queries;
    }

    @Action(AddQuery)
    add({getState, setState}: StateContext<QueryStateModel>, { payload }: AddQuery) {
        return this.queryService.post('/api', payload).subscribe((result) => {
            const state = getState();
            setState({
                ...state,
                queries: result
            });
          })
    }
}
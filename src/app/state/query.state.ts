import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import {
  AddQuery,
  //AddNegativeQuery,
  AddNegativeQueryBeforeDiff,
  AddNegativeQueryAfterDiff,
  AddExtendedQueryBeforeIntersect,
  AddExtendedQueryAfterInstersect,
} from '../actions/query.actions';
import { QueryResult, RequestType } from '../model/query.model';
import { Gui2wireApiService } from '../services/gui2wire-api.service';
import { tap, take } from 'rxjs/operators';
import { dispatch } from 'rxjs/internal/observable/pairs';
import { PostRequest } from '../classes/post';
import { DiffService } from '../services/diff.service';

export class QueryStateModel {
  queries: QueryResult[];
  counter: number;
}

@State<QueryStateModel>({
  name: 'queries',
  defaults: {
    queries: [],
    counter: 0,
  },
})
@Injectable()
export class QueryState {
  constructor(
    private queryService: Gui2wireApiService,
    private diffService: DiffService
  ) {}

  @Selector()
  static getQueryResults(state: QueryStateModel) {
    //return [...state.queries];
    const current = state.queries[state.queries.length - 1];
    if (!current) return;
    return [current];
  }

  @Selector()
  static getLastQuery(state: QueryStateModel) {
    //return [...state.queries];
    const current = state.queries[state.queries.length - 1];
    const prev = state.queries[state.queries.length - 2];
    // if (!current) return;
    // if (!prev) return;
    console.log('previous query', prev);
    console.log('current query', current);
    return [prev, current];
  }

  @Action(AddQuery)
  add(
    { getState, setState }: StateContext<QueryStateModel>,
    { payload }: AddQuery
  ) {
    const state = getState();
    return this.queryService.post('/api', payload.postRequest).pipe(
      take(1),
      tap((result) => {
        if (!result) return;
        console.log('result in additive', result);
        let type = RequestType.ADDITIVE;
        if (state.counter == 0) {
          type = RequestType.INITIAL;
        }
        setState({
          queries: [
            ...state.queries,
            {
              query: {
                query: payload.query,
                requestType: type,
                postRequest: payload.postRequest,
              },
              result: result.results,
            },
          ],
          counter: (state.counter += 1),
        });
      })
    );
  }

  @Action(AddNegativeQueryBeforeDiff)
  AddNegativeQueryBeforeDiff(
    { getState, setState, dispatch }: StateContext<QueryStateModel>,
    { payload }: AddNegativeQueryBeforeDiff
  ) {
    const state = getState();
    return this.queryService.post('/api', payload.postRequest).pipe(
      take(1),
      tap((result) => {
        if (!result) return;
        console.log('Result in b4 neg', result);
        let type = RequestType.NEGATIVE;
        setState({
          queries: [
            ...state.queries,
            {
              query: {
                query: payload.query,
                requestType: type,
                postRequest: payload.postRequest,
              },
              result: result.results,
            },
          ],
          counter: (state.counter += 1),
        });
        let diff = this.diffService.getDifference();
        dispatch(
          new AddNegativeQueryAfterDiff(
            {
              query: payload.query,
              requestType: type,
              postRequest: payload.postRequest,
            },
            diff
          )
        );
      })
    );
  }

  @Action(AddNegativeQueryAfterDiff)
  AddNegativeQueryAfterDiff(
    { getState, setState }: StateContext<QueryStateModel>,
    { query, result }: AddNegativeQueryAfterDiff
  ) {
    console.log('Result in after neg', result);
    const state = getState();
    let type = RequestType.NEGATIVE;
    return setState({
      queries: [
        ...state.queries,
        {
          query: {
            query: query.query,
            requestType: type,
            postRequest: query.postRequest,
          },
          result: result,
        },
      ],
      counter: (state.counter += 1),
    });
  }
  @Action(AddExtendedQueryBeforeIntersect)
  AddExtendedQueryBeforeIntersect(
    { getState, setState, dispatch }: StateContext<QueryStateModel>,
    { payload }: AddExtendedQueryBeforeIntersect
  ) {
    const state = getState();
    return this.queryService.post('/api', payload.postRequest).pipe(
      take(1),
      tap((result) => {
        if (!result) return;
        console.log('Result in b4 intersect', result);
        let type = RequestType.ADDITIVE;
        setState({
          queries: [
            ...state.queries,
            {
              query: {
                query: payload.query,
                requestType: type,
                postRequest: payload.postRequest,
              },
              result: result.results,
            },
          ],
          counter: (state.counter += 1),
        });
        let diff = this.diffService.getDifference();
        dispatch(
          new AddExtendedQueryAfterInstersect(
            {
              query: payload.query,
              requestType: type,
              postRequest: payload.postRequest,
            },
            diff
          )
        );
      })
    );
  }

  @Action(AddExtendedQueryAfterInstersect)
  AddExtendedQueryAfterInstersect(
    { getState, setState }: StateContext<QueryStateModel>,
    { query, result }: AddExtendedQueryAfterInstersect
  ) {
    console.log('Result in after intersect', result);
    const state = getState();
    let type = RequestType.ADDITIVE;
    return setState({
      queries: [
        ...state.queries,
        {
          query: {
            query: query.query,
            requestType: type,
            postRequest: query.postRequest,
          },
          result: result,
        },
      ],
      counter: (state.counter += 1),
    });
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

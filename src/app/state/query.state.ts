import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import {
  AddQuery,
  //AddNegativeQuery,
  AddNegativeQueryBeforeDiff,
  AddNegativeQueryAfterDiff,
  AddExtendedQueryBeforeIntersect,
  AddExtendedQueryAfterInstersect,
  AddNextScreens,
} from '../actions/query.actions';
import { QueryResult, RequestType } from '../model/query.model';
import { Gui2wireApiService } from '../services/gui2wire-api.service';
import { tap, take } from 'rxjs/operators';
import { dispatch } from 'rxjs/internal/observable/pairs';
import { PostRequest } from '../classes/post';
import { DiffService } from '../services/diff.service';
import { IntersectService } from '../services/intersect.service';
import { SetNoResponseService } from '../services/set-no-response.service';

export class QueryStateModel {
  queries: QueryResult[];
}

@State<QueryStateModel>({
  name: 'queries',
  defaults: {
    queries: [],
  },
})
@Injectable()
export class QueryState {
  constructor(
    private queryService: Gui2wireApiService,
    private diffService: DiffService,
    private intersectService: IntersectService,
    private SetNoResponseService: SetNoResponseService
  ) {}

  @Selector()
  static getQueryResults(state: QueryStateModel) {
    const current = state.queries[state.queries.length - 1];
    if (!current) return;
    return [current];
  }

  @Selector()
  static getLastQuery(state: QueryStateModel) {
    const current = state.queries[state.queries.length - 1];
    const prev = state.queries[state.queries.length - 2];
    return [prev, current];
  }

  // When a negative requests comes in the system
  @Action(AddNegativeQueryBeforeDiff)
  AddNegativeQueryBeforeDiff(
    { getState, setState, dispatch }: StateContext<QueryStateModel>,
    { payload }: AddNegativeQueryBeforeDiff
  ) {
    const state = getState();
    // forward request payload to the retrieval and ranking module via http post
    return this.queryService.post('/api', payload.postRequest).pipe(
      take(1),
      tap(
        (result) => {
          if (!result) return;
          setState({
            queries: [
              ...state.queries,
              {
                query: {
                  query: payload.query,
                  requestType: payload.requestType,
                  postRequest: payload.postRequest,
                  counter: payload.counter,
                },
                result: result.results,
              },
            ],
          });
          let diff = this.diffService.getDifference();
          if (diff) {
            dispatch(
              new AddNegativeQueryAfterDiff(
                {
                  query: payload.query,
                  requestType: payload.requestType,
                  postRequest: payload.postRequest,
                  counter: payload.counter,
                },
                diff
              )
            );
          }
        },
        (error) => {
          //Error callback
          console.error('error caught in component');
          throw error;
        }
      )
    );
  }

  // Update the state after processing implicit feedback for negative requests
  @Action(AddNegativeQueryAfterDiff)
  AddNegativeQueryAfterDiff(
    { getState, setState }: StateContext<QueryStateModel>,
    { query, result }: AddNegativeQueryAfterDiff
  ) {
    const state = getState();
    return setState({
      queries: [
        ...state.queries,
        {
          query: {
            query: query.query,
            requestType: query.requestType,
            postRequest: query.postRequest,
            counter: query.counter,
          },
          result: result,
        },
      ],
    });
  }

  // When an additice requests comes in the system
  @Action(AddExtendedQueryBeforeIntersect)
  AddExtendedQueryBeforeIntersect(
    { getState, setState, dispatch }: StateContext<QueryStateModel>,
    { payload }: AddExtendedQueryBeforeIntersect
  ) {
    const state = getState();
    // forward request payload to the retrieval and ranking module via http post
    return this.queryService.post('/api', payload.postRequest).pipe(
      take(1),
      tap((result) => {
        if (!result) return;
        setState({
          queries: [
            ...state.queries,
            {
              query: {
                query: payload.query,
                requestType: payload.requestType,
                postRequest: payload.postRequest,
                counter: payload.counter,
              },
              result: result.results,
            },
          ],
        });
        if (payload.requestType !== 'INITIAL') {
          let intersect = this.intersectService.getIntersection();
          if (!intersect) return;
          dispatch(
            new AddExtendedQueryAfterInstersect(
              {
                query: payload.query,
                requestType: payload.requestType,
                postRequest: payload.postRequest,
                counter: payload.counter,
              },
              intersect
            )
          );
        }
      })
    );
  }

  // Update the state after processing implicit feedback for additive requests
  @Action(AddExtendedQueryAfterInstersect)
  AddExtendedQueryAfterInstersect(
    { getState, setState }: StateContext<QueryStateModel>,
    { query, result }: AddExtendedQueryAfterInstersect
  ) {
    const state = getState();
    return setState({
      queries: [
        ...state.queries,
        {
          query: {
            query: query.query,
            requestType: query.requestType,
            postRequest: query.postRequest,
            counter: query.counter,
          },
          result: result,
        },
      ],
    });
  }

  // Update the state after processing implicit feedback for more screens requests
  @Action(AddNextScreens)
  AddNextScreens(
    { getState, setState }: StateContext<QueryStateModel>,
    { query, result }: AddNextScreens
  ) {
    const state = getState();
    return setState({
      queries: [
        ...state.queries,
        {
          query: {
            query: state.queries[state.queries.length - 1].query.query,
            requestType: query.requestType,
            postRequest:
              state.queries[state.queries.length - 1].query.postRequest,
            counter: query.counter,
          },
          result: state.queries[state.queries.length - 1].result,
        },
      ],
    });
  }
}

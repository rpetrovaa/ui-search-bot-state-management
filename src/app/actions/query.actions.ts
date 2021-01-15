import { Query } from '../model/query.model';

export class AddQuery {
  static readonly type = '[QUERY] Add';

  constructor(public payload: Query) {}
}

export class AddNegativeQuery {
  static readonly type = '[QUERY] Add Negative';

  constructor(public payload: Query) {}
}

export class AddInitialRequestType {
  static readonly type = '[INITIALREQUESTTYPE] Add';
}

import { PostResult } from '../classes/post';
import { Query } from '../model/query.model';

export class AddQuery {
  static readonly type = '[QUERY] Add';

  constructor(public payload: Query) {}
}

export class AddNegativeQueryBeforeDiff {
  static readonly type = '[QUERY] Add Negative B4 Diff';

  constructor(public payload: Query) {}
}

export class AddNegativeQueryAfterDiff {
  static readonly type = '[QUERY] Add Negative After Diff';

  constructor(public query: Query, public result: PostResult[]) {}
}

export class AddExtendedQueryBeforeIntersect {
  static readonly type = '[QUERY] Add Extended B4 Intersect';

  constructor(public payload: Query) {}
}

export class AddExtendedQueryAfterInstersect {
  static readonly type = '[QUERY] Add Extended After Instersect';

  constructor(public query: Query, public result: PostResult[]) {}
}

export class AddNextScreens {
  static readonly type = '[QUERY] Add Next Top 20 Screens';

  constructor(public query: Query, public result: PostResult[]) {}
}

export class AddInitialRequestType {
  static readonly type = '[INITIALREQUESTTYPE] Add';
}

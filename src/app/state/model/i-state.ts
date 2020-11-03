export interface IState {
    query: string,
    request_type: RequestType
}

enum RequestType {
    INITIAL, ADDITIVE, NEGATIVE
}
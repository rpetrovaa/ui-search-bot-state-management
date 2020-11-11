export interface Query {
    query: string,
    requestType: RequestType
}

enum RequestType {
    INITIAL, ADDITIVE, NEGATIVE
}
export interface S3EventBucket {
    name: string;
}
export interface S3EventObject {
    key: string;
    size: number;
}
export interface S3Event {
    bucket: S3EventBucket;
    object: S3EventObject;
}
export interface S3EventRecord {
    eventSource: string;
    s3: S3Event;
}

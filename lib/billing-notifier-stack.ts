import * as cdk from '@aws-cdk/core';
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');
import { Bucket } from '@aws-cdk/aws-s3';
import { Topic } from '@aws-cdk/aws-sns';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';
// import * as events from '@aws-cdk/aws-lambda-event-sources';

const billingBucketName = process.env.BILLING_BUCKET!;
const notificationEmail = process.env.NOTIFICATION_EMAIL!;
const nickname = process.env.AWS_ACCOUNT_NICKNAME || billingBucketName;

export class BillingNotifierStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const snsTopic = new Topic(this, 'BillingNotifierTopic', {
      topicName: 'BillingNotifierTopicName',
      displayName: 'Billing Notifier'
    });

    if (!billingBucketName || !notificationEmail) {
      throw new Error('Both BILLING_BUCKET and NOTIFICATION_EMAIL env variables must be defined');
    }
    const billingBucket = Bucket.fromBucketName(this, 'BillingBucketByName', billingBucketName);
    const bucket = new s3.Bucket(this, 'billing-notifier');

    const bnLambda = new lambda.Function(this, 'BillingNotifierLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns'),
      handler: 'lambda.handler',
      environment: {
        WORK_BUCKET: bucket.bucketName,
        BILL_BUCKET: billingBucket.bucketName,
        AWS_ACCOUNT_NICKNAME: nickname,
        TOPIC_ARN: snsTopic.topicArn
      },
    });

    billingBucket.grantRead(bnLambda);
    // billingBucket.grantPut(bnLambda, 'diffs/*');

    bucket.grantReadWrite(bnLambda);
    snsTopic.grantPublish(bnLambda);
    snsTopic.addSubscription(new subscriptions.EmailSubscription(notificationEmail));

    // https://github.com/aws/aws-cdk/issues/2004
    // bnLambda.addEventSource(new events.S3EventSource(
    //   billingBucket,
    //   {
    //     events: [
    //       s3.EventType.OBJECT_CREATED
    //     ]
    //   }
    // ));

    // aws s3api put-bucket-notification-configuration
    // replaces current config

  }
}

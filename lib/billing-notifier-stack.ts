import * as cdk from '@aws-cdk/core';
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');
import { Bucket } from '@aws-cdk/aws-s3';
import { Topic } from '@aws-cdk/aws-sns';
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions';

export class BillingNotifierStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const snsTopic = new Topic(this, 'BillingNotifierTopic', {
      topicName: 'BillingNotifierTopicName',
      displayName: 'Billing Notifier'
    });

    const billingBucket = Bucket.fromBucketName(this, 'BillingBucketByName', 'dmaser-billing');
    const bucket = new s3.Bucket(this, 'billing-notifier');

    const bnLambda = new lambda.Function(this, 'BillingNotifierLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns'),
      handler: 'lambda.handler',
      environment: {
        WORK_BUCKET: bucket.bucketName,
        BILL_BUCKET: billingBucket.bucketName,
        TOPIC_ARN: snsTopic.topicArn
      },
    });
 
    billingBucket.grantRead(bnLambda);
    // billingBucket.grantPut(bnLambda, 'diffs/*');
    
    bucket.grantReadWrite(bnLambda);
    snsTopic.grantPublish(bnLambda);
    snsTopic.addSubscription(new subscriptions.EmailSubscription('aws@davemaser.com'));

  }
}

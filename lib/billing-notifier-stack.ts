// import * as events from '@aws-cdk/aws-lambda-event-sources';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { aws_s3 as s3, aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_sns_subscriptions as subscriptions } from 'aws-cdk-lib';
import { UPDATES_PREFIX } from '../lambda-fns/lib/bill-data-tool';

const billingBucketName = process.env.BILLING_BUCKET!;
const notificationEmail = process.env.NOTIFICATION_EMAIL!;
const nickname = process.env.AWS_ACCOUNT_NICKNAME || billingBucketName;
const daysToKeep = process.env.BILLING_DATA_KEEP_DAYS ? +process.env.BILLING_DATA_KEEP_DAYS : 100;

export class BillingNotifierStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const snsTopic = new Topic(this, 'BillingNotifierTopic', {
      topicName: 'BillingNotifierTopic',
      displayName: 'Billing Notifier'
    });

    if (!billingBucketName || !notificationEmail) {
      throw new Error('Both BILLING_BUCKET and NOTIFICATION_EMAIL env variables must be defined');
    }
    const billingBucket = Bucket.fromBucketName(this, 'BillingBucketByName', billingBucketName);
    const billingWorkBucket = new s3.Bucket(this, 'billing-notifier');
    if (daysToKeep > 0) {
      billingWorkBucket.addLifecycleRule({
        id: `ExpireAfter${daysToKeep}Days`,
        expiration: Duration.days(daysToKeep),
        prefix: UPDATES_PREFIX
      });
    }

    const bnLambda = new lambda.Function(this, 'BillingNotifierLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('build/lambda-fns'),
      handler: 'lambda.handler',
      environment: {
        TZ: 'America/Los_Angeles',
        WORK_BUCKET: billingWorkBucket.bucketName,
        BILL_BUCKET: billingBucket.bucketName,
        AWS_ACCOUNT_NICKNAME: nickname,
        TOPIC_ARN: snsTopic.topicArn
      },
    });

    billingBucket.grantRead(bnLambda);
    // billingBucket.grantPut(bnLambda, 'diffs/*');

    billingWorkBucket.grantReadWrite(bnLambda);
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

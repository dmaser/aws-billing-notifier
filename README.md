# AWS Bill Update Notifier

Sends a notification (currently an SQS email endpoint) whenever the detailed bill is updated by AWS. Email contains JSON data with the differences from yesterday's version of the bill and the current totals, grouped by category (ProductCode) and details (UsageType).

## Pre-requisites

* Enable AWS detailed billing
  * TBD - Announced [here](https://aws.amazon.com/blogs/aws/aws-detailed-billing-reports/) in 2012, but [this page](https://docs.aws.amazon.com/cur/latest/userguide/detailed-billing.html) says it's no longer available. I was able to enable DBR in an account created in 2020.
  * Requires setting up an S3 bucket (referenced by the `BILLING_BUCKET` environment variable below) for AWS to write the bill objects to. 

* CDK account bootstrap
  * required for any CDK apps, so if you've used CDK before then this is probably already done
  * if this is your first time using the CDK it will give you the bootstrap commands the first time you run `cdk deploy`

## Environment variables

Must be defined or an error will be thrown, except for values with defaults noted below

* BILLING_BUCKET (see pre-requisites)
* NOTIFICATION_EMAIL
* AWS_ACCOUNT_NICKNAME  (defaults to BILLING_BUCKET, used in subject of notification email)
* BILLING_DATA_KEEP_DAYS (defaults to 100, expire billing notifier data automatically, 0 to never expire objects)

## Launching

* `npm run build`
* `cdk deploy`
## Background

I had a similar tool written in Java years ago, so it was past due for some updates. This seemed like a good opportunity to learn how the CDK tools work along with learning to develop Lambda functions in Typescript.

Instead of using a cron job to check for updated billing files, this takes advantage of S3 event notifications whenever a file is created in the billing bucket.

# TODO

## handle updates for last month's bill

* check if updated file matches last month
* compare with update from last day of last month



# From the CDK cli generated README.md

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

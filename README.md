# AWS Bill Update Notifier

Sends a notification (currently an SQS email endpoint) whenever the detailed bill is updated by AWS. Email contains JSON data with the differences from yesterday's version of the bill and the current totals, grouped by category (ProductCode) and details (UsageType).

## Example output

The body of the email is a a JSON object which consists of 2 main sections structuring exactly the same: the "diffs" and the current bill totals. Each section starts with a summary of totals for each category. Then there's an array of categories sorted by amount in descending order. Each category contains an array of details also sorted by amount descending.

For some purchases in AWS you are invoiced immediately (domain regeistration, for example) instead of after the end of the month. Those will show up in the paid array at the end and have the same structure as the diffs and current sections.

<details>
<summary>click to expand</summary>

```
{
    "msg": "retrieving 6xxxxxxxxxx1-aws-billing-csv-2021-07.csv from gnarly-billing",
    "timestamp": 1625782269686,
    "localTime": "2021-07-08T15:11:09",
    "diffs": {
        "summary": {
            "AmazonS3": "0.65",
            "AmazonRoute53": "0.00",
            "AmazonLightsail": "0.11",
            "AmazonEC2": "0.10",
            "AmazonRDS": "0.08",
            "AWSDataTransfer": "0.01"
        },
        "categories": [
            {
                "name": "AmazonS3",
                "amount": 0.65,
                "details": [
                    {
                        "usageType": "TimedStorage-SIA-ByteHrs",
                        "usageQty": 40.01728,
                        "amount": 0.5
                    },
                    {
                        "usageType": "TimedStorage-ByteHrs",
                        "usageQty": 2.09019,
                        "amount": 0.05
                    },
                    {
                        "usageType": "USW2-TimedStorage-ByteHrs",
                        "usageQty": 2.08923,
                        "amount": 0.05
                    },
                    {
                        "usageType": "TimedStorage-GlacierByteHrs",
                        "usageQty": 9.01184,
                        "amount": 0.03
                    },
                    {
                        "usageType": "USW2-TimedStorage-SIA-ByteHrs",
                        "usageQty": 1.18842,
                        "amount": 0.01
                    },
                    {
                        "usageType": "TimedStorage-RRS-ByteHrs",
                        "usageQty": 0.35491,
                        "amount": 0.01
                    },
                    {
                        "usageType": "USW2-Requests-Tier1",
                        "usageQty": 249,
                        "amount": 0
                    }
                ]
            },
            {
                "name": "AmazonLightsail",
                "amount": 0.11,
                "details": [
                    {
                        "usageType": "USW2-BundleUsage:0.5GB",
                        "usageQty": 23,
                        "amount": 0.11
                    }
                ]
            },
            {
                "name": "AmazonEC2",
                "amount": 0.1,
                "details": [
                    {
                        "usageType": "USW2-EBS:VolumeUsage",
                        "usageQty": 1.04731,
                        "amount": 0.05
                    },
                    {
                        "usageType": "USW2-EBS:SnapshotUsage",
                        "usageQty": 0.51074,
                        "amount": 0.03
                    },
                    {
                        "usageType": "USW2-EBS:VolumeUsage.gp2",
                        "usageQty": 0.25172,
                        "amount": 0.02
                    },
                    {
                        "usageType": "USW2-EBS:VolumeIOUsage",
                        "usageQty": 36765,
                        "amount": 0
                    }
                ]
            },
            {
                "name": "AmazonRDS",
                "amount": 0.08,
                "details": [
                    {
                        "usageType": "USW2-RDS:GP2-Storage",
                        "usageQty": 0.61935,
                        "amount": 0.08
                    }
                ]
            },
            {
                "name": "AWSDataTransfer",
                "amount": 0.01,
                "details": [
                    {
                        "usageType": "USW2-DataTransfer-Out-Bytes",
                        "usageQty": 0.13665,
                        "amount": 0.01
                    }
                ]
            },
            {
                "name": "AmazonRoute53",
                "amount": 0,
                "details": [
                    {
                        "usageType": "DNS-Queries",
                        "usageQty": 6371,
                        "amount": 0
                    }
                ]
            }
        ],
        "totalBeforeTax": 0.95,
        "tax": 0.03,
        "total": 0.98
    },
    "current": {
        "summary": {
            "AmazonEC2": "0.77",
            "AmazonRDS": "0.57",
            "AWSDataTransfer": "0.03",
            "AmazonS3": "4.60",
            "AmazonRoute53": "2.52",
            "AmazonLightsail": "0.86"
        },
        "categories": [
            {
                "name": "AmazonS3",
                "amount": 4.6,
                "details": [
                    {
                        "usageType": "TimedStorage-SIA-ByteHrs",
                        "usageQty": 280.08728,
                        "amount": 3.5,
                        "description": "$0.0125 per GB-Month of storage used in Standard-Infrequent Access"
                    },
                    {
                        "usageType": "TimedStorage-ByteHrs",
                        "usageQty": 14.62019,
                        "amount": 0.34,
                        "description": "$0.023 per GB - first 50 TB / month of storage used"
                    },
                    {
                        "usageType": "USW2-TimedStorage-ByteHrs",
                        "usageQty": 14.59923,
                        "amount": 0.34,
                        "description": "$0.023 per GB - first 50 TB / month of storage used"
                    },
                    {
                        "usageType": "TimedStorage-GlacierByteHrs",
                        "usageQty": 63.10184,
                        "amount": 0.25,
                        "description": "$0.004 per GB / month of storage used - Amazon Glacier"
                    },
                    {
                        "usageType": "USW2-TimedStorage-SIA-ByteHrs",
                        "usageQty": 8.31842,
                        "amount": 0.1,
                        "description": "$0.0125 per GB-Month of storage used in Standard-Infrequent Access"
                    },
                    {
                        "usageType": "TimedStorage-RRS-ByteHrs",
                        "usageQty": 2.46491,
                        "amount": 0.06,
                        "description": "$0.0240 per GB - first 1 TB / month of storage used - Reduced Redundancy Storage"
                    },
                    {
                        "usageType": "USW2-Requests-Tier1",
                        "usageQty": 2001,
                        "amount": 0.01,
                        "description": "$0.005 per 1,000 PUT, COPY, POST, or LIST requests"
                    }
                ]
            },
            {
                "name": "AmazonRoute53",
                "amount": 2.52,
                "details": [
                    {
                        "usageType": "HostedZone",
                        "usageQty": 5,
                        "amount": 2.5,
                        "description": "$0.50 per Hosted Zone for the first 25 Hosted Zones"
                    },
                    {
                        "usageType": "DNS-Queries",
                        "usageQty": 46108,
                        "amount": 0.02,
                        "description": "$0.40 per 1,000,000 queries for the first 1 Billion queries"
                    }
                ]
            },
            {
                "name": "AmazonLightsail",
                "amount": 0.86,
                "details": [
                    {
                        "usageType": "USW2-BundleUsage:0.5GB",
                        "usageQty": 183,
                        "amount": 0.86,
                        "description": "$0.0047 / Hour of 0.5GB bundle Instance"
                    }
                ]
            },
            {
                "name": "AmazonEC2",
                "amount": 0.77,
                "details": [
                    {
                        "usageType": "USW2-EBS:VolumeUsage",
                        "usageQty": 7.99731,
                        "amount": 0.4,
                        "description": "$0.05 per GB-month of Magnetic provisioned storage - US West (Oregon)"
                    },
                    {
                        "usageType": "USW2-EBS:VolumeUsage",
                        "usageQty": 7.99731,
                        "amount": 0.4,
                        "description": "$0.05 per GB-month of Magnetic provisioned storage - US West (Oregon)"
                    },
                    {
                        "usageType": "USW2-EBS:VolumeUsage.gp2",
                        "usageQty": 1.88172,
                        "amount": 0.18,
                        "description": "$0.10 per GB-month of General Purpose SSD (gp2) provisioned storage - US West (Oregon)"
                    },
                    {
                        "usageType": "USW2-EBS:VolumeUsage.gp2",
                        "usageQty": 1.88172,
                        "amount": 0.18,
                        "description": "$0.10 per GB-month of General Purpose SSD (gp2) provisioned storage - US West (Oregon)"
                    },
                    {
                        "usageType": "USW2-EBS:SnapshotUsage",
                        "usageQty": 3.59074,
                        "amount": 0.18,
                        "description": "$0.05 per GB-Month of snapshot data stored - US West (Oregon)"
                    },
                    {
                        "usageType": "USW2-EBS:SnapshotUsage",
                        "usageQty": 3.59074,
                        "amount": 0.18,
                        "description": "$0.05 per GB-Month of snapshot data stored - US West (Oregon)"
                    },
                    {
                        "usageType": "USW2-EBS:VolumeIOUsage",
                        "usageQty": 208750,
                        "amount": 0.01,
                        "description": "$0.05 per 1 million I/O requests - US West (Oregon)"
                    }
                ]
            },
            {
                "name": "AmazonRDS",
                "amount": 0.57,
                "details": [
                    {
                        "usageType": "USW2-RDS:GP2-Storage",
                        "usageQty": 4.91935,
                        "amount": 0.57,
                        "description": "$0.115 per GB-month of provisioned GP2 storage"
                    }
                ]
            },
            {
                "name": "AWSDataTransfer",
                "amount": 0.03,
                "details": [
                    {
                        "usageType": "USW2-DataTransfer-Out-Bytes",
                        "usageQty": 1.34665,
                        "amount": 0.03,
                        "description": "$0.090 per GB - first 10 TB / month data transfer out beyond the global free tier"
                    }
                ]
            }
        ],
        "tax": 0.37,
        "total": 9.72,
        "totalBeforeTax": 9.35
    },
    "paid": [],
    "error": "",
    "diff": 0.98
}
```

</details>

## Prerequisites

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

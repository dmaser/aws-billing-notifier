#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BillingNotifierStack } from '../lib/billing-notifier-stack';

const app = new cdk.App();
new BillingNotifierStack(app, 'BillingNotifierStack');

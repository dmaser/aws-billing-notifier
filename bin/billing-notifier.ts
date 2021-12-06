#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { BillingNotifierStack } from '../lib/billing-notifier-stack';

const app = new App();
new BillingNotifierStack(app, 'BillingNotifierStack');

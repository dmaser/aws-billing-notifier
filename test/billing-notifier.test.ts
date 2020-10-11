import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as BillingNotifier from '../lib/billing-notifier-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new BillingNotifier.BillingNotifierStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});

import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as BillingNotifier from '../lib/billing-notifier-stack';
import { Cal } from '../lambda-fns/lib/cal';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new BillingNotifier.BillingNotifierStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(matchTemplate({
    "Resources": {}
  }, MatchStyle.EXACT))

  const c = new Cal(new Date('2021-05-01'));
  expect(c.today()).toEqual('2021-05-01');
  expect(c.yesterday()).toEqual('2021-04-31');
  expect(c.now()).toEqual('2021-05-01 00:00:00');

});

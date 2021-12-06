import * as BillingNotifier from '../lib/billing-notifier-stack';
import { Cal } from '../lambda-fns/lib/cal';
import { App } from 'aws-cdk-lib';

test('Empty Stack', () => {
  const app = new App();
  // WHEN
  const stack = new BillingNotifier.BillingNotifierStack(app, 'MyTestStack');
  // THEN
  expect(stack).toMatchObject({
    "Resources": {}
  });

  const c = new Cal(new Date('2021-05-01'));
  expect(c.today()).toEqual('2021-05-01');
  expect(c.yesterday()).toEqual('2021-04-31');
  expect(c.now()).toEqual('2021-05-01 00:00:00');

});

import parse = require('csv-parse/lib/sync');
import { Bill } from './lib/bill';
import { BillNotification } from './lib/bill-notification';
import { BillCheckResult, BillData } from './lib/bill-util-types';
import { BillDataTool } from './lib/bill-data-tool';
import { Cal, CalFormat } from './lib/cal';
import { S3EventRecord } from './lib/s3-types';

const workBucket = process.env.WORK_BUCKET!;
const billBucket = process.env.BILL_BUCKET!;
const nickname = process.env.AWS_ACCOUNT_NICKNAME!;

exports.handler = async function (event: any) {

    console.log('event: ', JSON.stringify(event));
    console.log(`billBucket: ${billBucket}, workBucket: ${workBucket}`);

    const items: S3EventRecord[] = event.Records || [];
    console.log(`got ${items.length} items`);

    const cal = new Cal();
    const month = cal.today(CalFormat.Y_MO);
    const day = cal.today();
    console.log(`month: ${month}, day: ${day}`);

    const re = new RegExp(`aws-billing-csv-${month}`, 'i');

    const matchedRecord = items.find(i => i.eventSource === 'aws:s3' && re.test(i.s3.object.key));

    if (matchedRecord) {

        console.log('S3EventRecord match found: ', JSON.stringify(matchedRecord));

        let billCheckResult: BillCheckResult = { msg: '', timestamp: 0, dateTime: '', diffs: undefined, current: null, paid: [], error: '', diff: null };
        try {

            const bucket = matchedRecord.s3.bucket.name;
            const key = matchedRecord.s3.object.key;
            billCheckResult.msg = `retrieving ${key} from ${bucket}`;
            billCheckResult.timestamp = cal.date().getTime();
            billCheckResult.dateTime = cal.now();

            const billDataTool: BillDataTool = new BillDataTool(key, cal);
            const obj = await billDataTool.fetchCurrentBill(billBucket);
            const rows = parse(obj.Body as Buffer);
            console.log(`parsed ${rows.length} rows`);

            const bill = new Bill(rows);
            const currentBillData: BillData = bill.build();
            billCheckResult.current = currentBillData;

            const prevBillData: BillData | null = await billDataTool.readPreviousBill(workBucket);
            const diffs = bill.diff(prevBillData);
            billCheckResult.diffs = diffs;
            billCheckResult.paid = bill.paid();
            billCheckResult.diff = diffs.total;

            await billDataTool.writeCurrentBill(workBucket, currentBillData);

        } catch (e) {
            console.error('error retrieving object: ', e);
            billCheckResult.error = e;
        }

        const totalPaid = billCheckResult.paid.map(p => p.total.val).reduce((prev, curr) => prev + curr, 0);
        let subject = `[${nickname}] AWS Bill ${day} $${billCheckResult.current?.total?.trunc() || '0.00'} (+${billCheckResult.diff?.trunc()})`;
        if (totalPaid > 0) subject += '  Paid: $' + totalPaid.toFixed(2);
        const notification = new BillNotification(subject, JSON.stringify(billCheckResult, null, 4));
        await notification.send();

    } else if (items.length) {
        console.log('NO MATCHED ITEMS - re pattern: ', re);
        const found = items.map(i => i.s3?.object?.key).join(', ');
        console.log(`Items found: ${found}`);
    }


}

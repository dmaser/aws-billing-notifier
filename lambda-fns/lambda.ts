import parse = require('csv-parse/lib/sync');
import { Bill } from './lib/bill';
import { BillNotification } from './lib/bill-notification';
import { S3EventRecord, BillCheckResult, BillData } from './lib/bill-util-types';
import { BillDataTool } from './lib/bill-data-tool';

const workBucket = process.env.WORK_BUCKET!;
const billBucket = process.env.BILL_BUCKET!;
const nickname = process.env.AWS_ACCOUNT_NICKNAME!;

exports.handler = async function (event: any) {

    console.log('event: ', JSON.stringify(event));
    console.log(`billBucket: ${billBucket}, workBucket: ${workBucket}`);

    const items: S3EventRecord[] = event.Records || [];
    console.log(`got ${items.length} items`);

    const now = new Date();
    const day = now.toISOString().substr(0, 10);
    const month = day.substr(0, 7);
    const re = new RegExp(`aws-billing-csv-${month}`, 'i');

    const matchedRecord = items.find(i => i.eventSource === 'aws:s3' && re.test(i.s3.object.key));

    if (matchedRecord) {

        console.log('S3EventRecord match found: ', JSON.stringify(matchedRecord));

        let result: BillCheckResult = { msg: '', diffs: undefined, current: null, error: '', diff: null };
        try {

            const bucket = matchedRecord.s3.bucket.name;
            const key = matchedRecord.s3.object.key;
            result.msg = `retrieving ${key} from ${bucket}`;

            const billDataTool: BillDataTool = new BillDataTool(key, now);
            const obj = await billDataTool.fetchCurrentBill(billBucket);
            const rows = parse(obj.Body as Buffer);
            console.log(`parsed ${rows.length} rows`);

            const bill = new Bill(rows);
            const currentBillData: BillData = bill.build();
            result.current = currentBillData;

            const prevBillData: BillData | null = await billDataTool.readPreviousBill(workBucket);
            const diffs = bill.diff(prevBillData);
            result.diffs = diffs;
            result.diff = diffs.totalDiff;

            await billDataTool.writeCurrentBill(workBucket, currentBillData);

        } catch (e) {
            console.error('error retrieving object: ', e);
            result.error = e;
        }

        const notification = new BillNotification(`[${nickname}] AWS Bill ${day} $${result.current?.total?.trunc() || '0.00'} (+${result.diff?.trunc()})`, JSON.stringify(result, null, 4));
        await notification.send();
        
    } else if (items.length) {
        console.log('NO MATCHED ITEMS - re pattern: ', re);
    }


}

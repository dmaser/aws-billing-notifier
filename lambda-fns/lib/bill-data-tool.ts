import { Amount, BillData } from './bill-util-types';
import { Cal } from './cal';
import s3 = require('aws-sdk/clients/s3');

export class BillDataTool {

    private _key: string;
    private _cal: Cal;
    private _updatesPrefix: string;

    private currentBillDataKey: string;
    private prevBillDataKey: string;

    constructor(key: string, date: Cal, updatesPrefix: string = 'updates') {
        this._key = key;
        this._cal = date;
        this._updatesPrefix = updatesPrefix;

        const day = this._cal.today();
        const prevDay = this._cal.yesterday();

        this.currentBillDataKey = `${this._updatesPrefix}/${day}-update.json`
        this.prevBillDataKey = `${this._updatesPrefix}/${prevDay}-update.json`
        console.log(`today: ${day}, prevDay: ${prevDay}, currentBillDataKey: ${this.currentBillDataKey}, prevBillDataKey: ${this.prevBillDataKey}`);
    }

    async fetchCurrentBill(billBucket: string) {
        console.log(`fetchCurrentBill: ${billBucket}/${this._key}`);
        return new s3().getObject({ Bucket: billBucket, Key: this._key }).promise();
    }

    async writeCurrentBill(updatesBucket: string, data: BillData) {
        console.log(`writeCurrentBill to: ${updatesBucket}/${this.currentBillDataKey},`, JSON.stringify(data));
        await new s3().putObject({ Bucket: updatesBucket, Key: this.currentBillDataKey, Body: JSON.stringify(data) }).promise();
    }

    private reviver = (key: string, value: any) => {
        if (key === 'usageQty' || key === 'amount' || key === 'tax') {
            value = new Amount(value);
        }
        return value;
    }

    async readPreviousBill(updatesBucket: string): Promise<BillData | null> {
        console.log(`readPreviousBill from: ${updatesBucket}/${this.prevBillDataKey}`);
        if (this._cal.isFirstDayOfMonth()) return null;
        try {
            const updateObj = await new s3().getObject({ Bucket: updatesBucket, Key: this.prevBillDataKey }).promise();
            return JSON.parse(updateObj.Body as string, this.reviver) as BillData;
        } catch (e) {
            console.error('failed to readPreviousBill: ', e.message);
            return null;
        }
    }

}

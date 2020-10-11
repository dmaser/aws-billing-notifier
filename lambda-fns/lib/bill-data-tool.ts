import { Amount, BillData } from './bill-util-types';
import s3 = require('aws-sdk/clients/s3');

export class BillDataTool {

    private _key: string;
    private _date: Date;
    private _updatesPrefix: string;

    private day: string;
    private prevDay: string;
    private month: string;

    private currentBillDataKey: string;
    private prevBillDataKey: string;

    constructor(key: string, date: Date, updatesPrefix: string = 'updates') {
        this._key = key;
        this._date = date;
        this._updatesPrefix = updatesPrefix;

        this.day = this._date.toISOString().substr(0, 10);
        this.prevDay = new Date(this._date.getTime() - (24 * 60 * 60 * 1000)).toISOString().substr(0, 10);
        this.month = this.day.substr(0, 7);
        this.currentBillDataKey = `${this._updatesPrefix}/${this.day}-update.json`
        this.prevBillDataKey = `${this._updatesPrefix}/${this.prevDay}-update.json`
        console.log(`today: ${this.day}, prevDay: ${this.prevDay}, month: ${this.month}, currentBillDataKey: ${this.currentBillDataKey}, prevBillDataKey: ${this.prevBillDataKey}`);
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
        if (key === 'usageQty' || key === 'amount'){
            value = new Amount(value);
        }
        return value;
    }

    async readPreviousBill(updatesBucket: string): Promise<BillData | null> {
        console.log(`readPreviousBill from: ${updatesBucket}/${this.prevBillDataKey}`);
        try {
            const updateObj = await new s3().getObject({ Bucket: updatesBucket, Key: this.prevBillDataKey }).promise();
            return JSON.parse(updateObj.Body as string, this.reviver) as BillData;
        } catch (e) {
            console.error('failed to readPreviousBill: ', e.message);
            return null;
        }
    }

}

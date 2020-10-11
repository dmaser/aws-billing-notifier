import sns = require('aws-sdk/clients/sns');

const TOPIC_ARN = process.env.TOPIC_ARN!

export class BillNotification {

    private snsClient = new sns();
    private _subject: string;
    private _message: string;

    constructor(subject: string = 'AWS Bill Notification', message: string) {
        this._subject = subject;
        this._message = message;
    }

    public async send() {

        console.log(`sns publish - subject: "${this._subject}", topic arn: ${TOPIC_ARN}`);
        const publishResult = await this.snsClient.publish({ Subject: this._subject, Message: this._message, TopicArn: TOPIC_ARN }).promise();
        console.log(`sns publish result: `, publishResult);
    }

}

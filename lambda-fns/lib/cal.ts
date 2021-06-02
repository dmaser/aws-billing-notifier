export enum CalFormat {
    Y_MO = 7,
    Y_MO_DAY = 10,
    Y_MO_DAY_TIME = 19
}

export class Cal {

    private DAY_IN_MS = 24 * 60 * 60 * 1000;
    private MIN_TO_MS = 60 * 1000;

    private _date: Date;
    private _tzOffsetMs: number;

    constructor(date: Date = new Date()) {
        this._date = date;
        this._tzOffsetMs = this._date.getTimezoneOffset() * this.MIN_TO_MS;
    }

    public date(): Date {
        return this._date;
    }

    public now(fmt: CalFormat = CalFormat.Y_MO_DAY_TIME) {
        const t = new Date(this._date.getTime() - this._tzOffsetMs).toISOString();
        return this.fmt(t, fmt);
    }

    public today(fmt: CalFormat = CalFormat.Y_MO_DAY) {
        const t = new Date(this._date.getTime() - this._tzOffsetMs).toISOString();
        return this.fmt(t, fmt);
    }

    public isFirstDayOfMonth(): boolean {
        return /01$/.test(this.today());
    }

    public yesterday(fmt: CalFormat = CalFormat.Y_MO_DAY) {
        const t = new Date(this._date.getTime() - (this._tzOffsetMs + this.DAY_IN_MS)).toISOString();
        return this.fmt(t, fmt);
    }

    private fmt(isoDate: string, fmt: CalFormat) {
        return isoDate.substr(0, fmt.valueOf())
    }
}

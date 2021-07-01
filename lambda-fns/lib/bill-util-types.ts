export const USAGE_QTY_PRECISION = 5;

export class Amount {
    public val: number;
    private _precision: number;
    private _prefix: string;

    constructor(val: number | string, precision: number = 2, prefix: string = '$') {
        this.val = Number(val);
        this._precision = precision;
        this._prefix = prefix;
    }

    public toString = (): string => {
        return String(this.trunc() || 0);
    }

    public toJSON = (): number => {
        return Number(this.trunc()) || 0;
    }

    public trunc(): string {
        const factor = Math.pow(10, this._precision);
        return (Math.round(this.val * factor) / factor).toFixed(this._precision);
    }

}

export interface Detail {
    usageType: string;
    usageQty: Amount;
    amount: Amount;
    description?: string;
};

export interface Category {
    details: Detail[];
    name: string;
    amount: Amount;
};

export interface BillData {
    categories: Category[];
    totalBeforeTax: Amount;
    tax: Amount;
    total: Amount;
};

export interface BillCheckResult {
    msg: string;
    timestamp: number;
    dateTime: string;
    diffs?: BillData;
    current: BillData | null;
    paid: BillData[];
    error: Error | '';
    diff: Amount | null;
}

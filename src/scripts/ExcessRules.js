
export class FilterRule{
    
}
export class ExcessRule{
    constructor(){
        this.condition = [];
        this.adjustment = [];
    }
    importRule(){

    }
    evaluate(value){
        const satisfy = this.condition.reduce((sat, condition) => {
            if(!condition.evaluate(value)) return false;
            return sat;
        }, true);

        if(satisfy){
            const out = this.adjustment.reduce((v, adjustment) => {
                return adjustment.evaluate(v);
            }, value);
            return out;
        }
        return value;
    }
}

export const conditionCases = ['>', '<', '>=', '<=', '='];

class Condition{
    constructor(sign, value){
        this.sign = sign;
        this.value = value;
    }
    evaluate(v){
        switch(this.sign){
            case '>':
                return v > this.value;
            case '<':
                return v < this.value;
            case '>=':
                return v >= this.value;
            case '<=':
                return v <= this.value;
            case '=':
                return v === this.value;
            default:
                break;
        }
        return false;
    }
}

export const adjustmentCases = ['+', '-', '%'];

class Adjustment{
    constructor(sign, value){
        this.sign = sign;
        this.value = value;
    }
    evaluate(v){
        switch(this.sign){
            case '+':
                return v + this.value;
            case '-':
                return v - this.value;
            case '%':
                return v * (1 + this.value/100);
            default:
                break;
        }
        return v;
    }
}
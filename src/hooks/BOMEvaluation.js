import {useState, useEffect, useMemo} from 'react';


export function useBOMEvaluation(bomTable, apiDataFinished){
    const [bomEvaluation, setBomEvaluation] = useState({
        numQuoted: 0,
        numLines: bomTable.length,
        quotedPercent: 0,
        unquotedPercent: 100,
        total_price: 0
    });
    function evalLine(){

    }
    function evalBom(){

    }
    useEffect(() => {
        if(apiDataFinished){
            const nquoted = bomTable.reduce((n, line) => {
                if(line.offerEvaluation.fully_evaluated) return n+1;
                return n;
            }, 0);
            const qp = bomTable.length > 0 ? 100*(nquoted/bomTable.length) : 0
            const uqp =  100-qp;
            const total_price = bomTable.reduce((n, line) => {
                return n+line.offerEvaluation.total_price;
            }, 0);
            setBomEvaluation({
                numQuoted: nquoted,
                numLines: bomTable.length,
                quotedPercent: qp,
                unquotedPercent: uqp,
                total_price: total_price
            });
        }
    }, [bomTable, apiDataFinished]);
    return [bomEvaluation]
}
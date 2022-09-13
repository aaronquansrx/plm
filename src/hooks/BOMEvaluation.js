import {useState, useEffect, useMemo} from 'react';

import update from 'immutability-helper';

export function useBOMEvaluation(bomTable, apiDataFinished){
    const [bomEvaluation, setBomEvaluation] = useState({
        
        numLines: bomTable.length,
        price: {
            numQuoted: 0,
            quotedPercent: 0,
            unquotedPercent: 100,
            total_price: 0
        },
        leadtime: {
            numQuoted: 0,
            quotedPercent: 0,
            unquotedPercent: 100,
            total_price: 0
        }
    });
    function evalLine(){

    }
    function evalBom(){

    }
    function evalAlgorithm(algorithm){
        const nquoted = bomTable.reduce((n, line) => {
            if(line.offerEvaluation[algorithm].fully_evaluated) return n+1;
            return n;
        }, 0);
        const qp = bomTable.length > 0 ? 100*(nquoted/bomTable.length) : 0
        const uqp =  100-qp;
        const total_price = bomTable.reduce((n, line) => {
            return n+line.offerEvaluation[algorithm].total_price;
        }, 0);
        return {
            numQuoted: nquoted,
            quotedPercent: qp,
            unquotedPercent: uqp,
            total_price: total_price
        };
    }
    useEffect(() => {
        if(apiDataFinished){
            const bp = evalAlgorithm('price');
            const lt = evalAlgorithm('leadtime');
            setBomEvaluation({
                numLines: bomTable.length,
                price: bp,
                leadtime: lt
            });
        }
    }, [bomTable, apiDataFinished]);
    return [bomEvaluation]
}

export function useBOMEvaluationV2(bom){
    const [bomEvaluation, setBomEvaluation] = useState({
        numLines: bom.length,
        evaluation:
        {
            in_stock : {
                price : {
                    num_quoted: 0,
                    quoted_percent: 0,
                    unquoted_percent: 100,
                    total_price: 0,
                    total_excess_quantity: 0,
                    total_excess_price: 0
                },
                leadtime : {
                    num_quoted: 0,
                    quoted_percent: 0,
                    unquoted_percent: 100,
                    total_price: 0,
                    total_excess_quantity: 0,
                    total_excess_price: 0
                }
            },
            no_stock : {
                price : {
                    num_quoted: 0,
                    quoted_percent: 0,
                    unquoted_percent: 100,
                    total_price: 0,
                    total_excess_quantity: 0,
                    total_excess_price: 0
                },
                leadtime : {
                    num_quoted: 0,
                    quoted_percent: 0,
                    unquoted_percent: 100,
                    total_price: 0,
                    total_excess_quantity: 0,
                    total_excess_price: 0
                }
            }
        }
    });
    function changeEvaluation(evals){
        //console.log(evals);
        setBomEvaluation(update(bomEvaluation, {
            evaluation: {$set: evals}
        }));
    }
    function adjustLineEvaluation(adjust){
        
        console.log(adjust);
    }   
    return [bomEvaluation, changeEvaluation, adjustLineEvaluation];
}
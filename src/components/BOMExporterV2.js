import {useState} from 'react';
import { ExportExcelIcon } from './Icons';
import {ExportModal} from './Modals';

import {stockString} from './../scripts/AlgorithmVariable';

import XLSX from 'xlsx';
import { forEach } from 'lodash';

const restrictedBomAttrs = ['activeApis', 'octopart'];

function BOMExporterV2(props){
    const accessorToHeaders = props.bomAttrs.reduce((obj,attr)=>{
        obj[attr.accessor] = attr.Header;
        return obj;
    }, {});
    const apiAccessorToHeader = props.apis.reduce((obj, api) => {
        obj[api.accessor] = api.Header;
        return obj;
    }, {});
    const trimmedBomAttrs = props.bomAttrs.reduce((arr, attr)=>{
        if(!restrictedBomAttrs.includes(attr.accessor)){
            arr.push(attr);
        }
        return arr;
    }, []);
    const [showModal, setShowModal] = useState(false);
    function handleShowExport(){
        setShowModal(true);
    }
    function handleHideExport(){
        setShowModal(false);
    }
    function optionStructure(options){
        const best = {price: options.bestprice, leadtime: options.bestleadtime};
        const api = best.price ? 'price' : best.leadtime ? 'leadtime' : 'all'; //api: api (unused)
        const eva = options.evaluation;
        return { api: api, evaluation: eva, best: options.bestoffer };
    }
    function handleExport(fn, options={}){
        const fileName = fn === '' ? 'f' : fn;
        const headers = [];
        const opt = optionStructure(options);
        const base = baseTableFormat(trimmedBomAttrs);
        const bod = bestOfferData();
        base.forEach((b, i) =>{
            Object.assign(b, bod[i]);
        });
        if(!opt.best){
            const aaod = allApisOfferData();
            base.forEach((b, i) => {
                Object.assign(b, aaod[i]);
            });
        }
        console.log(base);
        const sheet = XLSX.utils.json_to_sheet(base, {header: headers});
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, 'BOMData');
        if(opt.evaluation){
            const evalFormat = evaluationFormat();
            const s2 = XLSX.utils.json_to_sheet(evalFormat);
            XLSX.utils.book_append_sheet(wb, s2, 'Evaluation')
        }
        XLSX.writeFile(wb, fileName+'.xlsx');
    }
    function apiAttrDecode(offer, acc, stockStr, best){
        switch(acc){
            case 'prices':
                return offer[acc].price[stockStr];
            case 'adjusted_quantity':
                return offer[acc][stockStr];
            case 'excess_quantity':
                return offer[acc][stockStr];
            case 'excess_price':
                return offer[acc][stockStr];
            default:
                return offer[acc];
        }
    }
    function allApisOfferData(){
        const stockStr = stockString(props.algorithm.stock);
        const formatted = props.data.map((line) => {
            const apis = props.apis.reduce((obj, api) => {
                if(api.accessor in line && line[api.accessor].offers.length > 0){
                    const apiData = line[api.accessor];
                    const offer = apiData.offers[apiData.offer_order[stockStr][props.algorithm.best][0]];
                    props.apiAttrs.forEach((heading) => {
                        const key = api.Header+'_'+heading.accessor;
                        obj[key] = apiAttrDecode(offer, heading.accessor, stockStr, props.algorithm.best);
                    });
                }
                return obj;
            }, {});
            return apis;
        });
        return formatted;
    }
    function bestOfferData(){
        const stockStr = stockString(props.algorithm.stock);
        const formatted = props.data.map((line, i) => {
            const hl = line.best[stockStr][props.algorithm.best];
            //console.log(line.best);
            //const bl = bestList[i];
            if(hl){
                const best = line[hl.api].offers[hl.offer_num];
                console.log(best);
                const apiHeader = apiAccessorToHeader[hl.api];
                const offerData = props.apiAttrs.reduce((obj, attr) => {
                    if('longHeader' in attr){
                        obj[attr.longHeader] = apiAttrDecode(best, attr.accessor, stockStr, props.algorithm.best);
                    }else{
                        obj[attr.Header] = apiAttrDecode(best, attr.accessor, stockStr, props.algorithm.best);
                    }
                    return obj;
                }, {});
                offerData['Total Price'] = best.total_price[stockStr];
                //best.prices.price * best.adjustedQuantity[stockStr];
                offerData.Distributor = apiHeader;
                return offerData;
            }
            return {};
        });
        return formatted;
    }
    function baseTableFormat(cols){
        const formatted = props.data.map((line) => {
            const base = cols.reduce((obj, col) => {
                const acc = col.accessor;
                switch(acc){
                    case 'mpns':
                        obj.MPN = line[acc].current;
                        break;
                    case 'quantities':
                        obj.Quantity = line[acc].multi;
                        break;
                    default:
                        obj[col.Header] = line[acc];
                        break;
                }
                return obj;
            }, {});
            return base;
        });
        return formatted;
    }
    function evaluationFormat(){
        const formatted = [];
        function evalLine(attr, value){
            return {
                attribute: attr,
                value: value
            }
        }
        const ev = props.evaluation.evaluation;
        const ss = stockString(props.algorithm.stock);
        formatted.push(evalLine('In Stock', props.algorithm.stock));
        formatted.push(evalLine('Algorithm Sort', props.algorithm.best));
        formatted.push(evalLine('Price Total', ev[ss][props.algorithm.best].total_price));
        formatted.push(evalLine('Quoted %', ev[ss][props.algorithm.best].quoted_percent));
        formatted.push(evalLine('Number of Lines', props.data.length));
        return formatted;
    }
    return (
        <div>
        <ExportExcelIcon size={32} show={showModal} onClick={handleShowExport}/>
        <ExportModal show={showModal} hideAction={handleHideExport} exportAction={handleExport}/>
        </div>
    );
}

export default BOMExporterV2;

    /*
    function defaultFormat(){
        const ignore = props.apis.map((api) => api.accessor);
        ignore.push('maxOffers', '_unnamed', 'activeApis', 
        'mpn', 'mpnOptions', 'highlights', 'lineLock', 'offerEvaluation', 
        'quantity'); 
        const formatted = props.data.map((line) => {
            const outline = Object.entries(line).reduce((obj, [k,v]) => {
                if(!ignore.includes(k)){
                    if(k === 'mpns'){
                        obj[accessorToHeaders['mpns']] = v.current;
                    }else if(k === 'quantities'){
                        obj[accessorToHeaders['quantities']] = v.multi;
                    }else{
                        obj[k] = v; 
                    }
                }
                return obj;
            }, {});
            props.apis.forEach((api) => {
                if(api.accessor in line && line[api.accessor].offers.length > 0){
                    const apiData = line[api.accessor];
                    const offer = apiData.offers[apiData.offerOrder];
                    props.apiAttrs.forEach((heading) => {
                        let out = offer[heading.accessor];
                        if(heading.accessor === 'prices'){
                            out = offer[heading.accessor].price;
                        }
                        outline[api.Header+'_'+heading.accessor] = out;
                    });
                }
            });
            return outline;
        });
        return formatted;
    }
    */
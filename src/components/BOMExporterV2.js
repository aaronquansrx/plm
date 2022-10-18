import {useState} from 'react';
import { ExportExcelIcon } from './Icons';
import {ExportModal} from './Modals';

import {stockString} from './../scripts/AlgorithmVariable';

import XLSX from 'xlsx';
import { forEach } from 'lodash';
import { BsArrowLeftSquareFill } from 'react-icons/bs';

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
        return { api: api, evaluation: eva, best: options.bestoffer, 
            filteredApiAttrs: options.filteredApiAttrs, selected: options.selected };
    }
    function handleExport(fn, options={}){
        const fileName = fn === '' ? 'f' : fn;
        const headers = [];
        const opt = optionStructure(options);
        const base = baseTableFormat(trimmedBomAttrs);
        const apiAttrs = opt.filteredApiAttrs ? props.apiAttrs : props.allApiAttrs;
        console.log(props.allApiAttrs);
        const bod = bestOfferData(apiAttrs);
        base.forEach((b, i) =>{
            Object.assign(b, bod[i]);
        });
        if(!opt.best){
            const aaod = allApisOfferData(apiAttrs);
            base.forEach((b, i) => {
                Object.assign(b, aaod[i]);
            });
        }
        if(opt.selected){
            const asod = allSelectedOfferData(apiAttrs);
            base.forEach((b, i) => {
                Object.assign(b, asod[i]);
            });
            //return;
        }
        //console.log(base);
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
    function apiAttrDecode(offer, acc, stockStr){
        switch(acc){
            case 'prices':
                return offer[acc].price[stockStr];
            case 'adjusted_quantity':
                return offer[acc][stockStr];
            case 'excess_quantity':
                return offer[acc][stockStr];
            case 'excess_price':
                return offer[acc][stockStr];
            case 'fees':
                return offer.fees.total;
            case 'display_total_price':
                return offer.display_total_price[stockStr].total;
            default:
                return offer[acc];
        }
    }
    function allApisOfferData(apiAttrs){
        const stockStr = stockString(props.algorithm.stock);
        const formatted = props.data.map((line) => {
            const apis = props.apis.reduce((obj, api) => {
                if(api.accessor in line && line[api.accessor].offers.length > 0){
                    const apiData = line[api.accessor];
                    const offer = apiData.offers[apiData.offer_order[stockStr][props.algorithm.best][0]];
                    apiAttrs.forEach((heading) => {
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
    function bestOfferData(apiAttrs){
        const stockStr = stockString(props.algorithm.stock);
        const formatted = props.data.map((line, i) => {
            const hl = line.best[stockStr][props.algorithm.best];
            //console.log(line.best);
            //const bl = bestList[i];
            if(hl){
                const best = line[hl.api].offers[hl.offer_num];
                //console.log(best);
                const apiHeader = apiAccessorToHeader[hl.api];
                const offerData = apiAttrs.reduce((obj, attr) => {
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
    function allSelectedOfferData(apiAttrs){
        const stockStr = stockString(props.algorithm.stock);
        const formatted = props.data.map((line, i) => {
            const offerData = {};
            const allSelectedOffers = props.apis.reduce((arrOffs, api) => {
                const selApiOffers = line[api.accessor].offers.reduce((arr, offer, on) => {
                    if(offer.selected) arr.push({offer:offer, api:api, offerNum: on});
                    return arr;
                }, []);
                const offs = arrOffs.concat(selApiOffers);
                return offs;
            }, []);
            //console.log(allSelectedOffers);
            allSelectedOffers.forEach((offer, i) => {
                const offStr = 'Selected Offer '+(i+1)+' ';
                offerData[offStr+'Api'] = offer.api.Header;
                offerData[offStr+'Offer Num'] = offer.offerNum;
                apiAttrs.forEach((attr) => {
                    if(attr.accessor in offer.offer){
                        const os = 'longHeader' in attr ? offStr+attr.longHeader : offStr+attr.Header;
                        offerData[os] = apiAttrDecode(offer.offer, attr.accessor, stockStr, props.algorithm.best);
                    }
                });
            });
            const octopartSelectedOffers = line.octopart.requested ? line.octopart.data.reduce((octOffs, oct) => {
                const api = oct.distributor;
                const oOffs = oct.offers.reduce((arr, off, on) => {
                    if(off.selected) arr.push({offer:off, api:api, offerNum: on});
                    return arr;
                }, []);
                const offs = octOffs.concat(oOffs);
                return offs;
            }, []) : [];
            //console.log(octopartSelectedOffers);

            octopartSelectedOffers.forEach((offer, i) => {
                const offStr = 'Octopart Offer '+(i+1)+' ';
                offerData[offStr+'Api'] = offer.api;
                offerData[offStr+'Offer Num'] = offer.offerNum;
                apiAttrs.forEach(attr => {
                    if(attr.accessor in offer.offer){
                        const os = 'longHeader' in attr ? offStr+attr.longHeader : offStr+attr.Header;
                        offerData[os] = apiAttrDecode(offer.offer, attr.accessor, stockStr, props.algorithm.best);
                    }
                })
            });

            return offerData;
        });
        console.log(formatted);
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
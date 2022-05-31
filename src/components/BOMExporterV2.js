import {useState} from 'react';
import { ExportExcelIcon } from './Icons';
import {ExportModal} from './Modals';
import XLSX from 'xlsx';

function BOMExporterV2(props){
    const accessorToHeaders = props.bomAttrs.reduce((obj,attr)=>{
        obj[attr.accessor] = attr.Header;
        return obj;
    }, {});
    const apiAccessorToHeader = props.apis.map((obj, api) => {
        obj[api.accessor] = api.Header;
        return obj;
    }, {});
    const [showModal, setShowModal] = useState(false);
    function handleShowExport(){
        setShowModal(true);
    }
    function handleHideExport(){
        setShowModal(false);
    }
    function handleExport(fn, options={}){
        const headers = [];
        const formatted = defaultFormat();
        const eva = evaluationFormat();
        if(formatted){
            const sheet = XLSX.utils.json_to_sheet(formatted, {header: headers});
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, sheet, 'BOMData');
            const s2 = XLSX.utils.json_to_sheet(eva);
            XLSX.utils.book_append_sheet(wb, s2, 'Evaluation')
            XLSX.writeFile(wb, fn+'.xlsx');
        }
        
    }
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
    function apisData(apisList){
        const formatted = props.data.map((line) => {
            const apis = apisList.reduce((obj, api) => {
                if(api.accessor in line && line[api.accessor].offers.length > 0){
                    const apiData = line[api.accessor];
                    const offer = apiData.offers[apiData.offerOrder];
                    props.apiAttrs.forEach((heading) => {
                        const key = api.Header+'_'+heading.accessor;
                        switch(heading.accessor){
                            case 'prices':
                                obj[key] = offer[heading.accessor].price;
                                break;
                            default:
                                obj[key] = offer[heading.accessor];
                                break;
                        }
                    });
                }
                return obj;
            }, {});
            return apis;
        });
        return formatted;
    }
    function singleOfferData(bestList){
        const formatted = props.data.map((line, i) => {
            const bl = bestList[i];
            const best = line[bl.api].offers[bl.offerNum];
            const apiHeader = apiAccessorToHeader[bl.api]
            const offerData = props.apiAttrs.reduce((obj, attr) => {
                const key = apiHeader+'_'+attr.accessor;
                switch(attr){
                    case 'prices':
                        obj[key] = best[attr.accessor].price;
                        break;
                    default:
                        obj[key] = best[attr.accessor];
                        break;
                }
                return obj;
            }, {});
            return offerData;
        });
        return formatted;
    }
    function baseTableFormat(cols){
        const formatted = props.data.map((line) => {
            const base = cols.reduce((obj, col) => {
                switch(col){
                    case 'mpns':
                        obj[col] = line[col].current;
                        break;
                    case 'quantities':
                        obj[col] = line[col].quantities;
                        break;
                    default:
                        obj[col] = line[col];
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
        formatted.push(['Algorithm', props.algorithm.stock+' : '+props.algorithm.best]);
        formatted.push(['Price Total', props.evaluation[props.algorithm.best].total_price]);
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
import {useState} from 'react';
import { ExportExcelIcon } from './Icons';
import {ExportModal} from './Modals';
import XLSX from 'xlsx';

function BOMExporter(props){
    const [showModal, setShowModal] = useState(false);
    function handleExport(fn, options={}){
        const headers = props.bomAttrs.map(attr => attr.accessor);
        console.log(headers);
        const formatted = options.bestPrice ? bestPriceFormat() : formatBOMData();
        if(formatted){
            const sheet = XLSX.utils.json_to_sheet(formatted, {header: headers});
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
            XLSX.writeFile(wb, fn+'.xlsx');
        }
    }
    function handleShowExport(){
        setShowModal(true);
    }
    function handleHideExport(){
        setShowModal(false);
    }
    function bestPriceFormat(){
        const ignore = props.apis.map((api) => api.accessor);
        ignore.push('maxOffers', '_unnamed', 'quantity');
        console.log(props.lowestOffers);
        const formatted = props.data.map((line, i) => {
            const outline = Object.entries(line).reduce((obj, [k,v]) => {
                if(!ignore.includes(k)){
                    obj[k] = v;
                }
                return obj;
            }, {});
            if(props.lowestOffers[i]){
                outline.distributer = props.lowestOffers[i].api;
                outline.offerNumber = props.lowestOffers[i].offerNum;
                const offer = line[props.lowestOffers[i].api].offers[props.lowestOffers[i].offerNum]
                //console.log(offer);
                props.apiSubHeadings.forEach((heading) => {
                    outline[heading.accessor] = offer[heading.accessor];
                });
            }
            return outline;
        });
        //console.log(formatted);
        //for()
        return formatted;
    }
    function formatBOMData(){
        const ignore = props.apis.map((api) => api.accessor);
        ignore.push('maxOffers', '_unnamed'); 
        const formatted = props.data.map((line) => {
            //const outline = {'MPN': line.mpn, 'Quantity': line.quantity};
            const outline = Object.entries(line).reduce((obj, [k,v]) => {
                if(!ignore.includes(k)){
                    obj[k] = v;
                }
                return obj;
            }, {});
            props.apis.forEach((api) => {
                if(api.accessor in line && line[api.accessor].offers.length > 0){
                    const offers = line[api.accessor].offers;
                    props.apiSubHeadings.forEach((heading) => {
                        outline[api.accessor+'_'+heading.accessor] = offers[0][heading.accessor];
                    });
                }
            });
            return outline;
        });
        console.log(formatted);
        return formatted;
    }
    return (
        <>
        <div className='Icon' onClick={handleShowExport}>
            <ExportExcelIcon size={32} show={showModal}/>
            <span>Export</span>
        </div>
        <ExportModal show={showModal} hideAction={handleHideExport} exportAction={handleExport}/>
        </>
    );
}

export default BOMExporter;
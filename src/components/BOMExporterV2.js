import {useState} from 'react';
import { ExportExcelIcon } from './Icons';
import {ExportModal} from './Modals';
import XLSX from 'xlsx';

function BOMExporterV2(props){
    const accessorToHeaders = props.bomAttrs.reduce((obj,attr)=>{
        obj[attr.accessor] = attr.Header;
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
        
        if(formatted){
            const sheet = XLSX.utils.json_to_sheet(formatted, {header: headers});
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
            XLSX.writeFile(wb, fn+'.xlsx');
        }
        
    }
    function defaultFormat(){
        const ignore = props.apis.map((api) => api.accessor);
        ignore.push('maxOffers', '_unnamed', 'activeApis', 
        'mpn', 'mpnOptions', 'highlights',
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
                    const offers = line[api.accessor].offers;
                    props.apiAttrs.forEach((heading) => {
                        outline[api.Header+'_'+heading.accessor] = offers[0][heading.accessor];
                    });
                }
            });
            return outline;
        });
        console.log(formatted);
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
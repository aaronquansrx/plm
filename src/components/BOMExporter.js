import {useState} from 'react';
import { ExportExcelIcon } from './Icons';
import {ExportModal} from './Modals';
import XLSX from 'xlsx';

function BOMExporter(props){
    const [showModal, setShowModal] = useState(false);
    function handleExport(fn){
        const formatted = formatBOMData();
        const sheet = XLSX.utils.json_to_sheet(formatted);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
        XLSX.writeFile(wb, fn+'.xlsx');
    }
    function handleShowExport(){
        setShowModal(true);
    }
    function handleHideExport(){
        setShowModal(false);
    }

    function formatBOMData(){
        const formatted = props.data.map((line) => {
            const outline = {'MPN': line.mpn};
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
        <ExportExcelIcon size={32} onClick={handleShowExport} show={showModal}/>
        <ExportModal show={showModal} hideAction={handleHideExport} exportAction={handleExport}/>
        </>
    );
}

export default BOMExporter;
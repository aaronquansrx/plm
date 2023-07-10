import React, {useEffect, useState} from 'react';

import XLSX from 'xlsx';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { getPLMRequest, postPLMRequest } from '../scripts/APICall';
import {ExportComponentAttributeModal} from '../components/BOMScrubInterface';

const attributes = [
    'Description', 'RoHS', 'REACH', 'MSL', 'Lead', 'Mounting Type'
];

function SingleComponentAttribute(){
    const [searchTerm, setSearchTerm] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [details, setDetails] = useState(null);
    const [mpn, setMpn] = useState(null);
    function handleChangeTerm(e){
        setSearchTerm(e.target.value);
    }
    function handleSearch(){
        setStatusMessage('Searching...');
        setMpn(searchTerm);
        const getData = {part: searchTerm};
        getPLMRequest('partdetails', getData,
        (res) => {
            console.log(res.data);
            if(res.data.success){
                setDetails(res.data.details);
                setStatusMessage('');
            }else{
                setStatusMessage('Search Failed');
            }
        }, (res) => {
            console.log(res.data);
            setStatusMessage('Server Error');
        });
    }
    function handleKeyDown(e){
        if(e.key == 'Enter'){
            handleSearch();
        }
    }
    function handleExport(fn, options={}){
        if(details){
            const tableData = [['MPN', ...attributes]].concat([[mpn, ...attributes.map(name => details[name])]]);
            const sheet = XLSX.utils.json_to_sheet(tableData, {skipHeader: true});
            if(options.csv){
                const csv = XLSX.utils.sheet_to_csv(sheet);
                const csvContent = "data:text/csv;charset=utf-8,"+csv;
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", fn+".csv");
                link.click();
            }else{
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, sheet, 'lineData');
                XLSX.writeFile(wb, fn+'.xlsx');
            }
        }
    }
    function handleOpenExport(){
        setShowExportModal(true);
    }
    function handleCloseExport(){
        setShowExportModal(false);
    }
    return(
        <div className='FlexNormal'>
            <h4>Single Component Search</h4>
            <span className='MPNRequest'>
            <Form.Control
            type="text"
            placeholder="MPN (exact match)"
            onChange={handleChangeTerm}
            onKeyDown={handleKeyDown}
            />
            <Button variant="outline-success" onClick={handleSearch}>Request</Button>
            <Button onClick={handleOpenExport}>Export</Button>
            {statusMessage}
            </span>

            {details &&
                attributes.map((name) => {
                    return <div>{name}: {details[name]}</div>
                })
            }
            <ExportComponentAttributeModal show={showExportModal} 
            hideAction={handleCloseExport} exportAction={handleExport}/>
        </div>

    );
}

export default SingleComponentAttribute;
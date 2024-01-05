import React, {useEffect, useState} from 'react';

import XLSX from 'xlsx';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { getPLMRequest, postPLMRequest } from '../scripts/APICall';
import {ExportComponentAttributeModal} from '../components/BOMScrubInterface';
import { LabeledCheckbox } from '../components/Forms';
import { useParams } from 'react-router';
const attributes = [
    'Category', 'Datasheet', 'Description', 'Long Description', 
    'RoHS', 'REACH', 'MSL', 'Lead', 'Mounting Type', 'Url'

];

function SingleComponentAttribute(){
    const params = useParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [details, setDetails] = useState(null);
    const [includeOctopart, setIncludeOctopart] = useState(false);
    const [octopartDetails, setOctopartDetails] = useState(null);
    //const [parameters, setParameters] = useState(null);
    //const [photo, setPhoto] = useState(null);
    const [mpn, setMpn] = useState(null);

    useEffect(() => {
        if(params.partId){
            //console.log(params);
            handleSearch(params.partId);
            //setSearchTerm(params.partId);
        }
    }, []);

    function handleChangeTerm(e){
        //console.log(e.target.value);
        setSearchTerm(e.target.value);
    }
    function handleClickSearch(){
        handleSearch();
    }
    function handleSearch(term=null){
        const st = term ? term : searchTerm;
        setStatusMessage('Searching...');
        setDetails(null);
        setMpn(st);
        const getData = {part: st};
        getPLMRequest('newpartdetails', getData,
        (res) => {
            console.log(res.data);
            if(res.data.success && res.data.found){
                setDetails(res.data.details);
                //setParameters(res.data.details.Parameters);
                //setPhoto(res.data.details.Photo);
                setStatusMessage('');
            }else{
                setStatusMessage('Searching Backup...');
                searchOldPartDetails(st);
            }
        }, (res) => {
            console.log(res.data);
            setStatusMessage('Server Error');
        });
        if(includeOctopart){
            const octopartParams = {
                detail: true,
                part: st
            }
            getPLMRequest('octopart', octopartParams, (res) => {
                console.log(res.data);
                setOctopartDetails(res.data.data);
            });
        }
    }
    function searchOldPartDetails(part){
        const getData = {part: part};
        getPLMRequest('partdetails', getData,
        (res) => {
            console.log(res.data);
            if(res.data.success){
                setDetails(res.data.details);
                //setParameters(res.data.details.Parameters);
                //setPhoto(res.data.details.Photo);
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
        if(details && fn !== ''){
            const tableData = [['MPN', ...attributes]].concat([[mpn, ...attributes.map(name => details[name])]]);
            const sheet = XLSX.utils.json_to_sheet(tableData, {skipHeader: true});
            const paramData = Object.entries(details.Parameters);//[];
            const paramSheet = XLSX.utils.json_to_sheet(paramData, {skipHeader: true});
            
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
                XLSX.utils.book_append_sheet(wb, sheet, 'Details');
                XLSX.utils.book_append_sheet(wb, paramSheet, 'Parameters');
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
            <h4>Single Component Attribute Search</h4>
            <div className='HoriCenter'>
            <span className='MPNRequest'>
            <Form.Control
            type="text"
            placeholder="MPN (exact match)"
            onChange={handleChangeTerm}
            onKeyDown={handleKeyDown}
            //value={searchTerm}
            />
            </span>
            <span style={{padding: '5px'}}>
            <LabeledCheckbox label={'Include Octopart'} id={'includeOctopart'} className='Pointer'
            checked={includeOctopart} onChange={() => setIncludeOctopart(!includeOctopart)}/>
            </span>
            <Button variant="outline-success" onClick={handleClickSearch}>Request</Button>
            <Button onClick={handleOpenExport}>Export</Button>
            {statusMessage}
            </div>

            {details &&
                <>
                {details.Photo && 
                <div>
                <img src={details.Photo} width='150px' height='150px'/>
                </div>
                }
                {attributes.map((name, i) => {
                    if(name === 'Datasheet' || name === 'Url'){
                        return <div key={i}>{name}: <a href={details[name]}>{details[name]}</a></div>
                    }
                    return <div key={i}>{name}: {details[name]}</div>
                })}
                {details.Parameters && 
                    <>
                    <h5>Parameters</h5>
                    {Object.entries(details.Parameters).map(([key, value], i) => {
                        return <div key={i}>{key}: {value}</div>
                    })}
                    </>
                }
                </>
            }
            <br/>
            {octopartDetails &&
                <>
                <h4>Octopart Details</h4>
                <div>{octopartDetails.description}</div>
                <div>
                    {Object.entries(octopartDetails.specs).map(([key, value], i) => {
                        return <div key={i}>{key}: {value}</div>
                    })}
                </div>
                </>
            }

            <ExportComponentAttributeModal show={showExportModal} 
            hideAction={handleCloseExport} exportAction={handleExport}/>
        </div>

    );
}

export default SingleComponentAttribute;
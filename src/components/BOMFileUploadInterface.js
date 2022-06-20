import { values } from 'lodash';
import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';
import axios from 'axios';
import XLSX from 'xlsx';

import Button from 'react-bootstrap/Button';

import {MyDropzone} from './Dropzone';
import {NamedCheckBox} from './Checkbox';
import {HoverOverlay} from './Tooltips';
import { AutoColumnOptionModal } from './Modals';

import {autoFindAttributesV2, parseLoadedBomV1} from './../scripts/Upload';

import { useServerUrl } from '../hooks/Urls';

import { BsFileEarmarkArrowDown } from "react-icons/bs";

import './../css/main.css';
//import {ExcelDisplayTable, CheckboxRowCustomColumnTable} from './Tables';

//const columnOptions = ["_remove", "Custom", "Manufacturer Part Number", "Manufacturer", "Quantity"];
/*
const tableHeaders = [
    {Header:'_remove', accessor: '_'},
    {Header:'Custom', accessor: 'custom'}, {Header:'Manufacturer Part Number', accessor: 'MPN'}, 
    {Header:'Manufacturer', accessor: 'manufacturer'}, {Header:'Quantity', accessor: 'quantity'}
];
const columnOptions = tableHeaders.map((obj) => obj.Header);

const headerToAccessor = tableHeaders.reduce(function(map, obj) {
    map[obj.Header] = obj.accessor;
    return map;
}, {});
*/

const autoSearchStrings = {
    mpn: ['mpn', 'manufacturing part number', 'manufacturer part number'],
    quantity: ['q', 'quantity'],
    manufacturer: ['manufacturer'],
    ipn: ['ipn', 'internal part number'],
    cpn: ['cpn', 'customer part number'],
    description: ['description'],
    reference: ['reference designator']

}

function BOMFileUploadInterface(props){
    const serverUrl = useServerUrl();
    const [file, setFile] = useState(null); 
    const [uploadedSheet, setUploadedSheet] = useState([]);
    const [autoFind, setAutoFind] = useState(true);
    const [autoOptionsModal, setAutoOptionsModal] = useState(false);
    const [activatedFindAttributes, setActivatedFindAttributes] = useState(props.headers.map((head) => {
        if(head.accessor in autoSearchStrings){
            head.active = true;
        }else{
            head.active = false;
        }
        return head;
    }));

    const [savedBoms, setSavedBoms] = useState([]);
    function handleDrop(workbook, file){
        setFile(file);
        //Get first worksheet
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        //Convert worksheet to array of arrays
        const data = XLSX.utils.sheet_to_json(ws, {header:1});
        const passData = data.map(l => {
            const line = [];
            for(let i=0; i<l.length; i++){
                const v = l[i] ? l[i].toString() : '';
                line.push(v);
            }
            return line;
        });
        //console.log(passData);
        setUploadedSheet(passData);
        if(autoFind){
            //console.log(props.headers);
            //console.log(activatedFindAttributes);
            const attributes = activatedFindAttributes.reduce((arr, attr) => {
                if(attr.active){
                    const searchArr = attr.accessor in autoSearchStrings ? autoSearchStrings[attr.accessor] : [];
                    arr.push({search:searchArr, header: {
                        Header: attr.Header, accessor: attr.accessor
                    }});
                }
                return arr;
            }, []);
            //console.log(attributes);
            const autoFound = autoFindAttributesV2(passData, attributes);
            if(autoFound.found){
                props.onBOMUpload(passData, {found: true, headers: autoFound.headers, bom: autoFound.bom});
            }else{
                props.onBOMUpload(passData);
            }
        }else{
            props.onBOMUpload(passData);
        }
        //props.onBOMUpload(passData, {autofind: autoFind}); //send straight to main bom
        //props.onBOMUpload(data, 1);
        
    }

    function handleConfirm(){
        props.onBOMUpload(uploadedSheet, {autofind: autoFind});
    }
    function handleCheckboxChange(){
        setAutoFind(!autoFind);
    }
    function handleShowAutoOptions(){
        setAutoOptionsModal(true);
    }
    function handleCloseOptions(){
        setAutoOptionsModal(false);
    }
    function handleCheckChange(i){
        setActivatedFindAttributes(update(activatedFindAttributes, {
            [i]: {active: 
                {$set: !activatedFindAttributes[i].active}
            }
        }));
    }
    function handleLoadBom(i){
        return function(){
            const bom = savedBoms[i];
            //console.log(savedBoms);
            //console.log(bom);
            const pBom = parseLoadedBomV1(bom.data);
            console.log(pBom);
            props.onBomLoad(pBom.bom, pBom.headers);
        }
    }
    useEffect(() => {
        if(props.user){
            axios({
                method: 'GET',
                url: serverUrl+'api/loadbom',
                params: {username: props.user},
            }).then(response => {
                console.log(response.data);
                setSavedBoms(response.data.boms);
            });
        }
    }, []);
    return (
        <div>
            <MyDropzone class='DropFiles' onDrop={handleDrop}>
                <BsFileEarmarkArrowDown size={40}/>
                <p>Drop BOM files (excel, csv)</p>
            </MyDropzone>
            {/*file &&
            <div>
                <span>{file.name}</span>
                <button onClick={handleConfirm}>Confirm</button>
            </div>*/
            }
            <div className='AutoColumnButtons'>
                <HoverOverlay tooltip='Automatically selects MPN and quantity columns from BOM'
                placement='bottom'>
                <NamedCheckBox label='Auto Columns' 
                onChange={handleCheckboxChange} checked={autoFind} value='auto'/>
                </HoverOverlay>
                <Button onClick={handleShowAutoOptions}>Options</Button>
            </div>
            <AutoColumnOptionModal show={autoOptionsModal} hideAction={handleCloseOptions} 
            attributes={activatedFindAttributes} onCheckChange={handleCheckChange}/>
            {
                savedBoms.map((bom, i) => 
                    <div key={i} onClick={handleLoadBom(i)}>{bom.name}</div>
                )
            }
        </div>
    );
}

export default BOMFileUploadInterface;
import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';
import {CheckboxRowCustomColumnTable, ReactTable} from './Tables';

import Button from 'react-bootstrap/Button';
import { WarningToolTipButtonFade } from './Tooltips';
import {bomEditParse} from './../scripts/Upload';

import './../css/table.css';

const tableHeaders = [
    {Header:'_remove', accessor: '_'}, {Header:'Manufacturer Part Number', accessor: 'mpn'}, 
    {Header:'Manufacturer', accessor: 'manufacturer'}, {Header:'Quantity', accessor: 'quantity'},
    {Header: 'Internal Part Number', accessor: 'ipn'}, {Header: 'Customer Part Number', accessor: 'cpn'},
    {Header: 'Description', accessor: 'description'}, {Header: 'Reference Designator', accessor: 'reference'},
    {Header:'Custom', accessor: 'custom'}
];
const columnOptions = tableHeaders.map((obj) => obj.Header);
const headerToAccessor = tableHeaders.reduce(function(map, obj) {
    map[obj.Header] = obj.accessor;
    return map;
}, {});

function BOMEditInterface(props){
    const originalSheet = props.bom ? props.bom : [];
    //const [originalSheet, setOriginalSheet] = useState(props.bom); // bom before editing
    const [editedSheet, setEditedSheet] = useState(props.bom); // edited bom (display)
    const [formattedSheet, setFormattedSheet] = useState([]); // will be sent to BOMInterface (array of same object)
    //keeps track of the edited table state
    const columnAttrs = props.bom.length > 0 ? Array(props.bom[0].length).fill(columnOptions[0]) : [];
    const [editTableState, setEditTableState] = useState({
        checkedRows: Array(props.bom.length).fill(false), 
        columnAttributes: columnAttrs
    });
    
    const [columnAttributes, setColumnAttributes] = useState([]);

    const [editState, setEditState] = useState(0);
    function handleEditCheckBox(i){
        setEditTableState(update(editTableState, {
            checkedRows: {[i]: 
                {$set: !editTableState['checkedRows'][i]}
            }
        }));
    }
    function handleEditAttributeChange(i, value){
        const valueIndex = editTableState.columnAttributes.reduce((v, h, i) => {
            if(h === value){
                return i;
            }
            return v;
        }, null);
        if(valueIndex !== null){
            setEditTableState(update(editTableState, {
                columnAttributes: {
                    [i]: {$set: value},
                    [valueIndex]: {$set: columnOptions[0]}
                }
            }));
        }else{
            setEditTableState(update(editTableState, {
                columnAttributes: {[i]: 
                    {$set: value}
                }
            }));
        }
    }
    /*
    function bomEditParse(table, columnAttrs, rowChecked, tableHeaders){
        const headerToAccessor = tableHeaders.reduce(function(map, obj) {
            map[obj.Header] = obj.accessor;
            return map;
        }, {});
        //if(hasMPNHeaderSet){
        const editedRowBom = table.reduce((arr, line, i) => {
            if(!rowChecked[i]) arr.push(line);
            return arr;
        }, []);
        const editedBom = editedRowBom.reduce((arr, line) => {
            const bomLine = {_unnamed: []};
            let mpns = [];
            line.forEach((cell, i) => {
                const attr = columnAttrs[i];
                if(attr !== tableHeaders[0].Header){
                    if(headerToAccessor[attr] === 'mpn'){
                        mpns = cell.split(', ');
                    }else if(headerToAccessor[attr] === 'quantity'){
                        bomLine.quantity = cell;
                        bomLine.displayQuantity = cell;
                    }else{
                        bomLine[headerToAccessor[attr]] = cell;
                    }
                }else{
                    bomLine["_unnamed"].push(cell);
                }
            });
            mpns.forEach((mpn, i) => {
                const bl = {...bomLine}; 
                bl.mpn = mpn;
                if(i !== 0) bl.displayQuantity = null;
                arr.push(bl);
            });
            return arr;
        }, []);
    
        const bomAttrs =  columnAttrs.reduce((arr, attr) => {
            if(attr !== tableHeaders[0].Header){
                arr.push({Header: attr, accessor: headerToAccessor[attr]});
            }
            return arr;
        }, []);
        bomAttrs.push({Header: 'Display Quantity', accessor: 'displayQuantity'});
    
        return {editedBom: editedBom, columnAttributes: bomAttrs};
    }
    */

   //const editedBomData = useBomParse(editState, );

    function handleConfirm(){
        let nextState = true;
        switch(editState){
            case 0: // editBOM based on the editTableState
                console.log(editTableState.columnAttributes);
                const hasMPNHeaderSet = editTableState.columnAttributes.reduce((b, attr) => {
                    if(attr === 'Manufacturer Part Number') return true;
                    return b;
                }, false);
                //use has mpn header set
                if(hasMPNHeaderSet){
                   const bomParse = bomEditParse(editedSheet, editTableState.columnAttributes, editTableState.checkedRows, props.headers);
                   setFormattedSheet(bomParse.editedBom);
                   setColumnAttributes(bomParse.columnAttributes);
                   console.log(bomParse.columnAttributes);
                }else{
                    nextState = false;
                }
                break;
            case 1: // checking the table
                props.onFinishEdit(formattedSheet, columnAttributes);
                break;
            default:
                console.log("Unknown BOMUpload state");
                break;
        }
        if(nextState) setEditState(editState+1);
    }
    function handleBack(){
        setEditState(editState-1);
    }
    function renderInterfaceState(){
        switch(editState){
            case 0:
                return(
                <div>
                {/*Remove Selected Lines*/}
                {<CheckboxRowCustomColumnTable sheet={originalSheet} columnOptions={columnOptions}
                checkedRows={editTableState["checkedRows"]} onCheckBox={handleEditCheckBox} 
                columnAttributes={editTableState["columnAttributes"]} onColumnChange={handleEditAttributeChange}/>}
                {/*<ChooseHeaderRowsTable sheet={originalSheet} headings={tableHeaders}/>*/}
                </div>);
            case 1:
                return( 
                <ReactTable data={formattedSheet} headers={columnAttributes}/>
                );
                //return <ExcelDisplayTable sheet={editedSheet}></ExcelDisplayTable>;
            default:
                return "Unknown interface state";
        }
    }
    return(
        <>
        <div className='FlexNormal'>
            <div className='IconNav2'>
                {editState !== 0 && <Button onClick={handleBack}>Back</Button>}
                {' '}
                {editState === 0 
                ? <WarningToolTipButtonFade onClick={handleConfirm} buttonText='Confirm'>
                    Manufacturer Part Number column not chosen
                </WarningToolTipButtonFade>
                : <Button onClick={handleConfirm}>Confirm</Button>}
            </div>
        </div>
        <div className='MainTable'>
        {renderInterfaceState()}
        </div>
        </>
    );
}

export default BOMEditInterface;
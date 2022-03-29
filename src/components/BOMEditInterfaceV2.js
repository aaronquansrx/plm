import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';
import Button from 'react-bootstrap/Button';

import {CheckboxRowCustomColumnTable, ReactTable} from './Tables';
import { WarningToolTipButtonFade } from './Tooltips';

import { bomEditParseV2 } from '../scripts/Upload';

import './../css/table.css';

const interfaceStates = ['edit', 'confirm'];

function BOMEditInterfaceV2(props){
    const columnOptions = props.tableHeaders.map(attr => attr.Header);
    const [formattedBOMData, setFormattedBOMData] = useState({
        sheet: [],
        attributes: []
    });
    const [editTableState, setEditTableState] = useState({
        checkedRows: Array(props.bom.length).fill(false), 
        columnAttributes: props.bom.length > 0 ? Array(props.bom[0].length).fill(columnOptions[0]) : []
    });
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
                    [valueIndex]: {$set: columnOptions[0]} //old index
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
    function handleConfirm(){
        let nextState = true;
        switch(interfaceStates[editState]){
            case 'edit': // editBOM based on the editTableState
                console.log(editTableState.columnAttributes);
                const hasMPNHeaderSet = editTableState.columnAttributes.reduce((b, attr) => {
                    if(attr === 'Manufacturer Part Number') return true;
                    return b;
                }, false);
                //use has mpn header set
                if(hasMPNHeaderSet){
                   const {editedBom: editedBom, columnAttributes: columnAttrs} = bomEditParseV2(props.bom, editTableState.columnAttributes, editTableState.checkedRows, props.tableHeaders);
                   setFormattedBOMData({
                       sheet: editedBom, attrs: columnAttrs
                   });
                   //setColumnAttributes(columnAttrs);
                   console.log(editedBom);
                }else{
                    nextState = false;
                }
                break;
            case 'confirm': // checking the table
                props.onFinishEdit(formattedBOMData.sheet, formattedBOMData.attrs);
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
        switch(interfaceStates[editState]){
            case 'edit':
                return(
                <div>
                {<CheckboxRowCustomColumnTable sheet={props.bom} columnOptions={columnOptions}
                checkedRows={editTableState["checkedRows"]} onCheckBox={handleEditCheckBox} 
                columnAttributes={editTableState["columnAttributes"]} 
                onColumnChange={handleEditAttributeChange}/>}
                </div>
                );
            case 'confirm':
                return( 
                <ReactTable data={formattedBOMData.sheet} headers={formattedBOMData.attrs}/>
                );
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

export default BOMEditInterfaceV2;
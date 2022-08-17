import React, {useEffect, useState} from 'react';
import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';

import {CogIcon} from './Icons';
import { NamedCheckBox } from './Checkbox';
import { LabeledCheckbox } from './Forms';
import {TemplateModal} from './Modals';

function BOMToolSettings(props){
    const [openSettings, setOpenSettings] = useState(false);
    const [apiAttributesState, setApiAttributesState] = useState(
        props.apiAttributes.map(() => true)
    );
    const [initAttrState, setInitAttrState] = useState(props.apiAttributes.map(() => true));
    function handleOpenSettings(){
        setOpenSettings(true);
        setApiAttributesState(initAttrState);
    }
    function handleCloseSettings(){
        setOpenSettings(false);
    }
    function handleApiAttributesChange(i){
        return function(v){
            setApiAttributesState(update(apiAttributesState, {
                [i]: {$set: v}
            }));
        }
    }
    function handleSaveSettings(){
        const displayApiAttributes = props.apiAttributes.reduce((arr, attr, i) => {
            if(apiAttributesState[i]){
                arr.push(attr);
            }
            return arr;
        }, []);
        setInitAttrState(apiAttributesState);
        props.onSaveSettings(displayApiAttributes);
        handleCloseSettings();
    }
    const settingsTitle = (<>BOM Tool Settings</>);
    const SettingsBody = () => (
        <>
        <h5>API Attributes</h5>
        {props.apiAttributes.map((attr, i) => {
            return (
            <LabeledCheckbox key={i} className='Pointer' label={'longHeader' in attr ? attr.longHeader : attr.Header}
            checked={apiAttributesState[i]} onChange={handleApiAttributesChange(i)} id={attr.accessor}/>
            );
        })}
        </>
    );
    const SettingsFooter = () => (
        <>
        <Button variant="secondary" onClick={handleCloseSettings}>Close</Button>
        <Button variant="primary" onClick={handleSaveSettings}>Save</Button>
        </>
    );
    return(
        <>
        <div onClick={handleOpenSettings}>
        <CogIcon size={30}/>
        </div>
        <TemplateModal show={openSettings} onClose={handleCloseSettings} 
        title={settingsTitle} 
        body={<SettingsBody/>} 
        footer={<SettingsFooter/>}
        />
        </>
    );
}

export default BOMToolSettings;
import React, {useEffect, useState} from 'react';
import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import { Accordion, ListGroup, ListGroupItem } from 'react-bootstrap';

import {CogIcon} from './Icons';
import { NamedCheckBox } from './Checkbox';
import { LabeledCheckbox } from './Forms';
import {TemplateModal} from './Modals';
import {TabPages} from './Tabs';
import {NumberInput} from './Forms';
import {SuggestionSearcher, ObjectSuggestionSearcher} from './Searcher';
import {ChooseButtonList} from './ButtonList';

import {conditionCases, adjustmentCases} from '../scripts/ExcessRules';

import axios from 'axios';
import {useServerUrl} from './../hooks/Urls';

const inProduction = process.env.NODE_ENV === 'production';

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
        if(props.onSaveSettings) props.onSaveSettings(displayApiAttributes);
        handleCloseSettings();
    }
    const settingsTitle = (<>BOM Tool Settings</>);
    const tabs = [
        {name: 'API Attributes', content: <APIAttributeSelector apiAttributesState={apiAttributesState} 
        handleApiAttributesChange={handleApiAttributesChange} apiAttributes={props.apiAttributes}/>},
        //{name: 'Excess Control Rules', content: <ExcessControlRules/>}
    ];

    if(!inProduction){
        tabs.unshift({name: 'Excess Control Rules', content: <ExcessControlRules/>});
    }
    const SettingsBody = () => (
        <TabPages tabs={tabs} displayTab={0}/>
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

function APIAttributeSelector(props){
    return(
        <>
        <h4>API Attributes</h4>
        {props.apiAttributes.map((attr, i) => {
            return (
            <LabeledCheckbox key={i} className='Pointer' label={'longHeader' in attr ? attr.longHeader : attr.Header}
            checked={props.apiAttributesState[i]} onChange={props.handleApiAttributesChange(i)} id={attr.accessor}/>
            );
        })}
        </>
    );
}

function ExcessControlRules(props){
    const serverUrl = useServerUrl();
    const [rules, setRules] = useState([]);
    const [newRules, setNewRules] = useState([]);
    useEffect(() => {
        //get rules
    }, []);
    function addRule(rule){
        setRules(rules.concat(rule));
        setNewRules(newRules.concat(rule));
    }
    function saveRules(){
        console.log(newRules);
        axios({
            method: 'POST',
            url: serverUrl+'api/excessrules',
            data: {
                new_rules: newRules, user_id: 1
            }
        }).then(response => {
            console.log(response.data);
        });
    }
    return(
    <>
    <div style={{borderBottom: '1px solid #dee2e6'}}>
    <h4>Excess Control Rules</h4>
    <Accordion defaultActiveKey={['0']}>
        {rules.map((rule, i) => {
            return(
            <Accordion.Item key={i} eventKey={i.toString()}>
            <Accordion.Header>Rule {i+1}</Accordion.Header>
            <Accordion.Body>
                <ListGroup>
                {rule.parameterConditions.map((condition, j) =>
                    <ListGroup.Item key={j}>{condition.parameter.name}: {condition.value.name}</ListGroup.Item>
                )}
                {rule.numberConditions.map((condition, j) => 
                    <ListGroup.Item key={j}>{condition.sign} {condition.value}</ListGroup.Item>
                )}
                {rule.adjustments.map((adj, j) => 
                    <ListGroup.Item key={j}>{adj.sign} {adj.value}</ListGroup.Item>
                )}
                </ListGroup>
            </Accordion.Body>
            </Accordion.Item>
        )
        })}
    </Accordion>
    </div>
    <h4>Add Rule</h4>
    <AddRule addRule={addRule}/>
    <Button onClick={saveRules}>Save Rules</Button>
    </>
    )
}

function AddRule(props){
    const serverUrl = useServerUrl();

    const [parameterConditions, setParameterConditions] = useState([]);
    const [numericalConditions, setNumericalConditions] = useState([]);
    const [adjustments, setAdjustments] = useState([]);

    const [parameterResults, setParameterResults] = useState([]);
    const [selectedParameter, setSelectedParameter] = useState(null);
    const [valueResults, setValueResults] = useState([]);
    const [selectedValue, setSelectedValue] = useState(null);

    const [updater, setUpdater] = useState(0);
    const suggestionSize = 5;
    function handleSearchParameter(st){
        if(st !== ''){
            axios({
                method: 'GET',
                url: serverUrl+'api/attributes',
                params: {parameter: st, limit: suggestionSize}
            }).then((response) => {
                const data = response.data;
                console.log(data);
                setParameterResults(data.search);
                //setParameterResults(data.search.map((s => s.name)));
            });
        }else{
            setParameterResults([]);
        }
    }
    function handleSearchValue(st){
        if(st !== ''){
            axios({
                method: 'GET',
                url: serverUrl+'api/attributes',
                params: {value: st, limit: suggestionSize}
            }).then((response) => {
                const data = response.data;
                console.log(data);
                setValueResults(data.search);
                //setValueResults(data.search.map((s => s.name)));
            });
        }else{
            setValueResults([]);
        }
    }
    function handleAddCondition(operator, value){
        const newNumericalCondition = {sign: operator, value: value};
        setNumericalConditions(numericalConditions.concat(newNumericalCondition));
    }
    function handleAddAdjustment(operator, value){
        const newAdjustment = {sign: operator, value: value};
        setAdjustments(adjustments.concat(newAdjustment));
    }
    function handleAddParameter(){
        if(selectedParameter && selectedValue){
            setParameterConditions(parameterConditions.concat({parameter: selectedParameter, value: selectedValue}));
        }
    }
    function handleAddRule(){
        if(parameterConditions.length > 0){
            props.addRule({
                parameter_conditions: parameterConditions, 
                number_conditions: numericalConditions, 
                adjustments: adjustments
            });
        }
        setSelectedParameter(null);
        setSelectedValue(null)
    }
    const rowStyle = {display: 'flex', flexDirection: 'row'};
    return(
    <>
    {(parameterConditions.length > 0 || numericalConditions.length > 0) && <h5>Conditions</h5>}
    {parameterConditions.length > 0 &&
        <div>
            <h6>Parameters</h6>
            <ListGroup>
            {
                parameterConditions.map((condition, i) => {
                    return <ListGroup.Item key={i}>{condition.parameter.name}: {condition.value.name}</ListGroup.Item>
                })
            }
            </ListGroup>
        </div>
    }
    {numericalConditions.length > 0 &&
        <div>
        <h6>Numbers</h6>
        <ListGroup>
        {
            numericalConditions.map((condition, i) => {
                return <ListGroup.Item key={i}>{condition.sign} {condition.value}</ListGroup.Item>
            })
        }
        </ListGroup>
        </div>
    }
    {adjustments.length > 0 && 
        <div>
            <h6>Adjustments</h6>
            <ListGroup>
            {
                adjustments.map((adj, i) => {
                    return <ListGroup.Item key={i}>{adj.sign} {adj.value}</ListGroup.Item>
                })
            }
            </ListGroup>
        </div>
    }

    <div style={rowStyle}>
    <div style={{}}>
    {selectedParameter ? <Button variant='success' onClick={() => setSelectedParameter(null)}>{selectedParameter.name}</Button>
    : <ObjectSuggestionSearcher searchTerm={''} placeholder={'Search Parameter'} recommends={parameterResults} 
    onSearch={handleSearchParameter} size={suggestionSize}
    onClickSuggestion={(p) => setSelectedParameter(p)}/>
    }
    </div>
    <div style={{}}>
    {selectedValue ? <Button variant='success' onClick={() => setSelectedValue(null)}>{selectedValue.name}</Button>
    : <ObjectSuggestionSearcher searchTerm={''} placeholder={'Search Value'} recommends={valueResults} 
    onSearch={handleSearchValue} size={suggestionSize}
    onClickSuggestion={(v) => setSelectedValue(v)}/>
    }
    </div>
    <Button onClick={handleAddParameter}>Add Condition</Button>
    </div>
    {/*<div style={rowStyle}>
    <ChooseButtonList chosen={conditionSign} items={conditionCases} changeChosen={(c) => setConditionSign(c)}/>
    <NumberInput value={conditionValue} onChange={i => setConditionValue(i)}/>
    <Button onClick={handleAddCondition}>Add Condition</Button>
    </div>*/}
    <AddLogic logicOperators={conditionCases} onAdd={handleAddCondition} logicName={'Condition'}/>
    <AddLogic logicOperators={adjustmentCases} onAdd={handleAddAdjustment} logicName='Adjustment'/>
    <Button onClick={handleAddRule}>Add Rule</Button>
    </>
    )
}

function AddLogic(props){
    const firstOperator = props.logicOperators.length > 0 ? props.logicOperators[0] : null; 
    const [operatorSign, setOperatorSign] = useState(firstOperator);
    const [numberValue, setNumberValue] = useState(0);
    const rowStyle = {display: 'flex', flexDirection: 'row'};
    function handleAdd(){
        props.onAdd(operatorSign, numberValue);
        setOperatorSign(firstOperator);
        setNumberValue(0);
    }
    return(
        <div style={rowStyle}>
            <ChooseButtonList chosen={operatorSign} items={props.logicOperators} changeChosen={(c) => setOperatorSign(c)}/>
            <NumberInput value={numberValue} onChange={i => setNumberValue(i)}/>
            <Button onClick={handleAdd}>Add {props.logicName}</Button>
        </div>
    );
}

export default BOMToolSettings;
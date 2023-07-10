import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

import { useQuoteRoles } from '../hooks/Roles';

import { TextControl } from '../../components/Forms';

import { SimpleDropdown } from '../../components/Dropdown';
import { SuggestionSearcher, ObjectSuggestionSearcher} from '../../components/Searcher';

import { HoverOverlay } from '../../components/Tooltips';

import { getPLMRequest, postPLMRequest } from '../../scripts/APICall';
import { IdCheckbox } from '../../components/Checkbox';

/*const roles = ['SuperUser', 'MQA', 'CBM', 'SSG', 
'Engineer', 'Commodity Mgr', 'Purch Mgr'];*/

function QuotingUsers(props){
    const [pageState, setPageState] = useState(0);
    const [duties, isAdmin] = useQuoteRoles(props.user);
    function changePageState(i){
        setPageState(i);
    }
    function renderView(){
        switch(pageState){
            case 0:
                return <UserView/>
            case 1:
                return <RoleView/>
        }
    }
    const seeUsers = 'role_edit' in duties || isAdmin;
    return(
        <>
        {seeUsers ?
        <>
        <div className='FlexNormal'>
            <h3>E-Quote Users</h3>
        </div>
        <div className='FlexNormal'>
            <UserNavigation selected={pageState} changePageState={changePageState}/>
        </div>
        <div className='FlexNormal'>
            {renderView()}
        </div>
        </>
        : <div className='FlexNormal'>
            <h3>Not Authorised</h3>
        </div>
        }
        </>
    );
}

function UserView(props){
    const maxUserSearch = 20;
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [quoteUsers, setQuoteUsers] = useState([]);
    const [userSuggestions, setUserSuggestions] = useState([]);
    const headers = [
        {accessor: 'username', label: 'Username'},
        {accessor: 'role', label: 'Role'}
    ]
    useEffect(() => {
        const getData = {
            function: 'quote_users'
        }
        getPLMRequest('user', getData, 
            (res) => {
                console.log(res.data);
                if(res.data.success){
                    setQuoteUsers(res.data.users);
                }
            },
            (res) => {
                console.log(res.data);
            }
        );
        const roleGetData = {
            function: 'quote_roles'
        }
        getPLMRequest('user', roleGetData,
        (res) => {
            console.log(res.data);
            setRoles(res.data.roles);
        },
        (res) => {
            console.log(res.data);
        });
    }, []);
    useEffect(() => {
        const quoteUserIds = new Set(quoteUsers.map((user) => user.user_id));
        const possibleUsers = users.reduce((arr, user) => {
            if(!quoteUserIds.has(user.id)){
                arr.push(user);
            }
            return arr;
        }, []);
        setUserSuggestions(possibleUsers);
    }, [quoteUsers, users])
    function handleSearch(term){
        const getData = {
            function: 'search', term: term, limit: maxUserSearch
        }
        getPLMRequest('user', getData, 
            (res) => {
                console.log(res.data);
                if(res.data.success){
                    setUsers(res.data.users);
                }
            },
            (res) => {
                console.log(res.data);
            }
        );
    }
    function handleClickSuggestion(reco){
        console.log(reco);
        const postData = {
            function: 'add_quote_user', user_id: reco.id
        }
        postPLMRequest('user', postData,
        (res) => {
            console.log(res.data);
            setQuoteUsers(res.data.users);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleChangeRole(roleIndex, i){
        const roleId = roles[roleIndex].id;
        
        const postData = {
            function: 'update_quote_role', user_id: quoteUsers[i].user_id, role_id: roleId
        }
        postPLMRequest('user', postData,
        (res) => {
            console.log(res.data);
            setQuoteUsers(res.data.users);
        },
        (res) => {
            console.log(res.data);
        });
    }
    function handleDelete(i){
        //console.log(users[i]);
        const postData = {
            function: 'delete_quote_user', user_id: quoteUsers[i].user_id
        }
        postPLMRequest('user', postData,
        (res) => {
            console.log(res.data);
            setQuoteUsers(res.data.users);
        },
        (res) => {
            console.log(res.data);
        });
    }
    return(
        <>
        <h3>Users</h3>
        <div>
            Add Quote User
            <div style={{display: 'flex', justifyContent: 'center'}}>
            <ObjectSuggestionSearcher recommends={userSuggestions} size={maxUserSearch}
            onSearch={handleSearch} onClickSuggestion={handleClickSuggestion}
            showBaseSuggestions/>
            </div>
        </div>
        <UserTable data={quoteUsers} headers={headers} roles={roles.map(role => role.name)}
        onChangeRole={handleChangeRole} onDelete={handleDelete} />
        </>
    );
}

function RoleView(props){
    const [duties, setDuties] = useState([]);
    const [roles, setRoles] = useState([]);
    useEffect(() => {
        const getData = {
            function: 'all_duties'
        }
        getPLMRequest('user', getData,
        (res) => {
            console.log(res.data);
            setDuties(res.data.role_duties);
        },
        (res) => {
            console.log(res.data);
        });

        const roleGetData = {
            function: 'quote_roles'
        }
        getPLMRequest('user', roleGetData,
        (res) => {
            console.log(res.data);
            setRoles(res.data.roles);
        },
        (res) => {
            console.log(res.data);
        });
    }, []);
    function handleAddRole(){
        const postData = {
            function: 'add_role'
        }
        postPLMRequest('user', postData,
        (res) => {
            //console.log(res.data);
            setRoles(res.data.roles);
        }, (res) => {
            console.log(res.data);
        });
    }
    function handleChangeRoleName(line, roleName){
        const roleId = roles[line].id;
        console.log(roleId);
        console.log(roleName);
        const postData = {
            function: 'update_role_name', role_id: roleId, name: roleName
        }
        
        postPLMRequest('user', postData,
        (res) => {
            console.log(res.data);
            setRoles(res.data.roles);
        }, (res) => {
            console.log(res.data);
        });
    }
    function handleDeleteRole(line){

    }
    function handleToggleDuty(line, duty, dutyIndex){
        console.log(duty.duty);
        console.log(roles[line]);
        if(duty.duty in roles[line].duties){
            console.log('in');
            const newLineDuties = {...roles[line].duties};
            delete newLineDuties[duty.duty];
            setRoles(update(roles, {
                [line]: {
                    duties: {$set: newLineDuties}
                }
            }));
            const postData = {
                function: 'remove_duty', role_id: roles[line].id, duty: duty.duty
            }
            postPLMRequest('user', postData, null, 
            (res) => {
                console.log(res.data);
            });
        }else{
            console.log('out');
            setRoles(update(roles, {
                [line]: {
                    duties: {
                        [duty.duty]: {$set: true}
                    }
                }
            }));
            const postData = {
                function: 'add_duty', role_id: roles[line].id, duty: duty.duty
            }
            postPLMRequest('user', postData, null, 
            (res) => {
                console.log(res.data);
            });
        }
        //setRoles()
    }
    console.log(roles);
    return(
        <>
        <h3>Roles</h3>
        <Button onClick={handleAddRole}>Add Role</Button>
        <RoleTable duties={duties} roles={roles}
        onChangeRoleName={handleChangeRoleName}
        onToggleDuty={handleToggleDuty}/>
        </>
    )
}

function UserNavigation(props){
    function handleNavChange(i){
        return function(){
            if(props.changePageState){
                props.changePageState(i);
            }
        }
    }
    function styling(sel, i){
        if(sel === i) return { backgroundColor: '#acb3ba'};
        return {};
    }
    return(
        <div className='FlexNormal IconNav'>
            <div className='MainSwitchIcon'>
                <HoverOverlay tooltip={'Back to Quote Main'} placement='bottom'>
                    <a href={'/quoting'}><div className={'Pointer'}>
                        Back to Quote Main
                    </div></a>
                </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
                <HoverOverlay tooltip={'Users'} placement='bottom'>
                    <div style={styling(props.selected, 0)} className={'Pointer'} 
                    onClick={handleNavChange(0)}>
                        Users
                    </div>
                </HoverOverlay>
            </div>
            <div className='MainSwitchIcon'>
                <HoverOverlay tooltip={'Roles'} placement='bottom'>
                    <div style={styling(props.selected, 1)} className={'Pointer'} 
                    onClick={handleNavChange(1)}>
                        Roles
                    </div>
                </HoverOverlay>
            </div>
        </div>
    );
}

function UserTable(props){
    function handleChangeRole(i){
        return function(item, roleIndex){
            if(props.onChangeRole) props.onChangeRole(roleIndex, i);
        }
    }
    function handleDelete(i){
        return function(){
            if(props.onDelete) props.onDelete(i);
        }
    }
    return(
        <Table>
            <thead className={props.headerClass}>
                <tr>
                {props.headers.map((h, i) => 
                <th key={i}>{h.label}</th>
                )}
                <th></th>
                </tr>
            </thead>
            <tbody>
                {props.data.map((row, i) => 
                    <tr key={i}>
                        {props.headers.map((h, j) => {
                            let content;
                            if(h.accessor === 'role'){
                                content = <SimpleDropdown selected={row.role ? row.role : 'No Role'} items={props.roles}
                                onChange={handleChangeRole(i)}/>
                            }else{
                                content = row[h.accessor];
                            }
                            return <td key={j}>{content}</td>;
                            }
                        )}
                        <td><Button onClick={handleDelete(i)} variant='danger'>X</Button></td>
                    </tr>
                )}
            </tbody>
        </Table>
    )
}

function RoleTable(props){
    const [newRoleName, setNewRoleName] = useState({line: -1, value: ''}); //{line, value}
    function handleClickNameRow(i){
        return function(){
            setNewRoleName(update(newRoleName, {
                line: {$set: i}
            }));
        }
    }
    function handleChangeName(name){
        setNewRoleName(update(newRoleName, {
            value: {$set: name},
        }));
    }
    function handleBlur(){
        setNewRoleName(update(newRoleName, {
            line: {$set: -1}
        }));
        props.onChangeRoleName(newRoleName.line, newRoleName.value);
    }
    function handleChangeDuty(line, duty, dutyIndex){
        return function(){
            props.onToggleDuty(line, duty, dutyIndex);
        }
    }
    const nameStyle = {borderRight: 'solid 2px black'};
    return(
        <Table>
            <thead className={props.headerClass}>
                <tr>
                <th style={nameStyle}>Role Name</th>
                {props.duties.map((h, i) => 
                <th key={i}>{h.label}</th>
                )}
                </tr>
            </thead>
            <tbody>
                {props.roles.map((role, i) => {
                    const nameCell = newRoleName.line === i ? 
                    <TextControl init={role.name} onChange={handleChangeName} onBlur={handleBlur}/>
                    : <>{role.name}</>
                    return <tr key={i}>
                        <td style={nameStyle} onClick={handleClickNameRow(i)}>{nameCell}</td>
                        {props.duties.map((duty, j) => {
                            const isChecked = duty.duty in role.duties;
                            return(
                                <td key={j}><IdCheckbox checked={isChecked} onChange={handleChangeDuty(i, duty, j)}/></td>
                            );
                        })}
                    </tr>
                })}
            </tbody>
        </Table>
    );
}

export default QuotingUsers;
import React, {useEffect, useState} from 'react';
import Nav from 'react-bootstrap/Nav';

export function TabPages(props){
    const tabs = props.tabs ? props.tabs : [];
    const dt = props.displayTab ? (props.displayTab >= tabs.length ? tabs.length-1 : props.displayTab) : 0;
    const [selectedTab, setSelectedTab] = useState(props.tabs ? dt : null);
    const content = selectedTab !== null ? tabs[selectedTab].content : null;
    function handleChangeTab(i){
        return function(){
            setSelectedTab(i);
        }
    }
    return(
    <>
    <div className={props.tabClass}>
    <Nav variant="tabs">
        {tabs.map((tab, i) => 
            <Nav.Item key={i} onClick={handleChangeTab(i)}>
                <Nav.Link>{tab.name}</Nav.Link>
            </Nav.Item>
        )}
    </Nav>
    </div>
    {content && content}
    </>
    )
}
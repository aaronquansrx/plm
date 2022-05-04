import React, {useEffect, useState} from 'react';
import Nav from 'react-bootstrap/Nav';

export function TabPages(props){
    const tabs = props.tabs ? props.tabs : [];
    const [selectedTab, setSelectedTab] = useState(props.tab ? 0 : null);
    const content = selectedTab !== null ? tabs[selectedTab].content : null;
    function handleChangeTab(i){
        return function(){
            setSelectedTab(i);
        }
    }
    return(
    <div>
    <Nav variant="tabs">
        {tabs.map((tab, i) => 
            <Nav.Item onClick={handleChangeTab(i)}>
                <Nav.Link>{tab.name}</Nav.Link>
            </Nav.Item>
        )}
    </Nav>
    <div>
        {content && content}
    </div>
    </div>
    )
}
import React, {useEffect, useState} from 'react';

import {useClientUrl, useServerUrl} from './../hooks/Urls';

import styled from 'styled-components';
import axios from 'axios';

import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar';


import { Container } from 'react-bootstrap';
import background from './../bg_srx_pattern_grey.gif';
import logo from './../logo_srx_global.png';

import {BiHelpCircle} from 'react-icons/bi';
import { HoverOverlay } from '../components/Tooltips';

import {StoreCurrencyOptions} from './../components/Options';
import {Login} from './../components/Modals';

import './../css/main.css';

const SRXBackgroundNavbar = styled(Navbar)`
    background-image: url(${background});
`;
const Version = styled.div`
    cursor: pointer; 
`;
const LoggedAs = styled.span`
    color: white;
`;

export function MainNavbar(props){
    //console.log(props.username);
    const [showLogin, setShowLogin] = useState(false);
    const [pingCount, setPingCount] = useState(0);
    const clientUrl = useClientUrl();
    const serverUrl = useServerUrl();
    function path(p){
        //const prePath = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_CLIENT_PATH : process.env.REACT_APP_TEST_PATH;
        //const server = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_SERVER : process.env.REACT_APP_SERVER_TEST;
        return clientUrl+'/'+p;
        //return server+prePath+p;
    }
    function toggleLoginModal(){
        setShowLogin(!showLogin);
    }
    function handleLogin(username, password){
        props.onLogin(username, password);
    }
    function handlePing(){
        //console.log('ping');
        if(props.username){
            axios({
                method: 'GET',
                url: serverUrl+'api/ping',
                params: {username: props.username},
            }).then(response => {
                console.log(response.data);
                setPingCount(pingCount+1);
            });
        }
    }
    useEffect(() => {
        if(props.username){
            //console.log('ping in min');
            if(pingCount === 0){
                handlePing();
            }
            setTimeout(handlePing, 60000);
        }
    }, [props.username, pingCount]);
    //console.log(props.username);
    return(
        <div className='FlexNormal'>
        <SRXBackgroundNavbar bg="dark" variant='dark' expand="lg">
        <Container fluid>
            <Navbar.Brand href={path("")}>
            <img
                src={logo}
                width='50%'
                height='50%'
                className="d-inline-block align-top"
                alt="React Bootstrap logo"
            />
            </Navbar.Brand>
            <Navbar.Brand href={path("")}>PLM</Navbar.Brand>
            <Navbar.Toggle aria-controls="navbarScroll" />
            <Navbar.Collapse id="navbarScroll">
            <Nav
                className="me-auto my-2 my-lg-0"
                style={{ maxHeight: '100px' }}
                navbarScroll
            >
                {props.pages.map((page, i) => {
                    return <Nav.Link key={i} href={path(page.path)}>{page.title}</Nav.Link>
                })}
            </Nav>
            {/*
            <Form className="d-flex">
                <FormControl
                type="search"
                placeholder="Search"
                className="me-2"
                aria-label="Search"
                />
                <Button variant="outline-success">Search</Button>
            </Form>
            */}
            {/*<Nav className='nav-link' onClick={handlePing}>Ping</Nav>*/}
            <Nav className='nav-link Help' >
            <HoverOverlay tooltip='Help (in development)' placement='auto'><BiHelpCircle size={30}/></HoverOverlay>
            </Nav>
            <Nav className='nav-link'>
                <StoreCurrencyOptions store={props.store} currency={props.currency} 
                onOptionChange={props.onOptionChange} 
                stores={props.stores} currencies={props.currencies}
                dataProcessLock={props.dataProcessLock}/>
            </Nav>
            <Nav><Version className='nav-link' onClick={props.onVersionClick}>V{props.version}</Version></Nav>
            <div>
            {/*<a href={path("login")}>Login</a><a href={path('login')} onClick={props.onLogout}>Logout</a>*/}
            {!props.username ? <span className='NavClickable' onClick={toggleLoginModal}>Login</span> : 
                <div>
                    <LoggedAs>Logged in as: {props.username} </LoggedAs>
                    <span className='NavClickable' onClick={props.onLogout}>Logout</span>
                </div>
            }
            </div>

            </Navbar.Collapse>
        </Container>
        </SRXBackgroundNavbar>
        {<Login show={showLogin} hideAction={toggleLoginModal} login={handleLogin} store={props.store} currency={props.currency}/>}
        </div>
    );
}
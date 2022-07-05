import React, {useEffect, useState} from 'react';

import {useClientUrl} from './../hooks/Urls';

import styled from 'styled-components';

import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar';


import { Container } from 'react-bootstrap';
import background from './../bg_srx_pattern_grey.gif';
import logo from './../logo_srx_global.png';

import {StoreCurrencyOptions} from './../components/Options';

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
    const clientUrl = useClientUrl();
    function path(p){
        //const prePath = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_CLIENT_PATH : process.env.REACT_APP_TEST_PATH;
        //const server = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_SERVER : process.env.REACT_APP_SERVER_TEST;
        return clientUrl+'/'+p;
        //return server+prePath+p;
    }
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
                <Nav.Link href={path("bomtool")}>BOM Tool</Nav.Link>
                <Nav.Link href={path("cbom")}>CBOM Exporter</Nav.Link>
                <Nav.Link href={path("partsearch")}>Part Search</Nav.Link>
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
            <Nav className='nav-link'>
                <StoreCurrencyOptions store={props.store} currency={props.currency} 
                onOptionChange={props.onOptionChange} 
                stores={props.stores} currencies={props.currencies}
                dataProcessLock={props.dataProcessLock}/>
            </Nav>
            <Nav><Version className='nav-link' onClick={props.onVersionClick}>V1.0</Version></Nav>
            <div>
            {!props.username ? <a href={path("login")}>Login</a> : 
                <div>
                    <LoggedAs>Logged in as: {props.username}</LoggedAs>
                    <a href={path('login')} onClick={props.onLogout}>Logout</a>
                </div>
            }
            </div>

            </Navbar.Collapse>
        </Container>
        </SRXBackgroundNavbar>
        </div>
    );
}
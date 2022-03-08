import React, {useEffect, useState} from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import './../css/main.css';

function Login(props){
    const [username, setUsername] = useState(null);
    function handleUsernameChange(e){
        const user = e.target.value;
        setUsername(user);
    }
    function handleLogin(){
        //console.log(username);
        props.onLogin(username);
    }
    function path(p){
        const prePath = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_CLIENT_PATH : process.env.REACT_APP_TEST_PATH;
        const server = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_SERVER : process.env.REACT_APP_SERVER_TEST;
        return server+prePath+p;
    }
    return(
        <div className='Login'>
            <Form>
            <Form.Group className="mb-3" controlId="formBasicUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control type="input" placeholder="Enter username" 
                onChange={handleUsernameChange}/>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" placeholder="Password" />
            </Form.Group>
            <Button href={path('')} variant="primary" onClick={handleLogin}>
                Login
            </Button>
            </Form>
        </div>
    )
}

export default Login;
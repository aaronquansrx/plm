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
            <Button href='/' variant="primary" onClick={handleLogin}>
                Login
            </Button>
            </Form>
        </div>
    )
}

export default Login;
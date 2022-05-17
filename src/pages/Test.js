import {useState, useEffect} from 'react';
import styled from 'styled-components';

const DownArrow = styled.div`
position: absolute;
height: 15px;
width: 30px;
background: red;
clip-path: polygon(100% 0, 50% 100%, 0 0);
`;

const BG = styled.div`
position: absolute;
height: 15px;
width:30px;
background: blue; 
`;

const Relative = styled.div`
    position: relative;
`;

const T = styled.div`
position: absolute;
height: 15px;
width:30px;
overflow: hidden;
`;

export default function Test(props){

    useEffect(() => {
        
    }, []);
    return(
        <div>
            Testing
            <div>
                <table>
                    <tr>
                        <td>
                            <Relative>
                            <BG/>
                            <DownArrow>ONE</DownArrow>
                            <T>Click</T>
                            </Relative>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    );
}
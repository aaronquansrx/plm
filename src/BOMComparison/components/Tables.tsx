//basic tables
import {useState, useEffect, useRef} from 'react';

import update from 'immutability-helper';
import { Table } from 'react-bootstrap';

import { SelectCheckbox } from './Controls';

export type TableHeader<T extends Record<string, any>> = {
    accessor: keyof T, label: string
  }
  
  type DisplayRecordTableProps<T extends Record<string, any>> = {
    headers: TableHeader<T>[];
    data: T[];
  }
  
export function DisplayRecordTableHeader<T extends Record<string, any>>(props:{headers: TableHeader<T>[]}){
  return(
    <thead className='TableHeading'>
      <tr>
        {props.headers.map((h:TableHeader<T>, i) => 
        <th key={i}>
          {h.label}
        </th>
        )}
      </tr>
      </thead>
  );
}

export function DisplayRecordTable<T extends Record<string, any>>(props: DisplayRecordTableProps<T>){
  return(
    <Table>
      <DisplayRecordTableHeader headers={props.headers}/>
      <DisplayRecordTableBody {...props}/>
    </Table>
  );
}

export function DisplayRecordTableBody<T extends Record<string, any>>(props:DisplayRecordTableProps<T>){
  return(
    <tbody>
        {props.data.map((row: T, i) => 
          <tr key={i}>
            {props.headers.map((header: TableHeader<T>, j) => 
              <td key={j}>
                {row[header.accessor]}
              </td>
            )}
          </tr>
        )}
    </tbody>
  );
}

type DisplayTableProps = {
  data: string[][]
}
export function DataTable(props:DisplayTableProps){
  return(
    <>
      <Table>
      <DataTableBody {...props}/>
      </Table>
    </>
  );
}

export function DataTableBody(props:DisplayTableProps){
  return(
    <tbody>
      {props.data.map((row: string[], i) => 
        <tr key={i}>
          {row.map((cell:string, j) =>
            <td key={j}>{cell}</td>
          )}
        </tr>
      )}
    </tbody>
  )
}

type DataTableCheckboxBodyProps = DisplayTableProps & {
  onCheckboxToggle:(id:number|undefined) => void;
}

export function DataTableSingleCheckboxBody(props:DataTableCheckboxBodyProps){
  //const [checkboxState, setCheckboxState] = useState(props.data.map(() => false));
  const [checkboxId, setCheckboxId] = useState<number | undefined>(undefined);
  function handleChange(i:number){
    return function(){
      if(i == checkboxId){
        setCheckboxId(undefined);
        props.onCheckboxToggle(undefined);
      }else{
        setCheckboxId(i);
        props.onCheckboxToggle(i);
      }
    }
  }
  return(
    <tbody>
      {props.data.map((row: string[], i) => 
        <tr key={i}>
          <td><SelectCheckbox checked={i == checkboxId} onChange={handleChange(i)}/></td>
          {row.map((cell:string, j) =>
            <td key={j}>{cell}</td>
          )}
        </tr>
      )}
    </tbody>
  )
}

export function DataTableCheckboxBody(props:DataTableCheckboxBodyProps){
  const [checkboxState, setCheckboxState] = useState(props.data.map(() => false));
  function handleChange(i:number){
    return function(){
      setCheckboxState(update(checkboxState, {
        [i]: {$set: checkboxState[i]}
      }));
    }
  }
  return(
    <tbody>
      {props.data.map((row: string[], i) => 
        <tr key={i}>
          <td><SelectCheckbox checked={checkboxState[i]} onChange={handleChange(i)}/></td>
          {row.map((cell:string, j) =>
            <td key={j}>{cell}</td>
          )}
        </tr>
      )}
    </tbody>
  )
}


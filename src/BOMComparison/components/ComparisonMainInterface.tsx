import React, { useEffect, useMemo } from 'react';

import update from 'immutability-helper';

import { Button, Table } from "react-bootstrap";
import { BOMMainFormat, BOMUploadFormat, UploadBOMInterfaceNew, main_bom_format_headers } from "./BOMUpload";
import { useState } from "react";
import { DisplayRecordTable, DisplayRecordTableHeader} from './Tables';
import { Header, TableHeader } from '../table/types';
import { BOMMainFormatTable, BOMMainFormatTableProps } from './BOMTableFormats';
import { BOMComparison, BOMComparisonObject, BOMDifference, BOMSideBySideLine, ComparisonResult } from '../scripts/Comparison';
import { ObjectDropdown, SelectDropdown } from './Selectors';
import { ArrayFunctions } from '../scripts/general';


type ComparisonMainInterfaceProps = {

}

type ComparisonMainInterfaceState = {
  bom_old: BOMComparisonObject | undefined;
  bom_new: BOMComparisonObject | undefined;
}

enum MainInterfaceView{
    Main, UploadBOMOld, UploadBOMNew, BOMOldViewer, BOMNewViewer
}

// differenciates between old and new, -- can add other sides
enum BOMComparisonSide{
  Old, New
}

export function ComparisonMainInterface(props:ComparisonMainInterfaceProps){
  const [mainView, setMainView] = useState<MainInterfaceView>(MainInterfaceView.Main);
  const [comparisonState, setComparisonState] = useState<ComparisonMainInterfaceState>(
    {bom_new: undefined, bom_old: undefined}
  );
  function handleUpload(side:BOMComparisonSide){
    return function(file_name: string, main_format: BOMMainFormat[], upload_format: BOMUploadFormat[],
      main_headers:Header[]){
      function updateComparisonState(side_key:string){
        setComparisonState(update(comparisonState, {
          [side_key]: {$set: {file_name, main_format, upload_format, main_headers}}
        }));
      }
      switch(side){
        case BOMComparisonSide.Old:
          updateComparisonState('bom_old');
          break;
        case BOMComparisonSide.New:
          updateComparisonState('bom_new');
          break;
      }
    }
  }
  function handleChangeView(new_view:MainInterfaceView){
    setMainView(new_view);
  }
  function handleClickUploadOld(){
    handleChangeView(MainInterfaceView.UploadBOMOld)
  }
  function handleClickUploadNew(){

  }
  function renderView():JSX.Element{
    switch(mainView){
      case MainInterfaceView.Main:
        return <MainView 
        comparisonState={comparisonState}
        onChangeView={handleChangeView}
        />
      case MainInterfaceView.UploadBOMOld:
        return <>
        <UploadComparisonBOMInterface title={'Upload Old BOM'} 
        onUploadBOM={handleUpload(BOMComparisonSide.Old)} onChangeView={handleChangeView}/>
        </>
      case MainInterfaceView.UploadBOMNew:
        return <>
        <UploadComparisonBOMInterface title={'Upload New BOM'} 
        onUploadBOM={handleUpload(BOMComparisonSide.New)} onChangeView={handleChangeView}/>
        </>
      case MainInterfaceView.BOMOldViewer:
        return <>
          <BOMViewInterface title={'BOM Old View'} onChangeView={handleChangeView} mainView={MainInterfaceView.Main}
          comparison_object={comparisonState.bom_old} headers={main_bom_format_headers}/>
        </>
      case MainInterfaceView.BOMNewViewer:
        return <><BOMViewInterface title={'BOM New View'} onChangeView={handleChangeView} mainView={MainInterfaceView.Main}
        comparison_object={comparisonState.bom_old} headers={main_bom_format_headers}/>
        </>
    }
    return <></>;
  }
  return(
    <>
      {renderView()}
    </>
  );
}

type MainViewProps = {
  comparisonState: ComparisonMainInterfaceState;
  onChangeView: (new_view:MainInterfaceView) => void;
}

function MainView(props: MainViewProps){
  const [comparisonKey, setComparisonKey] = useState<keyof BOMMainFormat>();
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult>();
  const matching_headers: Header[] = useMemo(() => {
    if(props.comparisonState.bom_new !== undefined && props.comparisonState.bom_old !== undefined){
      const headers = ArrayFunctions.find_intersection(props.comparisonState.bom_old.main_headers, 
        props.comparisonState.bom_new.main_headers);
      return headers;
    }
    return [];
  }, [props.comparisonState]);
  useEffect(() => {
    if(matching_headers.length > 0){
      setComparisonKey(matching_headers[0].accessor as keyof BOMMainFormat);
    }
  }, [matching_headers]);
  useEffect(() => {
    setComparisonResult(undefined);
  }, [comparisonKey])
  function handleChangeComparisonKey(header:Header){
    setComparisonKey(header.accessor as keyof BOMMainFormat);
  }
  function showState(){
    console.log(props.comparisonState);
    console.log(comparisonKey);
  }
  function handleComparison(){
    if(props.comparisonState.bom_old && props.comparisonState.bom_new){
      const comparison_result = BOMComparison.compareMain(props.comparisonState.bom_old!, props.comparisonState.bom_new!, comparisonKey!);
      console.log(comparison_result);
      setComparisonResult(comparison_result);
    }
  }
  //use dropdown for key select 
  return(
  <>
  <div className='FlexNormal'>
    {/*<Button onClick={showState}>Test</Button>*/}
    <div>Choose Comparison Key</div>
    <div><ObjectDropdown items={matching_headers} onChange={handleChangeComparisonKey} item_key={'label'}/></div>
  <div className={'Hori'}>
    <div>
    <BOMInterface onChangeView={props.onChangeView} 
    uploadView={MainInterfaceView.UploadBOMOld}
    bomViewerView={MainInterfaceView.BOMOldViewer}
    bom={props.comparisonState.bom_old} title='BOM Old'/>
    </div>
    <div>
    <BOMInterface onChangeView={props.onChangeView} 
    uploadView={MainInterfaceView.UploadBOMNew}
    bomViewerView={MainInterfaceView.BOMNewViewer}
    bom={props.comparisonState.bom_new} title='BOM New'/>
    </div>
  </div>
  </div>
  <div className='FlexNormal'>
    <Button onClick={handleComparison}>Compare</Button>
  </div>
  <div>
    {<ComparisonResultTable headers={main_bom_format_headers} comparisonKey={comparisonKey} comparisonResult={comparisonResult}/>}
  </div>
  </>
  );
}

type ComparisonResultTableProps = {
  headers: TableHeader<BOMMainFormat>[];
  comparisonKey?: keyof BOMMainFormat;
  comparisonResult?: ComparisonResult

}

function ComparisonResultTable(props:ComparisonResultTableProps){
  const diffColour = '#d5eef2';
  const addColour = '#cae6cc';
  const subColour = '#e6caca';
  return (
    <>
    <Table>
      <ComparisonTableHeader headers={props.headers}/>
      <tbody>
        {props.comparisonResult && props.comparisonResult.different_lines.map((line, i) => {
          const get_key = line.new_line[props.comparisonKey as keyof BOMMainFormat];
          const find_line = props.comparisonResult?.differences.get(get_key as string);
          return <tr key={i}>
            {props.headers.map((header, j) => {
              const style = find_line?.has(header.accessor) ? {backgroundColor: diffColour} : {}
              return <td key={j} style={style}>
                {line.old_line[header.accessor]}
              </td>
            })}
            {props.headers.map((header, j) => {
              const style = find_line?.has(header.accessor) ? {backgroundColor: diffColour} : {}
              return <td key={j+props.headers.length} style={style}>
                {line.new_line[header.accessor]}
              </td>
            })}
          </tr>
        })}
        {props.comparisonResult && props.comparisonResult.additions.map((line, i) => 
          <tr key={i}>
            {props.headers.map((_, j) => 
              <td key={j} style={{backgroundColor: addColour}}>
              </td>
            )}
            {props.headers.map((header, j) => 
              <td key={j} style={{backgroundColor: addColour}}>
              {line[header.accessor]}
            </td>
            )}
          </tr>
        )}
        {props.comparisonResult && props.comparisonResult.subtractions.map((line, i) => 
          <tr key={i}>
            {props.headers.map((_, j) => 
              <td key={j} style={{backgroundColor: subColour}}>
              </td>
            )}
            {props.headers.map((header, j) => 
              <td key={j} style={{backgroundColor: subColour}}>
              {line[header.accessor]}
            </td>
            )}
          </tr>
        )}
      </tbody>
    </Table>
    </>
  )
}


function ComparisonResultTableRow(props:ComparisonResultTableProps){
  function renderAddSubtract(compResult:BOMMainFormat, ){

  }
  return (
    <>
    </>
  )
}

function ComparisonTableHeader(props: {headers: TableHeader<BOMMainFormat>[]}){
  return(<>
    <thead className='TableHeading'>
      <tr>
        <th colSpan={props.headers.length}>BOM Old</th>
        <th colSpan={props.headers.length}>BOM New</th>
      </tr>
      <tr>
      {props.headers.map((h:TableHeader<BOMMainFormat>, i) => 
        <th key={i}>
          {h.label}
        </th>
      )}
      {props.headers.map((h:TableHeader<BOMMainFormat>, i) => 
        <th key={i}>
          {h.label}
        </th>
      )}
      </tr>
    </thead>
  </>);
}

type BOMInterfaceProps = {
  title?:string;
  bom?: BOMComparisonObject;
  uploadView: MainInterfaceView;
  bomViewerView: MainInterfaceView;
  onChangeView: (new_view:MainInterfaceView) => void;
}

function BOMInterface(props:BOMInterfaceProps){
  function handleChangeView(view:MainInterfaceView){
    return function(){
      props.onChangeView(view);
    } 
  }
  return(
    <>
    <div><h4>{props.title}</h4></div>
    <div>{props.bom?.file_name}</div>
    <div>
    <Button onClick={handleChangeView(props.uploadView)}>Upload</Button>
    <Button onClick={handleChangeView(props.bomViewerView)}>View</Button>
    </div>
    </>
  )
}

export type UploadComparisonBOMInterfaceProps = {
  title?:string;
  onChangeView: (new_view:MainInterfaceView) => void;
  //onChangeView: (new_view:MainInterfaceView) => (() => void); // change to just regular function ? todo
  onUploadBOM: (file_name: string, main_format: BOMMainFormat[], upload_format:BOMUploadFormat[],
    upload_headers: Header[]) => void;
}

export function UploadComparisonBOMInterface(props:UploadComparisonBOMInterfaceProps){

  function handleUpload(file_name: string, main_format: BOMMainFormat[], upload_format:BOMUploadFormat[], 
    upload_headers: Header[]){
    props.onUploadBOM(file_name, main_format, upload_format, upload_headers);
    props.onChangeView(MainInterfaceView.Main);
  }
  function handleBack(){
    props.onChangeView(MainInterfaceView.Main);
  }
  return(
    <>
    {props.title}
    <Button onClick={handleBack}>Back</Button>
    <UploadBOMInterfaceNew
        onFinishUpload={handleUpload}/>
    </>
  )
}


type BOMViewInterfaceProps = BOMMainFormatTableProps & {
  onChangeView: (new_view:MainInterfaceView) => void;
  mainView: MainInterfaceView;
  title?: string
}

function BOMViewInterface(props:BOMViewInterfaceProps){
  return(
    <>
    <div>
      {props.title}
    </div>
    <Button onClick={() => props.onChangeView(props.mainView)}>Back</Button>
    <BOMMainFormatTable comparison_object={props.comparison_object} headers={props.headers}/>
    </>
  );
}


import React from 'react';

import update from 'immutability-helper';

import { Button } from "react-bootstrap";
import { BOMMainFormat, BOMUploadFormat, UploadBOMInterfaceNew } from "./BOMUpload";
import { useState } from "react";


type ComparisonMainInterfaceProps = {

}

interface BOMComparisonObject{
  upload_format: BOMUploadFormat[];
  main_format: BOMMainFormat[];
  file_name: string
}

function new_bom_comparison_object():BOMComparisonObject{
  return {
    upload_format: [],
    main_format: [],
    file_name: ''
  }
}

type ComparisonMainInterfaceState = {
  bom_old: BOMComparisonObject | undefined;
  bom_new: BOMComparisonObject | undefined;
}

enum MainInterfaceView{
    Main, UploadBOMOld, UploadBOMNew,
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
    return function(file_name: string, main_format: BOMMainFormat[], upload_format: BOMUploadFormat[]){
      function updateComparisonState(side_key:string){
        setComparisonState(update(comparisonState, {
          [side_key]: {$set: {file_name, main_format, upload_format}}
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
    return function(){
      setMainView(new_view);
    }
  }
  function renderView():JSX.Element{
    switch(mainView){
      case MainInterfaceView.Main:
        return <MainView 
        comparisonState={comparisonState}
        onClickUploadOld={handleChangeView(MainInterfaceView.UploadBOMOld)} 
        onClickUploadNew={handleChangeView(MainInterfaceView.UploadBOMNew)}
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
  onClickUploadOld:() => void;
  onClickUploadNew:() => void;
}

export function MainView(props: MainViewProps){
  
  function showState(){
    console.log(props.comparisonState);
  }
  return(
    <>
    <Button onClick={showState}></Button>
    BOM Old
    {props.comparisonState.bom_old?.file_name}
    <Button onClick={props.onClickUploadOld}>Upload</Button>
    BOM New
    {props.comparisonState.bom_new?.file_name}
    <Button onClick={props.onClickUploadNew}>Upload</Button>
    </>
  );
}

export type UploadComparisonBOMInterfaceProps = {
  title?:string;
  onChangeView: (new_view:MainInterfaceView) => (() => void); // change to just regular function ? todo
  onUploadBOM: (file_name: string, main_format: BOMMainFormat[], upload_format:BOMUploadFormat[]) => void;
}

export function UploadComparisonBOMInterface(props:UploadComparisonBOMInterfaceProps){

  function handleUpload(file_name: string, main_format: BOMMainFormat[], upload_format:BOMUploadFormat[]){
    props.onUploadBOM(file_name, main_format, upload_format);
    props.onChangeView(MainInterfaceView.Main)();
  }
  return(
    <>
    {props.title}
    <Button onClick={props.onChangeView(MainInterfaceView.Main)}>Back</Button>
    <UploadBOMInterfaceNew
        onFinishUpload={handleUpload}/>
    </>
  )
}
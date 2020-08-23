import React from 'react';
import {Button} from 'monday-ui-components';
import styled from "styled-components";

const ButtonComponent = styled(Button)`
  color: red;

`;

function MyButton(props) {
  return <ButtonComponent type={props.type} label={props.label} onClick={props.onClick} />
}

export default MyButton;

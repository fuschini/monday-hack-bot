import React from 'react';
import styled from "styled-components";


const InputComponent = styled.input`
  outline: none;
  color: red;
  padding: 12px 24px 12px 24px;

`;

function Input(props) {
  const {label, onClick, disabled = false, type = "primary"} = props;
  return (
    <InputComponent>

    </InputComponent>
  );
}

export default Input;

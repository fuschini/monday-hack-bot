import { ReactMic } from 'react-mic';
import React from "react";
import axios from 'axios';

import { TextField } from '@material-ui/core';
// import {Button} from './components';
import {Button} from 'monday-ui-components';
import "./styles/App.css";
import mondaySdk from "monday-sdk-js";
const FormData = require('form-data');
const monday = mondaySdk();


class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      query: "",
      record: false,
      audioPath: ""
    };

    this.submitForm = this.submitForm.bind(this);
  }

  startRecording = () => {
    this.setState({ record: true });
  }

  stopRecording = () => {
    this.setState({ record: false });
  }

  onData(recordedBlob) {
    console.log('chunk of real-time data is: ', recordedBlob);
  }

  onStop(recordedBlob) {
    console.log('recordedBlob is: ', recordedBlob);
    const reader = new FileReader();

    reader.readAsBinaryString(recordedBlob.blobURL);
  }

  async submitForm() {

    var res = await axios.post(`https://gsf586ygb7.execute-api.us-east-1.amazonaws.com/dev/`, {"text": this.state.query})
    console.log(res)
  }

  componentDidMount() {
    monday.listen("settings", res => {
      this.setState({ settings: res.data });
    });

    monday.listen("context", res => {
      this.setState({context: res.data});
      console.log(res.data);
      monday.api(`query ($boardIds: [Int]) { boards (ids:$boardIds) { name items(limit:1) { name column_values { title text } } } }`,
        { variables: {boardIds: this.state.context.boardIds} }
      )
      .then(res => {
        this.setState({boardData: res.data});
      });
    })
  }

  render() {
    return (
      <div
        className="App"
        >

        <div className="main-container">

          <TextField fullWidth id="standard-basic" label="Add a task" onChange={(event) => {this.setState({query: event.target.value})}} />
          <Button type="primary" label="Add task" onClick={this.submitForm} />

            <ReactMic
              record={this.state.record}
              className="sound-wave"
              visualSetting="sinewave"
              onStop={this.onStop}
              onData={this.onData}
              strokeColor="#0085FF"
              backgroundColor="#FFFFFF" />
            <Button type="primary" label="Start" onClick={this.startRecording} onTouchTap={this.startRecording} />
            <Button type="error" label="Stop" onClick={this.stopRecording} onTouchTap={this.stopRecording} />

              <input type="file" id="avatar" name="avatar" accept="audio/*" value={this.state.audioPath}></input>

        </div>

      </div>
    );
  }
}

export default App;

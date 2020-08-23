import { ReactMic } from 'react-mic';
import React from "react";
import axios from 'axios';
import { TextField, Button } from '@material-ui/core';
import "./App.css";
import mondaySdk from "monday-sdk-js";
const monday = mondaySdk();


class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      query: "",
      record: false
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

          <TextField fullWidth id="standard-basic" label="Query" onChange={(event) => {this.setState({query: event.target.value})}} />
          <Button variant="contained" color="primary" onClick={this.submitForm}>
            OK
          </Button>

        </div>

      </div>
    );
  }
}

export default App;

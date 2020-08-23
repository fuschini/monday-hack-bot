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
    var queryResultFields = res.data.queryResult.parameters.fields
    monday.api(`mutation ($boardId: Int!, $task: String!, $columnValues: JSON!){
        create_item(
          board_id: $boardId, 
          group_id: "topics", 
          item_name: $task,
          column_values: $columnValues) {
            id
        }
      }`, { variables: {boardId: this.state.context.boardIds[0],
        task: queryResultFields.any.listValue.values[0].stringValue,
        columnValues: JSON.stringify({ 
            data: {
              date: queryResultFields["date-time"].stringValue
            } ,
            person: {
              personsAndTeams:[{id:15660862, kind:"person"}]}
          }) 
        }}
    )
  }

  componentDidMount() {
    monday.listen("settings", res => {
      this.setState({ settings: res.data });
    });

    monday.listen("context", res => {
      this.setState({context: res.data});
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

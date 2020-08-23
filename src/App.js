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
    var userId = 0

    if(checkIsMine(queryResultFields)){
      var userData = await monday.api(`{ me { id } }`)
      userId = userData.data.me.id
    } else{
      userId = await getUserId(queryResultFields)
    }

    if(queryResultFields.any.listValue.values.length > 0){
      this.createItem(queryResultFields, userId)
      this.setState({message: "Success"});
    }else{
      this.setState({message: "Wooops"});
    }
  }

  createItem(queryResultFields, userId) {
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
            date: queryResultFields["date-time"].listValue.values[0].stringValue
          } ,
          person: {
            personsAndTeams:[{id:userId, kind:"person"}]}
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

        <div
        className="App" style={{background: (this.state.settings.background)}}
        >
        {JSON.stringify(this.state.message, null, 2)} 
      </div>

      </div>
    );
  }
}

function checkIsMine(result) {
  if(result.selfTask.stringValue){
    return true
  }
  else{
    return false
  }
}

async function getUserId(result){
  var usersData = await monday.api(`{
    users(kind: all) {
      id
      name
    }
  }`)

  var selectedUserData = usersData.data.users.filter(function (user) {
    return user.name.includes(result["given-name"].listValue.values[0].stringValue)
  })
  
  // if there is no user with inputted name, return id zero
  if(selectedUserData[0]){
    return selectedUserData[0].id
  }else{
    return 0
  }
}

export default App;

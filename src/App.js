import React from "react";
import axios from 'axios';

import { TextField } from '@material-ui/core';
// import {Button} from './components';
import {Button} from 'monday-ui-components';
import "./styles/App.css";
import mondaySdk from "monday-sdk-js";
import AudioAnalyser from "react-audio-analyser"
const monday = mondaySdk();

class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      query: "",
      record: false,
      audioPath: "",
      status: "",
      audioType: "audio/wav"
    };

    this.handleChange = this.handleChange.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  controlAudio(status) {
        this.setState({
            status
        })
    }

    changeScheme(e) {
        this.setState({
            audioType: e.target.value
        })
    }

  startRecording = () => {
    this.setState({ record: true });
  }

  stopRecording = () => {
    this.setState({ record: false });
  }

  handleChange(event) {
    this.setState({audioPath: event.target.value});
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
    const {status, audioSrc, audioType} = this.state;
        const audioProps = {
            audioType,
            // audioOptions: {sampleRate: 30000}, // 设置输出音频采样率
            status,
            audioSrc,
            timeslice: 1000, // timeslice（https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start#Parameters）
            backgroundColor: '#ffffff',
            strokeColor: '#0085FF',
            startCallback: (e) => {
                console.log("succ start", e)
            },
            pauseCallback: (e) => {
                console.log("succ pause", e)
            },
            stopCallback: async (blob) => {
                // this.setState({
                //     audioSrc: window.URL.createObjectURL(e)
                // })
                console.log("succ stop", blob)
                var formData = new FormData();
                formData.append("audio", blob);

                var res = await axios.post(`https://gsf586ygb7.execute-api.us-east-1.amazonaws.com/dev/`, formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data'
                  }
                })
                console.log(res)
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
            },
            onRecordCallback: (e) => {
                console.log("recording", e)
            },
            errorCallback: (err) => {
                console.log("error", err)
            }
        }
    return (
      <div
        className="App"
        >

        <div className="main-container">

          <TextField fullWidth id="standard-basic" label="Add a task" onChange={(event) => {this.setState({query: event.target.value})}} />
          <Button type="primary" label="Add task" onClick={this.submitForm} />


              <AudioAnalyser {...audioProps}>
                        <div className="btn-box">
                            {status !== "recording" &&

                           <Button type="primary" label="Start" onClick={() => this.controlAudio("recording")} onTouchTap={this.startRecording} />
                         }
                            {status === "recording" &&
                            <i className="iconfont icon-pause" title="暂停"
                               onClick={() => this.controlAudio("paused")}></i>}
                             <Button type="error" label="Stop" onClick={() => this.controlAudio("inactive")} />
                        </div>
                    </AudioAnalyser>

                    <div
                      className="feedback" style={{background: (this.state.settings.background)}}
                      >
                      {JSON.stringify(this.state.message, null, 2)}
                    </div>
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

import React from "react";
import axios from 'axios';

import { TextField } from '@material-ui/core';
// import {Button} from './components';
import {Button} from 'monday-ui-components';
import "./styles/App.css";
import mondaySdk from "monday-sdk-js";
import AudioAnalyser from "react-audio-analyser"
import { Mic } from '@material-ui/icons';
import { css } from "@emotion/core";
import { ScaleLoader } from "react-spinners";
const monday = mondaySdk();

const override = css`
  display: block;
  margin: 0 auto;
`;

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
      audioType: "audio/wav",
      loading: true,
      btnIcon: 'mic',
      message: 'Hold the button and start speaking to add a task to your board.',
      displayTextInput: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.toggleTextInput = this.toggleTextInput.bind(this);
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
      this.setState({message:  "Success"});
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

  toggleTextInput() {
    if (this.displayTextInput) {
      this.setState({displayTextInput: false})
    } else {
      this.setState({displayTextInput: true})
    }
  }

  render() {
    const {status, audioSrc, audioType, btnIcon, displayTextInput} = this.state;
        const audioProps = {
            audioType,
            // audioOptions: {sampleRate: 30000}, // 设置输出音频采样率
            status,
            audioSrc,
            timeslice: 1000, // timeslice（https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start#Parameters）
            backgroundColor: '#ffffff',
            width: window.screen.width,
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

                this.setState({btnIcon: "loading", message: "Processing audio..."});

                try {
                  var res = await axios.post(`https://gsf586ygb7.execute-api.us-east-1.amazonaws.com/dev/`, formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data'
                    }
                  })
                  console.log(res)

                  if (res.data.queryResult.intent.name === 'projects/mondayhackathon-qlor/agent/intents/277395df-5e10-44be-a017-9620cbef0e4e') {

                    var queryResultFields = res.data.queryResult.parameters.fields
                    var userId = 0

                    if(checkIsMine(queryResultFields)){
                      var userData = await monday.api(`{ me { id } }`)
                      userId = userData.data.me.id
                    } else {
                      userId = await getUserId(queryResultFields)
                    }

                    if (queryResultFields.any.listValue.values.length > 0) {
                      this.createItem(queryResultFields, userId)
                    }

                  }

                  this.setState({message: res.data.queryResult.fulfillmentText});

                  this.setState({btnIcon: "mic"});

                } catch (err) {
                  console.log(err)
                  this.setState({btnIcon: "mic"});
                  this.setState({message: "Something went wrong... Try again or check the logs."});
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
      <div className="App">

        <div className="main-container">

          <div className="feedback">
            {this.state.message}
          </div>

          <button id="test" className="recordingButton" onMouseDown={() => this.controlAudio("recording")} onMouseUp={ () => {this.controlAudio("inactive"); document.activeElement.blur()} }>
              <div className="btnIconWrapper">
                {btnIcon === 'loading' &&
                  <ScaleLoader
                    css={override}
                    color={"#ffffff"}
                    height={70 + 22}
                    width={15}
                    loading={this.state.loading}
                    />
                }

                {btnIcon === 'mic' && <Mic className="micIcon" />}
              </div>
            </button>

          <AudioAnalyser {...audioProps}></AudioAnalyser>


          {displayTextInput ?
            <div className="textInputWrapper">
              <TextField fullWidth id="standard-basic" label="Add a task" onChange={(event) => {this.setState({query: event.target.value})}} />

              <div className="textBtnWrapper">
                <Button type="primary" label="Add&nbsp;task" onClick={this.submitForm} />
              </div>
            </div> : ''
          }

        </div>

        <div className="footer">
          <button  className="secondaryButton" onClick={() => this.toggleTextInput()} >Text&nbsp;input</button>
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
    var fullName = result["given-name"].listValue.values[0].stringValue.trim().concat(' ',result["last-name"].listValue.values[0].stringValue.trim())
    console.log("actual: ")
    console.log(user.name)
    console.log("expected: ")
    console.log(fullName)
    console.log(user.name == fullName)
    return user.name == fullName
  })

  // if there is no user with inputted name, return id zero
  if(selectedUserData[0]){
    return selectedUserData[0].id
  }else{
    return 0
  }
}

export default App;

import { ReactMic } from 'react-mic';
import React from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
const monday = mondaySdk();

class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      name: "",
      record: false
    };
  }

  handleClick() {    
    monday.api(`mutation {
        create_item(board_id: 704514125, group_id: "topics", item_name: "teste rola") {
          id
        }
      }`
    )
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

  componentDidMount() {
    monday.listen("settings", res => {
      this.setState({ settings: res.data });
    });

    monday.listen("context", res => {
      this.setState({context: res.data});
      console.log(res.data);
    })
  }

  render() {
    return (
      <div
        className="App" style={{background: (this.state.settings.background)}}
        >

        fusca

        <div>
          <ReactMic
            record={this.state.record}
            className="sound-wave"
            onStop={this.onStop}
            onData={this.onData}
            strokeColor="#000000"
            backgroundColor="#FF4081" />
          <button onClick={this.startRecording} type="button">Start</button>
          <button onClick={this.stopRecording} type="button">Stop</button>
        </div>

        {JSON.stringify(this.state.boardData, null, 2)}

        <button onClick={this.handleClick}>        
          {"Criar"}
        </button>
      </div>
    );
  }
}

export default App;

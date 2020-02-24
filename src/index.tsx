import * as React from "react";
import * as ReactDOM from "react-dom";
import { saveAs } from '@progress/kendo-file-saver';
import "./style.scss"
import {createRef, TextareaHTMLAttributes} from "react";

class GpxGen extends React.Component<any, any>{
  contentRef = createRef<HTMLTextAreaElement>()

  state = {
    content: "{}"
  }
  platform = "iOS"

  constructor(props: any) {
    super(props)
  }

  readFile(f: File) {
    var reader = new FileReader();
    reader.onload = () => {
      var text = reader.result;
      this.setState({
        content: text
      })
    };
    reader.readAsText(f);
  }

  onContentChanged(t: React.ChangeEvent<HTMLTextAreaElement>) {
    this.setState({
      content: t.target.value
    })
  }

  contentChanged(ev: React.DragEvent<HTMLTextAreaElement>){
    ev.preventDefault()
    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === 'file') {
          var file = ev.dataTransfer.items[i].getAsFile();
          this.readFile(file)
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.files.length; i++) {
        console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
      }
    }
  }

  createGPX(content: string) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<gpx 
  xmlns="http://www.topografix.com/GPX/1/1" 
  xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" 
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" 
  creator="SuaLe" 
  version="1.1"
>  
  ${content}
</gpx>`
  }

  createGPXAndroid(content: string, name: string, time: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.0"
     creator="SuaLe"
     xmlns="http://www.topografix.com/GPX/1/0"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd">
<name>${name}</name>
<time>${time}</time>

<trk>
 <name>${name}</name>
 <trkseg>
  ${content}
 </trkseg>
</trk>
</gpx>`
  }

  process(input: any) {
    let name = (input.name || "route").replace(/ /g,"_")
    let array = input.data;
    let startTime = "";
    let content = "";
    var index = 0;
    for (var e of array) {
      index += 1
      let timestamp = Math.round(e.timestamp / 1000) * 1000;
      let node = ""
      startTime = `${new Date(timestamp + 3000).toJSON().substring(0, 19) + "Z"}`
      if (this.platform == "android") {
        node = `
<trkpt lat="${e.lat}" lon="${e.lng}"><ele>0.000</ele><time>${new Date(timestamp).toJSON().substring(0, 19) + "Z"}</time></trkpt>
`
      } else {
        node = `
  <wpt lat="${e.lat}" lon="${e.lng}">
    <name>${name + index}</name>    
    <time>${new Date(timestamp).toJSON().substring(0, 19) + "Z"}</time>
  </wpt>       
`
      }
      content += node;
    }
    if (this.platform == "android") {
      let blob = new Blob([this.createGPXAndroid(content, name, startTime)], {type: "text/plain;charset=utf-8"});
      saveAs(blob, name + ".gpx")
    } else {
      let blob = new Blob([this.createGPX(content)], {type: "text/plain;charset=utf-8"});
      saveAs(blob, name + ".gpx")
    }
  }


  onExecute(t: React.MouseEvent<HTMLInputElement, MouseEvent>) {
    this.process(JSON.parse(this.contentRef.current.value))
  }

  platformChanged(t: any) {
    this.platform = t.target.value;
  }

  render() {
    return (
      <div>
        <h2>GPX Generates</h2>
        <div>
          <textarea value={this.state.content}
                    onDrop={this.contentChanged.bind(this)}
                    ref={this.contentRef}
                    onChange={this.onContentChanged.bind(this)}
                    style={{width: 400, height: 300}} />
        </div>
        <br/>
        <div>
          <input type={"radio"} name={"platform"} id={"Android"} value={"android"} onChange={this.platformChanged.bind(this)} /><label htmlFor={"Android"}>Android</label>
          <input type={"radio"} name={"platform"} value={"ios"} defaultChecked={true} id={"iOS"} onChange={this.platformChanged.bind(this)}/><label htmlFor={"iOS"}>iOS</label>
        </div>
        <br/>
        <div>
          <input type={"button"} value={"Execute"} onClick={this.onExecute.bind(this)}/>
        </div>
      </div>
    )
  }

  componentDidMount(){
  }
}

ReactDOM.render(<GpxGen />, document.getElementById("root"))

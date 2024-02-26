import React, { useEffect, useRef, useState } from "react";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";
import { ACTIONS } from "../Actions";
import Select from 'react-select';
import Axios from 'axios';



 

function Editor({ socketRef, roomId, onCodeChange }) {
  const editorRef = useRef(null);
  const [userCode, setUserCode] = useState("");
   const [userLang, setUserLang] = useState("python");
   const [userInput, setUserInput] = useState("");
   const [userOutput, setUserOutput] = useState("");
   const [loading, setLoading] = useState(false);
  useEffect(() => {
    const init = async () => {
      const editor = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );
      // for sync the code
      editorRef.current = editor;

      editor.setSize(null, "100%");
      editorRef.current.on("change", (instance, changes) => {
        // console.log("changes", instance ,  changes );
        const { origin } = changes;
        const code = instance.getValue(); // code has value which we write
        onCodeChange(code);
        setUserCode(code);
        
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });
    };

    init();
  }, []);


  


  // data receive from server
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          // console.log(code)
          editorRef.current.setValue(code);
          console.log(userCode);
        }
      });
    }
    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  function compile() {
    setUserOutput("");
    setLoading(true);
    // Post request to compile endpoint
    Axios.post(`http://localhost:5000/compile`, {
        code: userCode,
        language: userLang,
        input: userInput
    }).then((res) => {
      //  console.log(res.data);
        setUserOutput(res.data.output);
    }).then(() =>{
      setLoading(false);
    })
    // console.log(userCode);
}


	const languages = [
		{ value: "c", label: "C" },
		{ value: "cpp", label: "C++" },
		{ value: "python", label: "Python" },
		{ value: "java", label: "Java" },
	];
  return (
    <>
    <div className="main" style={{display:"flex", height:"100vh"}}>
    <div className="top">
    <div className="nav">
    <Select options={languages} value={userLang}
				onChange={(e) => setUserLang(e.value)}
				placeholder={userLang} className="select" 
        styles={{
          option: (provided,state) =>({...provided,backgroundColor: "black", cursor: "pointer"}),
          control: (provided, state) =>({...provided,height: "4vh"})
        }}
        />
        <button className="run" onClick={() => compile()}>RUN</button>
    </div>
    <div style={{ height: "100vh", width:"100%" }}>
      <textarea id="realtimeEditor"></textarea>
    </div>
</div>
    <div className="right-container" style={{padding: "2px 16px"}}>
            <h4>Input:</h4>
            <div className="input-box">
                <textarea id="code-inp" style={{height:"40vh",width:"18vw", border:"none"}}
                onChange=
                    {(e) => setUserInput(e.target.value)}>
                </textarea>
            </div>
            <h4>Output:</h4>
            {loading ? (
              
                <div className="spinner-box" style={{height:"46vh"}}>
                    <img src="../../spin.gif" alt="Loading..." />
                    <pre>{userOutput}</pre>
                </div>
            ) : (
                <div className="output-box">
                <pre>{userOutput}</pre>
                    
                </div>
            )}
        </div>
    </div>
    </>
  );
}

export default Editor;

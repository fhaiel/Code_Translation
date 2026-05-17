import './App.css';
import Select from "react-select";
import { useState, useRef, useEffect, useCallback } from 'react';
import 'prismjs';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript'; // For JS highlighting
import 'prismjs/components/prism-javascript'; // Import language support
import 'prismjs/components/prism-java';
import 'prismjs/themes/prism.css'; // Optional: import Prism theme
import { EditorView } from '@codemirror/view';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faCopy, faDownload, faCheck } from '@fortawesome/free-solid-svg-icons';
import ExampleProblems from './components/ExampleProblems.tsx';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (
  process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000'
    : 'https://backend-code-to-code-translation-kabul-238165955840.europe-west1.run.app'
);

// Language options for the dropdowns
const language_options = [
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'c++', label: 'C++' },
];

function App() {
  const [loading, set_loading] = useState(false);
  const [input_language, set_input_language] = useState(language_options[0]);
  const [output_language, set_output_language] = useState(language_options[1]);
  const [code, set_code] = useState('');
  const [translated_code, set_translated_code] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [controller, setController] = useState(null);

  // Create a ref to the hidden file input
  const file_input_ref = useRef(null);

  // Handle language selection changes
  const handle_input_language_change = (selected_option) => {
    set_input_language(selected_option);
  }

  const handle_output_language_change = (selected_option) => {
    set_output_language(selected_option);
  };

  // Swap input and output languages 
  const handle_switch_languages = () => {
    const temp = input_language;
    set_input_language(output_language);
    set_output_language(temp);
  };

  // Handle file selection for uploading
  const handle_file_upload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => set_code(e.target.result);
      reader.readAsText(file);
    }
  };

  // Copy translated code to clipboard
  const handle_copy = () => {
    navigator.clipboard.writeText(translated_code)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Unable to copy to clipboard.', err);
        setCopySuccess(false);
      });
  };

  // Download translated code as a file
  const handle_download = () => {
    const blob = new Blob([translated_code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Set file extension based on output language
    if (output_language.value === 'java') {
      link.download = 'translated_code.java';
    }
    else if (output_language.value === 'python') {
      link.download = 'translated_code.py';
    }
    else if (output_language.value === 'c++') {
      link.download = 'translated_code.cpp';
    }

    link.click();
    URL.revokeObjectURL(url);
  };

  // Trigger file input when the upload button is clicked
  const handle_upload_click = () => {
    file_input_ref.current.click();
  };

  // Handle stopping the translation process
  const handle_stop = () => {
    controller.abort();
    setController(new AbortController());
    set_loading(false);
  };

  // Handle API request for code translation
  const handle_translate = useCallback(async () => {
    if (!input_language) {
      alert('Please select a input language!');
      return;
    }
    if (!output_language) {
      alert('Please select a output language!');
      return;
    }
    if (!code) {
      alert('Please provide code to translate!');
      return;
    }

    set_loading(true); // Show loading state
    set_translated_code(''); // Clear previous translation

    try {

      // Abort previous request if it exists
      if (controller) {
        controller.abort();
      }

      // Create a new AbortController
      const newController = new AbortController();
      setController(newController);

      const response = await fetch(`${API_BASE_URL}/api/translate-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          target_language: output_language.value,
          input_language: input_language.value,
        }),
        signal: newController.signal,
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        // Decode and append the streamed content
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          set_translated_code((prev) => prev + chunk); // Update the state
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Translation request was aborted by the user.');
      } else {
        console.error('Error during translation:', error);

        // If response exists, log details
        if (error.response) {
          const text = await error.response.text();
          console.error("Server response:", text);
        }

        alert('An error occurred while translating the code.');
      }
    } finally {
      set_loading(false); // Hide loading state
      setController(null); // Reset the controller
    }
  }, [code, input_language, output_language]);

  // Handle keyboard shortcut (Ctrl + Enter) for translation
  useEffect(() => {
    const handle_keyboard_translate = (event) => {
      // Check for Ctrl+Enter key combination
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault(); // Prevent default behavior
        handle_translate(); // Trigger translation
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handle_keyboard_translate);

    // Clean-up event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handle_keyboard_translate);
    };
  }, [handle_translate]);

  // Handle selecting an example problem
  const handleExampleSelect = (code, language) => {
    set_code(code);
    // Find and set the corresponding language option
    const selectedLanguage = language_options.find(option =>
      option.value.toLowerCase() === language.toLowerCase()
    );
    if (selectedLanguage) {
      set_input_language(selectedLanguage);
    }
  };

  // Handle theme-switching
  const handle_mode_switch = () => {
    const rootElement = document.documentElement;
    rootElement.classList.toggle('whitemode');
  };

  return (
    <body>
      <button onClick={handle_mode_switch} id="theme-switch">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z" /></svg>
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M480-280q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Z" /></svg>
      </button>

      <div className="app">
        <h2>Code Translator</h2>

        <div className="language_selection">
          <Select
            options={language_options}
            value={input_language}
            onChange={handle_input_language_change}
            placeholder="Select input language"
            className="language_dropdown"
          />
          <button onClick={handle_switch_languages} className="switch_button">⇄</button>
          <Select
            options={language_options}
            value={output_language}
            onChange={handle_output_language_change}
            placeholder="Select output language"
            className="language_dropdown"
          />
        </div>

        <div className="container">
          {/* Left Section (Code Input + Upload Button) */}
          <div className="code_section_container left_section">
            <CodeMirror
              value={code}
              height="500px"
              className="code_section"
              extensions={[javascript(),
              EditorView.theme({ '&.cm-editor': { textAlign: 'left' }, })
              ]}
              theme={'dark'}
              basicSetup={{
                lineNumbers: true,
              }}
              onChange={set_code}
              placeholder="Input your code here"
            />
            <div className="section_buttons">
              <div className="tooltip">
                <button onClick={handle_upload_click} className="upload_button">
                  <FontAwesomeIcon icon={faUpload} />
                </button>
                <span className="tooltip_text">Upload</span>
              </div>
            </div>
          </div>

          {/* Middle translate button */}
          <div className="translate_button_container">

            {!loading && (<button
              onClick={handle_translate}
              className="translate_button"
            >
              Translate
            </button>
            )}

            {/* Stop-Button (wird nur angezeigt, wenn loading === true) */}
            {loading && (
              <button
                onClick={handle_stop}
                className="stop_button"
              >
                Stop Translation
              </button>
            )}
          </div>

          {/* Right Section (Translated Code + Copy/Download Buttons) */}
          <div className="code_section_container right_section">
            <CodeMirror
              value={translated_code}
              height="500px"
              className="code_section"
              extensions={[javascript(),
              EditorView.theme({ '&.cm-editor': { textAlign: 'left' }, })
              ]}
              theme={'dark'}
              options={{
                lineNumbers: true,
              }}
              readOnly={true}
              placeholder="Translated code will appear here"
            />
            <div className="section_buttons">
              <div className="tooltip">
                <button onClick={handle_copy} className={`copy_button ${copySuccess ? 'copied' : ''}`}>
                  <FontAwesomeIcon icon={copySuccess ? faCheck : faCopy} />
                </button>
                <span className="tooltip_text">Copy</span>
              </div>
              <div className="tooltip">
                <button onClick={handle_download} className="download_button">
                  <FontAwesomeIcon icon={faDownload} />
                </button>
                <span className="tooltip_text">Download</span>
              </div>
            </div>
          </div>
        </div>

        <ExampleProblems onSelectExample={handleExampleSelect} />

        {/* Hidden file input */}
        <input
          ref={file_input_ref}
          type="file"
          onChange={handle_file_upload}
          style={{ display: 'none' }}
        />
      </div>

    </body>
  );
}


export default App;

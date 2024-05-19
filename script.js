let port;
let thickness = 5
let readerWork = true
let reader;
let lastClickTime = 0;
let flag=false

async function connectButton() {
    try {
        console.log('in Connect');
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        document.querySelectorAll('button').forEach(button => {
            button.disabled = false;
        });

        readLoop();
        document.getElementById('connectButton').disabled = true;


    } catch (error) {
        console.error('Failed to open serial port:', error);
    }
};

async function disconnectButton() {
    console.log('in disConnect');

    try {
        if (port && port.readable) {
            try {
                readerWork = false;
                await reader.cancel();
            } catch (error) {
                console.log("disconnect error: ", error)
            }
            await port.close();
        }

        document.querySelectorAll('.sendButton').forEach(button => {
            button.disabled = true;
        });

        document.getElementById('connectButton').disabled = false;

    } catch (error) {
        console.error('Failed to close serial port:', error);
    }

};

async function readLoop() {

    try {
        let receivedData = '';
        
        while (port && port.readable && readerWork) {
            reader = port.readable.getReader();
            try {
                
                while (readerWork) {

                    const { value, done } = await reader.read();
                    if (done) { break; }

                    receivedData += new TextDecoder().decode(value, { stream: true }); // Use stream option to handle large amounts of data
                    const lines = receivedData.split('\n');
                    console.log("lines: ", lines);


                    for (let i = 0; i < lines.length - 1; i++) {
                        try {
                            const line = lines[i];
                            console.log(">line>> " + line)

                            if (/^p:([0-9]{1,4}).*/.test(line)) {
                                /*
                                 // Split the string into parts based on '/'
                                let parts = line.split('/');
    
                                // Extract the integers from the parts
                                const progress = parseInt(parts[0].split(':')[1], 10);
                                const totel = parseInt(parts[1], 10); 

                                handleProgress(progress, totel);
                                */
                            } else {
                                
                                const jsonData = JSON.parse(line);
                                console.log("JSON data:", jsonData);
                                document.getElementsByClassName("result_container")[0].innerHTML += `<p>${JSON.stringify(jsonData)}</p>`;
                                //document.getElementById("result").textContent += JSON.stringify(jsonData);
                                flag= false;
                            }
                        } catch (error) {
                            console.error('Error parsing JSON:', error);
                        }
                    }


                    // Keep the incomplete line for the next iteration
                    receivedData = lines[lines.length - 1];
                }

            } finally {
                reader.releaseLock();
            }
        }
    } catch (error) {
        console.error('Error reading from serial port:', error);
    }
}


document.getElementById("whiteLed_button").addEventListener("click", function () {
    event.preventDefault();
    this.classList.toggle("on");
    this.classList.toggle("off");
    this.textContent = this.classList.contains("on") ? "White LEDs OFF" : "White LEDs ON";
});

document.getElementById("blueLed_button").addEventListener("click", function () {
    event.preventDefault();
    this.classList.toggle("on");
    this.classList.toggle("off");
    this.textContent = this.classList.contains("on") ? "Violet LEDs OFF" : "Violet LEDs ON";
});

document.getElementById("sensativity_button").addEventListener("click", function () {
    event.preventDefault();
    this.classList.toggle("HIGH");
    this.classList.toggle("LOW");
    this.textContent = this.classList.contains("HIGH") ? "LOW" : "HIGH";
});


async function send_Integration_Time() {
    const value = document.getElementById('Integration_Input').value;
    console.log("value " + value);
    send(7, value);
}


async function send(message) {
    console.log("send");
    try {
        if (!port || !port.writable) { throw new Error('Serial port not open'); }
        console.log("send 1");
        
        let writer = await port.writable.getWriter();
        
        console.log("send 2");
        await writer.write(new TextEncoder().encode(message));
        console.log("send 3");
        await writer.releaseLock();
        console.log("send 4");
    } catch (error) {
        console.error('Failed to write to serial port:', error);
    }
}

  
//-------- result copy ---------

function clearText() {
   // document.querySelector('.result_container p').innerText="";
    document.getElementsByClassName("result_container")[0].innerHTML="";
}

function copyText() {
    var text = document.getElementsByClassName("result_container")[0].innerHTML;

    text = text.replace(/<p>/g, "").replace(/<\/p>/g, "\n");
 

    //var text = document.querySelector('.result_container p').innerText;
    navigator.clipboard.writeText(text).then(function () {
        console.log('Text copied to clipboard');
      //  var icon = document.querySelector('.material-symbols-outlined');
        var icon = document.querySelector('.copyText');
        //icon.innerText = 'done'; // Replace with "done" icon
        icon.style.backgroundColor = 'rgb(139, 212, 173)'; // Set color to green
        lastClickTime = Date.now();
        setTimeout(function () {
           // icon.innerText = 'content_copy'; // Restore "copy" icon
            icon.style.backgroundColor = '#007bff'; // Restore color
        }, 5000); // Reset after 5 seconds
    }, function (err) {
        console.error('Could not copy text: ', err);
    });
}


function handle_mouseover() {
    var icon = document.querySelector('.material-symbols-outlined');
    if (Date.now() - lastClickTime < 5000) { return; }
    icon.style.color = 'blue';
}


function handle_mouseout() {
    var icon = document.querySelector('.material-symbols-outlined');
    if (Date.now() - lastClickTime < 5000) { return; }
    icon.style.color = '#333';
}

//----------------------------


document.getElementById("startTestButton").addEventListener("click",async function () {
    event.preventDefault();

    // Serialize form data to JSON
    const formData = new FormData(document.getElementById("controlForm"));
    const json = {};

    // Add state of whiteLed_button to JSON
    const whiteLedButton = document.getElementById("whiteLed_button");
    const isWhiteLedOn = whiteLedButton.classList.contains("on");
    json["whiteLeds"] = isWhiteLedOn ? 0 : 1;

    // Add state of blueLed_button to JSON
    const blueLedButton = document.getElementById("blueLed_button");
    const isBlueLedOn = blueLedButton.classList.contains("on");
    json["blueLeds"] = isBlueLedOn ? 0 : 1;

    // Add state of sensativity_button to JSON
    const sensativityButton = document.getElementById("sensativity_button");
    const isHighSensativity = sensativityButton.classList.contains("HIGH");
    json["sensativity"] = isHighSensativity ? "LOW" : "HIGH";


    json["tg"] = parseInt(document.getElementById("Integration_Input").value);
    let numOfSample=parseInt(document.getElementById("numOfSamples_Input").value);
    json["num_of_sample"] = 1//parseInt(document.getElementById("numOfSamples_Input").value);

    const jsonString = JSON.stringify(json);
    // Assuming you have a function sendJsonOverSerial(jsonString) to send the JSON over serial
    startProgressBar();
    
    for (let i = 0; i < numOfSample; i++) {
        handleProgress(i+1, numOfSample+1);
        console.log("i " ,i)
        await send(jsonString);
        
        flag=true;
        
        while(flag){
            
            if ( i===0){ 
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (flag ){  await send(jsonString);}
            }
            else {await new Promise(resolve => setTimeout(resolve, 100));}
            
        }
    }

    closeProgressBar();


});


//-----------------------------------------------------------


function startProgressBar() {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'flex';
    progress = 0;
   // updateProgressBar();
}

function closeProgressBar() {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.display = 'none';
}

function handleProgress(data, total) {
    const progressBar = document.getElementById('progress');
    progressBar.value = (data / total) * 100;
   /* if (data + 1 >= total) {
        closeProgressBar();
    }*/
}



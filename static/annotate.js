// 'use strict';

let endTimestampMap = {};
let newStartTimestampMap = {};
// currentEditingTableRowIndex != getCurrentTableRowIndex()
// It's the row which you clicked
let currentEditingTableRowIndex = 1;  // 0 is the table header


google.charts.load('current', {'packages':['timeline']});
google.charts.setOnLoadCallback(drawChart);

// I couldn't embed a Map into a JSON. Fall back to a dictionary
// let endTimestampMap = new Map();

function getCurrentTableRowIndex(tableId="annotation-table") {
  const table = document.getElementById(tableId);
  // Add epsilon for getting the curront tab
  const currentTime = video.currentTime;

  let rowIndicesBeforeCurrentTime = [];
  for (let i = 1, row; row = table.rows[i]; i++) {
    let diff = Number(currentTime - row.cells[7].innerHTML);
    if (diff >= 0) {
      rowIndicesBeforeCurrentTime.push(i);
    } else {
      // break;
    }
  }
  if (rowIndicesBeforeCurrentTime.length === 0) {
    return -1
  }

  return  rowIndicesBeforeCurrentTime[rowIndicesBeforeCurrentTime.length - 1];
}


function saveData() {
  if (confirm("Do you want to save?")) {
  // Reference: https://dev.to/healeycodes/talking-to-python-from-javascript-and-back-again-31jf
  // POST
  const video_id = document.getElementById("video_id").innerHTML;
  const annotator_id = document.getElementById("annotator_id").innerHTML;
  fetch('/annotate-video='+video_id+'-annotator='+annotator_id, {
    // Specify the method
    method: 'POST',
    // JSON
    headers: {
      'Content-Type': 'application/json'
    },
    // A JSON payload
    body: JSON.stringify({
      "rowIndex_newstart": newStartTimestampMap,
      "rowIndex_end": endTimestampMap,
    })
  }).then(function (response) { // At this point, Flask has printed our JSON
    return response.text();
  }).then(function (text) {
    console.log('POST response: ');
    // Should be 'OK' if everything was successful
    console.log(text);
  });}
}


function colorTableRow() {
  let currentRowIndex = getCurrentTableRowIndex();
  // console.log("CurrentRowIndex: " + currentRowIndex);
  
  if (currentRowIndex < 0) { return; }
  
  clearTableColors(currentRowIndex);
  
  const table = document.getElementById("annotation-table");
  const emotion = table.rows[currentRowIndex].cells[3].innerHTML;

  switch (emotion) {
    case 'cuteness' :
      table.rows[currentRowIndex].className = 'cuteness';
      break;
    case 'startle' :
      table.rows[currentRowIndex].className = 'startle';
      break;
    case 'surprise' :
      table.rows[currentRowIndex].className = 'surprise';
      break;
    case 'frustration' :
        table.rows[currentRowIndex].className = 'frustration';
        break;
    case 'happiness' :
      table.rows[currentRowIndex].className = 'happiness';
      break;
    case 'excitement' :
        table.rows[currentRowIndex].className = 'excitement';
        break;
    case 'relief' :
        table.rows[currentRowIndex].className = 'relief';
        break;
    case 'wonder' :
        table.rows[currentRowIndex].className = 'wonder';
        break;
    case 'amusement' :
        table.rows[currentRowIndex].className = 'amusement';
        break;
    case 'insight_fiero' :
      table.rows[currentRowIndex].className = 'insight_fiero';
      break;
    case 'moved' :
        table.rows[currentRowIndex].className = 'moved';
        break;
    case 'puzzlement' :
      table.rows[currentRowIndex].className = 'puzzlement';
      break;
    case 'na' :
      table.rows[currentRowIndex].className = 'na';
      break;
    default:
      console.log("Unknown emotion: "+ emotion);
      break;
  }
  // table.rows[currentRowIndex].className = 'current-row'

}

function clearTableColors(upperIndexBound=-1) {
  const table = document.getElementById("annotation-table");
  
  if (upperIndexBound < 0) {
    upperIndexBound = table.rows.length;
  }
  for (let i = 0; i < upperIndexBound; i++) {
    table.rows[i].className = "";  
  }
}

function round(x) {
  return Math.round(x * 100) / 100
}


function markEndTimestamp() {
  // Update timestamp dict
  // let currentRowIndex = getCurrentTableRowIndex();
  // if (currentRowIndex < 0) {
  //   console.log("No emotion for the current time. Not marking end time.")
  //   return false;
  // }

  let endTime = round(video.currentTime);
  const table = document.getElementById("annotation-table");
  const currentRow = table.rows[currentEditingTableRowIndex];
  
  currentRow.cells[8].innerHTML = endTime;

  // const timestamp = currentRow.cells[6].innerHTML;
  const row_index = parseInt(currentRow.cells[10].innerHTML);
  endTime = currentRow.cells[8].innerHTML;
  endTimestampMap[row_index] = endTime;
}

function markStartTimestamp() {
  // Update timestamp dict
  // let currentRowIndex = getCurrentTableRowIndex();
  // if (currentRowIndex < 0) {
  //   console.log("No emotion for the current time. Not marking end time.")
  //   return false;
  // }

  const newStartTime = round(video.currentTime);
  const table = document.getElementById("annotation-table");
  const currentRow = table.rows[currentEditingTableRowIndex];
  
  currentRow.cells[7].innerHTML = newStartTime;

  // const timestamp = currentRow.cells[6].innerHTML;
  const row_index = parseInt(currentRow.cells[10].innerHTML);


  newStartTimestampMap[row_index] = currentRow.cells[7].innerHTML;
}

function timeupdateEventHandler() {
  ///////////////////////////////////////
  /// Video time change event handler
  ///////////////////////////////////////
  document.getElementById("current_time_display").innerHTML = video.currentTime;
  colorTableRow();
}

function jump(timestamp) {
  clearTableColors();
  video.currentTime = timestamp;  // This will trigger the video time change event handler
}

function jumpToTableRowIndex(index) {
  currentEditingTableRowIndex = index;
  console.log("index: "+index);
  const startTime = parseFloat(document.getElementById("annotation-table").rows[index].cells[7].innerHTML);
  jump(startTime);
}

function jumpPrevious() {
  if (currentEditingTableRowIndex > 1) {
    currentEditingTableRowIndex -= 1;
  }
  jumpToTableRowIndex(currentEditingTableRowIndex);   
}

function jumpNext() {
  if (currentEditingTableRowIndex < document.getElementById("annotation-table").rows.length ) {
    currentEditingTableRowIndex += 1;
  }
  jumpToTableRowIndex(currentEditingTableRowIndex);   
}


// window.onload
$(document).ready(function() { video.addEventListener('timeupdate', timeupdateEventHandler, false); });
// video.addEventListener('timeupdate', colorTableRow, false);

document.addEventListener('keydown', (event) => {
  const keyName = event.key;
  console.log(`Add timeupdate listener`);
  console.log(keyName);
  if (keyName === '1') {
    // Log end time of emotion
    // ends.push(video.currentTime);
    markStartTimestamp();
  } else if (keyName === '0') {
    // Mark start timestamp
    markEndTimestamp();
  } else if (keyName === '[') {
    // Pervious emotion
    jumpPrevious();    
  } else if (keyName === ']') {
    // Next emotion
    jumpNext();
  } else if (keyName === ',') {
    // Backward one second
    video.currentTime -= 0.25;
  } else if (keyName === '/') {
    // Fast-forward one second
    video.currentTime += 0.25;
  } else if (keyName === ';') {
    // Backward one second
    video.currentTime -= 1;
  } else if (keyName === "'") {
    // Fast-forward one second
    video.currentTime += 1;
  } else if (keyName === '.') {
    // Fast-forward one second
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  } else if (keyName === 's') {
    saveData();
  } else  {
    // alert(`Key pressed ${keyName}`);
  }
}, false);



function secondToDate(timeInSecond) {
  const hour = parseInt(Math.floor(timeInSecond / 3600));
  const minute = parseInt(Math.floor((timeInSecond - hour*3600) / 60));
  const second = parseInt(Math.floor(timeInSecond - hour*3600 - minute * 60 ));
  return new Date(0,0,0,hour, minute, second);
}

function dateToSecond(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function drawChart() {
  // Reference: https://developers.google.com/chart/interactive/docs/gallery/timeline
    let container = document.getElementById('timeline');
    let dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'Index' });
    dataTable.addColumn({ type: 'string', id: 'Emotion' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    
    const rows = [];

    const table = document.getElementById("annotation-table");

    /* Setting colors for timeseries item.
    Colors are set in order of the first column of the table; which is 'Emotion' in our case.
    Hence, the color sequence must be defined dynamically according to the annotation.

    However, it does not always work. Try http://localhost:5000/annotate-video=13-annotator=4
    excitement and startle are wrong colors.
    */
    let bar_colors = [];
    let emotions = [];
    const emotion_color_dict = {
      'cuteness': '#f032e6',
    'startle': '#e6194b',
    'surprise': '#469990',
    'frustration': '#3cb44b',
    'happiness': '#ffe119',
    'excitement': '#aaffc3',
    'relief': '#42d4f4',
    'wonder': '#800000',
    'amusement': '#4363d8',
    'insight_fiero': '#f58231',
    'moved': '#9a6324',
    'puzzlement': '#808000',
    'na': '#000000'
    };

    for (let i = 1, row; row = table.rows[i]; i++) {
      // Ignore the table header
      let start_sec = parseFloat(row.cells[7].innerHTML);
      let end_sec = parseFloat(row.cells[8].innerHTML);

      if (end_sec < start_sec) {
        end_sec = start_sec + 6;
      }

      let emotion = row.cells[3].innerHTML;

      rows.push(
        ['Emotion', emotion, secondToDate(start_sec), secondToDate(end_sec)]
        );

      if (emotions.indexOf(emotion) < 0) {
        emotions.push(emotion);
        bar_colors.push(emotion_color_dict[emotion]);
        console.log(emotion + emotion_color_dict[emotion]);
      }
    }

    dataTable.addRows(rows);
    
    const options = {
      colors: bar_colors,
      height: 180,
      width: 8000,
      hAxis: {
        // Datetime options: https://developers.google.com/chart/interactive/docs/datesandtimes
        format: 'mm:ss'
      }
    };
      
    const chart = new google.visualization.Timeline(container);
    chart.draw(dataTable, options);
    
    google.visualization.events.addListener(chart, 'select', function(){
      let selection = chart.getSelection();
      if (selection.length) {
        const row_index = selection[0].row;
        const start = dateToSecond(dataTable.getValue(row_index, 2));
        currentEditingTableRowIndex = row_index + 1;
        jump(start);
      }
              
  });
}      


function getTableRowIndex(startInSec) {
  console.log("getTableRowIndex, startInSec: "  + startInSec);
  const table = document.getElementById("annotation-table");
  for (let i = 1, row; row = table.rows[i]; i++) {
    let start = parseFloat(row.cells[7].innerHTML);
    if (start == startInSec) {
      return i;
    }
  }
  return -1;
}
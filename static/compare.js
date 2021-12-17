
'use strict';

google.charts.load('current', {'packages':['timeline']});
google.charts.setOnLoadCallback(drawChart);

function getCurrentTableRowIndex(table) {
  // Add epsilon for getting the curront tab
  const currentTime = video.currentTime;

  let rowIndicesBeforeCurrentTime = [];

  for (let i = 1, row; row = table.rows[i]; i++) {
    let diff = Number(currentTime - row.cells[5].innerHTML);
    if (diff >= 0) {
      rowIndicesBeforeCurrentTime.push(i);
    } else {
      break;
    }
  }
  if (rowIndicesBeforeCurrentTime.length === 0) {
    return -1
  }
  return  rowIndicesBeforeCurrentTime[rowIndicesBeforeCurrentTime.length - 1];
}


function _colorTableRow(table) {
  let currentRowIndex = getCurrentTableRowIndex(table);
  if (currentRowIndex < 0) { return; }
  
  clearTableColors(table);
  
  const emotion = table.rows[currentRowIndex].cells[1].innerHTML;
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
}

function colorTableRows() {
    for (let i = 0, table; table = document.getElementsByClassName('annotation-table')[i]; i++) {
        _colorTableRow(table);
    }
}


function clearTableColors(table) {
    const upperIndexBound = table.rows.length;
    for (let j = 1; j < upperIndexBound; j++) {
        table.rows[j].className = "";  
    }
}

function jump(timestamp) {
    for (let i = 0, table; table = document.getElementsByClassName('annotation-table')[i]; i++) {
        clearTableColors(table);
    }
  video.currentTime = timestamp;
}



// video.addEventListener('timeupdate', colorTableRow, false);

document.addEventListener('keydown', (event) => {
  const keyName = event.key;
  // let video = document.getElementsById("video");
  console.log(keyName);
  if (keyName === 'Meta') {
    // Log end time of emotion
    // ends.push(video.currentTime);
    return;
  } else if (keyName === 'ArrowLeft') {
    // Backward one second
    jump(video.currentTime - 1);
    
  } else if (keyName === 'ArrowRight') {
    // Fast-forward one second
    jump(video.currentTime + 1);
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

function getTimelineDataTable(labelViewOption){
    let dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'Annotator' });
    switch (labelViewOption) {
        case 'all':
            dataTable.addColumn({ type: 'string', id: 'Emotion' });
            break;
        case '4-case':
            dataTable.addColumn({ type: 'string', id: '4-case' });
            break;
        default:
            dataTable.addColumn({ type: 'string', id: 'top5' });
            break;
    }
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    return dataTable;
}

function getLabelColorDict(labelViewOption) {
    switch (labelViewOption) {
        case 'all':
            return {
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
        case '4-class':
            return {
              '1': 'blue',
              '0': 'gray',
              '-1': 'red',
              };
        case 'top5':
            return {
                '1': 'blue',
                '0': 'white',
                };
        default:
            break;
    }
}

function getLabelColorAsColumnIndex(labelViewOption) {
    switch (labelViewOption) {
        case 'all':
            return 1;
        case '4-class':
            return 2;
        case 'top5':
            return 3;
        default:
            break;
    }
}

function drawChart(labelViewOption='all') {
  // Reference: https://developers.google.com/chart/interactive/docs/gallery/timeline
    console.log("Draw chart");
    const container = document.getElementById("timeline");
    const dataTable = getTimelineDataTable(labelViewOption);
    
    /* Setting colors for timeseries item.
    Colors are set in order of the first column of the table; which is 'Emotion' in our case.
    Hence, the color sequence must be defined dynamically according to the annotation.

    However, it does not always work. Try http://localhost:5000/annotate-video=13-annotator=4
    excitement and startle are wrong colors.
    */
    const bar_colors = [];
    const label_color_dict = getLabelColorDict(labelViewOption);
    const labelColumnIndex = getLabelColorAsColumnIndex(labelViewOption);
    let timeLabelFormat = "mm:ss";

    const annotatorIdsAsHTMLElement = document.getElementsByClassName("annotator_id");

    for (let i = 0, element; element = annotatorIdsAsHTMLElement[i]; i++) {
        const annotator_id = element.innerHTML;
        // const tableId = "annotation-table" + (i+1);
    
        const table = document.getElementsByClassName("annotation-table")[i];
        let rows = [];
        let labelList = [];
        for (let j = 1, row; row = table.rows[j]; j++) {
            let start_sec = parseFloat(row.cells[5].innerHTML);
            let end_sec = parseFloat(row.cells[6].innerHTML);
        
            let label = row.cells[labelColumnIndex].innerHTML;

            if (end_sec < start_sec) {
                end_sec = start_sec + 6;
            }
            rows.push(
                ['Annotator ' + annotator_id, label, secondToDate(start_sec), secondToDate(end_sec)]
                );

            if (labelList.indexOf(label) < 0) {
                labelList.push(label);
                bar_colors.push(label_color_dict[label]);
            }
        }

        dataTable.addRows(rows);
        if (parseFloat(table.rows[table.rows.length-1].cells[4].innerHTML) > 3600) {
            timeLabelFormat = "HH:mm:ss";
        }
    }

    let options = {
      colors: bar_colors,
      //getTimelineTitle(),
      //   height: 180,
        width: 4000,
      hAxis: {
          // Datetime options: https://developers.google.com/chart/interactive/docs/datesandtimes
          format: timeLabelFormat,
        },
    };
      
    const chart = new google.visualization.Timeline(container);
    
    google.visualization.events.addListener(chart, 'ready', function () {

        const width = container.offsetWidth;
        const height = container.offsetHeight;

        
        var getSVG = container.getElementsByTagName("svg")[0]; // Gets the graph
        getSVG.setAttribute('xmlns', "http://www.w3.org/2000/svg"); // Add attr to svg
        getSVG.setAttribute('xmlns:svg', "http://www.w3.org/2000/svg"); // Add attr to svg

        // From Fiddle
        var myCanvas = document.getElementById("canvas");
        myCanvas.height = container.offsetHeight;
        myCanvas.width = container.offsetWidth;
        var ctx = myCanvas.getContext("2d");


        function drawInlineSVG(ctx, rawSVG, callback) {
            // Referene: https://stackoverflow.com/a/27232525/3067013

            var svg = new Blob([rawSVG], {type:"image/svg+xml;charset=utf-8"}),
                domURL = self.URL || self.webkitURL || self,
                url = domURL.createObjectURL(svg),
                img = new Image;
        
            img.onload = function () {
                ctx.drawImage(this, 0, 0);     
                domURL.revokeObjectURL(url);
                callback(this);
            };
        
            img.src = url;
        }
        drawInlineSVG(ctx, getSVG.outerHTML, function() {
            // console.log(canvas.toDataURL());  // -> PNG
        });
    });

    chart.draw(dataTable, options);
    
    google.visualization.events.addListener(chart, 'select', function(){
        let selection = chart.getSelection();
        // console.log("select");
        if (selection.length) {
            const start = dateToSecond(dataTable.getValue(selection[0].row, 2));
            jump(start);
        }
    });
}      


// window.onload
$(document).ready(function() { 
    video.addEventListener('timeupdate', colorTableRows, false); 

    var labelViewSelector = document.getElementById("labelViewSelector");

    labelViewSelector.addEventListener("click", function() {
        var options = labelViewSelector.querySelectorAll("option");
        var count = options.length;
        if(typeof(count) === "undefined" || count < 2)
        {
            drawChart();
        }
    });

    labelViewSelector.addEventListener("change", function() {
        // const option = labelViewSelector.value;
        drawChart(labelViewSelector.value);
        // if(option == "all"){
        // } else if(option == "4-class"){
        //     drawChart();
        // } else if(option == "top5"){
        //     drawChart();
        // }
    });

});

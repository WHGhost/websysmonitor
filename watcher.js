/* Holds the data retreived from the API. */
var data = {};

/* Converts a float to an int */
function int(x) {
    return Math[this < 0 ? 'ceil' : 'floor'](x);
}

/* Updates the memory information held in the data array by doing an ajax query to the API. */
function updateData(){
  var toUpdate = [];
  var ramwatchers = document.getElementsByClassName("ram-watcher")
  var swapwatchers = document.getElementsByClassName("swap-watcher")
  if(ramwatchers.length > 0) toUpdate.push('mem');
  if(swapwatchers.length > 0) toUpdate.push('swap');
  var args = "";
  for(var i=0; i<toUpdate.length; i++) args += toUpdate[i] + '&';
  var request = new XMLHttpRequest();
  request.open('get', 'api.php?' + args);
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status === 200) {
        var response = JSON.parse(request.responseText)
        if('mem' in response) data['mem'] = response['mem'];
        if('swap' in response) data['swap'] = response['swap'];
      } else {
          console.log('Failed to communicate with API to get memory information: ' + request.status);
      }
    }
  };
  request.send();
}

/* Updates the pages componments and updates the needed data */
function update(){
  updateData();
  /** The different watchers on the page */
  //TODO This things need to change to use the same gauge class and have a dedicated data tag
  var ramwatchers = document.getElementsByClassName("ram-watcher")
  var swapwatchers = document.getElementsByClassName("swap-watcher")

  /* Data processing */
  var mem = data['mem'];
  var ramTotal = mem['MemTotal'];
  var ramFree = mem['MemFree'];
  var ramUsage = (ramTotal - ramFree) / ramTotal * 100
  var swap = data['swap'][0];                                         //TODO Support multiple swaps
  var swapTotal = swap['Size'];
  var swapUsed = swap['Used'];
  if(swapUsed < 0) swapUsed = 0;
  var swapUsage = swapUsed / swapTotal * 100;

  setTextContentAllByClass("memometre-usage", parseInt(int(ramUsage)) + "%");
  setTextContentAllByClass("memometre-used", bytesToHumanString(ramTotal - ramFree))
  setTextContentAllByClass("memometre-total", bytesToHumanString(ramTotal))

  setTextContentAllByClass("swapometre-usage", parseInt(int(swapUsage)) + "%");
  setTextContentAllByClass("swapometre-used", bytesToHumanString(swapUsed))
  setTextContentAllByClass("swapometre-total", bytesToHumanString(swapTotal))
  
  for(var i = 0; i<ramwatchers.length; i++){
    watcher = ramwatchers[i];
    //watcher.getElementsByClassName()[0].textContent = int(ramUsage);
    drawGauge(watcher.getElementsByClassName("memometre-gauge")[0], int(ramUsage), 80);
  }
  for(var i = 0; i<swapwatchers.length; i++){
    watcher = swapwatchers[i];
    //watcher.getElementsByClassName("swapometre-text")[0].textContent = int(swapUsage);
    drawGauge(watcher.getElementsByClassName("swapometre-gauge")[0], int(swapUsage), 80);
  }
}

/* Draws a gauge on the given canvas, with filled up to x%, being red after high% */
function drawGauge(canv, x, high){
  var ctx = canv.getContext("2d");
  var m = canv.width / 2;
  ctx.beginPath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0,0,canv.width, canv.height);
  ctx.fillStyle = "#EEEEEE";
  ctx.arc(m, m, m - m/10 - 5, 0, 2*Math.PI);
  ctx.arc(m, m, m - m/10 - 15, 2*Math.PI, 0, true);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(m, m, m - m/10 - 1, Math.PI * 1.5, (Math.PI * 1.5) + x/50*Math.PI);
  ctx.arc(m, m, m - m/10 - 19, (Math.PI * 1.5) + x/50*Math.PI, 1.5*Math.PI, true);
  ctx.fillStyle = "#CC0000";
  ctx.fill();
  ctx.beginPath();
  var n = high;
  if(x < high) n=x;
  ctx.arc(m, m, m - m/10, Math.PI * 1.5, (Math.PI * 1.5) + n/50*Math.PI);
  ctx.arc(m, m, m - m/10 - 20, (Math.PI * 1.5) + n/50*Math.PI, 1.5*Math.PI, true);
  ctx.fillStyle = "#00AAAA";
  ctx.fill();
}

function setTextContentAllByClass(className, str){
  var els = document.getElementsByClassName(className);
  for(var i=0; i<els.length; i++){
    els[i].textContent = str;
  }
}

/*Takes a byte count and translate it to something human readable. */
function bytesToHumanString(b){
  var units = ["B", "kB", "mB", "gB", "tB"];
  var uniti = 0;
  while(b >= 1024){
    uniti++;
    b /= 1024;
  }
  if(uniti>units.length - 1) uniti = units.length -1;
  return parseFloat(b.toFixed(2)) + units[uniti];
}

/* Everytghing is in the name */
function setup(){
  updateData();
}

setup();
setInterval(update, 1000);

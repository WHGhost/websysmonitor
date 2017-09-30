/* Holds the data retreived from the API. */
var data = {};

/* Converts a float to an int */
function int(x) {
    return Math[this < 0 ? 'ceil' : 'floor'](x);
}

/* Updates the memory infrmation held in the data array by doing an ajax query to the API. */
function updateData(toUpdate){
  var args = "";
  for(var i=0; i<toUpdate.length; i++) args += toUpdate[i] + '&';
  var request = new XMLHttpRequest();
  request.open('get', 'api.php?' + args);
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status === 200) {
        var response = JSON.parse(request.responseText)
        data['mem'] = response['mem'];
        if('mem' in response) data['mem'] = response['mem'];
      } else {
          console.log('Failed to communicate with API to get memory information: ' + request.status);
      }
    }
  };
  request.send();
}

/* Updates the pages componments and updates the needed data */
function update(){
  var toUpdate = [];
  var ramwatchers = document.getElementsByClassName("ram-watcher")
  if(ramwatchers.length > 0) toUpdate.push('mem');
  if(toUpdate.length > 0) updateData(toUpdate);
  var mem = data['mem'];
  var ramTotal = mem['MemTotal'];
  var ramFree = mem['MemFree'];
  var ramUsage = (ramTotal - ramFree) / ramTotal * 100
  for(var i = 0; i<ramwatchers.length; i++){
    watcher = ramwatchers[i];
    watcher.getElementsByClassName("memometre-text")[0].textContent = int(ramUsage);
    drawGauge(watcher.getElementsByClassName("memometre-jauge")[0], int(ramUsage), 80);
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

/* Everytghing is in the name */
function setup(){
  var toUpdate = [];
  var ramwatchers = document.getElementsByClassName("ram-watcher")
  if(ramwatchers.length > 0) toUpdate.push('mem');
  if(toUpdate.length > 0) updateData(toUpdate);
  for(var i = 0; i<ramwatchers.length; i++){
    watcher = ramwatchers[i]
    watcher.innerHTML += "<canvas width=\"200\" height=\"200\" class=\"memometre-jauge\"></canvas>"
    watcher.innerHTML += "</canvas><span class=\"memometre-text\"></span>"
  }
}

setup();
setInterval(update, 1000);

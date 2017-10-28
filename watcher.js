/* Holds the data retreived from the API. */
var data = {};

var cpuGraphs = [];

//Some premade colors for graphs
var graphColors = ['#2e92b3', '#b32e68', '#2eb349', '#752eb3', '#e09636', '#4436e0', '#b32e2e', '#98b32e', '#41e036'];

/* Converts a float to an int */
function int(x) {
    return Math[this < 0 ? 'ceil' : 'floor'](x);
}

/* Updates the pages componments and updates the needed data */
function update(){
  var toUpdate = [];
  var ramwatchers = document.getElementsByClassName("ram-watcher")
  var swapwatchers = document.getElementsByClassName("swap-watcher")
  if(ramwatchers.length > 0 || swapwatchers.length > 0) toUpdate.push('mem_usage');
  if(cpuGraphs.length > 0) toUpdate.push('cpu_load');
  var args = "";
  for(var i=0; i<toUpdate.length; i++) args += toUpdate[i] + '&';
  var request = new XMLHttpRequest();
  request.open('get', 'api.php?' + args);
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status === 200) {
        let response = JSON.parse(request.responseText)

        let ramwatchers = document.getElementsByClassName("ram-watcher");
        let swapwatchers = document.getElementsByClassName("swap-watcher");

        //Ram part
        if(ramwatchers.length > 0){

          //Compute data
          let ramTotal = response['mem_usage']['MemTotal'];
          let ramFree = response['mem_usage']['MemAvailable'];
          let ramUsage = (ramTotal - ramFree) / ramTotal * 100

          //Update texts TODO that should be handled by the gauge object
          setTextContentAllByClass("memometre-usage", parseInt(int(ramUsage)) + "%");
          setTextContentAllByClass("memometre-used", bytesToHumanString(ramTotal - ramFree))
          setTextContentAllByClass("memometre-total", bytesToHumanString(ramTotal))

          //Update graphics
          for(let i = 0; i<ramwatchers.length; i++){
            let watcher = ramwatchers[i];
            drawGauge(watcher.getElementsByClassName("memometre-gauge")[0], int(ramUsage), 80);
          }
        }

        //Swap part
        if(swapwatchers.length > 0){

          //Compute data
          let swapTotal = response['mem_usage']['SwapTotal'];
          if(swapTotal != 0){
            let swapUsed = response['mem_usage']['SwapCached'];
            let swapUsage = swapUsed / swapTotal * 100;

            //Update text
            setTextContentAllByClass("swapometre-usage", parseInt(int(swapUsage)) + "%");
            setTextContentAllByClass("swapometre-used", bytesToHumanString(swapUsed))
            setTextContentAllByClass("swapometre-total", bytesToHumanString(swapTotal))

            //Update graphics
            for(var i = 0; i<swapwatchers.length; i++){
              var watcher = swapwatchers[i];
              drawGauge(watcher.getElementsByClassName("swapometre-gauge")[0], int(swapUsage), 80);
            }
          }

        }

        //CPU part
        if(cpuGraphs.length > 0){
          //Update graphs
          let cpuUsage = response['cpu_load'];
          for(let i = 0; i<cpuGraphs.length; i++){
            let graph = cpuGraphs[i];
            for(let id=0; id<cpuUsage.length; id++) graph.addPoint(id, new Date(response['date'] * 1000), cpuUsage[id]);
          }
        }
      } else {
          console.log('Failed to communicate with API: ' + request.status);
      }
    }
  };
  request.send();
}

function draw(){
  //Graphs
  for(let i = 0; i<cpuGraphs.length; i++) cpuGraphs[i].draw();
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

class Graph{
  constructor(canvas, minX, maxX, minY, maxY){
    this.canvas = canvas;
    this.maxX = maxX;
    this.minX = minX;
    this.maxY = maxY;
    this.minY = minY;
    this.lines = [];
  }

  addLine(color){
    if(color == null) color = graphColors[this.lines.length % graphColors.length];
    return this.lines.push({'points':[], 'color': color}) - 1;
  }

  addPoint(id, x, y){
    this.lines[id].points.push([x, y]);
    this.lines[id].points.sort(function(p1, p2){return p1[0] - p2[0]});
  }

  setLineColor(id){
    this.lines[id].color = color;
  }

  draw(){
    let ctx = this.canvas.getContext('2d');
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
    ctx.fill();
    ctx.lineWidth=2;
    for(let i=0; i<this.lines.length; i++){
      let line = this.lines[i];
      ctx.strokeStyle = line.color;
      ctx.beginPath();
      if(line.points.length < 1) continue;
      ctx.moveTo(
        line.points[0][0] / this.maxX * this.canvas.width,
        this.canvas.height - int(line.points[0][1] / this.maxY * this.canvas.height));
      for(let j=1; j<line.points.length; j++){
        let x =line.points[j][0] / this.maxX * this.canvas.width;
        let y = this.canvas.height - line.points[j][1] / this.maxY * this.canvas.height;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

class TimeGraph extends Graph{

  constructor(canvas, duration, minY, maxY){
    super(canvas, 0, duration, minY, maxY);
  }

  addPointNow(line, y){
    this.addPoint(line, new Date(), y)
  }

  addPoint(line, date, y){
    this.lines[line].points.push([date.getTime(), y, date]);
    this.lines[line].points.sort(function(p1, p2){return p1[2].getTime() - p2[2].getTime()});
  }

  draw(){
    let now = new Date().getTime();
    for(let i=0; i<this.lines.length; i++){
      let points = this.lines[i].points;
      for(let j=0; j<points.length; j++){
        let point = points[j]
        let age = (now - point[2].getTime()) / 1000;
        point[0] = this.maxX - age + 1
      }
      let min = this.minX;
      this.lines[i].points = this.lines[i].points.filter(
          function(item) {return item[0] > min-10}
        );
      super.draw();
    }
  }

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
    uniti++;0, 100
    b /= 1024;
  }
  if(uniti>units.length - 1) uniti = units.length -1;
  return parseFloat(b.toFixed(2)) + units[uniti];
}

/* Loads the required hardware information to setup the page */
function preInit(){
  var toUpdate = ['mem', 'swap', 'cpu'];
  var args = "";
  for(var i=0; i<toUpdate.length; i++) args += toUpdate[i] + '&';
  var request = new XMLHttpRequest();
  request.open('get', 'api.php?' + args);
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status === 200) {
        var response = JSON.parse(request.responseText)
        data['ram'] = response['mem']
        data['swap'] = response['swap']
        data['cpu'] = response['cpu']
        init();
      } else {
          console.log('Failed to communicate with API to get memory information: ' + request.status);
      }
    }
  };
  request.send();
}

function init(){

  /* Setting up the graph objects */
  let cpuGraphsElements = document.getElementsByClassName("cpu-graph");
  for(let i=0; i<cpuGraphsElements.length; i++){
    let graph = new TimeGraph(cpuGraphsElements[i], 60, 0, 100);
    for(let j=0; j<data['cpu'].length; j++) graph.addLine();
    cpuGraphs.push(graph);
  }

  //TODO It should all be object oriented

  postinit();

}

function postinit(){
  setInterval(update, 500);
  setInterval(draw, 100);
}

preInit();

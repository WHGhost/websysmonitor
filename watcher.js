/* Holds the data retreived from the API. */
var data = {};

var cpuGraphs = [];
var ramGauges = [];
var swapGauges = [];

//Some premade colors for graphs
var graphColors = ['#2e92b3', '#b32e68', '#2eb349', '#752eb3', '#e09636', '#4436e0', '#b32e2e', '#98b32e', '#41e036'];

/* Converts a float to an int */
function int(x) {
    return Math[this < 0 ? 'ceil' : 'floor'](x);
}

/* Updates the pages componments and updates the needed data */
function update(){
  var toUpdate = [];
  if(ramGauges.length > 0 || swapGauges.length > 0) toUpdate.push('mem_usage');
  if(cpuGraphs.length > 0) toUpdate.push('cpu_load');
  var args = "";
  for(var i=0; i<toUpdate.length; i++) args += toUpdate[i] + '&';
  var request = new XMLHttpRequest();
  request.open('get', 'api.php?' + args);
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status === 200) {
        let response = JSON.parse(request.responseText)

        /* CPU Graphs */
        if(cpuGraphs.length > 0){
          //Update graphs
          let cpuUsage = response['cpu_load'];
          for(let i = 0; i<cpuGraphs.length; i++){
            let graph = cpuGraphs[i];
            for(let id=0; id<cpuUsage.length; id++) graph.addPoint(id, new Date(response['date'] * 1000), cpuUsage[id]);
          }
	}

        /* Ram Gauges */
        if(ramGauges.length > 0) {
          let ramTotal = response['mem_usage']['MemTotal'];
          let ramFree = response['mem_usage']['MemAvailable'];
          let ramUsage = ramTotal - ramFree;
          for(let i=0; i<ramGauges.length; i++) ramGauges[i].value = ramUsage;
        }

        /* Swap Gauges */
        if(swapGauges.length > 0) {
          let swapTotal = response['mem_usage']['SwapTotal'];
          let swapUsage = swapTotal != 0 ? response['mem_usage']['SwapCached'] : 0;
          for(let i=0; i<swapGauges.length; i++) swapGauges[i].value = swapUsage;
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
  for(let i = 0; i<ramGauges.length; i++) ramGauges[i].draw();
  for(let i = 0; i<swapGauges.length; i++) swapGauges[i].draw();
}

class Gauge {

  constructor(element, min, max, high, unit) {
    this.element = element;
    this.element.classList.add("gauge");
    this.min = min;
    this.max = max;
    this.high = high;
    this.value = 0;
    this.unit = unit;
    this.lastRenderValue = NaN;

    /* Create the canvas */
    this.canvas = document.createElement("canvas");
    this.canvas.width = element.getAttribute('width');
    this.canvas.height = element.getAttribute('height');
    this.canvas.classList.add("gauge-canvas");
    element.appendChild(this.canvas);

    /* Create the text nodes */
    this.top_text = document.createElement("span");
    this.center_text = document.createElement("span");
    this.bottom_text = document.createElement("span");
    this.top_text.classList.add("gauge-top-text");
    this.center_text.classList.add("gauge-center-text");
    this.bottom_text.classList.add("gauge-bottom-text");
    this.bottom_text.innerText = this.formatText(this.max);
    this.element.appendChild(this.top_text);
    this.element.appendChild(this.center_text);
    this.element.appendChild(this.bottom_text);
  }

  draw(){
    if(this.lastRenderValue === this.value) return; //Avoid rendering when unecessary
    let ctx = this.canvas.getContext("2d");
    let m = this.canvas.width / 2;
    let x = (this.value - this.min) / (this.max - this.min) * 100;
    let high = (this.high -this.min) / (this.max - this.min) * 100;

    /* Update the text nodes */
    this.setTopText(this.formatText(this.value));
    this.setCenterText("" + int(x) + "%");

    ctx.beginPath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    let n = high;
    if(x < high) n=x;
    ctx.arc(m, m, m - m/10, Math.PI * 1.5, (Math.PI * 1.5) + n/50*Math.PI);
    ctx.arc(m, m, m - m/10 - 20, (Math.PI * 1.5) + n/50*Math.PI, 1.5*Math.PI, true);
    ctx.fillStyle = "#00AAAA";
    ctx.fill();
    this.lastRenderValue = this.value;
  }

  setTopText(val) {
    this.top_text.innerText = val;
  }
  
  setCenterText(val) {
    this.center_text.innerText = val;
  }

  setBottomText(val) {
    this.bottom_text.innerText = val;
  }

  formatText(val) {
    return "" + val + this.unit;
  }

}

class MemoryGauge extends Gauge {

  constructor(element, min, max, high) {
    super(element, min, max, high, 'B');
  }

  formatText(val){
    return bytesToHumanString(val);
  }

}

class Graph {
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
    ctx.strokeStyle = '#AAAAAA';
    let levels = [this.canvas.height/2, this.canvas.height/4, this.canvas.height/4*3];
    ctx.lineWidth=1;
    for(let l in levels){
      ctx.beginPath();
      ctx.moveTo(0, levels[l]);
      ctx.lineTo(this.canvas.width, levels[l]);
      ctx.stroke();
    }
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

  let ramTotal = data['ram']['MemTotal'];
  let swapTotal = data['swap'][0]['Size'];

  /* Setting up the gauges */
  let ramGaugeElements = document.getElementsByClassName("ram-gauge");
  let swapGaugeElements = document.getElementsByClassName("swap-gauge");
  for(let i=0; i<ramGaugeElements.length; i++)
    ramGauges.push(new MemoryGauge(
                         ramGaugeElements[i],
	                 0,
	                 ramTotal,
	                 ramTotal * .9
                       )
                  );
  for(let i=0; i<swapGaugeElements.length; i++)
    swapGauges.push(new MemoryGauge(
	                  swapGaugeElements[i],
	                  0,
	                  swapTotal,
	                  swapTotal * .9
                        )
                   );

  //TODO It should all be object oriented

  postInit();

}

function postInit(){
  setInterval(update, 500);
  setInterval(draw, 100);
}

preInit();

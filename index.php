<?php
  session_start();
  if(!isset($_SESSION["login"])){
    header("Location: login.php");
    die();
  }
  require_once 'header.html';
?>
    <section>

      <article class="memory-box box">
        <h5 class="box-name">Memory information:</h5>
        <div class="gauge-list">
          <div>
            <div class="ram-gauge" width=200 height=200></div>
            <span class="gauge-name">RAM</span>
	  </div>
          <div>
            <div class="swap-gauge" width=200 height=200></div>
            <span class="gauge-name">SWAP</span>
          </div>
        </div>
      </article>
      
      <article class="cpu-box box">
        <h5 class="box-name">CPU Usage:</h5>
        <canvas class="cpu-graph" width="500" height="230"></canvas>
	<div class="cpu-usage">Usage text</div>
      </article>

    </section>

    <script type="text/javascript" src="watcher.js"></script>

<?php require_once 'footer.html'; ?>

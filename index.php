<?php
  session_start();
  if(!isset($_SESSION["login"])){
    header("Location: login.php");
    die();
  }
  require_once 'header.html';
?>
    <section>
      <article class="memory-box">
        <h5 class="box-name">Memory information:</h5>
        <div class="ram-watcher" width=200 height=200>
          <canvas class="memometre-gauge" width="200" height="200"></canvas>
          <span class="memometre-usage gauge-center-text"></span>
          <span class="memometre-used gauge-top-text"></span>
          <span class="memometre-total gauge-bottom-text"></span>
          <span class="gauge-name">RAM</span>
        </div>
        <div class="swap-watcher" width=200 height=200>
          <canvas class="swapometre-gauge" width="200" height="200"></canvas>
          <span class="swapometre-usage gauge-center-text"></span>
          <span class="swapometre-used gauge-top-text"></span>
          <span class="swapometre-total gauge-bottom-text"></span>
          <span class="gauge-name">SWAP</span>
        </div>
      </article>
      
      <article class="cpu-box">
        <h5 class="box-name">CPU information:</h5>
        <canvas class="cpu-graph" width="500" height="250"></canvas>
      </article>
    </section>

    <script type="text/javascript" src="watcher.js"></script>

<?php require_once 'footer.html'; ?>

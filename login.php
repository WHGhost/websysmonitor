<?php
  session_start();

  $invalid = false;

  if(isset($_POST['password'])){
    include_once "config.php";
    if(hash('sha256', $_POST['password']) === $passhash){
      $_SESSION['login'] = true;
    }else{
      $invalid = true;
    }

  }
  if(isset($_SESSION["login"])){
    header("Location: index.php");
    die();
  }
  require_once 'header.php';
?>
  <section class="login-box">
    <h5 class="login-title">Please login:</h5>
    <form action="login.php" method="POST">
      <input name="password" type="password"></input>
      <input type="submit"></input>
    </form>
  </section>
  <?php if($invalid){ ?>
    <section class="invalid-box">
      <span>Invalid details, please try again...</span>
    </section>
  <?php } ?>
<?php
  require_once 'footer.php';
?>

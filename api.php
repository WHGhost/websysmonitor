<?php

  /* Reads /proc/meminfo and returns it's content as an array, with the values in bytes. */
  function getRam(){
    /*
    https://stackoverflow.com/questions/1455379/get-server-ram-with-php#1455610
    */
    $data = explode("\n", file_get_contents("/proc/meminfo"));
    $meminfo = array();
    foreach ($data as $line) {
      list($key, $val) = explode(":", $line);
      $val = trim($val);
      if(preg_match('/[0-9]* kB$/', $val)){
        $val = explode(' ', $val)[0];
        $val *= 1024;
      }else{
        $val *= 1;
      }
      $meminfo[$key] = $val;
    }
    unset($meminfo['']);
    return $meminfo;
  }



  $json = array();
  foreach($_GET as $key => $val){

    if($key === "mem"){
      $json['mem'] = getRam();
    }else{
      http_response_code(400);
      die();
    }
  }
  header('Content-type: application/json');
  echo json_encode($json);

?>

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
        $val = (int) $val;
      }
      $meminfo[$key] = $val;
    }
    unset($meminfo['']);
    return $meminfo;
  }

  function getSwap(){
    /* It can be made better, for sure, but I am still a php beginner,
    feel free to submit a PR if you eyes are bleeding. */
    $swapinfo = array();
    $data = explode("\n", file_get_contents("/proc/swaps"));
    $firstline = array_filter(explode(" ", str_replace("\t", " ", $data[0])));
    $tmp = array(); //This seems necessary as the array will still have the indexes otherwise...
    foreach ($firstline as $key => $value) {array_push($tmp, $value);}
    $firstline = $tmp;
    unset($tmp);
    $data = array_splice($data, 1, count($data) - 2);
    foreach($data as $line){
      $el = array();
      $line = array_filter(explode(" ", str_replace("\t", " ", $line)));
      $tmp = array(); //This seems necessary as the array will still have the indexes otherwise...
      foreach ($line as $key => $value) {array_push($tmp, $value);}
      $line = $tmp;
      unset($tmp);
      foreach($line as $key => $element){
        $el[$firstline[$key]] = trim($element);
      }
      array_push($swapinfo, $el);
    }
    return  $swapinfo;
  }



  $json = array();
  foreach($_GET as $key => $val){

    if($key === "mem"){
      $json['mem'] = getRam();
    }else if($key === "swap"){
      $json['swap'] = getSwap();
    }else{
      http_response_code(400);
      die();
    }
  }
  header('Content-type: application/json');
  echo json_encode($json);

?>

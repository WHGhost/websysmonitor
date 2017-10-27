<?php
  session_start();

  if(!(isset($_SESSION['login']) && $_SESSION['login'])){
    http_response_code(403);
    die();
  }
  /* Reads /proc/meminfo and returns it's content as an array, with the values in bytes. */
  function getRam(){
    /*
    https://stackoverflow.com/questions/1455379/get-server-ram-with-php#1455610
    */
    $data = explode("\n", file_get_contents("/proc/meminfo"));
    $meminfo = array();
    foreach ($data as $line) {
      if($line === ''){continue;} // Just to avoid a Warnin on the last line which is a vois string
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
      $el["Size"] *= 1024;
      $el["Used"] *= 1024;
      array_push($swapinfo, $el);
    }
    return  $swapinfo;
  }


  function getCpu(){
    $data = explode("\n\n", file_get_contents("/proc/cpuinfo"));
    $cpus = array();
    foreach ($data as $block) {
      if($block === ''){continue;} // Just to avoid a Warning on the last line which is a vois string
      $cpu = Array();
      $cpu_data = explode("\n", $block);
      foreach ($cpu_data as $line) {
        if($line === ''){continue;} // Just to avoid a Warning on the last line which is a vois string
        list($key, $val) = explode(":", $line);
        $val = trim($val);
        $cpu[strtolower(str_replace(' ', '_', trim($key)))] = $val;
      }

      $cpu['processor'] = (int)$cpu['processor'];
      $cpu['stepping'] = (int)$cpu['stepping'];
      $cpu['core_id'] = (int)$cpu['core_id'];
      $cpu['cache_size'] = (int)trim(str_replace('KB', '', $cpu['cache_size'])) * 1024;
      $cpu['physical_id'] = (int)$cpu['physical_id'];
      $cpu['siblings'] = (int)$cpu['siblings'];
      $cpu['cpu_cores'] = (int)$cpu['cpu_cores'];
      $cpu['apicid'] = (int)$cpu['apicid'];
      $cpu['initial_apicid'] = (int)$cpu['initial_apicid'];
      if($cpu['fpu_exception'] === "yes") $cpu['fpu_exception'] = true;
      else $cpu['fpu_exception'] = false;
      if($cpu['fpu'] === "yes") $cpu['fpu'] = true;
      else $cpu['fpu'] = false;
      $cpu['cpuid_level'] = (int)$cpu['cpuid_level'];
      if($cpu['wp'] === "yes") $cpu['wp'] = true;
      else $cpu['wp'] = false;
      $cpu['flags'] = explode(" ", $cpu['flags']);
      $cpu['bogomips'] = (float)$cpu['bogomips'];
      $cpu['cache_alignment'] = (int)$cpu['cache_alignment'];
      $cpu['apicid'] = (int)$cpu['apicid'];
      $cpu['freq_current'] = (float)$cpu['cpu_mhz'] * 1000;
      unset($cpu['cpu_mhz']);
      $cpu['freq_max'] = (float)file_get_contents("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq");
      $cpu['freq_min'] = (float)file_get_contents("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_min_freq");;

      array_push($cpus, $cpu);
    }
    return $cpus;
  }

  $json = array();
  foreach($_GET as $key => $val){

    if($key === 'mem'){             //Memory hardware information
      $json['mem'] = getRam();
    }else if($key === 'mem_l'){     //Memory load information
      $mem = getRam();
      $json['mem_l'] = ['MemTotal'=> $mem['MemTotal'],
                        'MemFree'=>$mem['MemFree'],
                        'MemAvailable'=>$mem['MemAvailable'],
                        'SwapTotal'=>$mem['SwapTotal'],
                        'SwapFree'=>$mem['SwapFree'],
                        'SwapCached'=>$mem['SwapCached']];
    }else if($key === 'swap'){      //Swap hardware information
      $json['swap'] = getSwap();
    }else if($key === 'cpu'){       //CPU hardware information
      $json['cpu'] = getCpu();
    }else if($key === 'cpu_l'){     //CPU load information
      $cpus = getCpu();
      $short_cpus = array();
      foreach($cpus as $cpu_id => $cpu){
        $short_cpus[$cpu_id] = array('freq_max'=>$cpu['freq_max'],
                                    'freq_min'=>$cpu['freq_min'],
                                    'freq_current'=>$cpu['freq_current']);
      }
      $json['cpu_l'] = $short_cpus;
    }else{
      http_response_code(400);
      die();
    }
  }
  header('Content-type: application/json');
  echo json_encode($json);

?>

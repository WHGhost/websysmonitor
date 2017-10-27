<?php

  //Set this to false to disable authentification
  $REQUIRE_LOGIN = false;

  /* That's sha256("test") is you are wondering. CHANGE WITH YOUR PASSWORD ONE. */
  $passhash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";

  /* The duration to sleep for between two reads of /proc/stat to compute
   * CPU load, in micosecondes. A higher value will result in a better precision,
   * but requests will take longer to process.
   */
  $CPU_LOAD_SLEEP = 500000;

?>

# Bootstrap - Performance Analysis

This repository is for analyzing the performance of various versions of the [bootstrap framework](https://github.com/twbs/bootstrap) using [telemetry](http://www.chromium.org/developers/telemetry). 

## Running the code
To run telemetry against this repository, 

1. Install all NPM dependencies
2. [Download]() and run selenium with drivers for Chrome or any other browsers. 
3. Run `grunt --verbose`
4. The grunt file will automatically connect to the selenium server and run the tests
5. The results will be available as a couch app at the URL specified in the grunt file. 

## More Info
* [Blog post](http://blog.nparashuram.com/2013/08/bootstrap-evolution-over-two-years.html) talking about how the system works

## Details

This repository has almost all versions of bootstrap. It creates HTML pages and uses the `smoothness_benchmark` to see how each version performs, for every component. 

_ Inspired by the awesome perf done in the [Topcoat.io](https://github.com/topcoat/topcoat/tree/master/dev/test/perf/telemetry) repository. Trying to do the same thing for bootstrap _

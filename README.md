# Bootstrap - Performance Analysis

This repository is for analyzing the performance of various versions of the [bootstrap framework](https://github.com/twbs/bootstrap) using [telemetry](http://www.chromium.org/developers/telemetry). 

## Running the code
To run telemetry against this repository, 

1. [Download](http://chromium-browser-source.commondatastorage.googleapis.com/chromium_tarball.html) the source of [Chromium](http://www.chromium.org/developers/how-tos/get-the-code) and extract it to a location. 
2. Set the environment variable `CHROMIUM_SRC` to the location where you extracted. The path usually ends with src/ and looks something like `/chromium.r197479/home/src_tarball/tarball/chromium/src/`
3. Run `npm install` to install dev dependencies
4. Run `grunt`. This command created HTML files for each version of bootstrap, for each component specified. These HTML files are copied to `CHROMIUM_SRC\tools\perf\page_sets\bootstrap*`
5. Navigate to `CHROMIUM_SRC\tools\perf` and run 
```
$> python run_multipage_benchmarks --browser=system smoothness_benchmark page_sets\bootstrap-perf.json -o results.csv
```
6. The command above will open each HTML file, scroll through the pages and return results. 

## Details

This repository has almost all versions of bootstrap. It creates HTML pages and uses the `smoothness_benchmark` to see how each version performs, for every comopnent. 

_ Inspired by the awesome perf done in the [Topcoat.io](https://github.com/topcoat/topcoat/tree/master/dev/test/perf/telemetry) repository. Trying to do the same thing for bootstrap _
#!/usr/bin/env jjs-with-deps
# dep:io.undertow:undertow-core:1.1.1.Final
# dep:ch.qos.logback:logback-classic:1.1.2

var log = org.slf4j.LoggerFactory.getLogger("com.github.stevestorey.jjswithdeps.example.Undertow");
var imports = new JavaImporter(Packages.io.undertow, Packages.io.undertow.server, Packages.io.undertow.util);
with (imports) {
  log.info("Starting server");
  Undertow.builder()
    .addHttpListener(8080, "localhost")
    .setHandler(function(exchange) {
        exchange.getResponseHeaders().put(Headers.CONTENT_TYPE, "text/html");
        exchange.getResponseSender().send("<html><body><h1>Hello World</h1></body></html>");
    })
    .build()
    .start();
  log.info("Server completed starting. Entering wait loop");
  while (true) java.lang.Thread.sleep(1000);
}
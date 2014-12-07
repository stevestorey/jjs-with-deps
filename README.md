jjs-with-deps
=============

Wrapper for JDK Nashorn jjs binary that will pre-process JS command-line scripts to add classpath
dependencies automatically via Maven. Special comment lines are added to the header of the script
of the form:

    # dep:ch.qos.logback:logback-classic:1.1.2

in order to add Logback as a dependency of the script, along with all the transitive dependencies
recorded in the Maven POM.

Thus a "Hello world" webserver script can be written as:

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

and be run simply as:

    [steve@localhost jjs-with-deps]$ ./undertow-hello-world.js 
    15:43:13.031 [main] INFO  c.g.s.jjswithdeps.example.Undertow - Starting server
    15:43:13.089 [main] DEBUG org.jboss.logging - Logging Provider: org.jboss.logging.Slf4jLoggerProvider
    15:43:13.098 [main] INFO  org.xnio - XNIO version 3.3.0.Final
    15:43:13.155 [main] INFO  org.xnio.nio - XNIO NIO Implementation Version 3.3.0.Final
    15:43:13.192 [XNIO-1 I/O-1] DEBUG org.xnio.nio - Started channel thread 'XNIO-1 I/O-1', selector sun.nio.ch.EPollSelectorImpl@79adcf
    15:43:13.192 [XNIO-1 I/O-2] DEBUG org.xnio.nio - Started channel thread 'XNIO-1 I/O-2', selector sun.nio.ch.EPollSelectorImpl@1556809
    15:43:13.224 [XNIO-1 I/O-4] DEBUG org.xnio.nio - Started channel thread 'XNIO-1 I/O-4', selector sun.nio.ch.EPollSelectorImpl@3db1bf
    15:43:13.224 [XNIO-1 I/O-3] DEBUG org.xnio.nio - Started channel thread 'XNIO-1 I/O-3', selector sun.nio.ch.EPollSelectorImpl@fba18c
    15:43:13.263 [main] INFO  c.g.s.jjswithdeps.example.Undertow - Server completed starting. Entering wait loop

without needing to provide the classpath in the execution itself.

Requirements
------------

* Java 8
* Maven 3

Installation
------------

Simply place the jjs-with-deps shell script somewhere on the PATH (e.g. /usr/local/bin/) and
the jjs-with-deps.js file in the same directory. Following that, you can create scripts with
the shebang

    #!/usr/bin/env jjs-with-deps

Usage
-----

Having added the relevant Shebang script header, you can go ahead and add comment lines for
your script dependencies, which use Maven co-ordinates in order to resolve the dependencies:

    # dep:<groupId>:<artifactId>[:type][:classifier]:<version>

Implementation
--------------

The initial shebang delegates to a small bash wrapper, as passing control immediately to the
jjs-with-deps.js script causes the original script filename to be lost from the provided arguments.

The JS script uses JBoss Shrinkwrap, which in turn uses Maven in order to resolve the dependency
co-ordinates, which must follow the Maven standard of G:A:V. First of all, the script checks
that the Shrinkwrap resolver POM has been install'ed locally (and will attempt to force it to
be resolved if not).

The next step is to setup a classloader containing all the Shrinkwrap code, which is used
to resolve all the artifacts defined in the user-script. Having created a list of all the local
JavaArchive files, a classloader for the user-script is created

Finally, a new Nashorn script engine instance is created (preserving the original CLI arguments)
from the new script class-loader and control is delegated to that via load()'ing the original
script.

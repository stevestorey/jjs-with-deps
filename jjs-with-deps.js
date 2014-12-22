#!/usr/bin/env jjs
#
# Wrapper script to look at the provided script and resolve
# any Maven dependencies before running the script with the
# relevant classpath set.
#
# For convenience, add this script somewhere in the path, so
# that scripts can start with:
#
# #!/usr/bin/env jjs-with-deps
#
# following which, they should add commented lines of the form:
#
# # dep:<groupId>:<artifactId>[:type|?][:classifier|?]:<version>
# # dep:org.apache.commons:commons-lang3:3.3.2
# # dep:org.jboss.shrinkwrap.resolver:shrinkwrap-resolver-depchain:pom:2.1.1
#

// Check that we have the POM for shrinkwrap in place, and if not, ask Maven to sort that
// out for us
function isShrinkwrapInstalled() {
  return (new java.io.File($ENV.HOME + "/.m2/repository/"
    + "org/jboss/shrinkwrap/resolver/shrinkwrap-resolver-depchain/2.1.1/shrinkwrap-resolver-depchain-2.1.1.pom")).exists();
}

if (!isShrinkwrapInstalled()) {
  //Run maven to download it all
  `mvn dependency:get -Dartifact=org.jboss.shrinkwrap.resolver:shrinkwrap-resolver-depchain:2.1.1:pom`
  // If it's still not in place, then bail
  if (!isShrinkwrapInstalled()) {
    print("ERROR: Could not find Shrinkwrap installation");
    exit(1);
  }
}

//Build a new classloader with all the dependencies required in order to run shrinkwrap
var shrinkWrapPaths = [
  "org/jboss/shrinkwrap/resolver/shrinkwrap-resolver-api/2.1.1/shrinkwrap-resolver-api-2.1.1.jar",
  "org/jboss/shrinkwrap/resolver/shrinkwrap-resolver-spi/2.1.1/shrinkwrap-resolver-spi-2.1.1.jar",
  "org/jboss/shrinkwrap/resolver/shrinkwrap-resolver-api-maven/2.1.1/shrinkwrap-resolver-api-maven-2.1.1.jar",
  "org/jboss/shrinkwrap/resolver/shrinkwrap-resolver-spi-maven/2.1.1/shrinkwrap-resolver-spi-maven-2.1.1.jar",
  "org/jboss/shrinkwrap/resolver/shrinkwrap-resolver-api-maven-archive/2.1.1/shrinkwrap-resolver-api-maven-archive-2.1.1.jar",
  "org/jboss/shrinkwrap/shrinkwrap-api/1.2.1/shrinkwrap-api-1.2.1.jar",
  "org/jboss/shrinkwrap/resolver/shrinkwrap-resolver-impl-maven/2.1.1/shrinkwrap-resolver-impl-maven-2.1.1.jar",
  "org/eclipse/aether/aether-api/0.9.0.M2/aether-api-0.9.0.M2.jar",
  "org/eclipse/aether/aether-impl/0.9.0.M2/aether-impl-0.9.0.M2.jar",
  "org/eclipse/aether/aether-spi/0.9.0.M2/aether-spi-0.9.0.M2.jar",
  "org/eclipse/aether/aether-util/0.9.0.M2/aether-util-0.9.0.M2.jar",
  "org/eclipse/aether/aether-connector-wagon/0.9.0.M2/aether-connector-wagon-0.9.0.M2.jar",
  "org/apache/maven/maven-aether-provider/3.1.1/maven-aether-provider-3.1.1.jar",
  "org/apache/maven/maven-model/3.1.1/maven-model-3.1.1.jar",
  "org/apache/maven/maven-model-builder/3.1.1/maven-model-builder-3.1.1.jar",
  "org/codehaus/plexus/plexus-component-annotations/1.5.5/plexus-component-annotations-1.5.5.jar",
  "org/apache/maven/maven-repository-metadata/3.1.1/maven-repository-metadata-3.1.1.jar",
  "org/apache/maven/maven-settings/3.1.1/maven-settings-3.1.1.jar",
  "org/apache/maven/maven-settings-builder/3.1.1/maven-settings-builder-3.1.1.jar",
  "org/codehaus/plexus/plexus-interpolation/1.19/plexus-interpolation-1.19.jar",
  "org/codehaus/plexus/plexus-utils/3.0.15/plexus-utils-3.0.15.jar",
  "org/sonatype/plexus/plexus-sec-dispatcher/1.3/plexus-sec-dispatcher-1.3.jar",
  "org/sonatype/plexus/plexus-cipher/1.4/plexus-cipher-1.4.jar",
  "org/apache/maven/wagon/wagon-provider-api/2.6/wagon-provider-api-2.6.jar",
  "org/apache/maven/wagon/wagon-file/2.6/wagon-file-2.6.jar",
  "commons-lang/commons-lang/2.6/commons-lang-2.6.jar",
  "org/apache/maven/wagon/wagon-http-lightweight/2.6/wagon-http-lightweight-2.6.jar",
  "org/apache/maven/wagon/wagon-http-shared/2.6/wagon-http-shared-2.6.jar",
  "org/jsoup/jsoup/1.7.2/jsoup-1.7.2.jar",
  "commons-io/commons-io/2.2/commons-io-2.2.jar",
  "org/jboss/shrinkwrap/resolver/shrinkwrap-resolver-impl-maven-archive/2.1.1/shrinkwrap-resolver-impl-maven-archive-2.1.1.jar",
  "org/jboss/shrinkwrap/shrinkwrap-impl-base/1.2.1/shrinkwrap-impl-base-1.2.1.jar",
  "org/jboss/shrinkwrap/shrinkwrap-spi/1.2.1/shrinkwrap-spi-1.2.1.jar",
  "org/jboss/shrinkwrap/resolver/shrinkwrap-resolver-spi-maven-archive/2.1.1/shrinkwrap-resolver-spi-maven-archive-2.1.1.jar",
  "org/eclipse/sisu/org.eclipse.sisu.plexus/0.0.0.M5/org.eclipse.sisu.plexus-0.0.0.M5.jar",
  "javax/enterprise/cdi-api/1.0/cdi-api-1.0.jar",
  "javax/annotation/jsr250-api/1.0/jsr250-api-1.0.jar",
  "javax/inject/javax.inject/1/javax.inject-1.jar",
  "com/google/guava/guava/10.0.1/guava-10.0.1.jar",
  "com/google/code/findbugs/jsr305/1.3.9/jsr305-1.3.9.jar",
  "org/sonatype/sisu/sisu-guice/3.1.0/sisu-guice-3.1.0-no_aop.jar",
  "aopalliance/aopalliance/1.0/aopalliance-1.0.jar",
  "org/eclipse/sisu/org.eclipse.sisu.inject/0.0.0.M5/org.eclipse.sisu.inject-0.0.0.M5.jar",
  "org/codehaus/plexus/plexus-compiler-javac/2.3/plexus-compiler-javac-2.3.jar",
  "org/codehaus/plexus/plexus-compiler-api/2.3/plexus-compiler-api-2.3.jar"
];

var shrinkWrapURLs = [];
for (i in shrinkWrapPaths) {
  shrinkWrapURLs.push(new java.net.URL("file://" + $ENV.HOME + "/.m2/repository/" + shrinkWrapPaths[i]));
}

// Remember the current classloader to be used as the parent of the next ones
var thread = java.lang.Thread.currentThread();
var originalCL = thread.getContextClassLoader();
// Make a CL to load up shrinkwrap
var shrinkwrapCL = new java.net.URLClassLoader(shrinkWrapURLs, originalCL);
thread.setContextClassLoader(shrinkwrapCL);

// Find deps from the script
function parseScriptDependencies(script) {
  var re = /# *dep:(.*)/
  var deps = new java.util.ArrayList();
  var br = new java.io.BufferedReader(new java.io.FileReader(new java.io.File(script)));
  try {
    var line = br.readLine();
    while (line != null) {
      //Parse it
      var dependency = re.exec(line);
      if (dependency != null) {
	deps.add(dependency[1]);
      }
      line = br.readLine();
    }
  } finally {
    br.close();
  }
  return deps;
}
var scriptDeps = parseScriptDependencies($ARG[0]); //java.util.Arrays.asList(["org.apache.commons:commons-lang3:3.3.2"]);

// And now setup the classloader for the script execution with the dependencies in place
function createScriptClassLoader() {
  if (scriptDeps.size() == 0) {
    // We need no additional dependencies
    return thread.getContextClassLoader();
  }
  var Maven = shrinkwrapCL.loadClass("org.jboss.shrinkwrap.resolver.api.maven.Maven");
  var Archive = shrinkwrapCL.loadClass("org.jboss.shrinkwrap.api.Archive");
  var JavaArchive = shrinkwrapCL.loadClass("org.jboss.shrinkwrap.api.spec.JavaArchive");
  var scriptArchives = Maven.getDeclaredMethod("resolver").invoke(null, [])
    .resolve(scriptDeps)
    .withTransitivity()
    .as(JavaArchive);

  //Create the classloader from the shrinkwrap JavaArchive array
  return shrinkwrapCL
    .loadClass("org.jboss.shrinkwrap.api.classloader.ShrinkWrapClassLoader")
    .getDeclaredConstructor(java.lang.ClassLoader.class,
			    //This allows us to find the Class instance for Archive[]
			    java.lang.reflect.Array.newInstance(Archive, 0).getClass())
    .newInstance(originalCL, scriptArchives);
};
var scriptCL = createScriptClassLoader();
thread.setContextClassLoader(scriptCL);

// We want to use scripting, but also add the arguments that were passed to us
// apart from the filename ..
var engineArgs = ["-scripting"].concat($ARG.slice(1, $ARG.length));
scriptCL.loadClass("jdk.nashorn.api.scripting.NashornScriptEngineFactory")
  .newInstance()
  .getScriptEngine(engineArgs)
  .eval("load('" + $ARG[0] + "')");

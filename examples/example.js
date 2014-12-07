#!/usr/bin/env jjs-with-deps
#
# Running this script via jjs-with-deps will mean that the dependencies
# specified below will be resolved via Maven where necessary, and the resulting
# JAR files will be added to the classpath before executing the jjs command.
#
# Below is the list of dependencies of the script, which will be resolved by
# the wrapper script. All lines that start "dep:" will be processed as dependency artifacts
# via Maven.
#
# dep:org.apache.commons:commons-lang3:3.3.2
#

# We can still pull items from the arguments. Run as
# ./example.js -- Steve
print("Hello " + (typeof($ARG[0]) != "undefined" ? $ARG[0] : "World"));

# The JAR dependency for commons-lang3 will have been added by the jjs-with-deps wrapper
var StringUtils = org.apache.commons.lang3.StringUtils;
print(StringUtils.join([1,2,3,'Steve'], ','));


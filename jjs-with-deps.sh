#!/bin/sh
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
# # dep:<groupId>:<artifactId>:<version>
# # dep:org.apache.commons:commons-lang3:3.3.2

# Uncomment the line below to enable debugging messages.
#DEBUG=1

function debug { if [ ! -z "$DEBUG" ]; then echo DEBUG: $1; fi; }

# Look at the script name and parse out any dep lines
artifacts=$(cat $1 | grep "# *dep:" | sed 's/.*dep://g' | uniq)
# Check whether each artifacts file exists in the m2 repository directory
for artifact in $artifacts; do
  debug "Looking for $artifact"
  # Build the expected filename from the artifact ID, which is presumed
  # to be in the format of groupId:artifactId:version, none of which can
  # contain colons.
  groupDir=$(echo $artifact | sed 's/\(.*\):.*:.*/\1/' | sed 's/\./\//g')
  artifactId=$(echo $artifact | sed 's/.*:\(.*\):.*/\1/')
  version=$(echo $artifact | sed 's/.*:.*:\(.*\)/\1/')
  jarFile="$HOME/.m2/repository/$groupDir/$artifactId/$version/$artifactId-$version.jar"
  if [ ! -e $jarFile ]; then
    debug $jarFile does not exist
    # We will therefore try and have Maven resolve the artifact
    mvn dependency:get -Dartifact=$artifact
    rc=$?
    if [[ $rc != 0 ]] ; then
      echo "ERROR: Artifact $artifactId could not be resolved. BAILING!"
      exit $rc
    fi
    # Check we can now see the file
    if [ ! -e $jarFile ]; then
      echo "ERROR: Artifact $artifactId was resolved by Maven, but is not where we expected. BAILING!"
    fi
  else
    crap=1
    debug DEBUG $jarFile DOES exist
  fi
  # If we get here, then the jar file exists and so we should add it to the classpath
  if [ ! -z "$classpath" ]; then
    classpath="$classpath:$jarFile"
  else
    classpath="$jarFile"
  fi
done

debug jjs -cp $classpath -scripting $@
jjs -cp $classpath -scripting $@
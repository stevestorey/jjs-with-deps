#!/usr/bin/env jjs-with-deps
#
# Example script demonstrating the use of GPU accelerated computation
# from a JJS script. The use of multi-line strings within the Nashorn
# scripting environment makes managing the kernels easier.
#
# Ported from https://jogamp.org/wiki/index.php/JOCL_Tutorial
#
# dep:org.jogamp.jocl:jocl-main:2.3.1
# dep:org.jogamp.gluegen:gluegen-rt-main:2.3.1

var out = java.lang.System.out;
var nanoTime = java.lang.System.nanoTime;

/**
 * Hello Java OpenCL example. Adds all elements of buffer A to buffer B and
 * stores the result in buffer C.<br/>
 * Sample was inspired by the Nvidia VectorAdd example written in C/C++ which is
 * bundled in the Nvidia OpenCL SDK.
 * 
 * @author Michael Bien
 */
// set up (uses default CLPlatform and creates context for all devices)
var context = com.jogamp.opencl.CLContext.create();
var READ_ONLY = com.jogamp.opencl.CLMemory.Mem.READ_ONLY;
var WRITE_ONLY = com.jogamp.opencl.CLMemory.Mem.WRITE_ONLY;
out.println("created " + context);

// always make sure to release the context under all circumstances
// not needed for this particular sample but recommented
try {
    out.println("Possible devices are: " + java.util.Arrays.asList(context.getDevices()));
    
    // select fastest device
    var device = context.getMaxFlopsDevice();
    out.println("using " + device);

    // create command queue on device.
    var queue = device.createCommandQueue();

    var elementCount = 1<<25; // Length of arrays to process 
    // Local work size dimensions
    var localWorkSize = java.lang.Math.min(device.getMaxWorkGroupSize(), 256);
    // Rounded up to the nearest multiple of the localWorkSize
    var globalWorkSize = roundUp(localWorkSize, elementCount);

    // load sources, create and build program
    var program = context.createProgram(<<<OPENCL_KERNEL
            // OpenCL Kernel Function for element by element vector addition
            kernel void VectorAdd(global const float* a, global const float* b, global float* c, int numElements) {
                // get index into global data array
                int iGID = get_global_id(0);
                // bound check, equivalent to the limit on a 'for' loop
                if (iGID >= numElements)  {
                    return;
                }
                // add the vector elements
                c[iGID] = a[iGID] + b[iGID];
            }
OPENCL_KERNEL).build();

    // A, B are input buffers, C is for the result
    var clBufferA = context.createFloatBuffer(globalWorkSize, READ_ONLY);
    var clBufferB = context.createFloatBuffer(globalWorkSize, READ_ONLY);
    var clBufferC = context.createFloatBuffer(globalWorkSize, WRITE_ONLY);

    out.println("used device memory: "
            + (clBufferA.getCLSize() + clBufferB.getCLSize() + clBufferC.getCLSize()) / 1000000 + "MB");

    // fill input buffers with random numbers
    // (just to have test data; seed is fixed -> results will not change
    // between runs).
    fillBuffer(clBufferA.getBuffer(), 12345);
    fillBuffer(clBufferB.getBuffer(), 67890);

    // get a reference to the kernel function with the name 'VectorAdd'
    // and map the buffers to its input parameters.
    var kernel = program.createCLKernel("VectorAdd");
    kernel.putArgs(clBufferA, clBufferB, clBufferC).putArg(elementCount);

    // asynchronous write of data to GPU device,
    // followed by blocking read to get the computed results back.
    var time = nanoTime();
    queue.putWriteBuffer(clBufferA, false).putWriteBuffer(clBufferB, false)
            .put1DRangeKernel(kernel, 0, globalWorkSize, localWorkSize).putReadBuffer(clBufferC, true);
    time = nanoTime() - time;

    // print first few elements of the resulting buffer to the console.
    out.println("a+b=c results snapshot: ");
    for (var i = 0; i < 10; i++)
        out.print(clBufferC.getBuffer().get() + ", ");
    out.println("...; " + clBufferC.getBuffer().remaining() + " more");
    out.println("computation took: " + (time / 1000000) + "ms");
} finally {
    // cleanup all resources associated with this context.
    context.release();
}

function fillBuffer(buffer, seed) {
    var rnd = new java.util.Random(seed);
    while (buffer.remaining() != 0)
        buffer.put(rnd.nextFloat() * 100);
    buffer.rewind();
}

function roundUp(groupSize, globalSize) {
    var r = globalSize % groupSize;
    if (r == 0) {
        return globalSize;
    } else {
        return globalSize + groupSize - r;
    }
}


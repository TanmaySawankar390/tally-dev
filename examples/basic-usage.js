import TallyPrimeSDK from '../src/index.js';

/**
 * Basic Usage Example
 * 
 * This example demonstrates how to:
 * 1. Initialize the SDK
 * 2. Test connection to TallyPrime
 * 3. Get connection information
 * 4. Update configuration
 */

async function basicUsageExample() {
    try {
        // Initialize SDK with default settings (localhost:9000)
        console.log('🚀 Initializing TallyPrime SDK...');
        const tally = new TallyPrimeSDK();

        // Get SDK information
        const sdkInfo = tally.getSDKInfo();
        console.log(`✅ ${sdkInfo.name} v${sdkInfo.version}`);
        console.log(`📝 ${sdkInfo.description}`);

        // Get connection info
        const connectionInfo = tally.getConnectionInfo();
        console.log(`🔗 Connecting to: ${connectionInfo.host}:${connectionInfo.port}`);
        console.log(`⏱️  Timeout: ${connectionInfo.timeout}ms`);

        // Test connection
        console.log('\n🔍 Testing connection to TallyPrime...');
        const isConnected = await tally.testConnection();
        
        if (isConnected) {
            console.log('✅ Successfully connected to TallyPrime!');
            
            // Demonstrate configuration update
            console.log('\n⚙️  Updating configuration...');
            tally.updateConfig({
                timeout: 45000 // Increase timeout to 45 seconds
            });
            
            const newConnectionInfo = tally.getConnectionInfo();
            console.log(`✅ New timeout: ${newConnectionInfo.timeout}ms`);
            
        } else {
            console.log('❌ Failed to connect to TallyPrime');
            console.log('💡 Make sure TallyPrime is running and configured for API access');
            console.log('💡 Check if port 9000 is open and accessible');
        }

    } catch (error) {
        console.error('❌ Error in basic usage example:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Ensure TallyPrime is running');
        console.log('2. Enable "Allow Remote API" in TallyPrime configuration');
        console.log('3. Check firewall settings');
        console.log('4. Verify the correct host and port');
    }
}

// Alternative: Initialize with custom configuration
async function customConfigExample() {
    try {
        console.log('\n🔧 Example with custom configuration...');
        
        const customTally = new TallyPrimeSDK({
            host: 'remote-server',  // Custom host
            port: 9001,            // Custom port
            timeout: 60000         // 60 second timeout
        });

        const connectionInfo = customTally.getConnectionInfo();
        console.log(`🔗 Custom connection: ${connectionInfo.host}:${connectionInfo.port}`);
        
        // Note: This will likely fail unless you have a TallyPrime instance 
        // running on 'remote-server' at port 9001
        console.log('⚠️  This example shows configuration only - connection may fail');

    } catch (error) {
        console.error('❌ Custom config example error:', error.message);
    }
}

// Run the examples
async function runExamples() {
    console.log('='.repeat(60));
    console.log('🌟 TallyPrime JavaScript SDK - Basic Usage Examples');
    console.log('='.repeat(60));

    await basicUsageExample();
    await customConfigExample();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Basic usage examples completed!');
    console.log('📚 Check other example files for specific functionality');
    console.log('='.repeat(60));
}

// Execute examples if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runExamples().catch(console.error);
}

export { basicUsageExample, customConfigExample };
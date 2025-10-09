// Test different Gemini API request formats
const https = require('https');

const GEMINI_URL = 'https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant';

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const req = https.request({
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: { 'Content-Type': 'application/json', ...options.headers }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData, success: res.statusCode < 300 });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, success: res.statusCode < 300 });
                }
            });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function testGeminiFormats() {
    console.log('🧠 Testing Gemini Medical Assistant API Formats');
    console.log('===============================================');
    
    const testFormats = [
        {
            name: 'Text Only - Simple Message',
            data: { message: 'What are the side effects of aspirin?' }
        },
        {
            name: 'Text Only - With Query Type',
            data: { 
                message: 'What are the side effects of aspirin?',
                query_type: 'text'
            }
        },
        {
            name: 'Text Only - With Type Field',
            data: { 
                message: 'What are the side effects of aspirin?',
                type: 'text_query'
            }
        },
        {
            name: 'Medical Query Format',
            data: { 
                query: 'What are the side effects of aspirin?',
                type: 'medical_question'
            }
        },
        {
            name: 'Empty Image Base64',
            data: { 
                message: 'What are the side effects of aspirin?',
                image_base64: ''
            }
        },
        {
            name: 'Null Image Base64',
            data: { 
                message: 'What are the side effects of aspirin?',
                image_base64: null
            }
        }
    ];
    
    for (let i = 0; i < testFormats.length; i++) {
        const format = testFormats[i];
        console.log(`\n${i + 1}. Testing: ${format.name}`);
        console.log(`   Request: ${JSON.stringify(format.data)}`);
        
        try {
            const result = await makeRequest(GEMINI_URL, {
                method: 'POST',
                body: JSON.stringify(format.data)
            });
            
            if (result.success && result.data.response) {
                console.log(`   ✅ SUCCESS: Response received (${result.data.response.length} chars)`);
                console.log(`   Preview: ${result.data.response.substring(0, 100)}...`);
                
                // If this format works, we found the solution!
                console.log('\n🎉 WORKING FORMAT FOUND!');
                console.log('Use this format for text queries:');
                console.log(JSON.stringify(format.data, null, 2));
                break;
                
            } else {
                console.log(`   ❌ FAILED: Status ${result.status}`);
                if (result.data.error) {
                    console.log(`   Error: ${result.data.error}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🧠 Gemini API Format Testing Complete');
}

testGeminiFormats().catch(console.error);

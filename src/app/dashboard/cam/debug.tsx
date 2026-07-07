"use client";

import { useState, useEffect } from "react";

export default function CamDebugPage() {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [apiTestResults, setApiTestResults] = useState<any[]>([]);
  const [esp32Ip, setEsp32Ip] = useState("192.168.1.10");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Get network information
    if (typeof window !== 'undefined') {
      const info = {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port,
        url: window.location.href,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      };
      setNetworkInfo(info);
    }
  }, []);

  const testApiEndpoint = async (url: string, name: string) => {
    setTesting(true);
    try {
      const startTime = Date.now();
      const response = await fetch(url, { method: 'GET', cache: 'no-cache' });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let result = {
        name,
        url,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        ok: response.ok,
        headers: {} as Record<string, string>
      };

      // Get headers
      response.headers.forEach((value, key) => {
        result.headers[key] = value;
      });

      // Try to get response text for errors
      if (!response.ok) {
        try {
          const errorText = await response.text();
          result.headers['error-body'] = errorText.substring(0, 200);
        } catch {
          // Ignore if can't read body
        }
      }

      setApiTestResults(prev => [...prev, result]);
    } catch (error: any) {
      setApiTestResults(prev => [...prev, {
        name,
        url,
        status: 'ERROR',
        statusText: error.message,
        responseTime: 'N/A',
        ok: false,
        headers: { 'error': error.message }
      }]);
    } finally {
      setTesting(false);
    }
  };

  const runAllTests = () => {
    setApiTestResults([]);
    
    // Test main page
    testApiEndpoint('/dashboard/cam', 'Camera Page');
    
    // Test stream API with default IP
    testApiEndpoint(`/api/esp32/stream?ip=${esp32Ip}&port=81`, 'Stream API (default IP)');
    
    // Test stream API with localhost (should fail validation)
    testApiEndpoint('/api/esp32/stream?ip=127.0.0.1&port=81', 'Stream API (localhost)');
    
    // Test data API
    testApiEndpoint('/api/esp32/data', 'Data API GET');
    
    // Test server health
    testApiEndpoint('/', 'Home Page');
  };

  const testEsp32Connection = async () => {
    if (!esp32Ip.trim()) return;
    
    setTesting(true);
    try {
      // Test direct connection to ESP32 (might fail due to CORS)
      const streamUrl = `http://${esp32Ip}:81/stream`;
      const startTime = Date.now();
      
      try {
        const response = await fetch(streamUrl, { 
          method: 'GET',
          mode: 'no-cors', // Use no-cors to avoid CORS errors
          cache: 'no-cache'
        });
        const endTime = Date.now();
        
        setApiTestResults(prev => [...prev, {
          name: 'Direct ESP32 Connection',
          url: streamUrl,
          status: 'NO-CORS',
          statusText: 'Request sent (CORS prevented full response)',
          responseTime: `${endTime - startTime}ms`,
          ok: true,
          headers: { 'note': 'CORS prevents reading full response from ESP32 directly' }
        }]);
      } catch (error: any) {
        setApiTestResults(prev => [...prev, {
          name: 'Direct ESP32 Connection',
          url: streamUrl,
          status: 'ERROR',
          statusText: error.message,
          responseTime: 'N/A',
          ok: false,
          headers: { 'error': error.message }
        }]);
      }
      
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Camera Stream Debug</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Network Information</h2>
        <pre className="text-sm bg-white p-3 rounded overflow-auto">
          {networkInfo ? JSON.stringify(networkInfo, null, 2) : 'Loading...'}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">ESP32 Connection Test</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={esp32Ip}
            onChange={(e) => setEsp32Ip(e.target.value)}
            placeholder="ESP32 IP Address"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={testEsp32Connection}
            disabled={testing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Test Direct Connection
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Default IP: 192.168.1.10. Check your ESP32 Serial Monitor for actual IP.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">API Tests</h2>
          <button
            onClick={runAllTests}
            disabled={testing}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Run All Tests
          </button>
        </div>

        {apiTestResults.length > 0 && (
          <div className="space-y-4">
            {apiTestResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${result.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{result.name}</h3>
                    <p className="text-sm text-gray-600 break-all">{result.url}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${result.ok ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {result.status} {result.ok ? '✓' : '✗'}
                  </span>
                </div>
                <div className="text-sm">
                  <p><strong>Response Time:</strong> {result.responseTime}</p>
                  <p><strong>Status Text:</strong> {result.statusText}</p>
                  {Object.keys(result.headers).length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium mb-1">Headers:</p>
                      <pre className="text-xs bg-white p-2 rounded overflow-auto">
                        {JSON.stringify(result.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Common Issues & Solutions</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>1. <strong>ESP32 not connected to WiFi:</strong> Check Serial Monitor for connection status</li>
          <li>2. <strong>Wrong IP address:</strong> ESP32 IP shown in Serial Monitor after boot</li>
          <li>3. <strong>ESP32 already has a client:</strong> Only one browser tab can connect at a time</li>
          <li>4. <strong>Network firewall:</strong> Ensure computer can reach ESP32 on local network</li>
          <li>5. <strong>Next.js server not running:</strong> Run `npm run dev` in terminal</li>
          <li>6. <strong>CORS issues:</strong> The proxy API should handle this</li>
        </ul>
      </div>
    </div>
  );
}